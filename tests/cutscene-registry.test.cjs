/**
 * 컷신 레지스트리 계약 — GAME_INTEGRATION_PLAN 단계 3.
 *
 * 제품으로 이전한 beat 데이터가 승인본과 어긋나지 않는지 고정한다.
 * 아직 이전하지 않은 묶음은 여기서 실패하지 않는다(단계 6에서 하나씩 늘린다).
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const bundles = require(path.join(root, "src/data/completion-bundles.js"));

// ── 이전이 끝난 묶음 ────────────────────────────────────────────────
const MIGRATED = [
  {
    bundleId: "B_AFTER_Q0",
    module: "src/cutscenes/data/beats-l0-l1.js",
    renderer: "src/cutscenes/renderers/l0-l1.js",
    rendererId: "l0-l1",
    // 승인된 검토본(커밋 7ecd508)의 beat 수. 대사를 늘이거나 줄이면 실패한다.
    beatCounts: { C1A_RETURNED_HEIR: 12, C1B_TWELVE_YEARS_UNDER: 10 },
  },
  {
    bundleId: "B_AFTER_Q1A",
    module: "src/cutscenes/data/beats-l1-l2.js",
    renderer: "src/cutscenes/renderers/l1-l2.js",
    rendererId: "l1-l2",
    beatCounts: { C2C_RAIN_BEHIND_THE_DOOR: 11, C2A_HOLTS_MEMORY: 14 },
    // 같은 데이터 모듈이 두 번들의 장면을 함께 담는다.
    sharedModuleSceneIds: ["C2B_MIST_IS_MISSING"],
  },
  {
    bundleId: "B_AFTER_Q1B",
    module: "src/cutscenes/data/beats-l1-l2.js",
    renderer: "src/cutscenes/renderers/l1-l2.js",
    rendererId: "l1-l2",
    beatCounts: { C2B_MIST_IS_MISSING: 11 },
    sharedModuleSceneIds: ["C2C_RAIN_BEHIND_THE_DOOR", "C2A_HOLTS_MEMORY"],
  },
  {
    bundleId: "B_AFTER_Q2A",
    module: "src/cutscenes/data/beats-l2-l3.js",
    renderer: "src/cutscenes/renderers/l2-l3.js",
    rendererId: "l2-l3",
    beatCounts: { C3A_CARVERS_CREST: 17, C3B_FRESH_ANCHOR: 5 },
    sharedModuleSceneIds: ["C3C_FOLLOW_THE_FLYER", "C2C_OPEN_DOOR_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q2B",
    module: "src/cutscenes/data/beats-l2-l3.js",
    renderer: "src/cutscenes/renderers/l2-l3.js",
    rendererId: "l2-l3",
    beatCounts: { C3C_FOLLOW_THE_FLYER: 7 },
    sharedModuleSceneIds: ["C3A_CARVERS_CREST", "C3B_FRESH_ANCHOR", "C2C_OPEN_DOOR_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q2C",
    module: "src/cutscenes/data/beats-l2-l3.js",
    renderer: "src/cutscenes/renderers/l2-l3.js",
    rendererId: "l2-l3",
    // 조건부 4개를 포함한 수. Q2A 통과 여부에 따라 실제 재생은 8개다.
    beatCounts: { C2C_OPEN_DOOR_CLOSING: 10 },
    sharedModuleSceneIds: ["C3A_CARVERS_CREST", "C3B_FRESH_ANCHOR", "C3C_FOLLOW_THE_FLYER"],
  },
  {
    bundleId: "B_AFTER_Q3A",
    module: "src/cutscenes/data/beats-l3-l4.js",
    renderer: "src/cutscenes/renderers/l3-l4.js",
    rendererId: "l3-l4",
    beatCounts: { C4A_LEDGER_TRAIL: 8, C4C_SQUARE_CHALLENGE: 7 },
    sharedModuleSceneIds: ["C3B_TOO_NEW_CLOSING", "C4B_CAT_FOUND_PAPERS"],
  },
  {
    bundleId: "B_AFTER_Q3B",
    module: "src/cutscenes/data/beats-l3-l4.js",
    renderer: "src/cutscenes/renderers/l3-l4.js",
    rendererId: "l3-l4",
    beatCounts: { C3B_TOO_NEW_CLOSING: 7 },
    sharedModuleSceneIds: ["C4A_LEDGER_TRAIL", "C4C_SQUARE_CHALLENGE", "C4B_CAT_FOUND_PAPERS"],
  },
  {
    bundleId: "B_AFTER_Q3C",
    module: "src/cutscenes/data/beats-l3-l4.js",
    renderer: "src/cutscenes/renderers/l3-l4.js",
    rendererId: "l3-l4",
    beatCounts: { C4B_CAT_FOUND_PAPERS: 8 },
    sharedModuleSceneIds: ["C4A_LEDGER_TRAIL", "C4C_SQUARE_CHALLENGE", "C3B_TOO_NEW_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q4A",
    module: "src/cutscenes/data/beats-l4-l5.js",
    renderer: "src/cutscenes/renderers/l4-l5.js",
    rendererId: "l4-l5",
    beatCounts: { C5A_CARRIAGE_WITNESS: 20 },
    sharedModuleSceneIds: ["C5B_SIREN_WITNESS", "C4C_PAINTER_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q4B",
    module: "src/cutscenes/data/beats-l4-l5.js",
    renderer: "src/cutscenes/renderers/l4-l5.js",
    rendererId: "l4-l5",
    beatCounts: { C5B_SIREN_WITNESS: 19 },
    sharedModuleSceneIds: ["C5A_CARRIAGE_WITNESS", "C4C_PAINTER_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q4C",
    module: "src/cutscenes/data/beats-l4-l5.js",
    renderer: "src/cutscenes/renderers/l4-l5.js",
    rendererId: "l4-l5",
    beatCounts: { C4C_PAINTER_CLOSING: 7 },
    sharedModuleSceneIds: ["C5A_CARRIAGE_WITNESS", "C5B_SIREN_WITNESS"],
  },
  {
    bundleId: "B_AFTER_Q5A",
    module: "src/cutscenes/data/beats-l5-l6.js",
    renderer: "src/cutscenes/renderers/l5-l6.js",
    rendererId: "l5-l6",
    beatCounts: { C6_EVIDENCE_WALL: 12 },
    sharedModuleSceneIds: ["C5B_THAT_NIGHT_CLOSING"],
  },
  {
    bundleId: "B_AFTER_Q6",
    module: "src/cutscenes/data/beats-l6-ending.js",
    renderer: "src/cutscenes/renderers/l6-ending.js",
    rendererId: "l6-ending",
    // 조건부 11개를 포함한 수. 본선만 밟으면 실제 재생은 25개다.
    beatCounts: { CE_ENDING: 36 },
  },
  {
    bundleId: "B_AFTER_Q5B",
    module: "src/cutscenes/data/beats-l5-l6.js",
    renderer: "src/cutscenes/renderers/l5-l6.js",
    rendererId: "l5-l6",
    beatCounts: { C5B_THAT_NIGHT_CLOSING: 9 },
    sharedModuleSceneIds: ["C6_EVIDENCE_WALL"],
  },
];

// view 이름은 묶음마다 다르고, 렌더러는 처리하지 못한 이름을 기본 연출로 흘려보낸다.
// 그래서 "렌더러 소스에 그 문자열이 있는가"로는 오타를 가릴 수 없다 — 오히려 정상적인
// 기본 연출까지 실패로 만든다. 여기서는 형태만 보고, 실제 시각 회귀는 dev 검토 페이지가 잡는다.
const VIEW_NAME = /^[a-z][A-Za-z0-9]*$/;

for (const entry of MIGRATED) {
  const bundle = bundles.get(entry.bundleId);
  assert.ok(bundle, `${entry.bundleId}: 번들이 없습니다.`);

  const scenes = require(path.join(root, entry.module));
  const expected = bundle.sceneIds.concat(entry.sharedModuleSceneIds || []).sort();
  assert.deepEqual(
    Object.keys(scenes).sort(),
    expected,
    `${entry.bundleId}: 데이터 모듈의 장면 집합이 번들과 다릅니다.`,
  );

  for (const sceneId of bundle.sceneIds) {
    const scene = scenes[sceneId];
    assert.equal(scene.id, sceneId, `${sceneId}: 장면 ID 가 키와 다릅니다.`);
    assert.equal(
      scene.renderer,
      entry.rendererId,
      `${sceneId}: 렌더러 ID 가 ${entry.rendererId} 이어야 합니다.`,
    );
    assert.equal(
      scene.beats.length,
      entry.beatCounts[sceneId],
      `${sceneId}: beat 수가 승인본과 다릅니다.`,
    );

    scene.beats.forEach((beat, index) => {
      const where = `${sceneId}#${index}`;
      assert.ok(typeof beat.speaker === "string" && beat.speaker, `${where}: 화자 누락`);
      assert.ok(typeof beat.text === "string" && beat.text, `${where}: 대사 누락`);
      assert.ok(beat.duration > 0, `${where}: duration 이 양수가 아닙니다.`);
      assert.match(beat.view, VIEW_NAME, `${where}: view 이름 형식이 올바르지 않습니다.`);
      assert.ok(
        (beat.textDelay || 0) < beat.duration,
        `${where}: textDelay 가 beat 길이보다 깁니다.`,
      );
      assert.ok(
        (beat.visualLock || 0) <= beat.duration,
        `${where}: visualLock 이 beat 길이보다 깁니다.`,
      );
    });
  }

  // 렌더러가 참조하는 자산이 실제로 존재해야 한다.
  const rendererSource = fs.readFileSync(path.join(root, entry.renderer), "utf8");
  const constants = new Map(
    Array.from(
      rendererSource.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*"([^"\n]*)"\s*;/g),
      (match) => [match[1], match[2]],
    ),
  );
  const assetBlock = rendererSource.slice(
    rendererSource.indexOf("const ASSETS = Object.freeze({"),
    rendererSource.indexOf("function create()"),
  );
  const references = Array.from(
    assetBlock.matchAll(/([A-Za-z_$][\w$]*)\s*\+\s*"([^"\n]+)"|:\s*"((?:assets)\/[^"\n]+)"/g),
    (match) => (match[3] ? match[3] : (constants.get(match[1]) || "") + match[2]),
  );
  assert.ok(references.length >= 5, `${entry.renderer}: 자산 목록을 읽지 못했습니다.`);
  for (const reference of references) {
    assert.ok(
      fs.existsSync(path.join(root, reference)),
      `${entry.renderer} 가 없는 자산을 참조합니다: ${reference}`,
    );
  }
}

// ── 검토 페이지가 제품 모듈을 호출하는지 ────────────────────────────
const reviewPage = fs.readFileSync(
  path.join(root, "dev/cutscenes/cutscene-review-l0-l1.html"),
  "utf8",
);
for (const layer of ["l1-l2", "l2-l3", "l3-l4", "l4-l5", "l5-l6", "l6-ending"]) {
  const page = fs.readFileSync(
    path.join(root, `dev/cutscenes/cutscene-review-${layer}.html`),
    "utf8",
  );
  assert.ok(
    page.includes(`src/cutscenes/data/beats-${layer}.js`),
    `${layer} 검토 페이지가 제품 데이터 모듈을 로드하지 않습니다.`,
  );
}
for (const required of [
  "src/cutscenes/cutscene-player.js",
  "src/cutscenes/renderers/l0-l1.js",
  "src/cutscenes/data/beats-l0-l1.js",
]) {
  assert.ok(
    reviewPage.includes(required),
    `검토 페이지가 제품 모듈 ${required} 를 로드하지 않습니다.`,
  );
}

for (const name of [
  "cutscene-review-l0-l1", "cutscene-review-l1-l2", "cutscene-review-l2-l3",
  "cutscene-review-l3-l4", "cutscene-review-l4-l5", "cutscene-review-l5-l6",
  "cutscene-review-l6-ending",
]) {
  const reviewScript = fs.readFileSync(
    path.join(root, `dev/cutscenes/${name}.js`),
    "utf8",
  );
  assert.ok(
    !reviewScript.includes("const SCENES ="),
    `${name}.js 에 장면 데이터 사본이 남아 있습니다. 정본은 src/cutscenes/data 입니다.`,
  );
}

console.log(`Cutscene registry tests passed (${MIGRATED.length} migrated bundles).`);
