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
];

// 묶음마다 시점 이름이 다르다. renderer 가 아는 값만 쓰면 된다.
const VIEWS = {
  "l0-l1": new Set(["third", "poster", "newspaper", "portrait", "wall"]),
  "l1-l2": new Set([
    "parlorPortrait", "parlorEleanor", "parlorBeth", "parlorBethEnter", "firstEleanor",
    "hallDoor", "hallEleanor", "hallBeth", "hallWorld", "wetWall",
    "schoolArrival", "schoolHolt", "schoolWide", "memoryJaw", "memoryBrow",
    "ferryWall", "tavernCora", "firstCora", "tavernWide", "catMemory",
  ]),
};

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
      assert.ok(
        VIEWS[entry.rendererId].has(beat.view),
        `${where}: 알 수 없는 view ${beat.view}`,
      );
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
const reviewPageL1L2 = fs.readFileSync(
  path.join(root, "dev/cutscenes/cutscene-review-l1-l2.html"),
  "utf8",
);
assert.ok(
  reviewPageL1L2.includes("src/cutscenes/data/beats-l1-l2.js"),
  "L1→L2 검토 페이지가 제품 데이터 모듈을 로드하지 않습니다.",
);
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

for (const name of ["cutscene-review-l0-l1", "cutscene-review-l1-l2"]) {
  const reviewScript = fs.readFileSync(
    path.join(root, `dev/cutscenes/${name}.js`),
    "utf8",
  );
  assert.ok(
    !reviewScript.includes("const SCENES ="),
    `${name}.js 에 장면 데이터 사본이 남아 있습니다. 정본은 src/cutscenes/data 입니다.`,
  );
}

console.log(`Cutscene registry tests passed (${MIGRATED.length} migrated bundle).`);
