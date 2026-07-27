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

  function create({ config, elements }) {
    let puzzleSource = null;
    let controller = null;
    let solveSeconds = 0;
    let timerId = null;

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
      elements.progress.textContent =
        `${status.filledCount.toLocaleString("ko-KR")} / ` +
        `${status.hiddenCount.toLocaleString("ko-KR")}칸 채움`;
      elements.undo.disabled = !status.canUndo;
      elements.reset.disabled = !status.canReset;
      elements.score.disabled = status.filledCount === 0;
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

      controller?.destroy();
      window.UIRenderer.renderCaseBriefing(
        elements.caseTitle,
        elements.witnessList,
        puzzleSource.caseInfo,
      );
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
        palette: puzzleSource.palette,
        onChange: updateStatus,
      });

      renderTimer();
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
      renderTimer();
    }

    elements.eraser.addEventListener("click", () => {
      if (!controller) return;
      elements.palette
        .querySelectorAll(".editor-color")
        .forEach((item) => item.classList.remove("is-selected"));
      elements.eraser.classList.add("is-selected");
      controller.setEraser(true);
    });
    elements.undo.addEventListener("click", () => controller?.undo());
    elements.reset.addEventListener("click", () => controller?.reset());

    renderTimer();

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

  window.EditorManager = Object.freeze({ create, formatTime });
})();
