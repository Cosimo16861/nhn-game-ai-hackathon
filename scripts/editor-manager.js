(function () {
  "use strict";

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return (
      `${String(minutes).padStart(2, "0")}:` +
      String(seconds).padStart(2, "0")
    );
  }

  function getProgressPercentage(filledCount, hiddenCount) {
    if (hiddenCount <= 0) return 0;
    return Math.max(
      0,
      Math.min(100, Math.round((filledCount / hiddenCount) * 100)),
    );
  }

  function create({ config, elements }) {
    let puzzleSource = null;
    let controller = null;
    let solveSeconds = 0;
    let timerId = null;
    let activeTool = "brush";
    let zoomIndex = 0;
    let hints = [];
    let revealedHintCount = 0;
    let hintPuzzleId = null;
    const zoomLevels = Object.freeze([1, 1.5, 2]);

    function renderTimer() {
      elements.timer.textContent = formatTime(solveSeconds);
    }

    function startTimer() {
      if (timerId !== null) return;
      timerId = window.setInterval(() => {
        solveSeconds++;
        renderTimer();
      }, 1000);
    }

    function stopTimer() {
      if (timerId === null) return;
      window.clearInterval(timerId);
      timerId = null;
    }

    function updateStatus(status) {
      const percentage = getProgressPercentage(
        status.filledCount,
        status.hiddenCount,
      );
      elements.progress.textContent =
        `${status.filledCount.toLocaleString("ko-KR")} / ` +
        `${status.hiddenCount.toLocaleString("ko-KR")}칸 · ` +
        `${percentage}%`;
      elements.hudProgressBar.style.width = `${percentage}%`;
      elements.hudProgressBar.setAttribute(
        "aria-valuenow",
        String(percentage),
      );
      elements.undo.disabled = !status.canUndo;
      elements.reset.disabled = !status.canReset;
      elements.score.disabled = status.filledCount === 0;
    }

    function renderMissionHud() {
      const stage = puzzleSource.caseInfo;
      const chapter = puzzleSource.chapterDefinition;
      const stageTotal = chapter?.stages?.length || 1;
      elements.hudStage.textContent =
        `세부 사건 ${stage.order || 1} / ${stageTotal}`;
      elements.hudObjective.textContent =
        stage.summary || "목격담을 참고해 빈 영역을 복원하세요.";
      elements.hudDifficulty.textContent =
        puzzleSource.difficultyRules?.label ||
        stage.difficulty ||
        "-";
      elements.hudPassingScore.textContent =
        `${stage.passingScore}점`;
    }

    function renderHintState() {
      const remaining = Math.max(
        0,
        hints.length - revealedHintCount,
      );
      elements.hintRemaining.textContent =
        `남은 힌트 ${remaining}회`;
      elements.hintButton.disabled =
        !puzzleSource || remaining === 0;
      elements.hintButton.textContent =
        remaining === 0 ? "힌트 사용 완료" : "힌트 보기";
    }

    function revealNextHint() {
      if (!puzzleSource || revealedHintCount >= hints.length) {
        return;
      }
      const hint = hints[revealedHintCount++];
      elements.hintTitle.textContent =
        `${hint.level}단계 · ${hint.title}`;
      elements.hintText.textContent = hint.message;
      elements.hintPanel.hidden = false;
      if (hint.color) {
        elements.hintColor.hidden = false;
        elements.hintColor.style.backgroundColor = hint.color;
        elements.hintColor.textContent = hint.color.toUpperCase();
      } else {
        elements.hintColor.hidden = true;
        elements.hintColor.textContent = "";
      }
      puzzleSource.hintsUsed = revealedHintCount;
      renderHintState();
    }

    function renderToolSelection() {
      const isBrush = activeTool === "brush";
      elements.brushTool.classList.toggle("is-selected", isBrush);
      elements.fillTool.classList.toggle("is-selected", !isBrush);
      elements.brushTool.setAttribute(
        "aria-pressed",
        String(isBrush),
      );
      elements.fillTool.setAttribute(
        "aria-pressed",
        String(!isBrush),
      );
    }

    function selectTool(tool) {
      if (!["brush", "fill"].includes(tool)) return;
      activeTool = tool;
      controller?.setTool(tool);
      renderToolSelection();
    }

    function renderZoom() {
      const zoom = zoomLevels[zoomIndex];
      elements.canvas.style.width = `${zoom * 100}%`;
      elements.zoomValue.textContent = `${zoom * 100}%`;
      elements.zoomOut.disabled = zoomIndex === 0;
      elements.zoomIn.disabled =
        zoomIndex === zoomLevels.length - 1;
    }

    function changeZoom(direction) {
      zoomIndex = Math.max(
        0,
        Math.min(
          zoomLevels.length - 1,
          zoomIndex + direction,
        ),
      );
      renderZoom();
    }

    function createBlankPlayerPixels() {
      if (!puzzleSource) return [];
      return puzzleSource.pixels.map((color, index) =>
        puzzleSource.hiddenMask[index] ? null : color,
      );
    }

    function expandPlayerPixels(playerPixels) {
      return window.Pixelizer.expandPixelGrid(
        playerPixels,
        config.paintGridSize,
        config.paintUnitSize,
      );
    }

    function renderComposite(canvas, playerPixels) {
      if (!puzzleSource) return;
      window.Pixelizer.renderCompositeGrid(
        canvas,
        puzzleSource.analysisPixels,
        expandPlayerPixels(playerPixels),
        puzzleSource.analysisHiddenMaskA,
        puzzleSource.analysisHiddenMaskB,
        puzzleSource.analysisHiddenMaskC,
        config.analysisGridSize,
        config.regionsPerSide,
        puzzleSource.difficultyRules
          ?.labelMinimumBlankRatio ?? 0.55,
      );
    }

    function setSource(source) {
      puzzleSource = source;
    }

    function open(source, { reset = false } = {}) {
      setSource(source);
      if (!puzzleSource) return;

      if (reset) {
        solveSeconds = 0;
        puzzleSource.playerPixels = createBlankPlayerPixels();
      }
      const currentPuzzleId = puzzleSource.caseInfo.id;
      if (reset || hintPuzzleId !== currentPuzzleId) {
        hints = Array.from(
          window.HintManager.buildHints(puzzleSource),
        );
        revealedHintCount = 0;
        hintPuzzleId = currentPuzzleId;
        puzzleSource.hintsUsed = 0;
        elements.hintPanel.hidden = true;
        elements.hintColor.hidden = true;
      }

      controller?.destroy();
      window.UIRenderer.renderCaseBriefing(
        elements.caseTitle,
        elements.witnessList,
        puzzleSource.caseInfo,
      );
      renderMissionHud();
      window.UIRenderer.renderEditorPalette(
        elements.palette,
        puzzleSource.palette,
        (color) => {
          elements.eraser.classList.remove("is-selected");
          controller?.setColor(color);
        },
      );
      elements.eraser.classList.remove("is-selected");
      controller = window.PixelEditor.create({
        canvas: elements.canvas,
        targetPixels: puzzleSource.pixels,
        initialPlayerPixels: puzzleSource.playerPixels,
        hiddenMaskA: puzzleSource.hiddenMaskA,
        hiddenMaskB: puzzleSource.hiddenMaskB,
        hiddenMaskC: puzzleSource.hiddenMaskC,
        gridSize: config.paintGridSize,
        analysisGridSize: config.analysisGridSize,
        paintUnitSize: config.paintUnitSize,
        analysisPixels: puzzleSource.analysisPixels,
        analysisHiddenMaskA: puzzleSource.analysisHiddenMaskA,
        analysisHiddenMaskB: puzzleSource.analysisHiddenMaskB,
        analysisHiddenMaskC: puzzleSource.analysisHiddenMaskC,
        regionsPerSide: config.regionsPerSide,
        labelMinimumBlankRatio:
          puzzleSource.difficultyRules
            ?.labelMinimumBlankRatio ?? 0.55,
        palette: puzzleSource.palette,
        onChange: updateStatus,
      });
      controller.setTool(activeTool);

      renderTimer();
      renderToolSelection();
      renderZoom();
      renderHintState();
      startTimer();
    }

    function syncPlayerPixels() {
      if (!controller || !puzzleSource) return null;
      puzzleSource.playerPixels = controller.getPlayerPixels();
      return puzzleSource.playerPixels;
    }

    function resetSession() {
      stopTimer();
      controller?.destroy();
      controller = null;
      puzzleSource = null;
      solveSeconds = 0;
      activeTool = "brush";
      zoomIndex = 0;
      hints = [];
      revealedHintCount = 0;
      hintPuzzleId = null;
      renderTimer();
      elements.hudStage.textContent = "세부 사건 - / -";
      elements.hudObjective.textContent =
        "목격담을 참고해 빈 영역을 복원하세요.";
      elements.hudDifficulty.textContent = "-";
      elements.hudPassingScore.textContent = "-점";
      elements.progress.textContent = "0 / 0칸 · 0%";
      elements.hudProgressBar.style.width = "0%";
      elements.hudProgressBar.setAttribute("aria-valuenow", "0");
      elements.hintPanel.hidden = true;
      elements.hintTitle.textContent = "";
      elements.hintText.textContent = "";
      elements.hintColor.hidden = true;
      renderHintState();
      renderToolSelection();
      renderZoom();
    }

    elements.eraser.addEventListener("click", () => {
      if (!controller) return;
      elements.palette
        .querySelectorAll(".editor-color")
        .forEach((item) => item.classList.remove("is-selected"));
      elements.eraser.classList.add("is-selected");
      controller.setEraser(true);
    });
    elements.brushTool.addEventListener("click", () => {
      selectTool("brush");
    });
    elements.fillTool.addEventListener("click", () => {
      selectTool("fill");
    });
    elements.zoomOut.addEventListener("click", () => {
      changeZoom(-1);
    });
    elements.zoomIn.addEventListener("click", () => {
      changeZoom(1);
    });
    elements.hintButton.addEventListener("click", revealNextHint);
    elements.undo.addEventListener("click", () => controller?.undo());
    elements.reset.addEventListener("click", () => controller?.reset());

    renderTimer();
    renderToolSelection();
    renderZoom();
    renderHintState();

    return Object.freeze({
      createBlankPlayerPixels,
      expandPlayerPixels,
      getElapsedSeconds: () => solveSeconds,
      open,
      renderComposite,
      resetSession,
      resume: startTimer,
      setSource,
      stop: stopTimer,
      syncPlayerPixels,
    });
  }

  window.EditorManager = Object.freeze({
    create,
    formatTime,
    getProgressPercentage,
  });
})();
