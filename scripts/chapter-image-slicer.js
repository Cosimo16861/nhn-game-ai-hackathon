(function () {
  "use strict";

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function calculateCropRect(
    sourceWidth,
    sourceHeight,
    layout,
    crop,
  ) {
    const width = Number(sourceWidth);
    const height = Number(sourceHeight);
    const columns = Number(layout?.columns);
    const rows = Number(layout?.rows);
    const column = Number(crop?.column);
    const row = Number(crop?.row);

    assert(
      Number.isInteger(width) &&
        width > 0 &&
        Number.isInteger(height) &&
        height > 0,
      "전체 사건 이미지 크기가 올바르지 않습니다.",
    );
    assert(
      Number.isInteger(columns) &&
        columns > 0 &&
        Number.isInteger(rows) &&
        rows > 0,
      "사건 이미지 분할 설정이 올바르지 않습니다.",
    );
    assert(
      Number.isInteger(column) &&
        column >= 0 &&
        column < columns &&
        Number.isInteger(row) &&
        row >= 0 &&
        row < rows,
      "세부 사건 조각 위치가 이미지 분할 범위를 벗어났습니다.",
    );

    const left = Math.floor((width * column) / columns);
    const top = Math.floor((height * row) / rows);
    const right = Math.floor((width * (column + 1)) / columns);
    const bottom = Math.floor((height * (row + 1)) / rows);

    return Object.freeze({
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    });
  }

  function drawStageCrop(image, canvas, layout, crop) {
    assert(
      image &&
        Number.isInteger(image.naturalWidth) &&
        Number.isInteger(image.naturalHeight),
      "불러온 전체 사건 이미지가 올바르지 않습니다.",
    );
    assert(
      canvas &&
        Number.isInteger(canvas.width) &&
        canvas.width > 0 &&
        Number.isInteger(canvas.height) &&
        canvas.height > 0,
      "세부 사건 출력 캔버스가 올바르지 않습니다.",
    );

    const cropRect = calculateCropRect(
      image.naturalWidth,
      image.naturalHeight,
      layout,
      crop,
    );
    const context = canvas.getContext("2d");
    assert(context, "세부 사건 이미지를 그릴 수 없습니다.");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return cropRect;
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), {
        once: true,
      });
      image.addEventListener(
        "error",
        () =>
          reject(
            new Error("대형 사건 원본 이미지를 읽을 수 없습니다."),
          ),
        { once: true },
      );
      image.src = source;
    });
  }

  async function extractStageSource(
    chapter,
    stage,
    outputSize = 512,
  ) {
    const size = Number(outputSize);
    assert(
      Number.isInteger(size) && size >= 64 && size <= 2048,
      "세부 사건 출력 크기는 64~2048 사이여야 합니다.",
    );
    assert(
      chapter?.masterImageSrc &&
        chapter?.layout &&
        stage?.crop,
      "대형 사건과 세부 사건 이미지 정보가 필요합니다.",
    );

    const image = await loadImage(chapter.masterImageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const sourceRect = drawStageCrop(
      image,
      canvas,
      chapter.layout,
      stage.crop,
    );

    return Object.freeze({
      canvas,
      dataUrl: canvas.toDataURL("image/png"),
      sourceRect,
      outputSize: size,
    });
  }

  window.ChapterImageSlicer = Object.freeze({
    calculateCropRect,
    drawStageCrop,
    extractStageSource,
  });
})();
