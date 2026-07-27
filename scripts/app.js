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

const elements = Object.freeze({
  caseGrid: document.querySelector("#caseGrid"),
  caseMessage: document.querySelector("#caseSelectionMessage"),
  loadCase: document.querySelector("#loadCaseButton"),
  appStatus: document.querySelector("#appStatus"),
  puzzlePreview: document.querySelector("#puzzlePreview"),
  resultMeta: document.querySelector("#resultMeta"),
  paletteList: document.querySelector("#paletteList"),
  startPuzzle: document.querySelector("#startPuzzleButton"),
  score: document.querySelector("#scoreButton"),
  continueEditing: document.querySelector("#continueEditingButton"),
  retryPuzzle: document.querySelector("#retryPuzzleButton"),
  newCase: document.querySelector("#newImageButton"),
  answerPreview: document.querySelector("#answerPreview"),
  playerPreview: document.querySelector("#playerPreview"),
  aiAnalyze: document.querySelector("#aiAnalyzeButton"),
  aiScore: document.querySelector("#aiScore"),
  aiScoreFlow: document.querySelector("#aiScoreFlow"),
  aiBaseline: document.querySelector("#aiBaselineScore"),
  aiRestored: document.querySelector("#aiRestoredScore"),
  aiStatus: document.querySelector("#aiStatus"),
});

const screenManager = window.ScreenManager.create({
  screens: {
    cases: document.querySelector("#config"),
    preview: document.querySelector("#pixelResult"),
    editor: document.querySelector("#editorSection"),
    result: document.querySelector("#scoreResult"),
  },
  companions: {
    cases: [document.querySelector("#scoreGuide")],
  },
});

const editorManager = window.EditorManager.create({
  config: GAME_CONFIG,
  elements: {
    canvas: document.querySelector("#editorCanvas"),
    palette: document.querySelector("#editorPalette"),
    progress: document.querySelector("#editorProgress"),
    timer: document.querySelector("#editorTimer"),
    caseTitle: document.querySelector("#caseTitleDisplay"),
    witnessList: document.querySelector("#witnessList"),
    eraser: document.querySelector("#eraserButton"),
    undo: document.querySelector("#undoButton"),
    reset: document.querySelector("#resetButton"),
    score: elements.score,
  },
});

const scoreElements = Object.freeze({
  finalScore: document.querySelector("#finalScoreValue"),
  message: document.querySelector("#scoreMessage"),
  grade: document.querySelector("#scoreGrade"),
  color: document.querySelector("#colorDetail"),
  edge: document.querySelector("#edgeDetail"),
  structure: document.querySelector("#structureDetail"),
  palette: document.querySelector("#paletteDetail"),
  time: document.querySelector("#timeDetail"),
  filled: document.querySelector("#filledDetail"),
  exact: document.querySelector("#exactDetail"),
  delta: document.querySelector("#deltaDetail"),
});

let selectedCaseDefinition = null;
let puzzleSource = null;

function validateGameConfig() {
  const expectedAnalysisSize =
    GAME_CONFIG.paintGridSize * GAME_CONFIG.paintUnitSize;
  if (GAME_CONFIG.analysisGridSize !== expectedAnalysisSize) {
    throw new Error(
      "원본 처리 해상도와 색칠 단위 설정이 일치하지 않습니다.",
    );
  }
}

function renderCaseSelection() {
  const cases = window.CaseData?.cases || [];
  if (cases.length === 0) {
    elements.appStatus.textContent = "사건 없음";
    elements.caseMessage.textContent = "등록된 사건이 없습니다.";
    return;
  }

  window.UIRenderer.renderCaseCards(
    elements.caseGrid,
    cases,
    (caseDefinition) => {
      selectedCaseDefinition = caseDefinition;
      elements.loadCase.disabled = false;
      elements.appStatus.textContent = "사건 선택됨";
      elements.caseMessage.textContent =
        `${caseDefinition.title}을 선택했습니다.`;
    },
  );
}

