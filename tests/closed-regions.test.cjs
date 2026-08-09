/**
 * 폐곡선 라벨링 — RESTORATION_QUEST_SPEC 3.2.
 *
 *   - 휘도 205 이하 픽셀은 잠긴 경계다.
 *   - 나머지는 4방향 연결 요소로 나뉜다.
 *   - 영역별 경계 상자는 그 영역의 모든 픽셀을 포함한다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
global.window = global.window || {};
require(path.join(root, "scripts/highres-restoration-scoring.js"));
require(path.join(root, "src/workbench/closed-regions.js"));
const ClosedRegions = global.window.ClosedRegions || globalThis.ClosedRegions;

/** 검은 십자로 네 칸을 나눈 합성 윤곽선. */
function crossOutline(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  const middle = Math.floor(size / 2);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const offset = (y * size + x) * 4;
      const isLine = x === middle || y === middle;
      const value = isLine ? 0 : 255;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { width: size, height: size, data };
}

const size = 21;
const regions = ClosedRegions.analyze(crossOutline(size));

assert.equal(regions.width, size);
assert.equal(regions.regionCount, 4, "십자는 네 개의 닫힌 면을 만들어야 합니다.");

const middle = Math.floor(size / 2);
const at = (x, y) => regions.regionOf[y * size + x];

// 선 위는 잠긴 경계다.
assert.equal(at(middle, 3), ClosedRegions.LOCKED);
assert.equal(at(3, middle), ClosedRegions.LOCKED);
assert.equal(regions.evaluationMask[middle * size + middle], 0);

// 네 사분면이 서로 다른 영역이다.
const quadrants = [at(2, 2), at(size - 3, 2), at(2, size - 3), at(size - 3, size - 3)];
assert.equal(new Set(quadrants).size, 4, "사분면은 서로 다른 영역이어야 합니다.");
quadrants.forEach((id) => assert.ok(id >= 0, "사분면은 잠긴 경계가 아니어야 합니다."));

// 같은 사분면 안은 이어져 있다.
assert.equal(at(1, 1), at(middle - 1, middle - 1));

// 크기와 경계 상자.
const totalPixels = regions.regionSizes.reduce((sum, value) => sum + value, 0);
const lockedPixels = regions.regionOf.filter((id) => id === ClosedRegions.LOCKED).length;
assert.equal(totalPixels + lockedPixels, size * size, "모든 픽셀이 분류돼야 합니다.");
assert.equal(regions.regionSizes[quadrants[0]], (middle) * (middle));

const bounds = regions.regionBounds[quadrants[0]];
assert.deepEqual(bounds, { x0: 0, y0: 0, x1: middle - 1, y1: middle - 1 });

const farBounds = regions.regionBounds[quadrants[3]];
assert.deepEqual(farBounds, {
  x0: middle + 1, y0: middle + 1, x1: size - 1, y1: size - 1,
});

// 회색(휘도 205 이하)도 경계로 본다 — 자산의 반음영 선이 새지 않아야 한다.
const grey = crossOutline(size);
for (let x = 0; x < size; x += 1) {
  const offset = (2 * size + x) * 4;
  grey.data[offset] = 100;
  grey.data[offset + 1] = 100;
  grey.data[offset + 2] = 100;
}
const greyRegions = ClosedRegions.analyze(grey);
assert.equal(greyRegions.regionOf[2 * size + 1], ClosedRegions.LOCKED);
assert.ok(greyRegions.regionCount > regions.regionCount, "회색 선이 면을 더 나눠야 합니다.");

console.log("Closed region tests passed.");
