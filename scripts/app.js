const GAME_CONFIG = Object.freeze({
  analysisGridSize: 256,
  paintGridSize: 128,
  paintUnitSize: 2,
  paletteSize: 8,
  regionsPerSide: 4,
  hiddenRegionCount: 3,
  scoreWeights: Object.freeze({
    color: 0.5,
    edge: 0.3,
    structure: 0.15,
    palette: 0.05,
  }),
});

const caseGrid = document.querySelector("#caseGrid");
const configSection = document.querySelector("#config");
const caseSelectionMessage = document.querySelector("#caseSelectionMessage");
const loadCaseButton = document.querySelector("#loadCaseButton");
const appStatus = document.querySelector("#appStatus");
const pixelResult = document.querySelector("#pixelResult");
const puzzlePreview = document.querySelector("#puzzlePreview");
const resultMeta = document.querySelector("#resultMeta");
const paletteList = document.querySelector("#paletteList");
const startPuzzleButton = document.querySelector("#startPuzzleButton");
const editorSection = document.querySelector("#editorSection");
const editorCanvas = document.querySelector("#editorCanvas");
const editorPalette = document.querySelector("#editorPalette");
const editorProgress = document.querySelector("#editorProgress");
const editorTimer = document.querySelector("#editorTimer");
const caseTitleDisplay = document.querySelector("#caseTitleDisplay");
const witnessList = document.querySelector("#witnessList");
const eraserButton = document.querySelector("#eraserButton");
const undoButton = document.querySelector("#undoButton");
const resetButton = document.querySelector("#resetButton");
const scoreButton = document.querySelector("#scoreButton");
const scoreResult = document.querySelector("#scoreResult");
const scoreGuide = document.querySelector("#scoreGuide");
const finalScoreValue = document.querySelector("#finalScoreValue");
const scoreMessage = document.querySelector("#scoreMessage");
const scoreGrade = document.querySelector("#scoreGrade");
const colorDetail = document.querySelector("#colorDetail");
const edgeDetail = document.querySelector("#edgeDetail");
const structureDetail = document.querySelector("#structureDetail");
const paletteDetail = document.querySelector("#paletteDetail");
const timeDetail = document.querySelector("#timeDetail");
const filledDetail = document.querySelector("#filledDetail");
const exactDetail = document.querySelector("#exactDetail");
const deltaDetail = document.querySelector("#deltaDetail");
const answerPreview = document.querySelector("#answerPreview");
const playerPreview = document.querySelector("#playerPreview");
const continueEditingButton = document.querySelector("#continueEditingButton");
const retryPuzzleButton = document.querySelector("#retryPuzzleButton");
const newImageButton = document.querySelector("#newImageButton");
const aiAnalyzeButton = document.querySelector("#aiAnalyzeButton");
const aiScore = document.querySelector("#aiScore");
const aiScoreFlow = document.querySelector("#aiScoreFlow");
const aiBaselineScore = document.querySelector("#aiBaselineScore");
const aiRestoredScore = document.querySelector("#aiRestoredScore");
const aiStatus = document.querySelector("#aiStatus");
let selectedCaseDefinition = null;
let puzzleSource = null;
let editorController = null;
let solveSeconds = 0;
let timerId = null;

const GAME_SCREENS = Object.freeze({
  cases: configSection,
  preview: pixelResult,
  editor: editorSection,
  result: scoreResult,
});