function attachMasks(source, masks) {
  const { analysisMask, paintMask } = masks;
  source.analysisHiddenMaskA = analysisMask.hiddenMaskA;
  source.analysisHiddenMaskB = analysisMask.hiddenMaskB;
  source.analysisHiddenMaskC = analysisMask.hiddenMaskC;
  source.analysisHiddenMask = analysisMask.hiddenMask;
  source.hiddenMaskA = paintMask.hiddenMaskA;
  source.hiddenMaskB = paintMask.hiddenMaskB;
  source.hiddenMaskC = paintMask.hiddenMaskC;
  source.hiddenMask = paintMask.hiddenMask;
  source.playerPixels = paintMask.playerPixels;
  source.analysisMaskMetadata = analysisMask;
  source.maskMetadata = paintMask;
}

async function prepareSelectedCase() {
  if (!selectedCaseDefinition) return;

  const caseDefinition = selectedCaseDefinition;
  const caseCards = Array.from(
    elements.caseGrid.querySelectorAll(".case-card"),
  );
  editorManager.resetSession();
  puzzleSource = null;
  screenManager.show("cases", { scroll: false });
  elements.loadCase.disabled = true;
  elements.loadCase.textContent = "사건 이미지 분석 중…";
  caseCards.forEach((card) => {
    card.disabled = true;
  });
  elements.appStatus.textContent = "퍼즐 생성 중";
  elements.caseMessage.textContent =
    `${caseDefinition.title}의 증거 이미지를 분석하고 있습니다.`;

  try {
    puzzleSource = await window.Pixelizer.pixelize(
      caseDefinition.imageSrc,
      {
        analysisGridSize: GAME_CONFIG.analysisGridSize,
        paintGridSize: GAME_CONFIG.paintGridSize,
        paletteSize: GAME_CONFIG.paletteSize,
      },
    );
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
    attachMasks(puzzleSource, puzzleMasks);
    editorManager.setSource(puzzleSource);
    editorManager.renderComposite(
      elements.puzzlePreview,
      puzzleSource.playerPixels,
    );
    window.UIRenderer.renderPalette(
      elements.paletteList,
      puzzleSource.palette,
    );

    elements.resultMeta.textContent =
      `${caseDefinition.title} · ${puzzleSource.analysisWidth} × ` +
      `${puzzleSource.analysisHeight} 분석 · ${puzzleSource.width} × ` +
      `${puzzleSource.height} 색칠판 · ${puzzleSource.palette.length}색 · ` +
      `영역 ${puzzleMasks.hiddenRegions
        .map((region) => region + 1)
        .join(", ")} 가림`;
    screenManager.show("preview");
    elements.appStatus.textContent = "퍼즐 준비 완료";
    elements.caseMessage.textContent =
      `${caseDefinition.title}의 퍼즐이 준비되었습니다.`;
  } catch (error) {
    puzzleSource = null;
    elements.appStatus.textContent = "불러오기 실패";
    elements.caseMessage.textContent =
      error.message || "사건 이미지를 불러오지 못했습니다.";
  } finally {
    caseCards.forEach((card) => {
      card.disabled = false;
    });
    elements.loadCase.disabled = selectedCaseDefinition === null;
    elements.loadCase.textContent = "선택한 사건 수사하기";
  }
}

function openEditor({ reset = false } = {}) {
  if (!puzzleSource) return;
  editorManager.open(puzzleSource, { reset });
  screenManager.show("editor");
  elements.appStatus.textContent = "복원 중";
}

function resetAiResult() {
  elements.aiAnalyze.disabled = false;
  elements.aiAnalyze.textContent = "AI로 분석하기";
  elements.aiScore.hidden = true;
  elements.aiScoreFlow.hidden = true;
  elements.aiStatus.textContent = "분석 전";
}

