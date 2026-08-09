/**
 * 퀘스트 설정으로 구동되는 공통 픽셀 작업대 런타임.
 * 선화는 잠긴 윤곽으로, 완성 이미지는 내부 채점용 목표 픽셀로 사용한다.
 */
(function (global) {
  "use strict";

  function mount(stage, config) {
  if (!stage) throw new Error("작업대를 표시할 요소가 필요합니다.");
  if (!config) throw new Error("작업대 퀘스트 설정이 필요합니다.");

  const GRID_SIZE = Number(config.gridSize);
  const ART_X = 188;
  const ART_Y = 51;
  const ART_SIZE = 262;
  const PAPER = config.paperColor || "#E8E3D5";
  const OUTLINE = config.outlineColor || "#120F0D";
  const OUTLINE_THRESHOLD = Number(config.outlineLuminanceThreshold ?? 160);
  const HISTORY_LIMIT = Number(config.historyLimit ?? 60);
  const LINE_SOURCE = config.lineSource;
  const TARGET_SOURCE = config.targetSource;
  const palette = config.palette;
  const REGION_DEFINITIONS = config.regions;
  const REGION_TARGET_COLORS = Object.freeze(Object.fromEntries(
    REGION_DEFINITIONS.map((region) => [
      region.id,
      Object.freeze(region.paletteIndexes.map((index) => palette[index])),
    ]),
  ));
  const feedback = Object.assign({
    preparing: "선화를 준비하고 있습니다",
    ready: `${REGION_DEFINITIONS.length}개 부위 마스크 준비 완료`,
    loadingMasks: "부위 마스크를 준비하는 중입니다",
    submitted: "제출하였습니다",
    submittedAnnouncement: "그림을 제출하였습니다.",
    loadError: "작업대 이미지를 불러오지 못했습니다",
  }, config.feedback || {});

  if (!Number.isInteger(GRID_SIZE) || GRID_SIZE <= 0) {
    throw new Error("작업대 해상도는 양의 정수여야 합니다.");
  }
  if (!LINE_SOURCE || !TARGET_SOURCE || !Array.isArray(palette) || !palette.length) {
    throw new Error("선화, 완성 이미지와 팔레트 설정이 필요합니다.");
  }
  if (!Array.isArray(REGION_DEFINITIONS) || !REGION_DEFINITIONS.length) {
    throw new Error("부위 마스크 설정이 필요합니다.");
  }

  const state = {
    title: config.title,
    quotes: config.quotes || [],
    visibleHintCount: Number(config.visibleHintCount ?? 2),
    showBackButton: config.showBackButton !== false,
    palette,
    activeColor: config.activeColor || palette[0].hex,
    activeTool: config.activeTool || "brush",
    brushSize: Number(config.brushSize ?? 2),
    canUndo: false,
    canRedo: false,
    isSubmitting: false,
    feedback: feedback.preparing,
  };

  const playerPixels = new Array(GRID_SIZE * GRID_SIZE).fill(null);
  const lockedMask = new Array(GRID_SIZE * GRID_SIZE).fill(false);
  const targetPixels = new Array(GRID_SIZE * GRID_SIZE).fill(PAPER);
  let regionMasks = null;
  let regionSummary = null;
  const undoStack = [];
  const redoStack = [];
  const artwork = document.createElement("canvas");
  artwork.width = GRID_SIZE;
  artwork.height = GRID_SIZE;
  const artworkContext = artwork.getContext("2d");
  artworkContext.imageSmoothingEnabled = false;
  let drawing = false;
  let lastPaintedIndex = -1;
  let app;
  let lastScoreResult = null;

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`이미지를 불러올 수 없습니다: ${source}`));
      image.src = source;
    });
  }

  function imagePixels(image) {
    const canvas = document.createElement("canvas");
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, GRID_SIZE, GRID_SIZE);
    return context.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data;
  }

  function createLineMask(image) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const source = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = new Array(GRID_SIZE * GRID_SIZE).fill(false);

    for (let gridY = 0; gridY < GRID_SIZE; gridY += 1) {
      const sourceY0 = Math.floor((gridY * canvas.height) / GRID_SIZE);
      const sourceY1 = Math.ceil(((gridY + 1) * canvas.height) / GRID_SIZE);
      for (let gridX = 0; gridX < GRID_SIZE; gridX += 1) {
        const sourceX0 = Math.floor((gridX * canvas.width) / GRID_SIZE);
        const sourceX1 = Math.ceil(((gridX + 1) * canvas.width) / GRID_SIZE);
        let luminanceTotal = 0;
        let sampleCount = 0;
        for (let sourceY = sourceY0; sourceY < sourceY1; sourceY += 1) {
          for (let sourceX = sourceX0; sourceX < sourceX1; sourceX += 1) {
            const offset = (sourceY * canvas.width + sourceX) * 4;
            luminanceTotal +=
              source[offset] * 0.2126 +
              source[offset + 1] * 0.7152 +
              source[offset + 2] * 0.0722;
            sampleCount += 1;
          }
        }
        mask[gridY * GRID_SIZE + gridX] =
          sampleCount > 0 && luminanceTotal / sampleCount < OUTLINE_THRESHOLD;
      }
    }
    return mask;
  }

  function hexToRgb(hex) {
    return [
      Number.parseInt(hex.slice(1, 3), 16),
      Number.parseInt(hex.slice(3, 5), 16),
      Number.parseInt(hex.slice(5, 7), 16),
    ];
  }

  function nearestPaletteColor(red, green, blue, candidates) {
    const available = candidates || palette;
    let nearest = available[0].hex;
    let nearestDistance = Infinity;
    available.forEach((entry) => {
      const [pr, pg, pb] = hexToRgb(entry.hex);
      const distance = (red - pr) ** 2 + (green - pg) ** 2 + (blue - pb) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = entry.hex;
      }
    });
    return nearest;
  }

  function prepareSources(lineImage, targetImage) {
    // 선화는 원본 구간의 밝기를 직접 평균내 브라우저별 축소 차이를 없앤다.
    // 목표 이미지는 픽셀 블록을 보존하기 위해 최근접 축소한다.
    const preparedLineMask = createLineMask(lineImage);
    const targetData = imagePixels(targetImage);
    for (let index = 0; index < playerPixels.length; index += 1) {
      lockedMask[index] = preparedLineMask[index];
    }
    createRegionMasks();
    for (let index = 0; index < playerPixels.length; index += 1) {
      if (lockedMask[index]) {
        targetPixels[index] = OUTLINE;
        continue;
      }
      const region = REGION_DEFINITIONS.find(
        (definition) => regionMasks[definition.id][index],
      );
      const offset = index * 4;
      targetPixels[index] = nearestPaletteColor(
        targetData[offset],
        targetData[offset + 1],
        targetData[offset + 2],
        REGION_TARGET_COLORS[region.id],
      );
    }
  }

  function createComponentLabels() {
    const labels = new Int16Array(lockedMask.length);
    labels.fill(-1);
    let componentId = 0;

    for (let start = 0; start < labels.length; start += 1) {
      if (lockedMask[start] || labels[start] !== -1) continue;
      const queue = [start];
      labels[start] = componentId;
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const index = queue[cursor];
        const x = index % GRID_SIZE;
        const y = Math.floor(index / GRID_SIZE);
        const neighbors = [];
        if (x > 0) neighbors.push(index - 1);
        if (x < GRID_SIZE - 1) neighbors.push(index + 1);
        if (y > 0) neighbors.push(index - GRID_SIZE);
        if (y < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE);
        neighbors.forEach((neighbor) => {
          if (lockedMask[neighbor] || labels[neighbor] !== -1) return;
          labels[neighbor] = componentId;
          queue.push(neighbor);
        });
      }
      componentId += 1;
    }
    return labels;
  }

  function createRegionMasks() {
    const componentLabels = createComponentLabels();
    const masks = {};
    const assigned = new Uint8Array(lockedMask.length);

    REGION_DEFINITIONS.forEach((region) => {
      const componentIds = new Set(
        region.seeds.map(([x, y]) => componentLabels[y * GRID_SIZE + x]),
      );
      if (componentIds.has(-1)) {
        throw new Error(`${region.label} 마스크 기준점이 잠금선 위에 있습니다.`);
      }
      const mask = Array.from(componentLabels, (componentId, index) => {
        const included = !lockedMask[index] && componentIds.has(componentId);
        if (included) {
          if (assigned[index]) throw new Error("부위 마스크가 서로 겹칩니다.");
          assigned[index] = 1;
        }
        return included;
      });
      masks[region.id] = Object.freeze(mask);
    });

    const editableCount = lockedMask.filter((locked) => !locked).length;
    const assignedCount = assigned.reduce((total, value) => total + value, 0);
    if (assignedCount !== editableCount) {
      throw new Error(
        `부위 마스크에 포함되지 않은 칸이 ${editableCount - assignedCount}개 있습니다.`,
      );
    }

    regionMasks = Object.freeze(masks);
    regionSummary = Object.freeze(REGION_DEFINITIONS.map((region) => {
      const pixelCount = regionMasks[region.id].filter(Boolean).length;
      return Object.freeze({
        id: region.id,
        label: region.label,
        weight: region.weight,
        pixelCount,
        ratio: Math.round((pixelCount / editableCount) * 1000) / 10,
      });
    }));

    stage.dataset.maskSummary = JSON.stringify(regionSummary);
    stage.dataset.editablePixels = String(editableCount);
    stage.dataset.lockedPixels = String(lockedMask.length - editableCount);
  }

  function renderArtwork() {
    artworkContext.fillStyle = PAPER;
    artworkContext.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    playerPixels.forEach((color, index) => {
      if (!color || lockedMask[index]) return;
      artworkContext.fillStyle = color;
      artworkContext.fillRect(index % GRID_SIZE, Math.floor(index / GRID_SIZE), 1, 1);
    });
    artworkContext.fillStyle = OUTLINE;
    lockedMask.forEach((locked, index) => {
      if (!locked) return;
      artworkContext.fillRect(index % GRID_SIZE, Math.floor(index / GRID_SIZE), 1, 1);
    });
    app.setArtwork(artwork);
  }

  function snapshot() {
    return playerPixels.slice();
  }

  function restore(snapshotPixels) {
    playerPixels.splice(0, playerPixels.length, ...snapshotPixels);
    renderArtwork();
  }

  function pushHistory() {
    undoStack.push(snapshot());
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack.length = 0;
    state.canUndo = true;
    state.canRedo = false;
  }

  function brushAt(index) {
    if (index < 0 || index === lastPaintedIndex) return;
    lastPaintedIndex = index;
    const centerX = index % GRID_SIZE;
    const centerY = Math.floor(index / GRID_SIZE);
    const size = Math.max(1, state.brushSize || 1);
    const start = -Math.floor((size - 1) / 2);
    const end = start + size;
    for (let yOffset = start; yOffset < end; yOffset += 1) {
      for (let xOffset = start; xOffset < end; xOffset += 1) {
        const x = centerX + xOffset;
        const y = centerY + yOffset;
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) continue;
        const paintIndex = y * GRID_SIZE + x;
        if (lockedMask[paintIndex]) continue;
        playerPixels[paintIndex] = state.activeTool === "eraser"
          ? null
          : state.activeColor;
      }
    }
    renderArtwork();
  }

  function floodFill(startIndex) {
    if (startIndex < 0 || lockedMask[startIndex]) return;
    const original = playerPixels[startIndex];
    const replacement = state.activeColor;
    if (original === replacement) return;
    const queue = [startIndex];
    const visited = new Uint8Array(playerPixels.length);
    while (queue.length) {
      const index = queue.pop();
      if (visited[index] || lockedMask[index] || playerPixels[index] !== original) continue;
      visited[index] = 1;
      playerPixels[index] = replacement;
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);
      if (x > 0) queue.push(index - 1);
      if (x < GRID_SIZE - 1) queue.push(index + 1);
      if (y > 0) queue.push(index - GRID_SIZE);
      if (y < GRID_SIZE - 1) queue.push(index + GRID_SIZE);
    }
    renderArtwork();
  }

  function indexFromPointer(event, surface) {
    const rect = surface.getBoundingClientRect();
    const x = Math.max(0, Math.min(GRID_SIZE - 1,
      Math.floor(((event.clientX - rect.left) / rect.width) * GRID_SIZE)));
    const y = Math.max(0, Math.min(GRID_SIZE - 1,
      Math.floor(((event.clientY - rect.top) / rect.height) * GRID_SIZE)));
    return y * GRID_SIZE + x;
  }

  function attachDrawingSurface() {
    const oldSurface = app.screen.hits.querySelector(".workbench-draw-surface");
    if (oldSurface) oldSurface.remove();
    const surface = document.createElement("div");
    surface.className = "workbench-draw-surface";
    surface.tabIndex = 0;
    surface.setAttribute("role", "application");
    surface.setAttribute(
      "aria-label",
      `${GRID_SIZE} 곱하기 ${GRID_SIZE} ${config.drawingLabel || "그림 영역"}`,
    );

    surface.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      surface.setPointerCapture(event.pointerId);
      pushHistory();
      drawing = true;
      lastPaintedIndex = -1;
      const index = indexFromPointer(event, surface);
      if (state.activeTool === "fill") floodFill(index);
      else brushAt(index);
    });
    surface.addEventListener("pointermove", (event) => {
      if (!drawing || state.activeTool === "fill") return;
      brushAt(indexFromPointer(event, surface));
    });
    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      lastPaintedIndex = -1;
      state.feedback = `${paintedCount().toLocaleString("ko-KR")}칸 채색됨`;
      renderWorkbench();
    };
    surface.addEventListener("pointerup", stopDrawing);
    surface.addEventListener("pointercancel", stopDrawing);
    app.screen.hits.appendChild(surface);
  }

  function paintedCount() {
    return playerPixels.reduce(
      (count, color, index) => count + (!lockedMask[index] && color ? 1 : 0),
      0,
    );
  }

  function renderWorkbench() {
    app.render(state);
    app.setArtwork(artwork);
    attachDrawingSurface();
  }

  function undo() {
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push(snapshot());
    restore(previous);
    state.canUndo = undoStack.length > 0;
    state.canRedo = true;
    state.feedback = "마지막 붓질을 되돌렸습니다";
    renderWorkbench();
  }

  function redo() {
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(snapshot());
    restore(next);
    state.canUndo = true;
    state.canRedo = redoStack.length > 0;
    state.feedback = "붓질을 다시 적용했습니다";
    renderWorkbench();
  }

  function reset() {
    if (playerPixels.every((color) => color === null)) return;
    pushHistory();
    playerPixels.fill(null);
    state.feedback = "새 종이를 준비했습니다";
    renderArtwork();
    renderWorkbench();
  }

  function submit() {
    if (!regionMasks) {
      state.feedback = feedback.loadingMasks;
      renderWorkbench();
      return;
    }
    const scoringPixels = playerPixels.map((color, index) =>
      lockedMask[index] ? targetPixels[index] : color,
    );
    lastScoreResult = global.MontageScoring.evaluate({
      targetPixels,
      playerPixels: scoringPixels,
      regionMasks,
      regionDefinitions: REGION_DEFINITIONS,
      gridSize: GRID_SIZE,
      config: config.scoring,
    });
    state.feedback = feedback.submitted;
    renderWorkbench();
    app.screen.say(feedback.submittedAnnouncement);
    stage.dispatchEvent(new CustomEvent("workbench:submitted", {
      detail: Object.freeze({ questId: config.id, result: lastScoreResult }),
    }));
    if (lastScoreResult.passed) {
      stage.dispatchEvent(new CustomEvent("workbench:passed", {
        detail: Object.freeze({ questId: config.id, result: lastScoreResult }),
      }));
    } else {
      stage.dispatchEvent(new CustomEvent("workbench:failed", {
        detail: Object.freeze({ questId: config.id, result: lastScoreResult }),
      }));
    }
  }

  function handleAction(action) {
    if (action.type === "select-color") state.activeColor = action.hex;
    if (action.type === "select-tool") {
      state.activeTool = action.tool;
      state.brushSize = action.size;
    }
    if (action.type === "undo") undo();
    if (action.type === "redo") redo();
    if (action.type === "reset") reset();
    if (action.type === "submit") submit();
    // 단일 셸에서는 Director 가 화면을 바꾼다. backUrl 은 board.html fallback 전용이다.
    if (action.type === "back-to-board") {
      if (typeof config.onBackToBoard === "function") config.onBackToBoard();
      else global.location.href = config.backUrl || "board.html";
    }
  }

  async function start() {
    app = global.Workbench.mount(stage, {
      reserveHeight: 54,
      onAction: handleAction,
    });
    renderWorkbench();
    try {
      const [lineImage, targetImage] = await Promise.all([
        loadImage(LINE_SOURCE),
        loadImage(TARGET_SOURCE),
      ]);
      prepareSources(lineImage, targetImage);
      state.feedback = feedback.ready;
      renderArtwork();
      renderWorkbench();
    } catch (error) {
      state.feedback = feedback.loadError;
      renderWorkbench();
      console.error(error);
    }
  }

  const ready = start();
  return Object.freeze({
    questId: config.id,
    gridSize: GRID_SIZE,
    palette,
    ready,
    getLockedMask: () => Object.freeze(lockedMask.slice()),
    getPlayerPixels: () => Object.freeze(playerPixels.slice()),
    getRegionMasks: () => regionMasks,
    getRegionSummary: () => regionSummary,
    getLastScoreResult: () => lastScoreResult,
    getTargetPixels: () => Object.freeze(targetPixels.slice()),
    /**
     * 화면을 떠날 때 PixelScreen 의 resize 리스너와 그리기 표면까지 해제한다.
     * 단일 셸에서 작업대를 여러 번 여닫아도 리스너가 쌓이면 안 된다.
     */
    destroy() {
      app?.destroy();
      app = null;
    },
  });
  }

  global.WorkbenchRuntime = Object.freeze({ mount });
})(window);
