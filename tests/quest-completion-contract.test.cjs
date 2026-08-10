/**
 * 각 퀘스트의 완료 번들과 컷신 ID 계약.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 4장 연결표, 7.5 부팅 검증
 *
 * 검사 범위
 *   1. 계획서 4장 연결표를 그대로 고정한다(퀘스트 → 번들 → 장면 순서 → 해금).
 *   2. 모든 장면 ID 가 제품 런타임(src/cutscenes/data)에 실재한다.
 *   3. 장면마다 렌더러가 등록돼 있고 그 렌더러 파일이 존재한다.
 *   4. 통과 → 번들 → 해금 사슬이 그래프와 어긋나지 않는다.
 *   5. 조건부 beat 는 실재하는 퀘스트 ID 만 참조한다.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const registry = require(path.join(root, "src/data/quest-registry.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const { QuestGraph } = global.window;

/**
 * GAME_INTEGRATION_PLAN 4장 연결표. 이 표를 바꾸려면 계획서를 먼저 고쳐야 한다.
 * [완료 퀘스트, bundle ID, 제작 scene 순서, 새로 여는 퀘스트]
 */
const PLAN_TABLE = [
  ["Q0_MONTAGE", "B_AFTER_Q0", ["C1A_RETURNED_HEIR", "C1B_TWELVE_YEARS_UNDER"], ["Q1A_IDEALIZED", "Q1B_TAVERN_WALL"]],
  ["Q1A_IDEALIZED", "B_AFTER_Q1A", ["C2C_RAIN_BEHIND_THE_DOOR", "C2A_HOLTS_MEMORY"], ["Q2C_CHILD_ROOM", "Q2A_TRUE_FACE"]],
  ["Q1B_TAVERN_WALL", "B_AFTER_Q1B", ["C2B_MIST_IS_MISSING"], ["Q2B_CAT"]],
  ["Q2A_TRUE_FACE", "B_AFTER_Q2A", ["C3A_CARVERS_CREST", "C3B_FRESH_ANCHOR"], ["Q3A_SEAL", "Q3B_TATTOO"]],
  ["Q2B_CAT", "B_AFTER_Q2B", ["C3C_FOLLOW_THE_FLYER"], ["Q3C_WAREHOUSE"]],
  ["Q2C_CHILD_ROOM", "B_AFTER_Q2C", ["C2C_OPEN_DOOR_CLOSING"], []],
  ["Q3A_SEAL", "B_AFTER_Q3A", ["C4A_LEDGER_TRAIL", "C4C_SQUARE_CHALLENGE"], ["Q4A_LEDGER", "Q4C_SQUARE_BET"]],
  ["Q3B_TATTOO", "B_AFTER_Q3B", ["C3B_TOO_NEW_CLOSING"], []],
  ["Q3C_WAREHOUSE", "B_AFTER_Q3C", ["C4B_CAT_FOUND_PAPERS"], ["Q4B_LOGBOOK"]],
  ["Q4A_LEDGER", "B_AFTER_Q4A", ["C5A_CARRIAGE_WITNESS"], ["Q5A_DOCK"]],
  ["Q4B_LOGBOOK", "B_AFTER_Q4B", ["C5B_SIREN_WITNESS"], ["Q5B_SIREN"]],
  ["Q4C_SQUARE_BET", "B_AFTER_Q4C", ["C4C_PAINTER_CLOSING"], []],
  ["Q5A_DOCK", "B_AFTER_Q5A", ["C6_EVIDENCE_WALL"], ["Q6_FINALE"]],
  ["Q5B_SIREN", "B_AFTER_Q5B", ["C5B_THAT_NIGHT_CLOSING"], []],
  ["Q6_FINALE", "B_AFTER_Q6", ["CE_ENDING"], []],
];

// ── 1. 계획서 연결표와 데이터가 같은가 ──────────────────────────────
assert.equal(
  bundles.completionBundles().length,
  PLAN_TABLE.length,
  "완료 번들 수가 계획서 연결표와 다릅니다.",
);

