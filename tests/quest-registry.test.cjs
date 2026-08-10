/**
 * 복원 퀘스트 등록부 — 필수 항목과 등록 순서.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7.5, 10장 단계 7
 *
 * 퀘스트마다 다음 여섯 가지가 모두 있어야 한다.
 *   1. questimage 원본/미완성 이미지
 *   2. 증언 메모
 *   3. 붓과 채우기 설정
 *   4. 판정 가중치와 통과 기준
 *   5. 성공 후 재생할 컷신 번들
 *   6. 다음 퀘스트 해금 조건
 *
 * 이미지가 실제로 존재하는지는 tests/questimage-assets.test.cjs 가,
 * 번들·장면 ID 가 실재하는지는 tests/quest-completion-contract.test.cjs 가 본다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const registry = require(path.join(root, "src/data/quest-registry.js"));
const contracts = require(path.join(root, "src/data/questimage-quests.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const { QuestGraph } = global.window;

// ── 0. 부팅 검증기 ──────────────────────────────────────────────────
assert.deepEqual(
  registry.validate(),
  [],
  "등록부 부팅 검증에서 문제가 나오면 안 됩니다.",
);

// ── 1. 계획서의 퀘스트 순서 ─────────────────────────────────────────
// GAME_INTEGRATION_PLAN 0장 흐름도와 7.5 등록 순서: 레이어 → 본선 → 가지.
const EXPECTED_ORDER = [
  "Q0_MONTAGE",
  "Q1A_IDEALIZED", "Q1B_TAVERN_WALL",
  "Q2A_TRUE_FACE", "Q2B_CAT", "Q2C_CHILD_ROOM",
  "Q3A_SEAL", "Q3B_TATTOO", "Q3C_WAREHOUSE",
  "Q4A_LEDGER", "Q4B_LOGBOOK", "Q4C_SQUARE_BET",
  "Q5A_DOCK", "Q5B_SIREN",
];
assert.deepEqual(registry.ids(), EXPECTED_ORDER, "등록 순서가 계획서와 다릅니다.");
assert.equal(registry.list().length, 14, "복원 퀘스트는 14개여야 합니다.");

// Q6 는 복원 퀘스트가 아니다 — 계획서 9장.
assert.equal(registry.get("Q6_FINALE"), null, "Q6 는 복원 퀘스트로 등록되면 안 됩니다.");

// 레이어별 본선은 정확히 하나.
for (let layer = 1; layer <= 5; layer += 1) {
  const mains = registry.inLayer(layer).filter((quest) => quest.route === "main");
  assert.equal(mains.length, 1, `레이어 ${layer}: 본선 퀘스트가 ${mains.length}개입니다.`);
}

// ── 2. 퀘스트마다 필수 여섯 항목 ────────────────────────────────────
const HEX = /^#[0-9a-f]{6}$/i;

for (const quest of registry.list()) {
  const where = quest.id;

  // (1) questimage 원본/미완성 이미지
  assert.equal(quest.images.resolution, 1254, `${where}: 원본 해상도가 1254 가 아닙니다.`);
  assert.match(quest.images.target, /^assets\/questimage\/.+__완성이미지\.png$/,
    `${where}: 완성본 경로가 규약과 다릅니다.`);
  assert.match(quest.images.outline, /^assets\/questimage\/.+__윤곽선\.png$/,
    `${where}: 윤곽선 경로가 규약과 다릅니다.`);
  const prefix = (source) => source.slice(0, source.lastIndexOf("__"));
  assert.equal(prefix(quest.images.target), prefix(quest.images.outline),
    `${where}: 완성본과 윤곽선의 접두사가 다릅니다.`);
  assert.ok(quest.images.target.includes(`/${where}__`),
    `${where}: 자산 접두사에 퀘스트 ID 가 없습니다.`);

  // (2) 증언 메모
  assert.ok(quest.notes.length >= 1, `${where}: 증언 메모가 없습니다.`);
  quest.notes.forEach((note, index) => {
    assert.ok(note.speaker, `${where} 메모 ${index + 1}: 화자가 없습니다.`);
    assert.ok(note.text, `${where} 메모 ${index + 1}: 문장이 없습니다.`);
  });
  assert.ok(quest.palette.length >= 1 && quest.palette.length <= 8,
    `${where}: 팔레트는 1~8색이어야 합니다.`);
  const seen = new Set();
  quest.palette.forEach((entry) => {
    assert.ok(entry.name, `${where}: 팔레트 색 이름이 없습니다.`);
    assert.match(entry.hex, HEX, `${where}: 팔레트 색 형식이 올바르지 않습니다.`);
    assert.ok(!seen.has(entry.hex.toLowerCase()), `${where}: 팔레트에 중복 색이 있습니다.`);
    seen.add(entry.hex.toLowerCase());
  });

  // (3) 붓과 채우기 설정
  const tools = quest.tools;
  assert.ok(Array.isArray(tools.brushSizes) && tools.brushSizes.length >= 1,
    `${where}: 붓 크기가 없습니다.`);
  tools.brushSizes.forEach((size) => {
    assert.ok(Number.isInteger(size) && size >= 2,
      `${where}: 1px 붓은 쓰지 않습니다 (${size}).`);
  });
  assert.ok(["fill", "brush", "eraser"].includes(tools.defaultTool),
    `${where}: 기본 도구가 올바르지 않습니다.`);
  assert.ok(tools.brushSizes.includes(tools.defaultBrushSize),
    `${where}: 기본 붓 크기가 목록에 없습니다.`);
  assert.ok(tools.zoom.min > 0 && tools.zoom.min < 1 && tools.zoom.max > 1,
    `${where}: 확대 범위가 올바르지 않습니다.`);
  assert.ok(tools.zoom.step > 0 && tools.zoom.step <= 0.5,
    `${where}: 확대 단계가 올바르지 않습니다.`);
  assert.ok(tools.lineLuminanceThreshold >= 0 && tools.lineLuminanceThreshold <= 255,
    `${where}: 선 휘도 기준이 0~255 밖입니다.`);

  // (4) 판정 가중치와 통과 기준
  const scoring = quest.scoring;
  assert.ok(scoring.passingScore > 0 && scoring.passingScore <= 100,
    `${where}: 통과선이 올바르지 않습니다.`);
  const total = Object.values(scoring.weights).reduce((sum, v) => sum + v, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `${where}: 가중치 합이 1이 아닙니다 (${total}).`);
  assert.ok(scoring.weights.color > 0 && scoring.weights.coverage > 0 &&
    scoring.weights.clip > 0, `${where}: 색·채색률·CLIP 가중치가 모두 필요합니다.`);
  const fallback = Object.values(scoring.fallbackWeights).reduce((sum, v) => sum + v, 0);
  assert.ok(Math.abs(fallback - 1) < 1e-9,
    `${where}: CLIP 미사용 가중치 합이 1이 아닙니다 (${fallback}).`);
  assert.equal(scoring.fallbackWeights.clip, undefined,
    `${where}: CLIP 미사용 가중치에 clip 이 남아 있습니다.`);
  // CLIP 은 보조 신호다. 색이 가장 무겁고, CLIP 만으로 통과할 수 없어야 한다.
  assert.ok(scoring.weights.color > 0.5, `${where}: 색 유사도가 주 신호여야 합니다.`);
  assert.ok(scoring.weights.clip * 100 < scoring.passingScore,
    `${where}: CLIP 만으로 통과선을 넘을 수 있습니다.`);

  // (5) 성공 후 재생할 컷신 번들
  assert.ok(quest.completion.bundleId, `${where}: 완료 번들 ID 가 없습니다.`);
  assert.ok(quest.completion.sceneIds.length >= 1, `${where}: 완료 장면이 없습니다.`);

  // (6) 다음 퀘스트 해금 조건
  assert.equal(quest.unlocks.trigger, "completion-bundle",
    `${where}: 해금은 번들 종료로만 일어나야 합니다.`);
  assert.equal(quest.unlocks.bundleId, quest.completion.bundleId,
    `${where}: 해금 번들이 완료 번들과 다릅니다.`);
  assert.ok(Array.isArray(quest.unlocks.questIds), `${where}: 해금 목록이 없습니다.`);
}

// ── 3. 데이터가 한 곳에만 있는가 ────────────────────────────────────
// 등록부는 세 정본을 join 할 뿐, 같은 사실을 다시 적지 않는다.
for (const quest of registry.list()) {
  const contract = contracts.get(quest.id);
  const node = QuestGraph.get(quest.id);
  const bundle = bundles.forQuest(quest.id);

  assert.equal(quest.images.target, contract.targetSource);
  assert.equal(quest.notes, contract.witnessNotes, "증언 메모는 계약을 그대로 참조해야 합니다.");
  assert.equal(quest.palette, contract.palette, "팔레트는 계약을 그대로 참조해야 합니다.");
  assert.equal(quest.layer, node.layer);
  assert.equal(quest.route, node.route);
  assert.equal(quest.parents, node.parents);
  assert.equal(quest.completion.sceneIds, bundle.sceneIds,
    "장면 목록은 번들을 그대로 참조해야 합니다.");
  assert.equal(quest.unlocks.questIds, bundle.unlocks,
    "해금 목록은 번들을 그대로 참조해야 합니다.");
}

// ── 4. 공통 계약과 퀘스트별 override ────────────────────────────────
// 도구·채점은 기본 계약 하나에서 나온다. 14곳에 복사돼 있으면 안 된다.
assert.deepEqual(
  contracts.toolsFor("Q5B_SIREN"),
  contracts.DEFAULT_TOOLS,
  "override 가 없는 퀘스트는 공통 도구 계약을 그대로 써야 합니다.",
);
assert.equal(
  contracts.scoringFor("Q5B_SIREN").passingScore,
  contracts.DEFAULT_SCORING.passingScore,
  "override 가 없는 퀘스트는 공통 통과선을 그대로 써야 합니다.",
);
// 통과선을 계약 한 곳에서 바꾸면 전 퀘스트에 반영돼야 한다(7.4).
const distinctPassing = new Set(registry.list().map((quest) => quest.scoring.passingScore));
assert.equal(distinctPassing.size, 1, "지금은 전 퀘스트 통과선이 같아야 합니다.");
assert.equal(distinctPassing.has(60), true, "최초 통과선은 60 입니다.");

// ── 5. 본선 도달성 ──────────────────────────────────────────────────
// 등록부의 해금 조건만 따라가도 14개 전부에 도달해야 한다.
const opened = new Set(bundles.opening().unlocks);
let grew = true;
while (grew) {
  grew = false;
  for (const quest of registry.list()) {
    if (!opened.has(quest.id)) continue;
    for (const next of quest.unlocks.questIds) {
      if (!opened.has(next)) { opened.add(next); grew = true; }
    }
  }
}
for (const quest of registry.list()) {
  assert.ok(opened.has(quest.id), `${quest.id} 에 해금만으로 도달할 수 없습니다.`);
}

console.log(`Quest registry tests passed (${registry.list().length} quests).`);
