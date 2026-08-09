const assert = require("node:assert/strict");
const path = require("node:path");

global.window = global;
require(path.join(__dirname, "..", "src", "data", "workbench-quests.js"));
require(path.join(__dirname, "..", "src", "data", "workbench", "q0-montage.js"));

const registry = global.WorkbenchQuestConfig;
const config = registry.get("Q0_MONTAGE");

assert.ok(config, "Q0_MONTAGE 설정이 등록되어야 합니다.");
assert.equal(config.gridSize, 64);
assert.equal(config.palette.length, 8);
assert.equal(config.regions.length, 5);
assert.equal(config.maskMode, "closed-regions");
assert.equal(registry.list().length, 1);
assert.equal(
  Math.round(config.regions.reduce((sum, region) => sum + region.weight, 0) * 1000),
  1000,
  "부위별 점수 비중의 합은 1이어야 합니다.",
);

config.regions.forEach((region) => {
  assert.ok(region.id && region.label);
  assert.ok(region.seeds.length > 0, `${region.label} 기준점이 필요합니다.`);
  region.seeds.forEach(([x, y]) => {
    assert.ok(x >= 0 && x < config.gridSize);
    assert.ok(y >= 0 && y < config.gridSize);
  });
  region.paletteIndexes.forEach((index) => {
    assert.ok(index >= 0 && index < config.palette.length);
  });
});

assert.throws(
  () => registry.validate({ ...config, id: "INVALID", gridSize: 0 }),
  /해상도는 양의 정수/,
);
assert.throws(
  () => registry.register(config),
  /이미 등록/,
);

console.log("Workbench quest config tests passed.");
