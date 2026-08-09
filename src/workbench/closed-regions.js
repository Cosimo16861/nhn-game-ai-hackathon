/**
 * 폐곡선 라벨링 — 1254² 윤곽선을 4방향 연결 요소로 한 번만 나눈다.
 * 근거: docs/RESTORATION_QUEST_SPEC.md 3.2, GAME_INTEGRATION_PLAN 7.1
 *
 * dev/quests 프로토타입(src/highres-restoration-runtime.js)의 알고리즘을 그대로
 * 옮기되 DOM 의존을 걷어내고 제품 모듈로 분리했다.
 *
 * 계약
 *   - 휘도 205 이하 픽셀은 잠긴 경계다. regionOf 는 -2.
 *   - 나머지는 0..regionCount-1 의 영역 번호를 갖는다.
 *   - 퀘스트당 한 번만 계산한다. 결과는 읽기 전용으로 다룬다.
 */
(function (global) {
  "use strict";

  const LOCKED = -2;

  function analyze(outlineImageData, threshold) {
    const scoring = global.HighResRestorationScoring;
    const width = outlineImageData.width;
    const height = outlineImageData.height;
    const count = width * height;

    const evaluationMask = scoring.createEvaluationMask(
      outlineImageData,
      threshold ?? scoring.DEFAULTS.lineLuminanceThreshold,
    );

    const regionOf = new Int32Array(count).fill(-1);
    for (let index = 0; index < count; index += 1) {
      if (!evaluationMask[index]) regionOf[index] = LOCKED;
    }

    const queue = new Int32Array(count);
    const regionSizes = [];
    // 영역별 경계 상자. 채우기 실행 취소를 캔버스 전체가 아니라 이 범위로 제한한다.
    const regionBounds = [];
    let regionId = 0;

    for (let start = 0; start < count; start += 1) {
      if (regionOf[start] !== -1) continue;
      let head = 0;
      let tail = 0;
      queue[tail++] = start;
      regionOf[start] = regionId;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;

      while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = (index - x) / width;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        if (x > 0 && regionOf[index - 1] === -1) {
          regionOf[index - 1] = regionId;
          queue[tail++] = index - 1;
        }
        if (x + 1 < width && regionOf[index + 1] === -1) {
          regionOf[index + 1] = regionId;
          queue[tail++] = index + 1;
        }
        if (y > 0 && regionOf[index - width] === -1) {
          regionOf[index - width] = regionId;
          queue[tail++] = index - width;
        }
        if (y + 1 < height && regionOf[index + width] === -1) {
          regionOf[index + width] = regionId;
          queue[tail++] = index + width;
        }
      }

      regionSizes.push(tail);
      regionBounds.push({ x0: minX, y0: minY, x1: maxX, y1: maxY });
      regionId += 1;
    }

    return Object.freeze({
      width,
      height,
      evaluationMask,
      regionOf,
      regionSizes: Object.freeze(regionSizes),
      regionBounds: Object.freeze(regionBounds),
      regionCount: regionId,
      LOCKED,
    });
  }

  global.ClosedRegions = Object.freeze({ LOCKED, analyze });
})(typeof window !== "undefined" ? window : globalThis);
