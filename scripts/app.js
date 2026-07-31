const GAME_CONFIG = Object.freeze({
  analysisGridSize: 256,
  paintGridSize: 128,
  paintUnitSize: 2,
  paletteSize: 8,
  regionsPerSide: 4,
  hiddenRegionCount: 3,
  maskStyle: "irregular",
  scoreWeights: Object.freeze({
    color: 0.5,
    edge: 0.3,
    structure: 0.15,
    palette: 0.05,
  }),
  combinedScoreWeights: Object.freeze({
    visual: 0.8,
    clip: 0.2,
  }),
});

const elements = Object.freeze({
  caseGrid: document.querySelector("#caseGrid"),
  caseMessage: document.querySelector("#caseSelectionMessage"),
  loadCase: document.querySelector("#loadCaseButton"),
  stageGrid: document.querySelector("#stageGrid"),
  stageChapterSummary: document.querySelector("#stageChapterSummary"),
  stageMessage: document.querySelector("#stageSelectionMessage"),
  assemblyBoard: document.querySelector("#assemblyBoard"),
  assemblyProgress: document.querySelector("#assemblyProgress"),
  finalDeduction: document.querySelector("#finalDeduction"),
  deductionForm: document.querySelector("#deductionForm"),
  deductionQuestion: document.querySelector("#deductionQuestion"),
  deductionOptions: document.querySelector("#deductionOptions"),
  deductionStatus: document.querySelector("#deductionStatus"),
  deductionResult: document.querySelector("#deductionResult"),
  submitDeduction: document.querySelector("#submitDeductionButton"),
  startStage: document.querySelector("#startStageButton"),
  backToChapters: document.querySelector("#backToChaptersButton"),
  appStatus: document.querySelector("#appStatus"),
  puzzlePreview: document.querySelector("#puzzlePreview"),
  resultMeta: document.querySelector("#resultMeta"),
  paletteList: document.querySelector("#paletteList"),
  previewCaseTitle: document.querySelector("#previewCaseTitle"),
  previewWitnessList: document.querySelector("#previewWitnessList"),
  startPuzzle: document.querySelector("#startPuzzleButton"),
  score: document.querySelector("#scoreButton"),
  continueEditing: document.querySelector("#continueEditingButton"),
  retryPuzzle: document.querySelector("#retryPuzzleButton"),
  nextStage: document.querySelector("#nextStageButton"),
  newCase: document.querySelector("#newImageButton"),
  answerPreview: document.querySelector("#answerPreview"),
  playerPreview: document.querySelector("#playerPreview"),
  resultComparison: document.querySelector("#resultComparison"),
  originalResultFigure: document.querySelector(
    "#originalResultFigure",
  ),
  failureFeedback: document.querySelector("#failureFeedback"),
  failureFeedbackList: document.querySelector(
    "#failureFeedbackList",
  ),
});

const screenManager = window.ScreenManager.create({
  screens: {
    cases: document.querySelector("#config"),
    stages: document.querySelector("#stageSelection"),
    preview: document.querySelector("#pixelResult"),
    editor: document.querySelector("#editorSection"),
    result: document.querySelector("#scoreResult"),
  },
  progressSteps: Object.fromEntries(
    Array.from(
      document.querySelectorAll("[data-game-step]"),
      (element) => [element.dataset.gameStep, element],
    ),
  ),
  progressAliases: {
    stages: "cases",
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
    hudStage: document.querySelector("#hudStage"),
    hudObjective: document.querySelector("#hudObjective"),
    hudDifficulty: document.querySelector("#hudDifficulty"),
    hudPassingScore: document.querySelector("#hudPassingScore"),
    hudProgressBar: document.querySelector("#hudProgressBar"),
    hintButton: document.querySelector("#hintButton"),
    hintRemaining: document.querySelector("#hintRemaining"),
    hintPanel: document.querySelector("#hintPanel"),
    hintTitle: document.querySelector("#hintTitle"),
    hintText: document.querySelector("#hintText"),
    hintColor: document.querySelector("#hintColor"),
    witnessList: document.querySelector("#witnessList"),
    brushTool: document.querySelector("#brushToolButton"),
    fillTool: document.querySelector("#fillToolButton"),
    eraser: document.querySelector("#eraserButton"),
    undo: document.querySelector("#undoButton"),
    reset: document.querySelector("#resetButton"),
    zoomOut: document.querySelector("#zoomOutButton"),
    zoomIn: document.querySelector("#zoomInButton"),
    zoomValue: document.querySelector("#zoomValue"),
    score: elements.score,
  },
});
const clipScoreManager = window.CLIPScoreManager.create();
const stageProgressManager = window.StageProgressManager.create(
  window.CaseData.chapters,
);

