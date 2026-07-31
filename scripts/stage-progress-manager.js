(function () {
  "use strict";

  const STORAGE_VERSION = 1;
  const DEFAULT_STORAGE_KEY = "pixel-recall-progress-v1";

  function calculateStars(finalScore, passingScore) {
    if (finalScore < passingScore) return 0;
    if (finalScore >= Math.min(100, passingScore + 25)) return 3;
    if (finalScore >= Math.min(100, passingScore + 15)) return 2;
    return 1;
  }

  function getDefaultStorage() {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  }

  function create(chapters, options = {}) {
    const chapterMap = new Map(
      Array.from(chapters || [], (chapter) => [
        chapter.id,
        chapter,
      ]),
    );
    const progressMap = new Map();
    const storage =
      options.storage === undefined
        ? getDefaultStorage()
        : options.storage;
    const storageKey =
      options.storageKey || DEFAULT_STORAGE_KEY;

    function getMutableProgress(chapterId) {
      if (!chapterMap.has(chapterId)) {
        throw new Error(`등록되지 않은 대형 사건입니다: ${chapterId}`);
      }
      if (!progressMap.has(chapterId)) {
        progressMap.set(chapterId, {
          unlockedStageCount: 1,
          clearedStageIds: new Set(),
          deductionCleared: false,
          bestScores: new Map(),
          stageStars: new Map(),
        });
      }
      return progressMap.get(chapterId);
    }

    function get(chapterId) {
      const progress = getMutableProgress(chapterId);
      return Object.freeze({
        unlockedStageCount: progress.unlockedStageCount,
        clearedStageIds: new Set(progress.clearedStageIds),
        deductionCleared: progress.deductionCleared,
        bestScores: new Map(progress.bestScores),
        stageStars: new Map(progress.stageStars),
      });
    }

    function persist() {
      if (!storage?.setItem) return false;
      const chapterProgress = {};
      progressMap.forEach((progress, chapterId) => {
        chapterProgress[chapterId] = {
          unlockedStageCount: progress.unlockedStageCount,
          clearedStageIds: Array.from(progress.clearedStageIds),
          deductionCleared: progress.deductionCleared,
          bestScores: Object.fromEntries(progress.bestScores),
        };
      });
      try {
        storage.setItem(
          storageKey,
          JSON.stringify({
            version: STORAGE_VERSION,
            chapters: chapterProgress,
          }),
        );
        return true;
      } catch {
        return false;
      }
    }

    function hydrate() {
      if (!storage?.getItem) return;
      let saved;
      try {
        saved = JSON.parse(storage.getItem(storageKey));
      } catch {
        return;
      }
      if (
        saved?.version !== STORAGE_VERSION ||
        !saved.chapters ||
        typeof saved.chapters !== "object"
      ) {
        return;
      }

      chapterMap.forEach((chapter, chapterId) => {
        const stored = saved.chapters[chapterId];
        if (!stored || typeof stored !== "object") return;
        const progress = getMutableProgress(chapterId);
        const validStageIds = new Set(
          chapter.stages.map((stage) => stage.id),
        );
        Array.from(stored.clearedStageIds || []).forEach(
          (stageId) => {
            if (validStageIds.has(stageId)) {
              progress.clearedStageIds.add(stageId);
            }
          },
        );
        const requestedUnlocked = Number(
          stored.unlockedStageCount,
        );
        progress.unlockedStageCount = Number.isInteger(
          requestedUnlocked,
        )
          ? Math.max(
              1,
              Math.min(chapter.stages.length, requestedUnlocked),
            )
          : 1;
        chapter.stages.forEach((stage) => {
          if (!progress.clearedStageIds.has(stage.id)) return;
          progress.unlockedStageCount = Math.max(
            progress.unlockedStageCount,
            Math.min(chapter.stages.length, stage.order + 1),
          );
        });
        Object.entries(stored.bestScores || {}).forEach(
          ([stageId, score]) => {
            const stage = chapter.stages.find(
              (candidate) => candidate.id === stageId,
            );
            const numericScore = Number(score);
            if (
              !stage ||
              !Number.isFinite(numericScore) ||
              numericScore < 0 ||
              numericScore > 100
            ) {
              return;
            }
            progress.bestScores.set(stageId, numericScore);
            progress.stageStars.set(
              stageId,
              calculateStars(
                numericScore,
                stage.passingScore,
              ),
            );
          },
        );
        progress.deductionCleared =
          stored.deductionCleared === true &&
          progress.clearedStageIds.size === chapter.stages.length;
      });
    }

    function recordResult(chapterId, stageId, finalScore) {
      const chapter = chapterMap.get(chapterId);
      const stage = chapter?.stages.find(
        (candidate) => candidate.id === stageId,
      );
      if (
        !stage ||
        !Number.isFinite(finalScore) ||
        finalScore < 0 ||
        finalScore > 100
      ) {
        throw new Error("세부 사건 결과 정보가 올바르지 않습니다.");
      }

      const progress = getMutableProgress(chapterId);
      if (stage.order > progress.unlockedStageCount) {
        throw new Error("잠긴 세부 사건의 결과는 기록할 수 없습니다.");
      }
      const cleared = finalScore >= stage.passingScore;
      const hasNextStage = stage.order < chapter.stages.length;
      if (cleared) {
        progress.clearedStageIds.add(stage.id);
        if (hasNextStage) {
          progress.unlockedStageCount = Math.max(
            progress.unlockedStageCount,
            stage.order + 1,
          );
        }
      }
      const previousBest =
        progress.bestScores.get(stage.id) ?? -1;
      if (finalScore > previousBest) {
        progress.bestScores.set(stage.id, finalScore);
        progress.stageStars.set(
          stage.id,
          calculateStars(finalScore, stage.passingScore),
        );
      }
      persist();

      return Object.freeze({
        cleared,
        hasNextStage,
        unlockedStageCount: progress.unlockedStageCount,
        clearedStageCount: progress.clearedStageIds.size,
        bestScore: progress.bestScores.get(stage.id),
        stars: progress.stageStars.get(stage.id) || 0,
      });
    }

    function recordDeduction(chapterId, correct) {
      const chapter = chapterMap.get(chapterId);
      const progress = getMutableProgress(chapterId);
      if (
        progress.clearedStageIds.size !== chapter.stages.length
      ) {
        throw new Error(
          "모든 세부 사건을 클리어한 뒤 최종 추리를 진행해야 합니다.",
        );
      }
      if (correct === true) {
        progress.deductionCleared = true;
      }
      persist();
      return Object.freeze({
        correct: correct === true,
        deductionCleared: progress.deductionCleared,
      });
    }

    hydrate();

    return Object.freeze({
      get,
      persist,
      recordDeduction,
      recordResult,
    });
  }

  window.StageProgressManager = Object.freeze({
    DEFAULT_STORAGE_KEY,
    STORAGE_VERSION,
    calculateStars,
    create,
  });
})();