function scoreCurrentRestoration() {
  if (!puzzleSource) return;

  editorManager.stop();
  const playerPixels = editorManager.syncPlayerPixels();
  if (!playerPixels) return;
  const expandedPixels =
    editorManager.expandPlayerPixels(playerPixels);
  const result = window.ScoreManager.evaluate(
    puzzleSource,
    playerPixels,
    expandedPixels,
    GAME_CONFIG,
  );
  window.ScoreManager.render(
    result,
    scoreElements,
    editorManager.getElapsedSeconds(),
  );
  resetAiResult();

  window.Pixelizer.renderPixelGrid(
    elements.answerPreview,
    puzzleSource.analysisPixels,
    GAME_CONFIG.analysisGridSize,
  );
  editorManager.renderComposite(
    elements.playerPreview,
    puzzleSource.playerPixels,
  );
  screenManager.show("result");
  elements.appStatus.textContent = "채점 완료";
}

function resetToCaseSelection() {
  editorManager.resetSession();
  selectedCaseDefinition = null;
  puzzleSource = null;
  screenManager.show("cases");
  window.UIRenderer.clearCaseSelection(elements.caseGrid);
  elements.loadCase.disabled = true;
  elements.appStatus.textContent = "사건 준비됨";
  elements.caseMessage.textContent =
    "사건 카드를 선택해 수사 기록을 확인하세요.";
}

async function analyzeWithAi() {
  if (!puzzleSource) return;

  elements.aiAnalyze.disabled = true;
  elements.aiAnalyze.textContent = "분석 중…";
  elements.aiScore.hidden = true;
  elements.aiScoreFlow.hidden = true;

  try {
    const baselineCanvas = document.createElement("canvas");
    baselineCanvas.width = elements.answerPreview.width;
    baselineCanvas.height = elements.answerPreview.height;
    editorManager.renderComposite(
      baselineCanvas,
      editorManager.createBlankPlayerPixels(),
    );

    const analysis = await window.AIImageAnalyzer.analyzeRecovery(
      elements.answerPreview,
      baselineCanvas,
      elements.playerPreview,
      (message) => {
        elements.aiStatus.textContent = message;
      },
    );
    puzzleSource.aiRecognitionRecovery = analysis;
    const improvementSign = analysis.improvement > 0 ? "+" : "";
    elements.aiScore.textContent =
      `${improvementSign}${analysis.improvement.toFixed(1)}p`;
    elements.aiBaseline.textContent =
      `${analysis.baselineScore.toFixed(1)}%`;
    elements.aiRestored.textContent =
      `${analysis.restoredScore.toFixed(1)}%`;
    elements.aiScore.hidden = false;
    elements.aiScoreFlow.hidden = false;
    elements.aiStatus.textContent =
      `${analysis.model} · 특징 ` +
      `${analysis.featureCount.toLocaleString("ko-KR")}개`;
  } catch (error) {
    elements.aiStatus.textContent =
      error.message ||
      "AI 분석을 사용할 수 없습니다. 인터넷 연결을 확인하세요.";
  } finally {
    elements.aiAnalyze.disabled = false;
    elements.aiAnalyze.textContent = "다시 분석하기";
  }
}

elements.loadCase.addEventListener("click", prepareSelectedCase);
elements.startPuzzle.addEventListener("click", () => {
  openEditor({ reset: true });
});
elements.score.addEventListener("click", scoreCurrentRestoration);
elements.continueEditing.addEventListener("click", () => {
  screenManager.show("editor");
  elements.appStatus.textContent = "복원 중";
  editorManager.resume();
});
elements.retryPuzzle.addEventListener("click", () => {
  openEditor({ reset: true });
});
elements.newCase.addEventListener("click", resetToCaseSelection);
elements.aiAnalyze.addEventListener("click", analyzeWithAi);

validateGameConfig();
renderCaseSelection();
window.UIRenderer.renderRules(GAME_CONFIG, {
  grid: document.querySelector("#gridRule"),
  palette: document.querySelector("#paletteRule"),
  hidden: document.querySelector("#hiddenRule"),
  weights: document.querySelector("#scoreWeights"),
});
screenManager.show("cases", { scroll: false });