for (const [questId, bundleId, sceneIds, unlocks] of PLAN_TABLE) {
  const bundle = bundles.forQuest(questId);
  assert.ok(bundle, `${questId}: 완료 번들이 없습니다.`);
  assert.equal(bundle.id, bundleId, `${questId}: 번들 ID 가 계획서와 다릅니다.`);
  assert.deepEqual(bundle.sceneIds.slice(), sceneIds,
    `${bundleId}: 장면 순서가 계획서와 다릅니다.`);
  assert.deepEqual(bundle.unlocks.slice().sort(), unlocks.slice().sort(),
    `${bundleId}: 해금 대상이 계획서와 다릅니다.`);

  // 그래프의 legacy alias 와도 어긋나면 안 된다.
  const node = QuestGraph.get(questId);
  assert.equal(node.completionBundleId, bundleId,
    `${questId}: 그래프의 completionBundleId 가 다릅니다.`);
  assert.equal(bundle.legacyCutsceneId, node.cutscene,
    `${bundleId}: legacy alias 가 그래프와 다릅니다.`);
  assert.deepEqual(
    bundle.unlocks.slice().sort(),
    (QuestGraph.UNLOCKS[node.cutscene] || []).slice().sort(),
    `${bundleId}: 해금 대상이 QuestGraph.UNLOCKS 와 다릅니다.`,
  );
}

// 등록된 복원 퀘스트는 모두 연결표에 있다.
const planQuestIds = new Set(PLAN_TABLE.map(([questId]) => questId));
for (const quest of registry.list()) {
  assert.ok(planQuestIds.has(quest.id), `${quest.id} 가 계획서 연결표에 없습니다.`);
}

// ── 2. 장면 ID 가 제품 런타임에 실재하는가 ──────────────────────────
const dataDirectory = path.join(root, "src/cutscenes/data");
const sceneModules = fs.readdirSync(dataDirectory).filter((name) => name.endsWith(".js"));
const productScenes = new Map();
for (const file of sceneModules) {
  const scenes = require(path.join(dataDirectory, file));
  for (const [id, scene] of Object.entries(scenes)) {
    assert.ok(!productScenes.has(id), `장면 ${id} 가 두 모듈에 중복 정의돼 있습니다.`);
    productScenes.set(id, { scene, file });
  }
}

// 오프닝 두 장면은 구 모듈을 adapter 로 감싼다 — GAME_INTEGRATION_PLAN 5.3.
const LEGACY_SCENES = new Map([
  ["C0_INTRO", "src/cutscene-c0-intro.js"],
  ["C0B_THE_JOB", "src/cutscene-c0b.js"],
]);
for (const [sceneId, file] of LEGACY_SCENES) {
  assert.ok(fs.existsSync(path.join(root, file)), `${sceneId}: ${file} 이 없습니다.`);
}

const rendererDirectory = path.join(root, "src/cutscenes/renderers");
const availableRenderers = new Set(
  fs.readdirSync(rendererDirectory)
    .filter((name) => name.endsWith(".js"))
    .map((name) => name.replace(/\.js$/, "")),
);

// 모든 번들의 장면이 제품 런타임에 있어야 한다. 엔딩까지 포함한다.
const missing = [];
for (const bundle of bundles.list()) {
  for (const sceneId of bundle.sceneIds) {
    if (LEGACY_SCENES.has(sceneId)) continue;
    const entry = productScenes.get(sceneId);
    if (!entry) { missing.push(`${bundle.id} → ${sceneId}`); continue; }

    // ── 3. 렌더러 등록 ───────────────────────────────────────────
    assert.ok(entry.scene.renderer, `${sceneId}: renderer ID 가 없습니다.`);
    assert.ok(
      availableRenderers.has(entry.scene.renderer),
      `${sceneId}: 렌더러 ${entry.scene.renderer}.js 가 없습니다.`,
    );
    assert.ok(entry.scene.beats.length >= 1, `${sceneId}: beat 가 없습니다.`);
    assert.equal(entry.scene.id, sceneId, `${sceneId}: 장면 ID 가 키와 다릅니다.`);

    // ── 5. 조건부 beat 는 실재하는 퀘스트만 참조한다 ─────────────
    entry.scene.beats.forEach((beat, index) => {
      if (!beat.when) return;
      const referenced = [].concat(beat.when.cleared || [], beat.when.notCleared || []);
      assert.ok(referenced.length > 0, `${sceneId}#${index}: 빈 when 조건입니다.`);
      referenced.forEach((questId) => {
        assert.ok(
          QuestGraph.get(questId),
          `${sceneId}#${index}: 없는 퀘스트 ${questId} 를 조건으로 씁니다.`,
        );
      });
    });
  }
}
assert.deepEqual(
  missing,
  [],
  `제품 런타임에 없는 장면이 있습니다:\n  ${missing.join("\n  ")}`,
);

