/**
 * 완료 컷신 번들 계약 교차 검증 — GAME_INTEGRATION_PLAN 단계 1.
 *
 * 검사 대상
 *   1. 15개 그래프 노드 전부에 bundle 이 있다.
 *   2. bundle.unlocks 와 QuestGraph.UNLOCKS(legacy alias)가 정확히 일치한다.
 *   3. 모든 scene ID 가 실제 제작본(dev/cutscenes)에 존재한다.
 *   4. scene ID 는 번들 사이에서 중복되지 않는다.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const { QuestGraph } = global.window;

// ── 1. 노드 ↔ 번들 ──────────────────────────────────────────────────
const completion = bundles.completionBundles();
assert.equal(completion.length, 15, "완료 번들은 노드 수와 같은 15개여야 합니다.");

for (const node of QuestGraph.NODES) {
  const bundle = bundles.forQuest(node.id);
  assert.ok(bundle, `${node.id}: 완료 번들이 없습니다.`);
  assert.equal(
    node.completionBundleId,
    bundle.id,
    `${node.id}: 그래프의 completionBundleId 가 번들 ID 와 다릅니다.`,
  );
  assert.equal(
    bundle.legacyCutsceneId,
    node.cutscene,
    `${bundle.id}: legacy alias 가 그래프의 cutscene 과 다릅니다.`,
  );
  assert.ok(bundle.sceneIds.length >= 1, `${bundle.id}: 장면이 비었습니다.`);
  assert.equal(bundle.replayable, true, `${bundle.id}: 다시 보기가 가능해야 합니다.`);
}

// ── 2. 해금 표 일치 ─────────────────────────────────────────────────
for (const bundle of completion) {
  const declared = QuestGraph.UNLOCKS[bundle.legacyCutsceneId] || [];
  assert.deepEqual(
    bundle.unlocks.slice().sort(),
    declared.slice().sort(),
    `${bundle.id}: unlocks 가 QuestGraph.UNLOCKS 와 다릅니다.`,
  );
  for (const questId of bundle.unlocks) {
    assert.ok(QuestGraph.get(questId), `${bundle.id}: 없는 노드 ${questId} 를 엽니다.`);
  }
}

const opening = bundles.opening();
assert.deepEqual(
  opening.unlocks.slice().sort(),
  QuestGraph.UNLOCKS[QuestGraph.GATE_CUTSCENE].slice().sort(),
  "오프닝 번들이 여는 노드가 GATE_CUTSCENE 과 다릅니다.",
);
assert.deepEqual(
  opening.sceneIds.slice(),
  QuestGraph.OPENING.slice(),
  "오프닝 번들의 장면 순서가 QuestGraph.OPENING 과 다릅니다.",
);

// ── 3. 장면 ID 유일성과 제작본 존재 ─────────────────────────────────
const seen = new Set();
for (const bundle of bundles.list()) {
  for (const sceneId of bundle.sceneIds) {
    assert.ok(!seen.has(sceneId), `장면 ${sceneId} 가 두 번들에 중복돼 있습니다.`);
    seen.add(sceneId);
    assert.equal(
      bundles.forScene(sceneId).id,
      bundle.id,
      `forScene(${sceneId}) 역색인이 어긋났습니다.`,
    );
  }
}

// 오프닝 두 장면은 src/cutscene-c0-*.js 가, 나머지는 회수한 검토본이 원본이다.
const producedSources = fs
  .readdirSync(path.join(root, "dev/cutscenes"))
  .filter((name) => name.endsWith(".js"))
  .map((name) => fs.readFileSync(path.join(root, "dev/cutscenes", name), "utf8"))
  .join("\n");

for (const bundle of completion) {
  for (const sceneId of bundle.sceneIds) {
    assert.ok(
      producedSources.includes(`id: "${sceneId}"`),
      `${bundle.id}: 장면 ${sceneId} 의 제작본이 dev/cutscenes 에 없습니다.`,
    );
  }
}

// ── 4. 본선 도달성 ──────────────────────────────────────────────────
// 오프닝 → Q0 → … → Q6 → 엔딩이 번들 해금만으로 이어져야 한다.
const opened = new Set(opening.unlocks);
let changed = true;
while (changed) {
  changed = false;
  for (const bundle of completion) {
    if (!opened.has(bundle.sourceQuestId)) continue;
    for (const questId of bundle.unlocks) {
      if (!opened.has(questId)) {
        opened.add(questId);
        changed = true;
      }
    }
  }
}
for (const node of QuestGraph.NODES) {
  assert.ok(opened.has(node.id), `${node.id} 에 번들 해금만으로 도달할 수 없습니다.`);
}

console.log(`Completion bundle tests passed (${bundles.list().length} bundles).`);
