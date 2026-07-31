(function () {
  "use strict";

  function getBackgroundPosition(index, count) {
    if (count <= 1) return "0%";
    return `${(index / (count - 1)) * 100}%`;
  }

  function createPlan(chapter, clearedStageIds) {
    if (
      !chapter?.layout ||
      !Array.isArray(chapter.stages) ||
      !chapter.masterImageSrc
    ) {
      throw new Error("전체 사건 조립 정보가 올바르지 않습니다.");
    }
    const clearedIds = new Set(clearedStageIds || []);
    const { columns, rows } = chapter.layout;
    const tiles = Array.from(
      { length: columns * rows },
      (_, index) => {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const stage =
          chapter.stages.find(
            (candidate) =>
              candidate.crop.column === column &&
              candidate.crop.row === row,
          ) || null;
        return Object.freeze({
          index,
          row,
          column,
          stage,
          cleared: Boolean(stage && clearedIds.has(stage.id)),
          backgroundImage: chapter.masterImageSrc,
          backgroundSize:
            `${columns * 100}% ${rows * 100}%`,
          backgroundPosition:
            `${getBackgroundPosition(column, columns)} ` +
            getBackgroundPosition(row, rows),
        });
      },
    );
    const completedStageCount = chapter.stages.filter((stage) =>
      clearedIds.has(stage.id),
    ).length;

    return Object.freeze({
      chapterId: chapter.id,
      columns,
      rows,
      completedStageCount,
      totalStageCount: chapter.stages.length,
      isComplete:
        completedStageCount === chapter.stages.length,
      tiles: Object.freeze(tiles),
    });
  }

  window.AssemblyManager = Object.freeze({
    createPlan,
    getBackgroundPosition,
  });
})();