// ── Q6 와 엔딩 ─────────────────────────────────────────────────────
const finaleBundle = bundles.forQuest("Q6_FINALE");
assert.ok(finaleBundle, "Q6 완료 번들이 없습니다.");
assert.deepEqual(finaleBundle.sceneIds.slice(), ["CE_ENDING"]);
assert.ok(productScenes.has("CE_ENDING"), "CE_ENDING 이 제품 런타임에 없습니다.");

// Q6 는 복원 퀘스트가 아니다 — 계획서 9장.
assert.equal(QuestGraph.get("Q6_FINALE").kind, "finale");
assert.equal(registry.get("Q6_FINALE"), null, "Q6 는 복원 퀘스트로 등록되면 안 됩니다.");

// 후일담은 완료한 가지로만 갈린다 — 계획서 9.2, QuestGraph.EPILOGUE_CUTS.
const endingBeats = productScenes.get("CE_ENDING").scene.beats;
const epilogueQuestIds = new Set(
  endingBeats.filter((beat) => beat.when).map((beat) => beat.when.cleared[0]),
);
assert.deepEqual(
  Array.from(epilogueQuestIds).sort(),
  QuestGraph.EPILOGUE_CUTS.map((cut) => cut.requires).sort(),
  "엔딩 후일담 조건이 QuestGraph.EPILOGUE_CUTS 와 다릅니다.",
);
// 본선만 밟아도 엔딩은 끝까지 재생돼야 한다(가지는 엔딩 필수가 아니다).
const mainOnly = endingBeats.filter((beat) => !beat.when);
assert.ok(mainOnly.length >= 20, "본선만 밟았을 때 엔딩이 너무 짧습니다.");
assert.equal(
  mainOnly[mainOnly.length - 1].view,
  "title",
  "본선만 밟아도 엔딩의 마지막 컷까지 도달해야 합니다.",
);

// ── 4. 통과 → 번들 → 해금 사슬 ─────────────────────────────────────
for (const quest of registry.list()) {
  for (const childId of quest.unlocks.questIds) {
    const child = QuestGraph.get(childId);
    assert.ok(child, `${quest.id}: 없는 노드 ${childId} 를 엽니다.`);
    assert.ok(
      child.parents.includes(quest.id),
      `${quest.id}: ${childId} 의 부모가 아닌데 열고 있습니다.`,
    );
    assert.equal(
      child.layer,
      quest.layer + 1,
      `${quest.id}: ${childId} 의 레이어가 인접하지 않습니다.`,
    );
  }
  // 부모가 열어 주지 않는 노드는 없어야 한다.
  const node = QuestGraph.get(quest.id);
  if (node.parents.length) {
    const openers = node.parents.filter((parentId) => {
      const parentBundle = bundles.forQuest(parentId);
      return parentBundle && parentBundle.unlocks.includes(quest.id);
    });
    assert.ok(
      openers.length > 0,
      `${quest.id}: 어떤 부모 번들도 이 노드를 열지 않습니다.`,
    );
  }
}

// 장면 ID 는 번들 사이에서 유일하다.
const seenScenes = new Set();
for (const bundle of bundles.list()) {
  for (const sceneId of bundle.sceneIds) {
    assert.ok(!seenScenes.has(sceneId), `장면 ${sceneId} 가 두 번들에 들어 있습니다.`);
    seenScenes.add(sceneId);
  }
}

console.log(
  `Quest completion contract tests passed ` +
  `(${PLAN_TABLE.length} bundles, ${seenScenes.size} scenes, ` +
  `${productScenes.size} in product runtime).`,
);
