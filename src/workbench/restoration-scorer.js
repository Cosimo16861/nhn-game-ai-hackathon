/**
 * 복원 판정 — 색 유사도와 의미 유사도를 결합한 관대한 통과 기준.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7.4, docs/RESTORATION_QUEST_SPEC.md 4장
 *
 *   CLIP 사용 가능: 색 70% + 채색률 15% + CLIP 15%
 *   CLIP 불가:     색 82% + 채색률 18%   (자동 재분배)
 *   최초 통과선:   60점, 특징별 하드 실패 없음
 *
 * 통과선과 가중치는 계약 데이터(questimage-quests.js)에서만 바꾼다.
 * 이 파일의 계산식은 통과선 조정 때 건드리지 않는다.
 *
 * 플레이어에게 숫자는 노출하지 않는다. 정성 피드백 네 단계만 돌려준다.
 */
(function (global) {
  "use strict";

  const CLIP_TIMEOUT_MS = 10000;

  const FEEDBACK = Object.freeze({
    pass: "증거로 사용할 수 있을 만큼 복원됐다.",
    near: "거의 완성됐다.",
    partial: "전체 인상은 잡히고 있다.",
    far: "증언 메모를 다시 살펴보자.",
  });

  function withTimeout(promise, ms) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = global.setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, ms);
      Promise.resolve(promise).then(
        (value) => {
          if (settled) return;
          settled = true;
          global.clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          if (settled) return;
          settled = true;
          global.clearTimeout(timer);
          console.warn("[restoration-scorer] CLIP 보조 점수를 건너뜁니다.", error);
          resolve(null);
        },
      );
    });
  }

  /**
   * @param {object} input
   *   contract           questimage 계약
   *   targetImageData    완성본(내부용, 저장하지 않는다)
   *   restoredImageData  플레이어 합성본
   *   evaluationMask     선 픽셀을 제외한 채점 대상
   *   evaluateClip       선택. (…) => Promise<number|null>
   */
  async function score(input) {
    const engine = global.HighResRestorationScoring;
    const scoring = input.contract.scoring || {};

    let clipScore = null;
    if (typeof input.evaluateClip === "function") {
      // CLIP 실패·지연은 제출 자체를 실패시키지 않는다.
      clipScore = await withTimeout(
        input.evaluateClip({ contract: input.contract }),
        input.clipTimeoutMs || CLIP_TIMEOUT_MS,
      );
    }

    const outcome = engine.evaluate({
      targetImageData: input.targetImageData,
      restoredImageData: input.restoredImageData,
      evaluationMask: input.evaluationMask,
      clipScore,
      passingScore: scoring.passingScore,
      weights: scoring.weights,
      fallbackWeights: scoring.fallbackWeights,
    });

    return Object.freeze({
      cleared: outcome.cleared,
      tier: outcome.tier,
      feedback: FEEDBACK[outcome.tier] || FEEDBACK.far,
      clipAvailable: outcome.clipAvailable,
      // 숫자는 제품 UI 에 넘기지 않는다. HAVEN_DEBUG 진단에서만 읽는다.
      debug: Object.freeze({
        finalScore: outcome.finalScore,
        colorScore: outcome.colorScore,
        coverageScore: outcome.coverageScore,
        clipScore: outcome.clipScore,
        passingScore: outcome.passingScore,
        sampledPixels: outcome.sampledPixels,
      }),
    });
  }

  global.RestorationScorer = Object.freeze({ CLIP_TIMEOUT_MS, FEEDBACK, score });
})(typeof window !== "undefined" ? window : globalThis);
