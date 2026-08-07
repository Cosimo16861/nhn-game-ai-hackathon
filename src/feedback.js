/**
 * 숨은 채점 → 정성 피드백 변환기.
 *
 * 정본 기준(GAME_DESIGN 8.4 / 00_SYSTEM 4.2):
 *   점수·가중치·통과선·정답 오버레이를 플레이어에게 공개하지 않는다.
 *   이 모듈 밖으로 숫자를 내보내지 않는 것이 유일한 규칙이다.
 *
 * 주의: scripts/score-manager.js 는 "통과 85점"처럼 숫자를 노출하는
 * 폐기된 옛 스펙이므로 사용하지 않는다. 시각 점수는 scripts/scoring.js 만 쓴다.
 */
(function () {
  "use strict";

  const TIER = {
    FAR: "far",
    PARTIAL: "partial",
    NEAR: "near",
    PASS: "pass",
  };

  /**
   * 한국어 조사 선택. 앞말의 받침 유무로 고른다.
   * @param {string} word 앞말
   * @param {[string,string]} pair [받침 있을 때, 없을 때] 예: ["이","가"]
   */
  function withParticle(word, pair) {
    const last = word.trim().slice(-1);
    const code = last.charCodeAt(0);
    const isHangul = code >= 0xac00 && code <= 0xd7a3;
    // 한글이 아니면 안전하게 '받침 없음'으로 처리한다.
    const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
    return `${word}${hasFinal ? pair[0] : pair[1]}`;
  }

  /** 필수 특징이 실제로 반영됐는지 — 좌표나 색상값은 노출하지 않는다. */
  function checkFeatures(quest, playerPixels, activeFeatures) {
    return activeFeatures.map((feature) => {
      const cells = feature.indices;
      let filled = 0;
      let matched = 0;

      cells.forEach((index) => {
        const painted = playerPixels[index];
        if (!painted) return;
        filled++;
        if (painted.toLowerCase() === feature.color.toLowerCase()) matched++;
      });

      const coverage = cells.length === 0 ? 1 : filled / cells.length;
      const accuracy = filled === 0 ? 0 : matched / filled;
      // 칠했고(70%+) 대체로 맞는 색(70%+)이어야 반영된 것으로 본다.
      const satisfied = coverage >= 0.7 && accuracy >= 0.7;

      return { id: feature.id, label: feature.label, satisfied, coverage, accuracy };
    });
  }

  /** 부족한 범주만 알려 준다. 정답 좌표·색상값은 말하지 않는다. */
  function weakestCategory(scores) {
    const categories = [
      { key: "color", score: scores.color.score, message: "증언에 나온 색을 다시 확인해 보자." },
      { key: "palette", score: scores.palette.score, message: "쓰지 않아도 될 색이 섞여 있는 것 같다." },
      { key: "edge", score: scores.edge.score, message: "형태의 경계가 아직 흐릿하다." },
      { key: "structure", score: scores.structure.score, message: "부분들의 밝기 관계가 어긋나 있다." },
    ];
    return categories.sort((a, b) => a.score - b.score)[0];
  }

  function unpaintedCount(quest, playerPixels) {
    let count = 0;
    quest.hiddenMask.forEach((hidden, index) => {
      if (hidden && !playerPixels[index]) count++;
    });
    return count;
  }

  /**
   * @returns {{tier, cleared, headline, notes:string[]}} 숫자 없는 결과
   */
  function evaluate(quest, playerPixels, activeFeatures) {
    const scores = window.PixelScoring.calculateRestorationScores(
      quest.targetPixels,
      playerPixels,
      quest.hiddenMask,
      quest.gridSize,
      quest.weights,
    );

    const features = checkFeatures(quest, playerPixels, activeFeatures);
    const missing = features.filter((feature) => !feature.satisfied);
    const blanks = unpaintedCount(quest, playerPixels);

    // 필수 특징을 놓치면 점수가 높아도 증거로 쓸 수 없다.
    const meetsFeatures = missing.length === 0;
    const cleared = scores.finalScore >= quest.passingScore && meetsFeatures;

    let tier;
    if (cleared) tier = TIER.PASS;
    else if (scores.finalScore >= quest.passingScore - 10) tier = TIER.NEAR;
    else if (scores.finalScore >= quest.passingScore - 27) tier = TIER.PARTIAL;
    else tier = TIER.FAR;

    const notes = [];
    let headline;

    if (tier === TIER.PASS) {
      headline = "증거로 사용할 수 있을 만큼 복원됐다.";
    } else if (tier === TIER.NEAR) {
      headline = "거의 완성됐다.";
      if (!meetsFeatures) {
        notes.push(
          `${withParticle(missing[0].label, ["이", "가"])} 아직 증언대로 보이지 않는다.`,
        );
      } else {
        notes.push(weakestCategory(scores).message);
      }
    } else if (tier === TIER.PARTIAL) {
      headline = "전체 인상은 가까워지고 있다.";
      if (blanks > 0) notes.push("아직 비어 있는 자리가 남아 있다.");
      notes.push(weakestCategory(scores).message);
      if (!meetsFeatures) {
        notes.push(
          `${withParticle(missing[0].label, ["을", "를"])} 다시 살펴보자.`,
        );
      }
    } else {
      headline = "증언 카드를 다시 살펴보자.";
      if (blanks > 0) notes.push("아직 비어 있는 자리가 많다.");
      missing.slice(0, 2).forEach((feature) => {
        notes.push(`증언에는 ${feature.label}에 관한 이야기가 있었다.`);
      });
      if (notes.length === 0) notes.push(weakestCategory(scores).message);
    }

    // 반환값에 점수를 담지 않는다. 디버깅이 필요하면 콘솔에서만 확인한다.
    if (window.HAVEN_DEBUG) {
      console.debug("[숨은 점수]", scores.finalScore, scores, features);
    }

    return Object.freeze({
      tier,
      cleared,
      headline,
      notes: Object.freeze(notes.slice(0, 3)),
    });
  }

  window.RestorationFeedback = Object.freeze({ evaluate, TIER });
})();
