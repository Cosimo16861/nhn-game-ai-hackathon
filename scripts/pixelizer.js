(function () {
  "use strict";

  function componentToHex(value) {
    return Math.round(value).toString(16).padStart(2, "0");
  }

  function rgbToHex(color) {
    return `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;
  }

  function colorDistanceSquared(a, b) {
    const redMean = (a.r + b.r) / 2;
    const redDifference = a.r - b.r;
    const greenDifference = a.g - b.g;
    const blueDifference = a.b - b.b;

    return (
      (2 + redMean / 256) * redDifference * redDifference +
      4 * greenDifference * greenDifference +
      (2 + (255 - redMean) / 256) * blueDifference * blueDifference
    );
  }

  function findWidestChannel(colors) {
    const ranges = ["r", "g", "b"].map((channel) => {
      const values = colors.map((color) => color[channel]);
      return {
        channel,
        range: Math.max(...values) - Math.min(...values),
      };
    });

    ranges.sort((a, b) => b.range - a.range);
    return ranges[0];
  }

  function averageColor(colors) {
    const total = colors.reduce(
      (sum, color) => ({
        r: sum.r + color.r,
        g: sum.g + color.g,
        b: sum.b + color.b,
      }),
      { r: 0, g: 0, b: 0 },
    );

    return {
      r: total.r / colors.length,
      g: total.g / colors.length,
      b: total.b / colors.length,
    };
  }

  function createPalette(colors, maximumColors) {
    const boxes = [colors.slice()];

    while (boxes.length < maximumColors) {
      let splitIndex = -1;
      let splitRange = -1;
      let splitChannel = "r";

      boxes.forEach((box, index) => {
        if (box.length < 2) return;
        const widest = findWidestChannel(box);
        if (widest.range > splitRange) {
          splitIndex = index;
          splitRange = widest.range;
          splitChannel = widest.channel;
        }
      });

      if (splitIndex < 0 || splitRange === 0) break;

      const boxToSplit = boxes.splice(splitIndex, 1)[0];
      boxToSplit.sort((a, b) => a[splitChannel] - b[splitChannel]);
      const midpoint = Math.ceil(boxToSplit.length / 2);
      boxes.push(boxToSplit.slice(0, midpoint), boxToSplit.slice(midpoint));
    }

    return boxes.filter((box) => box.length > 0).map(averageColor);
  }

  function findClosestPaletteColor(color, palette) {
    let closest = palette[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    palette.forEach((candidate) => {
      const distance = colorDistanceSquared(color, candidate);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = candidate;
      }
    });

    return closest;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const usesObjectUrl = typeof source !== "string";
      const imageUrl = usesObjectUrl ? URL.createObjectURL(source) : source;

      image.addEventListener(
        "load",
        () => {
          if (usesObjectUrl) URL.revokeObjectURL(imageUrl);
          resolve(image);
        },
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          if (usesObjectUrl) URL.revokeObjectURL(imageUrl);
          reject(new Error("이미지를 읽을 수 없습니다."));
        },
        { once: true },
      );
      image.src = imageUrl;
    });
  }

  function drawSquareCrop(image, canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }

  function readDownscaledPixels(image, gridSize) {
    const canvas = document.createElement("canvas");
    canvas.width = gridSize;
    canvas.height = gridSize;
    drawSquareCrop(image, canvas);

    const context = canvas.getContext("2d", { willReadFrequently: true });
    const data = context.getImageData(0, 0, gridSize, gridSize).data;
    const colors = [];

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255;
      colors.push({
        r: data[index] * alpha + 255 * (1 - alpha),
        g: data[index + 1] * alpha + 255 * (1 - alpha),
        b: data[index + 2] * alpha + 255 * (1 - alpha),
      });
    }

    return colors;
  }

  function expandPixelGrid(pixels, gridSize, scale) {
    if (
      pixels.length !== gridSize * gridSize ||
      !Number.isInteger(scale) ||
      scale < 1
    ) {
      throw new Error("확대할 픽셀 데이터와 배율이 올바르지 않습니다.");
    }

    const expandedGridSize = gridSize * scale;
    const expandedPixels = new Array(expandedGridSize * expandedGridSize);

    for (let row = 0; row < gridSize; row++) {
      for (let column = 0; column < gridSize; column++) {
        const color = pixels[row * gridSize + column];
        for (let offsetY = 0; offsetY < scale; offsetY++) {
          const targetRow = row * scale + offsetY;
          for (let offsetX = 0; offsetX < scale; offsetX++) {
            const targetColumn = column * scale + offsetX;
            expandedPixels[targetRow * expandedGridSize + targetColumn] =
              color;
          }
        }
      }
    }

    return expandedPixels;
  }

  function composePixelLayers(
    referencePixels,
    expandedPlayerPixels,
    hiddenMasks,
  ) {
    const pixelCount = referencePixels.length;
    const hasValidLayers =
      expandedPlayerPixels.length === pixelCount &&
      hiddenMasks.length > 0 &&
      hiddenMasks.every((mask) => mask.length === pixelCount);

    if (!hasValidLayers) {
      throw new Error("합성할 이미지와 마스크 크기가 일치하지 않습니다.");
    }

    return referencePixels.map((referenceColor, index) => {
      const isHidden = hiddenMasks.some((mask) => mask[index]);
      return isHidden ? expandedPlayerPixels[index] : referenceColor;
    });
  }

  function renderPixelGrid(canvas, pixels, gridSize) {
    const context = canvas.getContext("2d");
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    pixels.forEach((color, index) => {
      const column = index % gridSize;
      const row = Math.floor(index / gridSize);
      context.fillStyle =
        color || ((column + row) % 2 === 0 ? "#20283a" : "#121827");
      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    });
  }

  function renderSplitMaskGrid(
    canvas,
    pixels,
    hiddenMaskA,
    hiddenMaskB,
    hiddenMaskC,
    gridSize,
    regionsPerSide = 4,
  ) {
    const context = canvas.getContext("2d");
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    pixels.forEach((color, index) => {
      const column = index % gridSize;
      const row = Math.floor(index / gridSize);

      if (hiddenMaskA[index]) {
        context.fillStyle = getMaskFillColor(0, column + row);
      } else if (hiddenMaskB[index]) {
        context.fillStyle = getMaskFillColor(1, column + row);
      } else if (hiddenMaskC[index]) {
        context.fillStyle = getMaskFillColor(2, column + row);
      } else {
        context.fillStyle = color;
      }

      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    });

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
    renderMaskLabels(
      context,
      canvas,
      [hiddenMaskA, hiddenMaskB, hiddenMaskC],
      Array(pixels.length).fill(null),
      gridSize,
    );
  }

  function renderPlayerGrid(
    canvas,
    targetPixels,
    playerPixels,
    hiddenMaskA,
    hiddenMaskB,
    hiddenMaskC,
    gridSize,
  ) {
    const context = canvas.getContext("2d");
    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    targetPixels.forEach((targetColor, index) => {
      const column = index % gridSize;
      const row = Math.floor(index / gridSize);
      const playerColor = playerPixels[index];

      if (playerColor) {
        context.fillStyle = playerColor;
      } else if (hiddenMaskA[index]) {
        context.fillStyle = getMaskFillColor(0, column + row);
      } else if (hiddenMaskB[index]) {
        context.fillStyle = getMaskFillColor(1, column + row);
      } else if (hiddenMaskC[index]) {
        context.fillStyle = getMaskFillColor(2, column + row);
      } else {
        context.fillStyle = targetColor;
      }

      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    });
    renderMaskLabels(
      context,
      canvas,
      [hiddenMaskA, hiddenMaskB, hiddenMaskC],
      playerPixels,
      gridSize,
    );
  }

  const MASK_FILL_COLORS = Object.freeze([
    Object.freeze(["#3d351d", "#2d2819"]),
    Object.freeze(["#193a31", "#122c26"]),
    Object.freeze(["#452524", "#311c1b"]),
  ]);
  const MASK_LABEL_COLORS = Object.freeze([
    "#f5c761",
    "#6fc9aa",
    "#e8736c",
  ]);

  function getMaskFillColor(maskIndex, parity) {
    const palette =
      MASK_FILL_COLORS[maskIndex] || MASK_FILL_COLORS[0];
    return palette[Math.abs(parity) % 2];
  }

  function renderMaskLabels(
    context,
    canvas,
    hiddenMasks,
    playerPixels,
    gridSize,
    minimumBlankRatio = 0.55,
  ) {
    if (
      typeof context.fillText !== "function" ||
      !Array.isArray(hiddenMasks) ||
      !Array.isArray(playerPixels)
    ) {
      return;
    }

    hiddenMasks.forEach((mask, maskIndex) => {
      let hiddenCount = 0;
      let blankCount = 0;
      let columnTotal = 0;
      let rowTotal = 0;

      mask.forEach((hidden, index) => {
        if (!hidden) return;
        hiddenCount++;
        if (playerPixels[index] !== null) return;
        blankCount++;
        columnTotal += index % gridSize;
        rowTotal += Math.floor(index / gridSize);
      });
      if (
        blankCount === 0 ||
        blankCount / hiddenCount < minimumBlankRatio
      ) {
        return;
      }

      const x =
        ((columnTotal / blankCount + 0.5) / gridSize) *
        canvas.width;
      const y =
        ((rowTotal / blankCount + 0.5) / gridSize) *
        canvas.height;
      const size = Math.max(
        22,
        Math.min(34, canvas.width / 18),
      );

      context.save?.();
      context.fillStyle = MASK_LABEL_COLORS[maskIndex];
      context.fillRect(x - size / 2, y - size / 2, size, size);
      context.fillStyle = "#20312b";
      context.font = `900 ${Math.round(size * 0.56)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        String.fromCharCode(65 + maskIndex),
        x,
        y + 1,
      );
      context.restore?.();
    });
  }

  function renderCompositeGrid(
    canvas,
    analysisPixels,
    expandedPlayerPixels,
    hiddenMaskA,
    hiddenMaskB,
    hiddenMaskC,
    analysisGridSize,
    regionsPerSide = 4,
    labelMinimumBlankRatio = 0.55,
  ) {
    const context = canvas.getContext("2d");
    const cellWidth = canvas.width / analysisGridSize;
    const cellHeight = canvas.height / analysisGridSize;
    const compositePixels = composePixelLayers(
      analysisPixels,
      expandedPlayerPixels,
      [hiddenMaskA, hiddenMaskB, hiddenMaskC],
    );

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    compositePixels.forEach((color, index) => {
      const column = index % analysisGridSize;
      const row = Math.floor(index / analysisGridSize);

      if (color) {
        context.fillStyle = color;
      } else if (hiddenMaskA[index]) {
        context.fillStyle = getMaskFillColor(0, column + row);
      } else if (hiddenMaskB[index]) {
        context.fillStyle = getMaskFillColor(1, column + row);
      } else if (hiddenMaskC[index]) {
        context.fillStyle = getMaskFillColor(2, column + row);
      }

      context.fillRect(
        column * cellWidth,
        row * cellHeight,
        Math.ceil(cellWidth),
        Math.ceil(cellHeight),
      );
    });

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
    renderMaskLabels(
      context,
      canvas,
      [hiddenMaskA, hiddenMaskB, hiddenMaskC],
      expandedPlayerPixels,
      analysisGridSize,
      labelMinimumBlankRatio,
    );
  }

  function createResolutionPlan(options) {
    const analysisGridSize = Number(
      options.analysisGridSize ?? options.gridSize,
    );
    const paintGridSize = Number(
      options.paintGridSize ?? options.gridSize,
    );
    const paletteSize = Number(options.paletteSize);
    const hasValidSizes =
      Number.isInteger(analysisGridSize) &&
      Number.isInteger(paintGridSize) &&
      analysisGridSize > 0 &&
      paintGridSize > 0 &&
      analysisGridSize >= paintGridSize &&
      analysisGridSize % paintGridSize === 0;

    if (!hasValidSizes) {
      throw new Error(
        "원본 처리 해상도는 색칠판 해상도의 정수 배수여야 합니다.",
      );
    }
    if (
      !Number.isInteger(paletteSize) ||
      paletteSize < 2 ||
      paletteSize > 256
    ) {
      throw new Error("팔레트 색상 수는 2~256 사이여야 합니다.");
    }

    return Object.freeze({
      analysisGridSize,
      paintGridSize,
      paintUnitSize: analysisGridSize / paintGridSize,
      paletteSize,
    });
  }

  async function pixelize(source, options) {
    const plan = createResolutionPlan(options);
    const image = await loadImage(source);
    const analysisSourceColors = readDownscaledPixels(
      image,
      plan.analysisGridSize,
    );
    const paintSourceColors = readDownscaledPixels(
      image,
      plan.paintGridSize,
    );
    const paletteRgb = createPalette(
      analysisSourceColors,
      plan.paletteSize,
    );
    const analysisQuantizedRgb = analysisSourceColors.map((color) =>
      findClosestPaletteColor(color, paletteRgb),
    );
    const paintQuantizedRgb = paintSourceColors.map((color) =>
      findClosestPaletteColor(color, paletteRgb),
    );
    const paintPixels = paintQuantizedRgb.map(rgbToHex);

    return {
      image,
      width: plan.paintGridSize,
      height: plan.paintGridSize,
      analysisWidth: plan.analysisGridSize,
      analysisHeight: plan.analysisGridSize,
      paintUnitSize: plan.paintUnitSize,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      palette: paletteRgb.map(rgbToHex),
      analysisPixels: analysisQuantizedRgb.map(rgbToHex),
      paintPixels,
      pixels: paintPixels,
    };
  }

  window.Pixelizer = Object.freeze({
    composePixelLayers,
    createResolutionPlan,
    drawSquareCrop,
    expandPixelGrid,
    getMaskFillColor,
    pixelize,
    renderMaskLabels,
    renderCompositeGrid,
    renderPixelGrid,
    renderSplitMaskGrid,
    renderPlayerGrid,
  });
})();