const scoreElements = Object.freeze({
  finalScore: document.querySelector("#finalScoreValue"),
  message: document.querySelector("#scoreMessage"),
  outcome: document.querySelector("#caseOutcome"),
  grade: document.querySelector("#scoreGrade"),
  visual: document.querySelector("#visualDetail"),
  clip: document.querySelector("#clipDetail"),
  clipCoverage: document.querySelector("#clipCoverageDetail"),
  color: document.querySelector("#colorDetail"),
  edge: document.querySelector("#edgeDetail"),
  structure: document.querySelector("#structureDetail"),
  palette: document.querySelector("#paletteDetail"),
  stars: document.querySelector("#stageStarsValue"),
  hintsUsed: document.querySelector("#hintsUsedDetail"),
  hintPenalty: document.querySelector("#hintPenaltyDetail"),
  time: document.querySelector("#timeDetail"),
  filled: document.querySelector("#filledDetail"),
  exact: document.querySelector("#exactDetail"),
  delta: document.querySelector("#deltaDetail"),
  visualWeight: document.querySelector("#visualWeightLabel"),
  clipWeight: document.querySelector("#clipWeightLabel"),
  colorWeight: document.querySelector("#colorWeightLabel"),
  edgeWeight: document.querySelector("#edgeWeightLabel"),
  structureWeight: document.querySelector("#structureWeightLabel"),
  paletteWeight: document.querySelector("#paletteWeightLabel"),
});

let selectedChapterDefinition = null;
let selectedStageDefinition = null;
let selectedDeductionIndex = null;
let puzzleSource = null;

function validateGameConfig() {
  const expectedAnalysisSize =
    GAME_CONFIG.paintGridSize * GAME_CONFIG.paintUnitSize;
  if (GAME_CONFIG.analysisGridSize !== expectedAnalysisSize) {
    throw new Error(
      "원본 처리 해상도와 색칠 단위 설정이 일치하지 않습니다.",
    );
  }
  const combinedWeightTotal =
    GAME_CONFIG.combinedScoreWeights.visual +
    GAME_CONFIG.combinedScoreWeights.clip;
  if (Math.abs(combinedWeightTotal - 1) > 0.0000001) {
    throw new Error("시각·CLIP 점수 가중치의 합은 100%여야 합니다.");
  }
}

function renderCaseSelection() {
  const chapters = window.CaseData?.chapters || [];
  if (chapters.length === 0) {
    elements.appStatus.textContent = "사건 없음";
    elements.caseMessage.textContent = "등록된 사건이 없습니다.";
    return;
  }

  window.UIRenderer.renderChapterCards(
    elements.caseGrid,
    chapters,
    (chapterDefinition) => {
      selectedChapterDefinition = chapterDefinition;
      elements.loadCase.disabled = false;
      elements.appStatus.textContent = "사건 선택됨";
      elements.caseMessage.textContent =
        `${chapterDefinition.title}을 선택했습니다.`;
    },
  );
}

