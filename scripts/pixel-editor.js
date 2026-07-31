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
    const labelMinimumBlankRatio =
      options.labelMinimumBlankRatio ?? 0.55;
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
    let activeTool = "brush";
    let drawing = false;
    let activePointerId = null;
    let currentStroke = null;
    let keyboardFocused = false;
    let keyboardCursorIndex = hiddenMask.findIndex(Boolean);
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
          window.Pixelizer.getMaskFillColor(0, column + row);
      } else if (analysisHiddenMaskB[index]) {
        context.fillStyle =
          window.Pixelizer.getMaskFillColor(1, column + row);
      } else if (analysisHiddenMaskC[index]) {
        context.fillStyle =
          window.Pixelizer.getMaskFillColor(2, column + row);
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
      window.Pixelizer.renderMaskLabels(
        context,
        canvas,
        [
          analysisHiddenMaskA,
          analysisHiddenMaskB,
          analysisHiddenMaskC,
        ],
        window.Pixelizer.expandPixelGrid(
          playerPixels,
          gridSize,
          paintUnitSize,
        ),
        analysisGridSize,
        labelMinimumBlankRatio,
      );
      if (
        keyboardFocused &&
        keyboardCursorIndex >= 0 &&
        typeof context.strokeRect === "function"
      ) {
        const column = keyboardCursorIndex % gridSize;
        const row = Math.floor(keyboardCursorIndex / gridSize);
        const width = canvas.width / gridSize;
        const height = canvas.height / gridSize;
        context.save?.();
        context.strokeStyle = "#ffffff";
        context.lineWidth = Math.max(2, canvas.width / 320);
        context.strokeRect(
          column * width,
          row * height,
          width,
          height,
        );
        context.restore?.();
      }
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

    function getMaskGroup(index) {
      if (hiddenMaskA[index]) return hiddenMaskA;
      if (hiddenMaskB[index]) return hiddenMaskB;
      if (hiddenMaskC[index]) return hiddenMaskC;
      return null;
    }

    function fillConnectedArea(startIndex) {
      const activeMask = getMaskGroup(startIndex);
      if (!activeMask) return;

      const sourceColor = playerPixels[startIndex];
      const nextColor = erasing ? null : selectedColor;
      if (sourceColor === nextColor) return;

      const queue = [startIndex];
      const visited = new Set([startIndex]);
      let queueIndex = 0;
      while (queueIndex < queue.length) {
        const index = queue[queueIndex++];
        if (
          !activeMask[index] ||
          playerPixels[index] !== sourceColor
        ) {
          continue;
        }

        currentStroke.set(index, playerPixels[index]);
        playerPixels[index] = nextColor;
        const row = Math.floor(index / gridSize);
        const column = index % gridSize;
        const neighbors = [
          row > 0 ? index - gridSize : -1,
          row < gridSize - 1 ? index + gridSize : -1,
          column > 0 ? index - 1 : -1,
          column < gridSize - 1 ? index + 1 : -1,
        ];
        neighbors.forEach((neighbor) => {
          if (neighbor >= 0 && !visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
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
      const index = eventToIndex(event);
      if (activeTool === "fill") {
        fillConnectedArea(index);
        finishStroke();
      } else {
        paint(index);
      }
    }

    function handlePointerMove(event) {
      if (
        activeTool !== "brush" ||
        !drawing ||
        event.pointerId !== activePointerId
      ) {
        return;
      }
      event.preventDefault();
      paint(eventToIndex(event));
    }

    function handlePointerEnd(event) {
      if (event.pointerId !== activePointerId) return;
      finishStroke();
    }

    function handleKeyDown(event) {
      if (keyboardCursorIndex < 0) return;
      const row = Math.floor(keyboardCursorIndex / gridSize);
      const column = keyboardCursorIndex % gridSize;
      const movements = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      if (movements[event.key]) {
        event.preventDefault();
        const [rowOffset, columnOffset] = movements[event.key];
        const nextRow = Math.max(
          0,
          Math.min(gridSize - 1, row + rowOffset),
        );
        const nextColumn = Math.max(
          0,
          Math.min(gridSize - 1, column + columnOffset),
        );
        keyboardCursorIndex = nextRow * gridSize + nextColumn;
        render();
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      drawing = true;
      activePointerId = "keyboard";
      currentStroke = new Map();
      if (activeTool === "fill") {
        fillConnectedArea(keyboardCursorIndex);
      } else {
        paint(keyboardCursorIndex);
      }
      finishStroke();
    }

    function handleFocus() {
      keyboardFocused = true;
      render();
    }

    function handleBlur() {
      keyboardFocused = false;
      render();
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerEnd);
    canvas.addEventListener("pointercancel", handlePointerEnd);
    canvas.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("focus", handleFocus);
    canvas.addEventListener("blur", handleBlur);

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
      setTool(tool) {
        if (!["brush", "fill"].includes(tool)) return;
        activeTool = tool;
      },
      getTool() {
        return activeTool;
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
        canvas.removeEventListener("keydown", handleKeyDown);
        canvas.removeEventListener("focus", handleFocus);
        canvas.removeEventListener("blur", handleBlur);
      },
    });
  }

  window.PixelEditor = Object.freeze({ create });
})();
