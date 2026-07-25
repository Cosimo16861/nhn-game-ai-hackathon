const GAME_CONFIG = Object.freeze({
  gridSize: 64,
  paletteSize: 8,
  hiddenQuadrantCount: 2,
  maxFileSizeBytes: 10 * 1024 * 1024,
  acceptedMimeTypes: ["image/png", "image/jpeg"],
  scoreWeights: Object.freeze({
    color: 0.5,
    edge: 0.3,
    structure: 0.15,
    palette: 0.05,
  }),
});

const imageInput = document.querySelector("#imageInput");
const fileMessage = document.querySelector("#fileMessage");
const continueButton = document.querySelector("#continueButton");
const appStatus = document.querySelector("#appStatus");
const pixelResult = document.querySelector("#pixelResult");
const sourcePreview = document.querySelector("#sourcePreview");
const pixelPreview = document.querySelector("#pixelPreview");
const puzzlePreview = document.querySelector("#puzzlePreview");
const resultMeta = document.querySelector("#resultMeta");
const paletteList = document.querySelector("#paletteList");
const startPuzzleButton = document.querySelector("#startPuzzleButton");
const editorSection = document.querySelector("#editorSection");
const editorCanvas = document.querySelector("#editorCanvas");
const editorPalette = document.querySelector("#editorPalette");
const editorProgress = document.querySelector("#editorProgress");
const eraserButton = document.querySelector("#eraserButton");
const undoButton = document.querySelector("#undoButton");
const resetButton = document.querySelector("#resetButton");
const scoreButton = document.querySelector("#scoreButton");
const scoreResult = document.querySelector("#scoreResult");
const colorScoreValue = document.querySelector("#colorScoreValue");
const scoreMessage = document.querySelector("#scoreMessage");
const scoreGrade = document.querySelector("#scoreGrade");
const edgeDetail = document.querySelector("#edgeDetail");
const structureDetail = document.querySelector("#structureDetail");
const filledDetail = document.querySelector("#filledDetail");
const exactDetail = document.querySelector("#exactDetail");
const deltaDetail = document.querySelector("#deltaDetail");
const answerPreview = document.querySelector("#answerPreview");
const playerPreview = document.querySelector("#playerPreview");
const continueEditingButton = document.querySelector("#continueEditingButton");
let selectedFile = null;
let puzzleSource = null;
let editorController = null;

function formatMegabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function renderRules() {
  document.querySelector("#gridRule").textContent =
    `${GAME_CONFIG.gridSize} × ${GAME_CONFIG.gridSize}`;
  document.querySelector("#paletteRule").textContent =
    `${GAME_CONFIG.paletteSize}색`;
  document.querySelector("#hiddenRule").textContent =
    `4개 중 ${GAME_CONFIG.hiddenQuadrantCount}개 · 50%`;

  const labels = {
    color: "색상",
    edge: "윤곽선",
    structure: "주변 구조",
    palette: "팔레트",
  };

  const scoreWeights = document.querySelector("#scoreWeights");
  scoreWeights.replaceChildren(
    ...Object.entries(GAME_CONFIG.scoreWeights).map(([key, weight]) => {
      const item = document.createElement("li");
      const label = document.createTextNode(`${labels[key]} `);
      const value = document.createElement("strong");
      value.textContent = `${Math.round(weight * 100)}%`;
      item.append(label, value);
      return item;
    }),
  );
}

function showFileState(message, type = "") {
  fileMessage.textContent = message;
  fileMessage.className = "file-message";
  if (type) {
    fileMessage.classList.add(`is-${type}`);
  }
}

function validateImage(file) {
  if (!GAME_CONFIG.acceptedMimeTypes.includes(file.type)) {
    return "PNG 또는 JPG 이미지만 선택할 수 있습니다.";
  }

  if (file.size > GAME_CONFIG.maxFileSizeBytes) {
    return "이미지 크기는 10MB 이하여야 합니다.";
  }

  return "";
}

function renderPalette(palette) {
  paletteList.replaceChildren(
    ...palette.map((color) => {
      const chip = document.createElement("span");
      const swatch = document.createElement("span");
      const label = document.createElement("span");

      chip.className = "palette-chip";
      swatch.className = "palette-swatch";
      swatch.style.backgroundColor = color;
      label.textContent = color.toUpperCase();
      chip.append(swatch, label);
      return chip;
    }),
  );
}