function showScreen(screenName, { scroll = true } = {}) {
  const activeScreen = GAME_SCREENS[screenName];
  if (!activeScreen) {
    throw new Error(`알 수 없는 게임 화면입니다: ${screenName}`);
  }

  Object.entries(GAME_SCREENS).forEach(([name, section]) => {
    section.hidden = name !== screenName;
  });
  scoreGuide.hidden = screenName !== "cases";

  if (scroll) {
    activeScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function validateGameConfig() {
  const expectedAnalysisSize =
    GAME_CONFIG.paintGridSize * GAME_CONFIG.paintUnitSize;
  if (GAME_CONFIG.analysisGridSize !== expectedAnalysisSize) {
    throw new Error(
      "원본 처리 해상도와 색칠 단위 설정이 일치하지 않습니다.",
    );
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTimer() {
  editorTimer.textContent = formatTime(solveSeconds);
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

function renderCaseSelection() {
  const cases = window.CaseData?.cases || [];
  const difficultyLabels = {
    easy: "쉬움",
    normal: "보통",
    hard: "어려움",
  };

  if (cases.length === 0) {
    appStatus.textContent = "사건 없음";
    caseSelectionMessage.textContent = "등록된 사건이 없습니다.";
    return;
  }

  caseGrid.replaceChildren(
    ...cases.map((caseDefinition, index) => {
      const card = document.createElement("button");
      const imageWrap = document.createElement("span");
      const image = document.createElement("img");
      const body = document.createElement("span");
      const caseIndex = document.createElement("span");
      const title = document.createElement("h3");
      const metadata = document.createElement("span");
      const difficulty = document.createElement("span");
      const passingScore = document.createElement("span");
      const selectLabel = document.createElement("span");

      card.type = "button";
      card.className = "case-card";
      card.dataset.caseId = caseDefinition.id;
      card.setAttribute("aria-pressed", "false");
      imageWrap.className = "case-card-image";
      image.src = caseDefinition.imageSrc;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      body.className = "case-card-body";
      caseIndex.className = "case-card-index";
      caseIndex.textContent = `CASE ${String(index + 1).padStart(2, "0")}`;
      title.textContent = caseDefinition.title;
      metadata.className = "case-card-meta";
      difficulty.textContent =
        `난이도 ${difficultyLabels[caseDefinition.difficulty]}`;
      passingScore.textContent = `통과 ${caseDefinition.passingScore}점`;
      selectLabel.className = "case-card-select";
      selectLabel.textContent = "사건 선택";

      metadata.append(difficulty, passingScore);
      body.append(caseIndex, title, metadata, selectLabel);
      imageWrap.append(image);
      card.append(imageWrap, body);

      card.addEventListener("click", () => {
        caseGrid.querySelectorAll(".case-card").forEach((caseCard) => {
          caseCard.classList.remove("is-selected");
          caseCard.setAttribute("aria-pressed", "false");
          caseCard.querySelector(".case-card-select").textContent = "사건 선택";
        });
        card.classList.add("is-selected");
        card.setAttribute("aria-pressed", "true");
        selectLabel.textContent = "선택됨";
        selectedCaseDefinition = caseDefinition;
        loadCaseButton.disabled = false;
        appStatus.textContent = "사건 선택됨";
        caseSelectionMessage.textContent =
          `${caseDefinition.title}을 선택했습니다.`;
      });

      return card;
    }),
  );
}

async function prepareSelectedCase() {
  if (!selectedCaseDefinition) return;

  const caseDefinition = selectedCaseDefinition;
  const caseCards = Array.from(caseGrid.querySelectorAll(".case-card"));
  stopTimer();
  editorController?.destroy();
  editorController = null;
  puzzleSource = null;
  solveSeconds = 0;
  renderTimer();
  showScreen("cases", { scroll: false });
  loadCaseButton.disabled = true;
  loadCaseButton.textContent = "사건 이미지 분석 중…";
  caseCards.forEach((card) => {
    card.disabled = true;
  });
  appStatus.textContent = "퍼즐 생성 중";
  caseSelectionMessage.textContent =
    `${caseDefinition.title}의 증거 이미지를 분석하고 있습니다.`;

  try {
    puzzleSource = await window.Pixelizer.pixelize(caseDefinition.imageSrc, {
      analysisGridSize: GAME_CONFIG.analysisGridSize,
      paintGridSize: GAME_CONFIG.paintGridSize,
      paletteSize: GAME_CONFIG.paletteSize,
    });
    puzzleSource.caseDefinition = caseDefinition;
    puzzleSource.caseInfo = caseDefinition;

    const puzzleMasks =
      window.MaskGenerator.generateDualResolutionMasks(
      puzzleSource.analysisPixels,
      puzzleSource.paintPixels,
      {
        analysisGridSize: GAME_CONFIG.analysisGridSize,
        paintGridSize: GAME_CONFIG.paintGridSize,
        regionsPerSide: GAME_CONFIG.regionsPerSide,
        hiddenRegionCount: GAME_CONFIG.hiddenRegionCount,
        hiddenRegions: caseDefinition.hiddenRegions,
      },
    );
    const analysisMask = puzzleMasks.analysisMask;
    const paintMask = puzzleMasks.paintMask;
    puzzleSource.analysisHiddenMaskA = analysisMask.hiddenMaskA;
    puzzleSource.analysisHiddenMaskB = analysisMask.hiddenMaskB;
    puzzleSource.analysisHiddenMaskC = analysisMask.hiddenMaskC;
    puzzleSource.analysisHiddenMask = analysisMask.hiddenMask;
    puzzleSource.hiddenMaskA = paintMask.hiddenMaskA;
    puzzleSource.hiddenMaskB = paintMask.hiddenMaskB;
    puzzleSource.hiddenMaskC = paintMask.hiddenMaskC;
    puzzleSource.hiddenMask = paintMask.hiddenMask;
    puzzleSource.playerPixels = paintMask.playerPixels;
    puzzleSource.analysisMaskMetadata = analysisMask;
    puzzleSource.maskMetadata = paintMask;

    renderCompositePlayer(puzzlePreview, puzzleSource.playerPixels);
    renderPalette(puzzleSource.palette);

    resultMeta.textContent =
      `${caseDefinition.title} · ${puzzleSource.analysisWidth} × ` +
      `${puzzleSource.analysisHeight} 분석 · ${puzzleSource.width} × ` +
      `${puzzleSource.height} 색칠판 · ${puzzleSource.palette.length}색 · ` +
      `영역 ${puzzleMasks.hiddenRegions
        .map((region) => region + 1)
        .join(", ")} 가림`;
    showScreen("preview");
    appStatus.textContent = "퍼즐 준비 완료";
    caseSelectionMessage.textContent =
      `${caseDefinition.title}의 퍼즐이 준비되었습니다.`;
  } catch (error) {
    puzzleSource = null;
    appStatus.textContent = "불러오기 실패";
    caseSelectionMessage.textContent =
      error.message || "사건 이미지를 불러오지 못했습니다.";
  } finally {
    caseCards.forEach((card) => {
      card.disabled = false;
    });
    loadCaseButton.disabled = selectedCaseDefinition === null;
    loadCaseButton.textContent = "선택한 사건 수사하기";
  }
}

function renderRules() {
  document.querySelector("#gridRule").textContent =
    `${GAME_CONFIG.analysisGridSize} × ${GAME_CONFIG.analysisGridSize} 분석 · ` +
    `${GAME_CONFIG.paintGridSize} × ${GAME_CONFIG.paintGridSize} 색칠`;
  document.querySelector("#paletteRule").textContent =
    `${GAME_CONFIG.paletteSize}색`;
  document.querySelector("#hiddenRule").textContent =
    `16개 중 ${GAME_CONFIG.hiddenRegionCount}개 · 18.75%`;

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

function renderCaseBriefing(caseInfo) {
  caseTitleDisplay.textContent = caseInfo.title;
  witnessList.replaceChildren(
    ...caseInfo.witnesses.map((witness, index) => {
      const item = document.createElement("li");
      const label = document.createElement("strong");
      const statement = document.createElement("span");
      label.className = "witness-label";
      label.textContent = `목격담 ${String.fromCharCode(65 + index)}`;
      statement.textContent = witness;
      item.append(label, statement);
      return item;
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

function createBlankPlayerPixels() {
  return puzzleSource.pixels.map((color, index) =>
    puzzleSource.hiddenMask[index] ? null : color,
  );
}

function expandPlayerPixels(playerPixels) {
  return window.Pixelizer.expandPixelGrid(
    playerPixels,
    GAME_CONFIG.paintGridSize,
    GAME_CONFIG.paintUnitSize,
  );
}

function renderCompositePlayer(canvas, playerPixels) {
  const expandedPlayerPixels = expandPlayerPixels(playerPixels);
  window.Pixelizer.renderCompositeGrid(
    canvas,
    puzzleSource.analysisPixels,
    expandedPlayerPixels,
    puzzleSource.analysisHiddenMaskA,
    puzzleSource.analysisHiddenMaskB,
    puzzleSource.analysisHiddenMaskC,
    GAME_CONFIG.analysisGridSize,
    GAME_CONFIG.regionsPerSide,
  );
}

function openEditor({ reset = false } = {}) {
  if (!puzzleSource) return;

  if (reset) {
    solveSeconds = 0;
    puzzleSource.playerPixels = createBlankPlayerPixels();
  }

  editorController?.destroy();
  renderCaseBriefing(puzzleSource.caseInfo);
  renderEditorPalette(puzzleSource.palette);
  eraserButton.classList.remove("is-selected");
  editorController = window.PixelEditor.create({
    canvas: editorCanvas,
    targetPixels: puzzleSource.pixels,
    initialPlayerPixels: puzzleSource.playerPixels,
    hiddenMaskA: puzzleSource.hiddenMaskA,
    hiddenMaskB: puzzleSource.hiddenMaskB,
    hiddenMaskC: puzzleSource.hiddenMaskC,
    gridSize: GAME_CONFIG.paintGridSize,
    analysisGridSize: GAME_CONFIG.analysisGridSize,
    paintUnitSize: GAME_CONFIG.paintUnitSize,
    analysisPixels: puzzleSource.analysisPixels,
    analysisHiddenMaskA: puzzleSource.analysisHiddenMaskA,
    analysisHiddenMaskB: puzzleSource.analysisHiddenMaskB,
    analysisHiddenMaskC: puzzleSource.analysisHiddenMaskC,
    regionsPerSide: GAME_CONFIG.regionsPerSide,
    palette: puzzleSource.palette,
    onChange: updateEditorStatus,
  });

  renderTimer();
  startTimer();
  showScreen("editor");
  appStatus.textContent = "복원 중";
}

function getGrade(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

function getScoreMessage(colorResult, finalScore) {
  const blankCount = colorResult.hiddenCount - colorResult.filledCount;
  if (blankCount > 0) {
    return `${blankCount.toLocaleString("ko-KR")}칸이 비어 있어 0점으로 반영되었습니다. 계속 수정하면 점수를 높일 수 있습니다.`;
  }
  if (finalScore >= 90) return "색상, 윤곽선과 지역 구조를 거의 완벽하게 복원했습니다.";
  if (finalScore >= 65) return "주요 특징은 잘 복원했지만 일부 색상이나 형태가 다릅니다.";
  return "원본과 다른 부분이 많습니다. 항목별 점수를 확인하고 다시 도전해 보세요.";
}

loadCaseButton.addEventListener("click", prepareSelectedCase);

startPuzzleButton.addEventListener("click", () => {
  openEditor({ reset: true });
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

  stopTimer();
  puzzleSource.playerPixels = editorController.getPlayerPixels();
  const logicalResult = window.PixelScoring.calculateColorScore(
    puzzleSource.pixels,
    puzzleSource.playerPixels,
    puzzleSource.hiddenMask,
  );
  const expandedPlayerPixels = expandPlayerPixels(
    puzzleSource.playerPixels,
  );
  const analysisScores =
    window.PixelScoring.calculateRestorationScores(
    puzzleSource.analysisPixels,
    expandedPlayerPixels,
    puzzleSource.analysisHiddenMask,
    GAME_CONFIG.analysisGridSize,
    GAME_CONFIG.scoreWeights,
  );
  const result = analysisScores.color;
  const edgeResult = analysisScores.edge;
  const structureResult = analysisScores.structure;
  const paletteResult = analysisScores.palette;
  const finalScore = analysisScores.finalScore;
  puzzleSource.logicalColorScore = logicalResult;
  puzzleSource.colorScore = result;
  puzzleSource.edgeScore = edgeResult;
  puzzleSource.structureScore = structureResult;
  puzzleSource.paletteScore = paletteResult;
  puzzleSource.finalScore = finalScore;

  finalScoreValue.textContent = finalScore.toFixed(1);
  scoreGrade.textContent = getGrade(finalScore);
  colorDetail.textContent = `${result.score.toFixed(1)}점`;
  edgeDetail.textContent = `${edgeResult.score.toFixed(1)}점`;
  structureDetail.textContent = `${structureResult.score.toFixed(1)}점`;
  paletteDetail.textContent = `${paletteResult.score.toFixed(1)}점`;
  timeDetail.textContent = formatTime(solveSeconds);
  filledDetail.textContent =
    `${logicalResult.filledCount.toLocaleString("ko-KR")} / ` +
    logicalResult.hiddenCount.toLocaleString("ko-KR");
  exactDetail.textContent =
    `${logicalResult.exactMatchCount.toLocaleString("ko-KR")}칸`;
  deltaDetail.textContent =
    result.averageDeltaE === null ? "-" : `ΔE ${result.averageDeltaE.toFixed(1)}`;
  scoreMessage.textContent = getScoreMessage(logicalResult, finalScore);
  aiAnalyzeButton.disabled = false;
  aiAnalyzeButton.textContent = "AI로 분석하기";
  aiScore.hidden = true;
  aiScoreFlow.hidden = true;
  aiStatus.textContent = "분석 전";

  window.Pixelizer.renderPixelGrid(
    answerPreview,
    puzzleSource.analysisPixels,
    GAME_CONFIG.analysisGridSize,
  );
  renderCompositePlayer(playerPreview, puzzleSource.playerPixels);

  showScreen("result");
  appStatus.textContent = "채점 완료";
});

continueEditingButton.addEventListener("click", () => {
  showScreen("editor");
  appStatus.textContent = "복원 중";
  startTimer();
});

retryPuzzleButton.addEventListener("click", () => {
  openEditor({ reset: true });
});

newImageButton.addEventListener("click", () => {
  stopTimer();
  editorController?.destroy();
  editorController = null;
  selectedCaseDefinition = null;
  puzzleSource = null;
  solveSeconds = 0;
  showScreen("cases");
  caseGrid.querySelectorAll(".case-card").forEach((caseCard) => {
    caseCard.classList.remove("is-selected");
    caseCard.setAttribute("aria-pressed", "false");
    caseCard.querySelector(".case-card-select").textContent = "사건 선택";
  });
  loadCaseButton.disabled = true;
  appStatus.textContent = "사건 준비됨";
  caseSelectionMessage.textContent =
    "사건 카드를 선택해 수사 기록을 확인하세요.";
  renderTimer();
});

aiAnalyzeButton.addEventListener("click", async () => {
  if (!puzzleSource) return;

  aiAnalyzeButton.disabled = true;
  aiAnalyzeButton.textContent = "분석 중…";
  aiScore.hidden = true;
  aiScoreFlow.hidden = true;

  try {
    const baselineCanvas = document.createElement("canvas");
    baselineCanvas.width = answerPreview.width;
    baselineCanvas.height = answerPreview.height;
    const baselinePixels = createBlankPlayerPixels();
    renderCompositePlayer(baselineCanvas, baselinePixels);

    const analysis = await window.AIImageAnalyzer.analyzeRecovery(
      answerPreview,
      baselineCanvas,
      playerPreview,
      (message) => {
        aiStatus.textContent = message;
      },
    );
    puzzleSource.aiRecognitionRecovery = analysis;
    const improvementSign = analysis.improvement > 0 ? "+" : "";
    aiScore.textContent =
      `${improvementSign}${analysis.improvement.toFixed(1)}p`;
    aiBaselineScore.textContent = `${analysis.baselineScore.toFixed(1)}%`;
    aiRestoredScore.textContent = `${analysis.restoredScore.toFixed(1)}%`;
    aiScore.hidden = false;
    aiScoreFlow.hidden = false;
    aiStatus.textContent =
      `${analysis.model} · 특징 ${analysis.featureCount.toLocaleString("ko-KR")}개`;
  } catch (error) {
    aiStatus.textContent =
      error.message || "AI 분석을 사용할 수 없습니다. 인터넷 연결을 확인하세요.";
  } finally {
    aiAnalyzeButton.disabled = false;
    aiAnalyzeButton.textContent = "다시 분석하기";
  }
});

validateGameConfig();
renderCaseSelection();
renderRules();
showScreen("cases", { scroll: false });
