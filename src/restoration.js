/**
 * 복원 작업대 화면.
 * 기준: GAME_DESIGN 8장 / docs/script/00_SYSTEM.md 4장
 *  - 작업 중에는 점수·통과 여부를 절대 표시하지 않는다
 *  - 복원 목표에는 이미 확보한 증언으로 해금된 특징만 표시한다
 *  - 제출 전 확인창, 제출 횟수 무제한, 실패해도 그림을 보존한다
 */
(function () {
  "use strict";

  const UNDO_LIMIT = 60;

  function createWorkbench(root, options) {
    let quest = options.quest;
    let onCleared = options.onCleared;
    let size = quest.gridSize;
    const canvas = root.querySelector("[data-role=canvas]");
    const context = canvas.getContext("2d");
    const paletteEl = root.querySelector("[data-role=palette]");
    const toolsEl = root.querySelector("[data-role=tools]");
    const goalsEl = root.querySelector("[data-role=goals]");
    const cluesEl = root.querySelector("[data-role=clues]");
    const resultEl = root.querySelector("[data-role=result]");

    let cellSize = canvas.width / size;

    let pixels = quest.lockedPixels.slice();
    let undoStack = [];
    let redoStack = [];
    let activeColor = quest.palette[0].hex;
    let activeTool = "pencil";
    let painting = false;

    /** 증언으로 해금된 필수 특징만 목표·채점 대상이 된다(00_SYSTEM 4.1). */
    function activeFeatures() {
      return quest.requiredFeatures.filter((feature) => {
        if (feature.always) return true;
        if (feature.clue && window.GameState.has(feature.clue)) return true;
        if (
          feature.cluesAny &&
          feature.cluesAny.some((clue) => window.GameState.has(clue))
        ) {
          return true;
        }
        return false;
      });
    }

    function pushUndo() {
      undoStack.push(pixels.slice());
      if (undoStack.length > UNDO_LIMIT) undoStack.shift();
      redoStack = [];
    }

    // 256²(65,536칸)에서는 칸마다 fillRect 를 부르면 느리다.
    // 논리 해상도 그대로의 ImageData 에 직접 쓰고 한 번에 올린다.
    let frame = null;
    const EMPTY = [58, 50, 43]; // 아직 칠하지 않은 자리 — 작업대 바탕

    function rgbOf(hex) {
      const v = hex.replace("#", "");
      return [
        parseInt(v.slice(0, 2), 16),
        parseInt(v.slice(2, 4), 16),
        parseInt(v.slice(4, 6), 16),
      ];
    }

    function draw() {
      if (!frame || frame.width !== size) {
        canvas.width = size;
        canvas.height = size;
        frame = context.createImageData(size, size);
      }
      const data = frame.data;

      for (let i = 0; i < pixels.length; i++) {
        const offset = i * 4;
        if (!quest.paintable[i] && !quest.lockedPixels[i]) {
          data[offset + 3] = 0; // 배경은 투명
          continue;
        }
        const color = pixels[i];
        const [r, g, b] = color ? rgbOf(color) : EMPTY;
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
        data[offset + 3] = 255;
      }

      context.putImageData(frame, 0, 0);
      updateGrid();
    }

    /** 칸이 충분히 클 때만 격자를 보여 준다. 256²에서는 잡음이 될 뿐이다. */
    function updateGrid() {
      const grid = root.querySelector("[data-role=grid]");
      if (!grid) return;
      const displayed = canvas.getBoundingClientRect().width || 384;
      const cell = displayed / size;
      grid.hidden = cell < 6;
      grid.style.setProperty("--cell", `${cell}px`);
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
      if (x < 0 || y < 0 || x >= size || y >= size) return -1;
      return y * size + x;
    }

    /**
     * 채울 영역의 셀 목록.
     * artwork.js 로 준비한 아트는 영역이 미리 계산돼 있고,
     * 그렇지 않은 아트(문자맵 기반)는 현재 색이 같은 칸들을 즉석에서 묶는다.
     */
    function regionCells(index) {
      if (quest.regionOf && quest.regions) {
        const id = quest.regionOf[index];
        return id >= 0 ? quest.regions[id] : [];
      }

      const seed = pixels[index] || null;
      const cells = [];
      const seen = new Set([index]);
      const stack = [index];

      while (stack.length > 0) {
        const at = stack.pop();
        cells.push(at);
        const x = at % size;
        const y = (at / size) | 0;
        const push = (n) => {
          if (seen.has(n) || !quest.hiddenMask[n]) return;
          if ((pixels[n] || null) !== seed) return;
          seen.add(n);
          stack.push(n);
        };
        if (x > 0) push(at - 1);
        if (x < size - 1) push(at + 1);
        if (y > 0) push(at - size);
        if (y < size - 1) push(at + size);
      }
      return cells;
    }

    function applyTool(index) {
      if (index < 0) return;
      // 선화와 배경은 수정할 수 없다.
      if (!quest.hiddenMask[index]) return;

      if (activeTool === "fill") {
        // 선화로 둘러싸인 영역 하나를 통째로 칠한다.
        // 256²를 한 픽셀씩 칠하는 것은 불가능하므로 이것이 기본 도구다.
        const cells = regionCells(index);
        if (cells.length === 0) return;
        let changed = false;
        for (let i = 0; i < cells.length; i++) {
          if (pixels[cells[i]] !== activeColor) {
            pixels[cells[i]] = activeColor;
            changed = true;
          }
        }
        if (!changed) return;
      } else if (activeTool === "pencil") {
        if (pixels[index] === activeColor) return;
        pixels[index] = activeColor;
      } else if (activeTool === "eraser") {
        if (!pixels[index]) return;
        pixels[index] = null;
      } else if (activeTool === "picker") {
        if (pixels[index]) activeColor = pixels[index];
        renderPalette();
        return;
      }
      draw();
    }

    function renderPalette() {
      paletteEl.innerHTML = "";
      quest.palette.forEach((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "swatch";
        button.style.background = entry.hex;
        button.title = entry.name;
        button.setAttribute("aria-label", entry.name);
        if (entry.hex === activeColor) button.classList.add("is-active");
        button.addEventListener("click", () => {
          activeColor = entry.hex;
          // 색을 고른다고 도구가 바뀌면 안 된다. 채우기로 작업하던 흐름이 끊긴다.
          // 다만 지우개·스포이드 상태였다면 칠하려는 의도로 보고 그리기 도구로 돌린다.
          if (activeTool === "eraser" || activeTool === "picker") {
            activeTool = "fill";
          }
          renderPalette();
          renderTools();
        });
        paletteEl.appendChild(button);
      });
    }

    function renderTools() {
      const tools = [
        { id: "fill", label: "채우기" },
        { id: "pencil", label: "연필" },
        { id: "eraser", label: "지우개" },
        { id: "picker", label: "스포이드" },
      ];
      toolsEl.innerHTML = "";
      tools.forEach((tool) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tool";
        button.textContent = tool.label;
        if (tool.id === activeTool) button.classList.add("is-active");
        button.addEventListener("click", () => {
          activeTool = tool.id;
          renderTools();
        });
        toolsEl.appendChild(button);
      });
    }

    function renderGoals() {
      const features = activeFeatures();
      goalsEl.innerHTML = "";

      if (features.length === 0) {
        const li = document.createElement("li");
        li.className = "muted";
        li.textContent = "아직 아는 특징이 없다. 증언을 더 들어야 한다.";
        goalsEl.appendChild(li);
        return;
      }

      // 목표는 명세 항목이 아니라 '기억나는 말'이다.
      // "얼굴·턱 윤곽선" 같은 설계 용어는 몰입을 깬다. 증언자의 목소리를 그대로 남긴다.
      features.forEach((feature) => {
        const li = document.createElement("li");

        if (feature.quote) {
          const quote = document.createElement("q");
          quote.className = "goal-quote";
          quote.textContent = feature.quote;
          li.appendChild(quote);

          if (feature.speaker) {
            const who = document.createElement("cite");
            who.className = "goal-speaker";
            who.textContent = `— ${feature.speaker}`;
            li.appendChild(who);
          }
        } else {
          // 아직 목격담이 붙지 않은 특징은 기존 라벨로 보여 준다.
          li.textContent = feature.label;
        }

        goalsEl.appendChild(li);
      });
    }

    function renderClues() {
      const cards = (quest.clueCards || []).filter(
        (card) =>
          (!card.flag && !card.flagsAny) ||
          (card.flag && window.GameState.has(card.flag)) ||
          (card.flagsAny && card.flagsAny.some((flag) => window.GameState.has(flag))),
      );

      cluesEl.innerHTML = "";
      cards.forEach((card) => {
        const li = document.createElement("li");
        const speaker = document.createElement("strong");
        speaker.textContent = card.speaker;
        const text = document.createElement("span");
        text.textContent = card.text;
        li.append(speaker, text);
        cluesEl.appendChild(li);
      });
    }

    async function submit() {
      const confirmed = await window.UI.confirm(
        "이 그림을 제출하시겠습니까?\n제출한 뒤에도 다시 수정할 수 있습니다.",
        { okLabel: "제출한다", cancelLabel: "더 그린다" },
      );
      if (!confirmed) return;

      // 짧은 종이 넘김 연출 후 결과
      root.classList.add("is-developing");
      window.setTimeout(() => {
        root.classList.remove("is-developing");
        const outcome = window.RestorationFeedback.evaluate(
          quest,
          pixels,
          activeFeatures(),
        );
        showResult(outcome);
      }, 650);
    }

    function showResult(outcome) {
      resultEl.hidden = false;
      resultEl.dataset.tier = outcome.tier;
      resultEl.innerHTML = "";

      const headline = document.createElement("p");
      headline.className = "result-headline";
      headline.textContent = outcome.headline;
      resultEl.appendChild(headline);

      outcome.notes.forEach((note) => {
        const p = document.createElement("p");
        p.className = "result-note";
        p.textContent = note;
        resultEl.appendChild(p);
      });

      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = outcome.cleared
        ? quest.clearedLabel || "복원 결과를 확인한다"
        : "계속 수정하기";
      button.addEventListener("click", () => {
        resultEl.hidden = true;
        if (outcome.cleared) onCleared();
      });
      resultEl.appendChild(button);
      // 결과가 화면 밖에 있으면 아무 일도 없었던 것처럼 보인다.
      resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    canvas.addEventListener("mousedown", (event) => {
      painting = true;
      pushUndo();
      applyTool(cellFromEvent(event));
    });
    canvas.addEventListener("mousemove", (event) => {
      if (!painting) return;
      applyTool(cellFromEvent(event));
    });
    window.addEventListener("mouseup", () => {
      painting = false;
    });
    canvas.addEventListener("mouseleave", () => {
      painting = false;
    });

    root.querySelector("[data-action=undo]").addEventListener("click", () => {
      if (undoStack.length === 0) return;
      redoStack.push(pixels.slice());
      pixels = undoStack.pop();
      draw();
    });
    root.querySelector("[data-action=redo]").addEventListener("click", () => {
      if (redoStack.length === 0) return;
      undoStack.push(pixels.slice());
      pixels = redoStack.pop();
      draw();
    });
    root.querySelector("[data-action=reset]").addEventListener("click", async () => {
      const confirmed = await window.UI.confirm(
        "그림을 처음 상태로 되돌리시겠습니까?\n지금까지 칠한 색이 모두 지워집니다.",
        { okLabel: "되돌린다", cancelLabel: "그만둔다" },
      );
      if (!confirmed) return;
      pushUndo();
      pixels = quest.lockedPixels.slice();
      draw();
    });
    root.querySelector("[data-action=submit]").addEventListener("click", submit);

    function refresh() {
      renderPalette();
      renderTools();
      renderGoals();
      renderClues();
      draw();
    }

    // 아트 파이프라인으로 준비한 결과는 퀘스트당 한 번만 계산한다(256²는 80ms 안팎).
    const preparedCache = new Map();

    /**
     * `source`(PNG 경로 또는 그리기 함수)를 가진 퀘스트는 artwork.js 로 준비해
     * 정답·선화·채우기 영역을 채워 넣는다. 문자맵 기반 퀘스트는 그대로 쓴다.
     */
    async function resolveQuest(rawQuest) {
      if (!rawQuest.source) return rawQuest;
      if (preparedCache.has(rawQuest.id)) return preparedCache.get(rawQuest.id);

      // 외곽선 색은 플레이어가 고르는 색이 아니지만 양자화 대상에는 반드시 포함해야
      // 한다. 빠뜨리면 어두운 선이 다른 색으로 흡수되어 선화가 만들어지지 않는다.
      const quantizePalette = rawQuest.palette.map((entry) => entry.hex);
      if (!quantizePalette.some((hex) => hex.toUpperCase() === rawQuest.outline.toUpperCase())) {
        quantizePalette.push(rawQuest.outline);
      }

      const art = await window.Artwork.prepare(rawQuest.source, {
        size: rawQuest.gridSize,
        palette: quantizePalette,
        outline: rawQuest.outline,
        minRegion: rawQuest.minRegion,
      });

      // 필수 특징의 대상 픽셀은 '그 색으로 칠해야 하는 곳'으로 자동 도출한다.
      const requiredFeatures = rawQuest.requiredFeatures.map((feature) =>
        Object.freeze({
          ...feature,
          indices: feature.indices || window.Artwork.indicesOfColor(art, feature.color),
        }),
      );

      const resolved = Object.freeze({ ...rawQuest, ...art, requiredFeatures });
      preparedCache.set(rawQuest.id, resolved);
      return resolved;
    }

    async function setQuest(nextQuest, nextOptions = {}) {
      quest = await resolveQuest(nextQuest);
      onCleared = nextOptions.onCleared || onCleared;
      size = quest.gridSize;
      cellSize = canvas.width / size;
      pixels = quest.lockedPixels.slice();
      undoStack = [];
      redoStack = [];
      activeColor = quest.palette[0].hex;
      // 256²에서는 채우기가 기본 도구다.
      activeTool = size > 64 ? "fill" : "pencil";
      painting = false;
      resultEl.hidden = true;
      refresh();
    }

    return { refresh, setQuest };
  }

  window.Restoration = Object.freeze({ create: createWorkbench });
})();
