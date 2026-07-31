(function () {
  "use strict";

  const EXPECTED_WITNESS_COUNT = 3;
  const EXPECTED_HIDDEN_REGION_COUNT = 3;
  const SUPPORTED_DIFFICULTIES = new Set(["easy", "normal", "hard"]);

  function addIssue(issues, code, message, stageId = null) {
    issues.push(Object.freeze({ code, message, stageId }));
  }

  function isValidDeduction(question) {
    return Boolean(
      question &&
        String(question.prompt || "").trim() &&
        Array.isArray(question.options) &&
        question.options.length >= 2 &&
        question.options.length <= 4 &&
        Number.isInteger(question.answerIndex) &&
        question.answerIndex >= 0 &&
        question.answerIndex < question.options.length,
    );
  }

  function auditStage(stage, issues) {
    const stageId = String(stage?.id || "unknown-stage");
    const witnesses = Array.from(stage?.witnesses || []);
    const clipPrompts = Array.from(stage?.clipPrompts || []);
    const hiddenRegions = Array.from(stage?.hiddenRegions || []);
    const hints = Array.from(stage?.hints || []);

    if (witnesses.length !== EXPECTED_WITNESS_COUNT) {
      addIssue(
        issues,
        "stage-witness-count",
        "목격담은 A·B·C 세 문장이어야 합니다.",
        stageId,
      );
    }
    if (
      clipPrompts.length !== EXPECTED_WITNESS_COUNT ||
      new Set(clipPrompts).size !== EXPECTED_WITNESS_COUNT
    ) {
      addIssue(
        issues,
        "stage-clip-prompts",
        "서로 다른 CLIP 분석 문장 세 개가 필요합니다.",
        stageId,
      );
    }
    if (
      hiddenRegions.length !== EXPECTED_HIDDEN_REGION_COUNT ||
      new Set(hiddenRegions).size !== EXPECTED_HIDDEN_REGION_COUNT
    ) {
      addIssue(
        issues,
        "stage-hidden-regions",
        "서로 다른 가림 구역 세 개가 필요합니다.",
        stageId,
      );
    }
    if (hints.length < 1) {
      addIssue(
        issues,
        "stage-hint",
        "초심자를 위한 힌트가 한 개 이상 필요합니다.",
        stageId,
      );
    }
    if (!SUPPORTED_DIFFICULTIES.has(stage?.difficulty)) {
      addIssue(
        issues,
        "stage-difficulty",
        "난이도는 easy, normal, hard 중 하나여야 합니다.",
        stageId,
      );
    }
    if (
      !Number.isFinite(stage?.passingScore) ||
      stage.passingScore < 0 ||
      stage.passingScore > 100
    ) {
      addIssue(
        issues,
        "stage-passing-score",
        "통과 점수는 0~100 사이여야 합니다.",
        stageId,
      );
    }
  }

  function auditChapter(chapter) {
    const issues = [];
    const columns = Number(chapter?.layout?.columns);
    const rows = Number(chapter?.layout?.rows);
    const totalSlots =
      Number.isInteger(columns) &&
      columns > 0 &&
      Number.isInteger(rows) &&
      rows > 0
        ? columns * rows
        : 0;
    const stages = Array.from(chapter?.stages || []);
    const cropKeys = new Set();

    if (chapter?.masterImageStatus !== "ready") {
      addIssue(
        issues,
        "master-image-placeholder",
        "연속된 전체 사건 이미지를 준비 상태로 바꿔야 합니다.",
      );
    }
    if (totalSlots === 0) {
      addIssue(
        issues,
        "invalid-layout",
        "유효한 사건 이미지 분할 정보를 지정해야 합니다.",
      );
    }
    if (stages.length !== totalSlots) {
      addIssue(
        issues,
        "incomplete-stage-grid",
        `분할 구역 ${totalSlots}개를 모두 채우는 세부 사건이 필요합니다.`,
      );
    }

    for (const stage of stages) {
      const column = Number(stage?.crop?.column);
      const row = Number(stage?.crop?.row);
      if (
        !Number.isInteger(column) ||
        !Number.isInteger(row) ||
        column < 0 ||
        row < 0 ||
        column >= columns ||
        row >= rows
      ) {
        addIssue(
          issues,
          "invalid-stage-crop",
          "세부 사건 조각 위치가 분할 범위를 벗어났습니다.",
          String(stage?.id || "unknown-stage"),
        );
      } else {
        const cropKey = `${column}:${row}`;
        if (cropKeys.has(cropKey)) {
          addIssue(
            issues,
            "duplicate-stage-crop",
            "두 세부 사건이 같은 조각 위치를 사용합니다.",
            String(stage?.id || "unknown-stage"),
          );
        }
        cropKeys.add(cropKey);
      }
      auditStage(stage, issues);
    }

    if (!isValidDeduction(chapter?.finalDeduction)) {
      addIssue(
        issues,
        "final-deduction",
        "전체 그림 완성 후 사용할 최종 추리 문제가 필요합니다.",
      );
    }

    const status =
      chapter?.masterImageStatus === "placeholder"
        ? "placeholder"
        : issues.length === 0
          ? "ready"
          : "incomplete";

    return Object.freeze({
      chapterId: String(chapter?.id || "unknown-chapter"),
      status,
      isReady: status === "ready",
      completedSlots: cropKeys.size,
      totalSlots,
      issues: Object.freeze(issues),
    });
  }

  function auditChapters(chapters) {
    return Object.freeze(Array.from(chapters || [], auditChapter));
  }

  window.ContentReadiness = Object.freeze({
    auditChapter,
    auditChapters,
  });
})();
