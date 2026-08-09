(function () {
  "use strict";

  const root = document.querySelector("[data-role=q1a-test]");
  const contract = window.QuestImageContracts.get("Q1A_IDEALIZED");
  const clipManager = window.CLIPScoreManager?.create();

  async function evaluateClip({ contract: activeContract, targetCanvas, restoredCanvas }) {
    if (!clipManager) throw new Error("CLIP 보조 모듈이 준비되지 않았습니다.");
    const result = await clipManager.evaluate({
      referenceCanvas: targetCanvas,
      restoredCanvas,
      hiddenRegions: activeContract.clipRegions,
      clipPrompts: activeContract.clipPrompts,
      visualScore: 50,
      regionsPerSide: 4,
      combinedWeights: { visual: 0.85, clip: 0.15 },
      referenceCacheKey: activeContract.id,
      onProgress(progress) {
        if (window.HAVEN_DEBUG) console.debug("[CLIP]", progress);
      },
    });
    if (!Number.isFinite(result.clip.score)) {
      throw new Error("신뢰할 수 있는 CLIP 구역 점수가 없습니다.");
    }
    return result.clip.score;
  }

  if (!root || !contract) {
    throw new Error("Q1A 고해상도 테스트 설정을 찾을 수 없습니다.");
  }

  document.title = `${contract.title} · 1254px 복원 테스트`;
  const runtime = window.HighResRestorationRuntime.mount(root, contract, { evaluateClip });
  window.Q1AHighResTest = runtime;
  runtime.initialize().catch((error) => {
    console.error(error);
    const status = root.querySelector("[data-role=status]");
    status.textContent = `초기화 실패: ${error.message}`;
  });
})();