function renderEditorPalette(palette) {
  editorPalette.replaceChildren(
    ...palette.map((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "editor-color";
      button.style.backgroundColor = color;
      button.setAttribute("aria-label", `${color.toUpperCase()} 색상`);
      button.dataset.color = color;
      if (index === 0) button.classList.add("is-selected");

      button.addEventListener("click", () => {
        editorPalette
          .querySelectorAll(".editor-color")
          .forEach((item) => item.classList.remove("is-selected"));
        button.classList.add("is-selected");
        eraserButton.classList.remove("is-selected");
        editorController?.setColor(color);
      });

      return button;
    }),
  );
}

function updateEditorStatus(status) {
  editorProgress.textContent =
    `${status.filledCount.toLocaleString("ko-KR")} / ` +
    `${status.hiddenCount.toLocaleString("ko-KR")}칸 채움`;
  undoButton.disabled = !status.canUndo;
  resetButton.disabled = !status.canReset;
  scoreButton.disabled = status.filledCount === 0;
}

function getGrade(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function getScoreMessage(result) {
  const blankCount = result.hiddenCount - result.filledCount;
  if (blankCount > 0) {
    return `${blankCount.toLocaleString("ko-KR")}칸이 비어 있어 0점으로 반영되었습니다. 계속 수정하면 점수를 높일 수 있습니다.`;
  }
  if (result.score >= 90) return "원본의 색상을 거의 완벽하게 복원했습니다.";
  if (result.score >= 65) return "주요 색상은 잘 복원했지만 일부 영역의 색이 다릅니다.";
  return "원본과 다른 색상이 많습니다. 비교 결과를 확인하고 다시 도전해 보세요.";
}

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;
  selectedFile = null;
  puzzleSource = null;
  continueButton.disabled = true;
  pixelResult.hidden = true;
  editorSection.hidden = true;
  scoreResult.hidden = true;
  editorController?.destroy();
  editorController = null;

  if (!file) {
    appStatus.textContent = "준비됨";
    showFileState("선택된 이미지가 없습니다.");
    return;
  }

  const error = validateImage(file);
  if (error) {
    imageInput.value = "";
    appStatus.textContent = "확인 필요";
    showFileState(error, "error");
    return;
  }

  appStatus.textContent = "이미지 선택됨";
  selectedFile = file;
  showFileState(
    `${file.name} · ${formatMegabytes(file.size)}`,
    "success",
  );
  continueButton.disabled = false;
});

