/**
 * 런타임 자산 경로 검사 — GAME_INTEGRATION_PLAN 단계 1.
 *
 *   1. src/ 의 제품 코드가 문자열로 참조하는 assets/·fonts/ 경로가 실제로 존재한다.
 *   2. 제품 코드는 폐기 폴더(output/, image/, video/, assets/quests/,
 *      assets/게임_이미지_모음/)를 참조하지 않는다. — PROJECT_STRUCTURE 3장
 *   3. 복원 노드 14개가 questimage 계약·완료 번들과 ID 단위로 맞물린다.
 *      — GAME_INTEGRATION_PLAN 7.5 부팅 검증
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function walkJs(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkJs(target);
    return entry.isFile() && entry.name.endsWith(".js") ? [target] : [];
  });
}

// ── 1·2. 제품 코드의 자산 경로 ──────────────────────────────────────
const FORBIDDEN = [
  "output/",
  "image/",
  "video/",
  "assets/quests/",
  "assets/게임_이미지_모음/",
];

// 폐기 승인 대기 중인 구 월드·대화 코드는 index.html 이 로드하지 않는다.
// LEGACY_DELETION_MANIFEST 2.3 이 삭제 대상으로 확정할 때까지 검사에서 제외한다.
const LEGACY_UNLOADED = new Set([
  "src/artwork.js", "src/dialogue.js", "src/ending.js", "src/feedback.js",
  "src/game.js", "src/restoration.js", "src/state.js", "src/ui.js",
  "src/data/dialogue-prologue.js", "src/data/dialogue-act1.js",
  "src/data/dialogue-act2.js", "src/data/dialogue-act3.js",
  "src/data/dialogue-cat.js", "src/data/dialogue-finale.js",
  "src/data/quest-cat.js", "src/data/quest-dock.js",
  "src/data/quest-portrait.js", "src/data/quest-seal.js",
]);

const productFiles = walkJs(path.join(root, "src"))
  .filter((file) => !LEGACY_UNLOADED.has(path.relative(root, file)));

/**
 * 자산 경로는 각 기능의 ASSET_ROOT 한 곳에서만 이어 붙인다(PROJECT_STRUCTURE 7장).
 * 그래서 `${ROOT}/…` 형태의 템플릿 문자열은 같은 파일의 문자열 상수를 넣어 펼친다.
 */
function expandRootConstants(source) {
  const constants = new Map(
    Array.from(
      source.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*["']([^"'\n]*)["']\s*;/g),
      (match) => [match[1], match[2]],
    ),
  );
  return source.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (whole, name) =>
    constants.has(name) ? constants.get(name) : whole,
  );
}

let checkedPaths = 0;
for (const file of productFiles) {
  const relative = path.relative(root, file);
  const source = expandRootConstants(fs.readFileSync(file, "utf8"));

  // 자산처럼 보이는 문자열만 본다. "video/webm;codecs=vp9" 같은 MIME 타입은
  // 경로가 아니므로 확장자 또는 디렉터리 종결로 걸러 낸다.
  const assetLike = Array.from(
    source.matchAll(
      /["'`](\.?\/?[\w가-힣][\w가-힣./-]*(?:\/|\.(?:png|jpe?g|webp|gif|svg|ttf|otf|woff2?|json|mp3|ogg|wav)))["'`]/g,
    ),
    (match) => match[1].replace(/^\.\//, ""),
  );

  for (const forbidden of FORBIDDEN) {
    const offender = assetLike.find((reference) => reference.startsWith(forbidden));
    assert.ok(
      !offender,
      `${relative} 가 폐기 대상 경로를 참조합니다: ${offender}`,
    );
  }

  const references = assetLike.filter(
    (reference) => reference.startsWith("assets/") || reference.startsWith("fonts/"),
  );
  for (const reference of references) {
    // 접두사만 담은 상수(ASSET_ROOT)는 디렉터리로 존재하면 된다.
    const resolved = path.join(root, reference);
    assert.ok(
      fs.existsSync(resolved),
      `${relative} 가 없는 자산을 참조합니다: ${reference}`,
    );
    checkedPaths += 1;
  }
}

// ── 3. 복원 노드 ↔ 계약 ↔ 번들 ─────────────────────────────────────
global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const questImages = require(path.join(root, "src/data/questimage-quests.js"));
const bundles = require(path.join(root, "src/data/completion-bundles.js"));
const { QuestGraph } = global.window;

const restorationNodes = QuestGraph.NODES.filter((node) => node.kind === "restoration");
assert.equal(restorationNodes.length, 14, "복원 노드는 14개여야 합니다.");

const contractIds = new Set(questImages.list().map((quest) => quest.id));
const graphIds = new Set(restorationNodes.map((node) => node.id));
assert.deepEqual(
  Array.from(contractIds).sort(),
  Array.from(graphIds).sort(),
  "questimage 계약 ID 집합과 그래프의 복원 노드 ID 집합이 다릅니다.",
);

for (const node of restorationNodes) {
  const contract = questImages.get(node.id);
  assert.ok(contract, `${node.id}: questimage 계약이 없습니다.`);
  assert.equal(contract.resolution, 1254, `${node.id}: 원본 해상도가 1254 가 아닙니다.`);
  assert.ok(bundles.forQuest(node.id), `${node.id}: 완료 번들이 없습니다.`);

  if (contract.scoring) {
    const weights = contract.scoring.weights;
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    assert.ok(
      Math.abs(total - 1) < 1e-9,
      `${node.id}: 점수 가중치 합이 1 이 아닙니다 (${total}).`,
    );
    const fallbackTotal = Object.values(contract.scoring.fallbackWeights)
      .reduce((sum, value) => sum + value, 0);
    assert.ok(
      Math.abs(fallbackTotal - 1) < 1e-9,
      `${node.id}: CLIP 미사용 가중치 합이 1 이 아닙니다 (${fallbackTotal}).`,
    );
  }
}

// Q6 는 복원 퀘스트가 아니다. 계약이 있으면 안 된다. — GAME_INTEGRATION_PLAN 9장
assert.equal(
  questImages.get("Q6_FINALE"),
  null,
  "Q6_FINALE 는 복원 퀘스트가 아니므로 questimage 계약을 가지면 안 됩니다.",
);

console.log(
  `Runtime asset path tests passed (${checkedPaths} asset references, ` +
  `${restorationNodes.length} restoration nodes).`,
);
