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
    const quest = options.quest;
    const size = quest.gridSize;
    const canvas = root.querySelector("[data-role=canvas]");
    const context = canvas.getContext("2d");
    const paletteEl = root.querySelector("[data-role=palette]");
    const toolsEl = root.querySelector("[data-role=tools]");
    const goalsEl = root.querySelector("[data-role=goals]");
    const cluesEl = root.querySelector("[data-role=clues]");
    const resultEl = root.querySelector("[data-role=result]");

    const cellSize = canvas.width / size;

    let pixels = quest.lockedPixels.slice();
    let undoStack = [];
    let redoStack = [];
    let activeColor = quest.palette[0].hex;
    let activeTool = "pencil";
    let painting = false;

    /** 증언으로 해금된 필수 특징만 목표·채점 대상이 된다(00_SYSTEM 4.1). */
    function activeFeatures() {
      return quest.requiredFeatures.filter((feature) =>
        window.GameState.has(feature.clue),
      );
    }

    function pushUndo() {
      undoStack.push(pixels.slice());
      if (undoStack.length > UNDO_LIMIT) undoStack.shift();
      redoStack = [];
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (let index = 0; index < pixels.length; index++) {
        const x = (index % size) * cellSize;
        const y = Math.floor(index / size) * cellSize;

        if (!quest.paintable[index]) continue;

        const color = pixels[index];
        if (color) {
          context.fillStyle = color;
          context.fillRect(x, y, cellSize, cellSize);
        } else {
          // 채워야 하는 빈 칸 — 옅은 작업대 바탕
          context.fillStyle = "#3A322B";
          context.fillRect(x, y, cellSize, cellSize);
        }
      }

      // 픽셀 격자
      context.strokeStyle = "rgba(0,0,0,0.18)";
      context.lineWidth = 1;
      for (let i = 0; i <= size; i++) {
        const p = i * cellSize;
        context.beginPath();
        context.moveTo(p, 0);
        context.lineTo(p, canvas.height);
        context.stroke();
        context.beginPath();
        context.moveTo(0, p);
        context.lineTo(canvas.width, p);
        context.stroke();
      }
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
      const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
      if (x < 0 || y < 0 || x >= size || y >= size) return -1;
      return y * size + x;
    }

    function applyTool(index) {
      if (index < 0) return;
      // 선화와 배경은 수정할 수 없다.
      if (!quest.hiddenMask[index]) return;

      if (activeTool === "pencil") {
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
          activeTool = "pencil";
          renderPalette();
          renderTools();
        });
        paletteEl.appendChild(button);
      });
    }

    function renderTools() {
      const tools = [
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

      features.forEach((feature) => {
        const li = document.createElement("li");
        li.textContent = feature.label;
        goalsEl.appendChild(li);
      });
    }

    function renderClues() {
      const cards = [
        { flag: "CLUE_CAT_FUR", text: "온몸이 옅은 회색이에요." },
        { flag: "CLUE_CAT_EAR", text: "귀 한쪽만 하얘요. 나머지는 몸과 같은 회색이고요." },
        { flag: "CLUE_CAT_RIBBON", text: "붉은 리본을 목에 매 줬어요." },
      ].filter((card) => window.GameState.has(card.flag));

      cluesEl.innerHTML = "";
      cards.forEach((card) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>코라</strong><span>${card.text}</span>`;
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
      button.textContent = outcome.cleared ? "전단을 들고 코라에게 간다" : "계속 수정하기";
      button.addEventListener("click", () => {
        resultEl.hidden = true;
        if (outcome.cleared) options.onCleared();
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

    return { refresh };
  }

  window.Restoration = Object.freeze({ create: createWorkbench });
})();