startPuzzleButton.addEventListener("click", () => {
  if (!puzzleSource) return;

  editorController?.destroy();
  renderEditorPalette(puzzleSource.palette);
  eraserButton.classList.remove("is-selected");
  editorController = window.PixelEditor.create({
    canvas: editorCanvas,
    targetPixels: puzzleSource.pixels,
    initialPlayerPixels: puzzleSource.playerPixels,
    hiddenMaskA: puzzleSource.hiddenMaskA,
    hiddenMaskB: puzzleSource.hiddenMaskB,
    gridSize: GAME_CONFIG.gridSize,
    palette: puzzleSource.palette,
    onChange: updateEditorStatus,
  });

  pixelResult.hidden = true;
  scoreResult.hidden = true;
  editorSection.hidden = false;
  appStatus.textContent = "복원 중";
  editorSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

eraserButton.addEventListener("click", () => {
  if (!editorController) return;
  editorPalette
    .querySelectorAll(".editor-color")
    .forEach((item) => item.classList.remove("is-selected"));
  eraserButton.classList.add("is-selected");
  editorController.setEraser(true);
});

undoButton.addEventListener("click", () => {
  editorController?.undo();
});

resetButton.addEventListener("click", () => {
  editorController?.reset();
});

scoreButton.addEventListener("click", () => {
  if (!editorController || !puzzleSource) return;

  puzzleSource.playerPixels = editorController.getPlayerPixels();
  const result = window.PixelScoring.calculateColorScore(
    puzzleSource.pixels,
    puzzleSource.playerPixels,
    puzzleSource.hiddenMask,
  );
  const edgeResult = window.PixelScoring.calculateEdgeScore(
    puzzleSource.pixels,
    puzzleSource.playerPixels,
    puzzleSource.hiddenMask,
    GAME_CONFIG.gridSize,
  );
  const structureResult = window.PixelScoring.calculateStructureScore(
    puzzleSource.pixels,
    puzzleSource.playerPixels,
    puzzleSource.hiddenMask,
    GAME_CONFIG.gridSize,
  );
  puzzleSource.colorScore = result;
  puzzleSource.edgeScore = edgeResult;
  puzzleSource.structureScore = structureResult;

  colorScoreValue.textContent = result.score.toFixed(1);
  scoreGrade.textContent = getGrade(result.score);
  edgeDetail.textContent = `${edgeResult.score.toFixed(1)}점`;
  structureDetail.textContent = `${structureResult.score.toFixed(1)}점`;
  filledDetail.textContent =
    `${result.filledCount.toLocaleString("ko-KR")} / ` +
    result.hiddenCount.toLocaleString("ko-KR");
  exactDetail.textContent =
    `${result.exactMatchCount.toLocaleString("ko-KR")}칸`;
  deltaDetail.textContent =
    result.averageDeltaE === null ? "-" : `ΔE ${result.averageDeltaE.toFixed(1)}`;
  scoreMessage.textContent = getScoreMessage(result);

  window.Pixelizer.renderPixelGrid(
    answerPreview,
    puzzleSource.pixels,
    GAME_CONFIG.gridSize,
  );
  window.Pixelizer.renderPixelGrid(
    playerPreview,
    puzzleSource.playerPixels,
    GAME_CONFIG.gridSize,
  );

  editorSection.hidden = true;
  scoreResult.hidden = false;
  appStatus.textContent = "채점 완료";
  scoreResult.scrollIntoView({ behavior: "smooth", block: "start" });
});

continueEditingButton.addEventListener("click", () => {
  scoreResult.hidden = true;
  editorSection.hidden = false;
  appStatus.textContent = "복원 중";
  editorSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

continueButton.addEventListener("click", async () => {
  if (!selectedFile) return;

  editorSection.hidden = true;
  scoreResult.hidden = true;
  editorController?.destroy();
  editorController = null;
  continueButton.disabled = true;
  continueButton.textContent = "픽셀로 변환하는 중…";
  appStatus.textContent = "변환 중";

  try {
    puzzleSource = await window.Pixelizer.pixelize(selectedFile, {
      gridSize: GAME_CONFIG.gridSize,
      paletteSize: GAME_CONFIG.paletteSize,
    });

    window.Pixelizer.drawSquareCrop(puzzleSource.image, sourcePreview);
    window.Pixelizer.renderPixelGrid(
      pixelPreview,
      puzzleSource.pixels,
      GAME_CONFIG.gridSize,
    );
    const puzzleMask = window.MaskGenerator.generateMask(
      puzzleSource.pixels,
      {
        gridSize: GAME_CONFIG.gridSize,
        hiddenQuadrantCount: GAME_CONFIG.hiddenQuadrantCount,
      },
    );
    puzzleSource.hiddenMaskA = puzzleMask.hiddenMaskA;
    puzzleSource.hiddenMaskB = puzzleMask.hiddenMaskB;
    puzzleSource.hiddenMask = puzzleMask.hiddenMask;
    puzzleSource.playerPixels = puzzleMask.playerPixels;
    puzzleSource.maskMetadata = puzzleMask;
    window.Pixelizer.renderSplitMaskGrid(
      puzzlePreview,
      puzzleSource.pixels,
      puzzleSource.hiddenMaskA,
      puzzleSource.hiddenMaskB,
      GAME_CONFIG.gridSize,
    );
    renderPalette(puzzleSource.palette);

    resultMeta.textContent =
      `${puzzleSource.sourceWidth} × ${puzzleSource.sourceHeight}px 원본 · ` +
      `${puzzleSource.palette.length}색 · ` +
      `영역 ${puzzleMask.hiddenQuadrants.map((index) => index + 1).join(", ")} ` +
      `숨김 (${puzzleMask.hiddenCount.toLocaleString("ko-KR")}칸)`;
    pixelResult.hidden = false;
    appStatus.textContent = "변환 완료";
    showFileState("픽셀 이미지 데이터가 준비되었습니다.", "success");
    pixelResult.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    appStatus.textContent = "변환 실패";
    showFileState(error.message || "이미지 변환에 실패했습니다.", "error");
  } finally {
    continueButton.disabled = false;
    continueButton.textContent = "다시 픽셀화하기";
  }
});

renderRules();
