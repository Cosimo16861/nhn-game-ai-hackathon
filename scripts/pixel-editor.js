(function () {
  "use strict";

  function create(options) {
    const {
      canvas,
      targetPixels,
      initialPlayerPixels,
      hiddenMaskA,
      hiddenMaskB,
      hiddenMaskC,
      gridSize,
      regionsPerSide = 4,
      palette,
      onChange,
    } = options;
    const context = canvas.getContext("2d");
    const analysisGridSize = options.analysisGridSize ?? gridSize;
    const paintUnitSize =
      options.paintUnitSize ?? analysisGridSize / gridSize;
    const analysisPixels = options.analysisPixels ?? targetPixels;
    const analysisHiddenMaskA =
      options.analysisHiddenMaskA ?? hiddenMaskA;
    const analysisHiddenMaskB =
      options.analysisHiddenMaskB ?? hiddenMaskB;
    const analysisHiddenMaskC =
      options.analysisHiddenMaskC ?? hiddenMaskC;
    const expectedAnalysisPixelCount =
      analysisGridSize * analysisGridSize;
    const hasValidAnalysisLayers =
      Number.isInteger(paintUnitSize) &&
      paintUnitSize >= 1 &&
      analysisGridSize === gridSize * paintUnitSize &&
      analysisPixels.length === expectedAnalysisPixelCount &&
      analysisHiddenMaskA.length === expectedAnalysisPixelCount &&
      analysisHiddenMaskB.length === expectedAnalysisPixelCount &&
      analysisHiddenMaskC.length === expectedAnalysisPixelCount;

    if (!hasValidAnalysisLayers) {
      throw new Error(
        "분석 화면 데이터와 색칠판 데이터의 크기가 일치하지 않습니다.",
      );
    }

    const hiddenMask = targetPixels.map(
      (_, index) =>
        hiddenMaskA[index] || hiddenMaskB[index] || hiddenMaskC[index],
    );
    let playerPixels = initialPlayerPixels.slice();
    let selectedColor = palette[0];
    let erasing = false;
    let drawing = false;
    let activePointerId = null;
    let currentStroke = null;
    const undoStack = [];

    function notify() {
      const hiddenCount = hiddenMask.filter(Boolean).length;
      const filledCount = playerPixels.reduce(
        (count, color, index) =>
          count + (hiddenMask[index] && color !== null ? 1 : 0),
        0,
      );
      onChange({
        filledCount,
        hiddenCount,
        canUndo: undoStack.length > 0,
        canReset: filledCount > 0,
      });
    }

    function drawAnalysisCell(index) {
      const cellWidth = canvas.width / analysisGridSize;
      const cellHeight = canvas.height / analysisGridSize;
      const column = index % analysisGridSize;
      const row = Math.floor(index / analysisGridSize);
      const paintColumn = Math.floor(column / paintUnitSize);
      const paintRow = Math.floor(row / paintUnitSize);
      const paintIndex = paintRow * gridSize + paintColumn;
      const playerColor = playerPixels[paintIndex];

      if (
        !analysisHiddenMaskA[index] &&
        !analysisHiddenMaskB[index] &&
        !analysisHiddenMaskC[index]
      ) {
        context.fillStyle = analysisPixels[index];
      } else if (playerColor) {
        context.fillStyle = playerColor;
      } else if (analysisHiddenMaskA[index]) {
        context.fillStyle =
          (column + row) % 2 === 0 ? "#20283a" : "#121827";
      } else if (analysisHiddenMaskB[index]) {
        context.fillStyle =
          (column + row) % 2 === 0 ? "#392342" : "#22162b";
      } else if (analysisHiddenMaskC[index]) {
        context.fillStyle =
          (column + row) % 2 === 0 ? "#244039" : "#152620";
      }

      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    }

    function drawPaintCell(index) {
      const paintColumn = index % gridSize;
      const paintRow = Math.floor(index / gridSize);

      for (let offsetY = 0; offsetY < paintUnitSize; offsetY++) {
        const analysisRow = paintRow * paintUnitSize + offsetY;
        for (let offsetX = 0; offsetX < paintUnitSize; offsetX++) {
          const analysisColumn =
            paintColumn * paintUnitSize + offsetX;
          drawAnalysisCell(
            analysisRow * analysisGridSize + analysisColumn,
          );
        }
      }
    }

    function render() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;

      analysisPixels.forEach((_, index) => drawAnalysisCell(index));

      context.beginPath();
      context.strokeStyle = "rgba(255, 255, 255, 0.55)";
      context.lineWidth = 2;
      for (let line = 1; line < regionsPerSide; line++) {
        const x = (canvas.width / regionsPerSide) * line;
        const y = (canvas.height / regionsPerSide) * line;
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
      }
      context.stroke();
    }

    function eventToIndex(event) {
      const bounds = canvas.getBoundingClientRect();
      const x = (event.clientX - bounds.left) * (canvas.width / bounds.width);
      const y = (event.clientY - bounds.top) * (canvas.height / bounds.height);
      const column = Math.max(
        0,
        Math.min(gridSize - 1, Math.floor(x / (canvas.width / gridSize))),
      );
      const row = Math.max(
        0,
        Math.min(gridSize - 1, Math.floor(y / (canvas.height / gridSize))),
      );
      return row * gridSize + column;
    }

    function paint(index) {
      if (!hiddenMask[index]) return;

      const nextColor = erasing ? null : selectedColor;
      if (playerPixels[index] === nextColor) return;
      if (!currentStroke.has(index)) {
        currentStroke.set(index, playerPixels[index]);
      }
      playerPixels[index] = nextColor;
      drawPaintCell(index);
    }

    function finishStroke() {
      if (!drawing) return;
      drawing = false;
      activePointerId = null;

      const changes = Array.from(currentStroke, ([index, before]) => ({
        index,
        before,
        after: playerPixels[index],
      })).filter((change) => change.before !== change.after);

      if (changes.length > 0) {
        undoStack.push(changes);
      }
      currentStroke = null;
      render();
      notify();
    }

    function handlePointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      drawing = true;
      activePointerId = event.pointerId;
      currentStroke = new Map();
      canvas.setPointerCapture?.(event.pointerId);
      paint(eventToIndex(event));
    }

    function handlePointerMove(event) {
      if (!drawing || event.pointerId !== activePointerId) return;
      event.preventDefault();
      paint(eventToIndex(event));
    }

    function handlePointerEnd(event) {
      if (event.pointerId !== activePointerId) return;
      finishStroke();
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);

    render();
    notify();

    return Object.freeze({
      setColor(color) {
        if (!palette.includes(color)) return;
        selectedColor = color;
        erasing = false;
      },
      setEraser(enabled) {
        erasing = enabled;
      },
      undo() {
        const changes = undoStack.pop();
        if (!changes) return;
        changes.forEach(({ index, before }) => {
          playerPixels[index] = before;
        });
        render();
        notify();
      },
      reset() {
        const changes = [];
        playerPixels.forEach((color, index) => {
          if (!hiddenMask[index] || color === null) return;
          changes.push({ index, before: color, after: null });
          playerPixels[index] = null;
        });
        if (changes.length > 0) undoStack.push(changes);
        render();
        notify();
      },
      getPlayerPixels() {
        return playerPixels.slice();
      },
      destroy() {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerEnd);
        canvas.removeEventListener("pointercancel", handlePointerEnd);
      },
    });
  }

  window.PixelEditor = Object.freeze({ create });
})();