function openStageSelection() {
  if (!selectedChapterDefinition) return;

  const progress = stageProgressManager.get(
    selectedChapterDefinition.id,
  );
  const assemblyPlan = window.AssemblyManager.createPlan(
    selectedChapterDefinition,
    progress.clearedStageIds,
  );
  selectedStageDefinition = null;
  elements.startStage.disabled = true;
  elements.stageChapterSummary.textContent =
    `${selectedChapterDefinition.title} · ` +
    selectedChapterDefinition.summary;
  elements.stageMessage.textContent =
    `${progress.clearedStageIds.size} / ` +
    `${selectedChapterDefinition.stages.length}개 세부 사건 클리어`;
  elements.assemblyProgress.textContent = assemblyPlan.isComplete
    ? "전체 복원 완료"
    : `${assemblyPlan.completedStageCount} / ` +
      `${assemblyPlan.totalStageCount} 조각`;
  window.UIRenderer.renderAssemblyBoard(
    elements.assemblyBoard,
    assemblyPlan,
  );
  const deductionQuestion =
    selectedChapterDefinition.finalDeduction;
  const canDeduce =
    assemblyPlan.isComplete && deductionQuestion;
  elements.finalDeduction.hidden = !canDeduce;
  elements.finalDeduction.classList.remove(
    "is-correct",
    "is-incorrect",
  );
  selectedDeductionIndex = null;
  if (canDeduce) {
    const solved = progress.deductionCleared;
    elements.finalDeduction.classList.toggle(
      "is-solved",
      solved,
    );
    elements.deductionQuestion.textContent =
      deductionQuestion.prompt;
    elements.deductionStatus.textContent = solved
      ? "사건 해결"
      : "추리 가능";
    elements.deductionResult.textContent = solved
      ? deductionQuestion.explanation
      : "복원된 네 조각을 비교해 가장 타당한 결론을 선택하세요.";
    elements.submitDeduction.disabled = true;
    elements.submitDeduction.hidden = solved;
    window.UIRenderer.renderDeductionOptions(
      elements.deductionOptions,
      deductionQuestion,
      (selectedIndex) => {
        selectedDeductionIndex = selectedIndex;
        elements.submitDeduction.disabled = false;
        elements.finalDeduction.classList.remove(
          "is-incorrect",
        );
        elements.deductionStatus.textContent = "답안 선택됨";
      },
      solved,
    );
  }
  window.UIRenderer.renderStageCards(
    elements.stageGrid,
    selectedChapterDefinition.stages,
    progress.unlockedStageCount,
    (stageDefinition) => {
      selectedStageDefinition = stageDefinition;
      elements.startStage.disabled = false;
      elements.appStatus.textContent = "세부 사건 선택됨";
      elements.stageMessage.textContent =
        `${stageDefinition.order}단계 · ${stageDefinition.title}을 선택했습니다.`;
    },
    progress.clearedStageIds,
    progress.stageStars,
  );
  screenManager.show("stages");
  elements.appStatus.textContent = "세부 사건 선택";
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

async function prepareSelectedStage() {
  if (!selectedChapterDefinition || !selectedStageDefinition) return;

  const caseDefinition = selectedStageDefinition;
  const stageCards = Array.from(
    elements.stageGrid.querySelectorAll(".stage-card"),
  );
  editorManager.resetSession();
  elements.nextStage.hidden = true;
  puzzleSource = null;
  screenManager.show("stages", { scroll: false });
  elements.startStage.disabled = true;
  elements.startStage.textContent = "사건 이미지 분석 중…";
  stageCards.forEach((card) => {
    card.disabled = true;
  });
  elements.appStatus.textContent = "퍼즐 생성 중";
  elements.stageMessage.textContent =
    `${caseDefinition.title}의 증거 이미지를 분석하고 있습니다.`;

  try {
    const difficultyRules = window.DifficultyRules.get(
      caseDefinition.difficulty,
    );
    const stageSource =
      await window.ChapterImageSlicer.extractStageSource(
        selectedChapterDefinition,
        caseDefinition,
        512,
      );
    puzzleSource = await window.Pixelizer.pixelize(
      stageSource.dataUrl,
      {
        analysisGridSize: GAME_CONFIG.analysisGridSize,
        paintGridSize: GAME_CONFIG.paintGridSize,
        paletteSize: GAME_CONFIG.paletteSize,
      },
    );
    puzzleSource.caseDefinition = caseDefinition;
    puzzleSource.caseInfo = caseDefinition;
    puzzleSource.chapterDefinition = selectedChapterDefinition;
    puzzleSource.stageSourceRect = stageSource.sourceRect;
    puzzleSource.difficultyRules = difficultyRules;

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
          maskStyle: GAME_CONFIG.maskStyle,
          maskInsetBase: difficultyRules.maskInsetBase,
          maskInsetVariation:
            difficultyRules.maskInsetVariation,
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
    window.UIRenderer.renderCaseBriefing(
      elements.previewCaseTitle,
      elements.previewWitnessList,
      caseDefinition,
    );

    elements.resultMeta.textContent =
      `${caseDefinition.title} · ${puzzleSource.analysisWidth} × ` +
      `${puzzleSource.analysisHeight} 분석 · ${puzzleSource.width} × ` +
      `${puzzleSource.height} 색칠판 · ${puzzleSource.palette.length}색 · ` +
      `영역 ${puzzleMasks.hiddenRegions
        .map((region) => region + 1)
        .join(", ")} 불규칙 가림`;
    screenManager.show("preview");
    elements.appStatus.textContent = "퍼즐 준비 완료";
    elements.stageMessage.textContent =
      `${caseDefinition.title}의 퍼즐이 준비되었습니다.`;
  } catch (error) {
    puzzleSource = null;
    elements.appStatus.textContent = "불러오기 실패";
    elements.stageMessage.textContent =
      error.message || "사건 이미지를 불러오지 못했습니다.";
  } finally {
    const progress = stageProgressManager.get(
      selectedChapterDefinition.id,
    );
    stageCards.forEach((card, index) => {
      card.disabled = index >= progress.unlockedStageCount;
    });
    elements.startStage.disabled = selectedStageDefinition === null;
    elements.startStage.textContent = "선택한 세부 사건 시작";
  }
}

function openEditor({ reset = false } = {}) {
  if (!puzzleSource) return;
  editorManager.open(puzzleSource, { reset });
  screenManager.show("editor");
  elements.appStatus.textContent = "복원 중";
}

function getClipProgressMessage(progress) {
  if (progress.status === "download") {
    const percentage = Number(progress.progress?.progress);
    if (Number.isFinite(percentage)) {
      return `CLIP 모델 내려받는 중 ${Math.round(percentage)}%`;
    }
  }
  return progress.message || "CLIP 분석 중…";
}

function preloadClipModel() {
  clipScoreManager
    .preload((progress) => {
      elements.appStatus.textContent =
        getClipProgressMessage(progress);
    })
    .then(() => {
      if (puzzleSource) {
        elements.appStatus.textContent =
          "복원 중 · CLIP 준비 완료";
      }
    })
    .catch(() => {
      if (puzzleSource) {
        elements.appStatus.textContent =
          "복원 중 · CLIP은 채점 시 재시도";
      }
    });
}

function recordStageResult(finalScore) {
  const passingScore =
    puzzleSource.caseDefinition.passingScore;
  const stageOrder = puzzleSource.caseDefinition.order;
  const progressResult = stageProgressManager.recordResult(
    puzzleSource.chapterDefinition.id,
    puzzleSource.caseDefinition.id,
    finalScore,
  );
  const { cleared, hasNextStage } = progressResult;

  return Object.freeze({
    cleared,
    hasNextStage,
    stars: progressResult.stars,
    bestScore: progressResult.bestScore,
    message: cleared
      ? hasNextStage
        ? `${stageOrder + 1}단계 세부 사건이 해제되었습니다.`
        : "이 대형 사건의 모든 세부 사건을 클리어했습니다."
      : `${passingScore - finalScore > 0 ? (passingScore - finalScore).toFixed(1) : "0"}점이 더 필요합니다.`,
  });
}

function applyResultDisclosure(result) {
  const disclosure = window.ScoreManager.getResultDisclosure(
    result.finalScore,
    result.passingScore,
  );
  elements.originalResultFigure.hidden =
    !disclosure.revealOriginal;
  elements.resultComparison.classList.toggle(
    "is-original-hidden",
    !disclosure.revealOriginal,
  );
  elements.failureFeedback.hidden = disclosure.cleared;
  elements.failureFeedbackList.replaceChildren();

  if (!disclosure.cleared) {
    for (const message of window.ScoreManager.createFailureFeedback(
      result,
    )) {
      const item = document.createElement("li");
      item.textContent = message;
      elements.failureFeedbackList.append(item);
    }
  }
}

async function scoreCurrentRestoration() {
  if (!puzzleSource) return;

  elements.score.disabled = true;
  elements.score.textContent = "채점 준비 중…";
  editorManager.stop();
  const playerPixels = editorManager.syncPlayerPixels();
  if (!playerPixels) {
    elements.score.disabled = false;
    elements.score.textContent = "현재 상태 채점하기";
    editorManager.resume();
    return;
  }
  const expandedPixels =
    editorManager.expandPlayerPixels(playerPixels);
  const result = window.ScoreManager.evaluate(
    puzzleSource,
    playerPixels,
    expandedPixels,
    GAME_CONFIG,
  );

  window.Pixelizer.renderPixelGrid(
    elements.answerPreview,
    puzzleSource.analysisPixels,
    GAME_CONFIG.analysisGridSize,
  );
  editorManager.renderComposite(
    elements.playerPreview,
    puzzleSource.playerPixels,
  );

  try {
    const clipResult = await clipScoreManager.evaluate({
      referenceCanvas: elements.answerPreview,
      restoredCanvas: elements.playerPreview,
      hiddenRegions:
        puzzleSource.caseDefinition.hiddenRegions,
      clipPrompts:
        puzzleSource.caseDefinition.clipPrompts,
      visualScore: result.finalScore,
      regionsPerSide: GAME_CONFIG.regionsPerSide,
      combinedWeights: GAME_CONFIG.combinedScoreWeights,
      referenceCacheKey: puzzleSource.caseDefinition.id,
      onProgress: (progress) => {
        const message = getClipProgressMessage(progress);
        elements.score.textContent = message;
        elements.appStatus.textContent = message;
      },
    });
    const assistedScore = window.ScoreManager.applyHintPenalty(
      clipResult.combined.finalScore,
      puzzleSource.hintsUsed || 0,
    );
    const stageResult = recordStageResult(
      assistedScore.finalScore,
    );
    const combinedResult = Object.freeze({
      ...result,
      visualFinalScore: result.finalScore,
      clip: clipResult.clip,
      combined: clipResult.combined,
      scoreWeights: GAME_CONFIG.scoreWeights,
      passingScore: puzzleSource.caseDefinition.passingScore,
      hintsUsed: assistedScore.hintsUsed,
      hintPenalty: assistedScore.hintPenalty,
      stageStars: stageResult.stars,
      finalScore: assistedScore.finalScore,
      stageClearMessage: stageResult.message,
    });
    puzzleSource.clipScore = clipResult.clip;
    puzzleSource.combinedScore = clipResult.combined;
    puzzleSource.finalScore = assistedScore.finalScore;
    puzzleSource.isCleared = stageResult.cleared;
    window.ScoreManager.render(
      combinedResult,
      scoreElements,
      editorManager.getElapsedSeconds(),
    );
    applyResultDisclosure(combinedResult);
    screenManager.show("result");
    elements.nextStage.hidden = !stageResult.cleared;
    elements.nextStage.textContent = stageResult.hasNextStage
      ? "해제된 다음 사건 보기"
      : "완성된 전체 그림 보기";
    elements.appStatus.textContent = stageResult.cleared
      ? "세부 사건 클리어"
      : "재수사 필요";
  } catch (error) {
    elements.appStatus.textContent =
      error.message ||
      "CLIP 채점에 실패했습니다. 인터넷 연결을 확인하세요.";
    editorManager.resume();
  } finally {
    elements.score.disabled = false;
    elements.score.textContent = "현재 상태 채점하기";
  }
}

function resetToCaseSelection() {
  editorManager.resetSession();
  selectedChapterDefinition = null;
  selectedStageDefinition = null;
  selectedDeductionIndex = null;
  puzzleSource = null;
  screenManager.show("cases");
  window.UIRenderer.clearCaseSelection(elements.caseGrid);
  elements.loadCase.disabled = true;
  elements.appStatus.textContent = "사건 준비됨";
  elements.caseMessage.textContent =
    "사건 카드를 선택해 수사 기록을 확인하세요.";
}

elements.loadCase.addEventListener("click", openStageSelection);
elements.startStage.addEventListener("click", prepareSelectedStage);
elements.backToChapters.addEventListener("click", () => {
  selectedStageDefinition = null;
  window.UIRenderer.clearStageSelection(elements.stageGrid);
  elements.startStage.disabled = true;
  screenManager.show("cases");
  elements.appStatus.textContent = "사건 선택";
});
elements.startPuzzle.addEventListener("click", () => {
  openEditor({ reset: true });
  preloadClipModel();
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
elements.nextStage.addEventListener("click", openStageSelection);
elements.deductionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (
    !selectedChapterDefinition?.finalDeduction ||
    selectedDeductionIndex === null
  ) {
    return;
  }
  const result = window.DeductionManager.evaluate(
    selectedChapterDefinition.finalDeduction,
    selectedDeductionIndex,
  );
  stageProgressManager.recordDeduction(
    selectedChapterDefinition.id,
    result.correct,
  );
  elements.deductionResult.textContent = result.message;
  elements.finalDeduction.classList.toggle(
    "is-correct",
    result.correct,
  );
  elements.finalDeduction.classList.toggle(
    "is-incorrect",
    !result.correct,
  );
  elements.deductionStatus.textContent = result.correct
    ? "사건 해결"
    : "추리 실패";
  if (result.correct) {
    elements.submitDeduction.hidden = true;
    elements.deductionOptions
      .querySelectorAll("input")
      .forEach((input) => {
        input.disabled = true;
      });
    elements.appStatus.textContent = "대형 사건 해결";
  }
});
elements.newCase.addEventListener("click", resetToCaseSelection);

validateGameConfig();
renderCaseSelection();
screenManager.show("cases", { scroll: false, focus: false });
