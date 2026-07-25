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

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.addEventListener(
        "load",
        () => {
          URL.revokeObjectURL(objectUrl);
          resolve(image);
        },
        { once: true },
      );
      image.addEventListener(
        "error",
        () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("이미지를 읽을 수 없습니다."));
        },
        { once: true },
      );
      image.src = objectUrl;
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
    gridSize,
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
        context.fillStyle =
          (column + row) % 2 === 0 ? "#20283a" : "#121827";
      } else if (hiddenMaskB[index]) {
        context.fillStyle =
          (column + row) % 2 === 0 ? "#392342" : "#22162b";
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
  }

  async function pixelize(file, options) {
    const image = await loadImage(file);
    const sourceColors = readDownscaledPixels(image, options.gridSize);
    const paletteRgb = createPalette(sourceColors, options.paletteSize);
    const quantizedRgb = sourceColors.map((color) =>
      findClosestPaletteColor(color, paletteRgb),
    );

    return {
      image,
      width: options.gridSize,
      height: options.gridSize,
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      palette: paletteRgb.map(rgbToHex),
      pixels: quantizedRgb.map(rgbToHex),
    };
  }

  window.Pixelizer = Object.freeze({
    drawSquareCrop,
    pixelize,
    renderPixelGrid,
    renderSplitMaskGrid,
  });
})();
