(function (global) {
  "use strict";

  const WHITE = Object.freeze([255, 255, 255, 255]);
  const MAX_HISTORY = 5;
  const BRUSH_SIZES = Object.freeze([16, 36, 72]);

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${source}`));
      image.src = source;
    });
  }

  function hexToRgb(hex) {
    const normalized = String(hex).replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
      255,
    ];
  }

  function createImageCanvas(image, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    return canvas;
  }

  function createTransparentOutlineCanvas(imageData, evaluationMask) {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const transparentLines = context.createImageData(imageData.width, imageData.height);

    for (let pixelIndex = 0; pixelIndex < evaluationMask.length; pixelIndex += 1) {
      if (evaluationMask[pixelIndex]) continue;
      const offset = pixelIndex * 4;
      transparentLines.data[offset] = imageData.data[offset];
      transparentLines.data[offset + 1] = imageData.data[offset + 1];
      transparentLines.data[offset + 2] = imageData.data[offset + 2];
      transparentLines.data[offset + 3] = 255;
    }

    context.putImageData(transparentLines, 0, 0);
    return canvas;
  }

  function buildClosedRegions(outlineImageData, threshold) {
    const width = outlineImageData.width;
    const height = outlineImageData.height;
    const count = width * height;
    const mask = global.HighResRestorationScoring.createEvaluationMask(
      outlineImageData,
      threshold,
    );
    const regionOf = new Int32Array(count);
    regionOf.fill(-1);
    for (let index = 0; index < count; index += 1) {
      if (!mask[index]) regionOf[index] = -2;
    }

    const queue = new Int32Array(count);
    const regionSizes = [];
    let regionId = 0;

    for (let start = 0; start < count; start += 1) {
      if (regionOf[start] !== -1) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      regionOf[start] = regionId;

      while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) visit(index - 1);
        if (x + 1 < width) visit(index + 1);
        if (y > 0) visit(index - width);
        if (y + 1 < height) visit(index + width);
      }

      regionSizes.push(tail);
      regionId += 1;

      function visit(index) {
        if (regionOf[index] !== -1) return;
        regionOf[index] = regionId;
        queue[tail++] = index;
      }
    }

    return Object.freeze({
      evaluationMask: mask,
      regionOf,
      regionSizes: Object.freeze(regionSizes),
      regionCount: regionId,
    });
  }

  function mount(root, contract, options = {}) {
    if (!root || !contract) throw new Error("고해상도 작업대와 퀘스트 계약이 필요합니다.");

    const paintCanvas = root.querySelector("[data-role=paint-canvas]");
    const outlineImage = root.querySelector("[data-role=outline-image]");
    const targetPreview = root.querySelector("[data-role=target-preview]");
    const paletteElement = root.querySelector("[data-role=palette]");
    const notesElement = root.querySelector("[data-role=notes]");
    const statusElement = root.querySelector("[data-role=status]");
    const resultElement = root.querySelector("[data-role=result]");
    const debugElement = root.querySelector("[data-role=debug-score]");
    const clipToggle = root.querySelector("[data-role=clip-toggle]");
    const zoomLabel = root.querySelector("[data-role=zoom-label]");
    const canvasStack = root.querySelector("[data-role=canvas-stack]");

    const state = {
      ready: false,
      tool: "fill",
      color: contract.palette[0].hex,
      brushSize: BRUSH_SIZES[1],
      zoom: 1,
      busy: false,
    };
    const paintContext = paintCanvas.getContext("2d", { willReadFrequently: true });
    let playerImageData;
    let targetCanvas;
    let targetImageData;
    let outlineCanvas;
    let outlineImageData;
    let regions;
    let targetImage;
    let painting = false;
    let lastPoint = null;
    let undoStack = [];
    let redoStack = [];

    function setStatus(message) {
      statusElement.textContent = message;
    }

    function invalidateResult() {
      resultElement.hidden = true;
      resultElement.removeAttribute("data-tier");
      resultElement.replaceChildren();
      debugElement.textContent = "";
    }

    function renderNotes() {
      notesElement.replaceChildren();
      contract.witnessNotes.forEach((entry) => {
        const card = document.createElement("article");
        card.className = "quest-note";
        const speaker = document.createElement("strong");
        speaker.textContent = entry.speaker;
        const text = document.createElement("p");
        text.textContent = entry.text;
        card.append(speaker, text);
        notesElement.appendChild(card);
      });
    }

    function renderPalette() {
      paletteElement.replaceChildren();
      contract.palette.forEach((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "palette-color";
        button.dataset.color = entry.hex;
        button.title = entry.name;
        button.setAttribute("aria-label", `${entry.name} ${entry.hex}`);
        button.style.setProperty("--swatch", entry.hex);
        button.classList.toggle("is-active", entry.hex === state.color);
        button.addEventListener("click", () => {
          state.color = entry.hex;
          renderPalette();
        });
        paletteElement.appendChild(button);
      });
    }

    function syncControls() {
      root.querySelectorAll("[data-tool]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.tool === state.tool);
      });
      root.querySelectorAll("[data-brush-size]").forEach((button) => {
        button.classList.toggle(
          "is-active",
          Number(button.dataset.brushSize) === state.brushSize,
        );
      });
      root.querySelector("[data-action=undo]").disabled = undoStack.length === 0;
      root.querySelector("[data-action=redo]").disabled = redoStack.length === 0;
      zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
      const baseSize = Math.max(420, Math.min(760, global.innerWidth - 610));
      const displaySize = Math.round(baseSize * state.zoom);
      canvasStack.style.width = `${displaySize}px`;
      canvasStack.style.height = `${displaySize}px`;
    }

    function resetPlayerData() {
      paintCanvas.width = contract.resolution;
      paintCanvas.height = contract.resolution;
      playerImageData = paintContext.createImageData(contract.resolution, contract.resolution);
      const data = playerImageData.data;
      for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = WHITE[0];
        data[offset + 1] = WHITE[1];
        data[offset + 2] = WHITE[2];
        data[offset + 3] = WHITE[3];
      }
      paintContext.putImageData(playerImageData, 0, 0);
    }

    function pushUndo() {
      undoStack.push(paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
      if (undoStack.length > MAX_HISTORY) undoStack.shift();
      redoStack = [];
      invalidateResult();
      syncControls();
    }

    function restoreSnapshot(snapshot) {
      playerImageData = snapshot;
      paintContext.putImageData(playerImageData, 0, 0);
    }

    function pointFromEvent(event) {
      const rect = paintCanvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(contract.resolution - 1,
          Math.floor(((event.clientX - rect.left) / rect.width) * contract.resolution))),
        y: Math.max(0, Math.min(contract.resolution - 1,
          Math.floor(((event.clientY - rect.top) / rect.height) * contract.resolution))),
      };
    }

    function writePixel(index, rgba) {
      const offset = index * 4;
      playerImageData.data[offset] = rgba[0];
      playerImageData.data[offset + 1] = rgba[1];
      playerImageData.data[offset + 2] = rgba[2];
      playerImageData.data[offset + 3] = rgba[3];
    }

    function fillRegion(point, rgba) {
      const start = point.y * contract.resolution + point.x;
      const regionId = regions.regionOf[start];
      if (regionId < 0) return false;
      const regionOf = regions.regionOf;
      for (let index = 0; index < regionOf.length; index += 1) {
        if (regionOf[index] === regionId) writePixel(index, rgba);
      }
      paintContext.putImageData(playerImageData, 0, 0);
      return true;
    }

    function brushAt(point, rgba) {
      const size = contract.resolution;
      const start = point.y * size + point.x;
      const regionId = regions.regionOf[start];
      if (regionId < 0) return null;
      const radius = Math.max(3, state.brushSize / 2);
      const x0 = Math.max(0, Math.floor(point.x - radius));
      const y0 = Math.max(0, Math.floor(point.y - radius));
      const x1 = Math.min(size - 1, Math.ceil(point.x + radius));
      const y1 = Math.min(size - 1, Math.ceil(point.y + radius));
      const squared = radius * radius;

      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = x - point.x;
          const dy = y - point.y;
          const index = y * size + x;
          if (dx * dx + dy * dy <= squared && regions.regionOf[index] === regionId) {
            writePixel(index, rgba);
          }
        }
      }
      return { x0, y0, x1, y1 };
    }

    function brushSegment(from, to, rgba) {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(2, state.brushSize * 0.3)));
      let dirty = null;
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps;
        const box = brushAt({
          x: Math.round(from.x + (to.x - from.x) * ratio),
          y: Math.round(from.y + (to.y - from.y) * ratio),
        }, rgba);
        if (!box) continue;
        dirty = dirty
          ? {
              x0: Math.min(dirty.x0, box.x0), y0: Math.min(dirty.y0, box.y0),
              x1: Math.max(dirty.x1, box.x1), y1: Math.max(dirty.y1, box.y1),
            }
          : box;
      }
      if (dirty) {
        paintContext.putImageData(
          playerImageData,
          0,
          0,
          dirty.x0,
          dirty.y0,
          dirty.x1 - dirty.x0 + 1,
          dirty.y1 - dirty.y0 + 1,
        );
      }
    }

    function selectedRgba() {
      return state.tool === "eraser" ? WHITE : hexToRgb(state.color);
    }

    function beginPaint(event) {
      if (!state.ready || state.busy) return;
      const point = pointFromEvent(event);
      pushUndo();
      if (state.tool === "fill") {
        if (!fillRegion(point, selectedRgba())) undoStack.pop();
        syncControls();
        return;
      }
      painting = true;
      lastPoint = point;
      paintCanvas.setPointerCapture?.(event.pointerId);
      brushSegment(point, point, selectedRgba());
    }

    function movePaint(event) {
      if (!painting || !lastPoint) return;
      const point = pointFromEvent(event);
      brushSegment(lastPoint, point, selectedRgba());
      lastPoint = point;
    }

    function endPaint() {
      painting = false;
      lastPoint = null;
    }

    function createCompositeCanvas() {
      const canvas = document.createElement("canvas");
      canvas.width = contract.resolution;
      canvas.height = contract.resolution;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(paintCanvas, 0, 0);
      context.drawImage(outlineCanvas, 0, 0, contract.resolution, contract.resolution);
      return canvas;
    }

    function resultCopy(outcome) {
      if (outcome.tier === "pass") {
        return ["증거로 사용할 수 있을 만큼 복원됐다.", "색이 조금 달라도 전체 인상과 주요 면이 충분히 이어진다."];
      }
      if (outcome.tier === "near") {
        return ["거의 완성됐다.", "비어 있는 큰 면이나 코트·피부의 색 관계를 한 번 더 살펴보자."];
      }
      if (outcome.tier === "partial") {
        return ["초상의 인상은 잡히고 있다.", "채우기 도구로 닫힌 큰 영역부터 정리하면 빠르게 가까워진다."];
      }
      return ["증언 메모를 다시 살펴보자.", "짙은 머리, 청록 코트, 따뜻한 창가 빛부터 복원해 보자."];
    }

    async function evaluate() {
      if (!state.ready || state.busy) return null;
      state.busy = true;
      setStatus("복원 결과를 비교하는 중입니다…");
      root.classList.add("is-busy");
      try {
        const compositeCanvas = createCompositeCanvas();
        let clipScore = null;
        if (clipToggle?.checked && typeof options.evaluateClip === "function") {
          try {
            setStatus("CLIP 보조 분석을 준비하는 중입니다…");
            clipScore = await options.evaluateClip({
              contract,
              targetCanvas,
              restoredCanvas: compositeCanvas,
            });
          } catch (error) {
            console.warn("CLIP 보조 분석을 건너뜁니다.", error);
            setStatus("CLIP을 사용할 수 없어 색상 점수로 판정합니다.");
          }
        }
        const restoredImageData = compositeCanvas
          .getContext("2d", { willReadFrequently: true })
          .getImageData(0, 0, contract.resolution, contract.resolution);
        const scoring = contract.scoring || {};
        const outcome = global.HighResRestorationScoring.evaluate({
          targetImageData,
          restoredImageData,
          evaluationMask: regions.evaluationMask,
          clipScore,
          passingScore: scoring.passingScore,
          weights: scoring.weights,
          fallbackWeights: scoring.fallbackWeights,
        });
        const [headline, note] = resultCopy(outcome);
        resultElement.hidden = false;
        resultElement.dataset.tier = outcome.tier;
        resultElement.innerHTML = `<strong>${headline}</strong><p>${note}</p>`;
        debugElement.textContent = [
          `최종 ${outcome.finalScore.toFixed(1)}`,
          `색 ${outcome.colorScore.toFixed(1)}`,
          `채색 ${outcome.coverageScore.toFixed(1)}`,
          outcome.clipAvailable ? `CLIP ${outcome.clipScore.toFixed(1)}` : "CLIP 미사용(가중치 자동 재분배)",
          `통과선 ${outcome.passingScore}`,
        ].join(" · ");
        setStatus(outcome.cleared ? "Q1A 테스트 통과" : "수정 후 다시 제출할 수 있습니다.");
        return outcome;
      } finally {
        state.busy = false;
        root.classList.remove("is-busy");
      }
    }

    function applyReference() {
      if (!state.ready) return;
      pushUndo();
      paintContext.clearRect(0, 0, contract.resolution, contract.resolution);
      paintContext.drawImage(targetImage, 0, 0, contract.resolution, contract.resolution);
      playerImageData = paintContext.getImageData(0, 0, contract.resolution, contract.resolution);
      setStatus("QA용 완성본을 적용했습니다. 제출 판정을 확인하세요.");
    }

    function bindControls() {
      paintCanvas.addEventListener("pointerdown", beginPaint);
      paintCanvas.addEventListener("pointermove", movePaint);
      paintCanvas.addEventListener("pointerup", endPaint);
      paintCanvas.addEventListener("pointercancel", endPaint);
      paintCanvas.addEventListener("pointerleave", endPaint);

      root.querySelectorAll("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => {
          state.tool = button.dataset.tool;
          syncControls();
        });
      });
      root.querySelectorAll("[data-brush-size]").forEach((button) => {
        button.addEventListener("click", () => {
          state.brushSize = Number(button.dataset.brushSize);
          if (state.tool === "fill") state.tool = "brush";
          syncControls();
        });
      });
      root.querySelector("[data-action=undo]").addEventListener("click", () => {
        if (undoStack.length === 0) return;
        redoStack.push(paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
        restoreSnapshot(undoStack.pop());
        invalidateResult();
        syncControls();
      });
      root.querySelector("[data-action=redo]").addEventListener("click", () => {
        if (redoStack.length === 0) return;
        undoStack.push(paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
        restoreSnapshot(redoStack.pop());
        invalidateResult();
        syncControls();
      });
      root.querySelector("[data-action=reset]").addEventListener("click", () => {
        pushUndo();
        resetPlayerData();
        setStatus("윤곽선 상태로 되돌렸습니다.");
      });
      root.querySelector("[data-action=submit]").addEventListener("click", evaluate);
      root.querySelector("[data-action=apply-reference]").addEventListener("click", applyReference);
      root.querySelector("[data-action=toggle-reference]").addEventListener("click", () => {
        targetPreview.hidden = !targetPreview.hidden;
      });
      root.querySelector("[data-action=zoom-in]").addEventListener("click", () => {
        state.zoom = Math.min(1.6, state.zoom + 0.2);
        syncControls();
      });
      root.querySelector("[data-action=zoom-out]").addEventListener("click", () => {
        state.zoom = Math.max(0.6, state.zoom - 0.2);
        syncControls();
      });
      global.addEventListener("resize", syncControls);
    }

    async function initialize() {
      renderNotes();
      renderPalette();
      bindControls();
      syncControls();
      setStatus("1254×1254 원본과 폐곡선을 분석하는 중입니다…");
      let loadedOutline;
      [targetImage, loadedOutline] = await Promise.all([
        loadImage(contract.targetSource),
        loadImage(contract.outlineSource),
      ]);
      targetCanvas = createImageCanvas(targetImage, contract.resolution);
      const sourceOutlineCanvas = createImageCanvas(loadedOutline, contract.resolution);
      targetImageData = targetCanvas
        .getContext("2d", { willReadFrequently: true })
        .getImageData(0, 0, contract.resolution, contract.resolution);
      outlineImageData = sourceOutlineCanvas
        .getContext("2d", { willReadFrequently: true })
        .getImageData(0, 0, contract.resolution, contract.resolution);
      targetPreview.src = contract.targetSource;
      resetPlayerData();
      regions = buildClosedRegions(
        outlineImageData,
        global.HighResRestorationScoring.DEFAULTS.lineLuminanceThreshold,
      );
      outlineCanvas = createTransparentOutlineCanvas(outlineImageData, regions.evaluationMask);
      outlineImage.src = outlineCanvas.toDataURL("image/png");
      state.ready = true;
      setStatus(`준비 완료 · ${contract.resolution}×${contract.resolution} · 닫힌 영역 ${regions.regionCount}개`);
      syncControls();
      return api;
    }

    const api = Object.freeze({
      initialize,
      evaluate,
      applyReference,
      getState: () => Object.freeze({ ...state, regionCount: regions?.regionCount || 0 }),
      createCompositeCanvas,
    });
    return api;
  }

  global.HighResRestorationRuntime = Object.freeze({ BRUSH_SIZES, mount });
})(window);
