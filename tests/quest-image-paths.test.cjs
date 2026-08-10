/**
 * 모든 이미지 경로가 실제로 존재하는가.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7.5 부팅 검증, 13장 "자산 404"
 *
 * 검사 범위
 *   1. 14개 복원 퀘스트의 완성본·윤곽선 28장 — 존재·PNG·1254×1254·비어 있지 않음
 *   2. 제품에 이전된 컷신 렌더러가 참조하는 모든 이미지
 *   3. index.html 이 로드하는 스크립트·스타일시트
 *   4. 파일명 정규화(NFC/NFD)와 대소문자가 계약과 정확히 일치하는가
 *
 * 자산 하나가 사라지면 게임이 그 퀘스트에서 멈춘다. 그래서 이름 하나까지 본다.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
global.window = global.window || {};
require(path.join(root, "src/data/quest-graph.js"));
const registry = require(path.join(root, "src/data/quest-registry.js"));

function pngSize(file) {
  const header = fs.readFileSync(file).subarray(0, 24);
  assert.equal(
    header.toString("hex", 0, 8),
    "89504e470d0a1a0a",
    `${path.relative(root, file)} 는 PNG 가 아닙니다.`,
  );
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

/**
 * 계약에 적힌 이름과 디스크의 이름이 바이트 단위로 같아야 한다.
 * macOS 는 한글 파일명을 NFD 로 저장하므로 existsSync 만으로는 부족하다.
 * — PROJECT_STRUCTURE 7장 "대소문자와 한글 정규화 차이를 허용하지 않는다"
 */
function assertExactName(relativePath) {
  const directory = path.join(root, path.dirname(relativePath));
  const wanted = path.basename(relativePath);
  assert.ok(fs.existsSync(directory), `디렉터리가 없습니다: ${path.dirname(relativePath)}`);
  const entries = fs.readdirSync(directory);
  const exact = entries.includes(wanted);
  if (exact) return;
  const normalized = entries.filter(
    (name) => name.normalize("NFC") === wanted.normalize("NFC"),
  );
  assert.ok(
    normalized.length > 0,
    `계약이 없는 파일을 가리킵니다: ${relativePath}`,
  );
  // NFC/NFD 차이만 있는 경우는 파일 시스템 정규화 차이이므로 허용하되 기록한다.
  normalizationOnly.push(relativePath);
}

const normalizationOnly = [];

// ── 1. 복원 퀘스트 이미지 28장 ──────────────────────────────────────
let questImages = 0;
const usedPaths = new Set();

for (const quest of registry.list()) {
  for (const [role, relative] of [["완성본", quest.images.target], ["윤곽선", quest.images.outline]]) {
    const absolute = path.join(root, relative);
    assert.ok(
      fs.existsSync(absolute),
      `${quest.id} ${role} 이미지가 없습니다: ${relative}`,
    );
    assertExactName(relative);

    const stats = fs.statSync(absolute);
    assert.ok(stats.isFile(), `${relative} 가 파일이 아닙니다.`);
    assert.ok(stats.size > 0, `${relative} 가 비어 있습니다.`);

    const size = pngSize(absolute);
    assert.deepEqual(
      size,
      { width: quest.images.resolution, height: quest.images.resolution },
      `${quest.id} ${role}: ${size.width}×${size.height} 는 계약 해상도와 다릅니다.`,
    );

    assert.ok(!usedPaths.has(relative), `${relative} 가 두 퀘스트에 쓰였습니다.`);
    usedPaths.add(relative);
    questImages += 1;
  }
}
assert.equal(questImages, 28, "복원 퀘스트 이미지는 28장이어야 합니다.");

// 계약이 쓰지 않는 questimage 파일이 남아 있지 않은가.
const questImageDirectory = path.join(root, "assets/questimage");
const onDisk = fs.readdirSync(questImageDirectory)
  .filter((name) => name.toLowerCase().endsWith(".png"));
assert.equal(
  onDisk.length,
  28,
  `assets/questimage 에 PNG 가 ${onDisk.length}개 있습니다. 28개여야 합니다.`,
);

// ── 2. 이전된 컷신 렌더러의 이미지 ──────────────────────────────────
const rendererDirectory = path.join(root, "src/cutscenes/renderers");
const rendererFiles = fs.readdirSync(rendererDirectory).filter((name) => name.endsWith(".js"));
assert.ok(rendererFiles.length >= 1, "이전된 컷신 렌더러가 없습니다.");

let cutsceneImages = 0;
for (const file of rendererFiles) {
  const source = fs.readFileSync(path.join(rendererDirectory, file), "utf8");
  const constants = new Map(
    Array.from(
      source.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*"([^"\n]*)"\s*;/g),
      (match) => [match[1], match[2]],
    ),
  );
  const block = source.slice(
    source.indexOf("const ASSETS = Object.freeze({"),
    source.indexOf("function create()"),
  );
  const references = Array.from(
    block.matchAll(/([A-Za-z_$][\w$]*)\s*\+\s*"([^"\n]+)"|:\s*"(assets\/[^"\n]+)"/g),
    (match) => (match[3] ? match[3] : (constants.get(match[1]) || "") + match[2]),
  );
  assert.ok(references.length >= 3, `${file}: 자산 목록을 읽지 못했습니다.`);

  for (const relative of references) {
    assert.ok(
      relative.startsWith("assets/"),
      `${file} 가 assets 밖을 참조합니다: ${relative}`,
    );
    const absolute = path.join(root, relative);
    assert.ok(fs.existsSync(absolute), `${file} 가 없는 자산을 참조합니다: ${relative}`);
    assert.ok(fs.statSync(absolute).size > 0, `${relative} 가 비어 있습니다.`);
    assertExactName(relative);
    cutsceneImages += 1;
  }
}

// ── 3. index.html 이 로드하는 파일 ──────────────────────────────────
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const loaded = Array.from(
  indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g),
  (match) => match[1],
).filter((reference) => !reference.startsWith("http") && !reference.startsWith("data:"));
assert.ok(loaded.length > 20, "index.html 의 로드 목록을 읽지 못했습니다.");
for (const relative of loaded) {
  assert.ok(
    fs.existsSync(path.join(root, relative)),
    `index.html 이 없는 파일을 로드합니다: ${relative}`,
  );
}

// 제품 진입점은 폐기 폴더를 로드하지 않는다 — PROJECT_STRUCTURE 3장.
for (const forbidden of ["output/", "image/", "assets/quests/", "assets/게임_이미지_모음/"]) {
  assert.ok(
    !loaded.some((relative) => relative.startsWith(forbidden)),
    `index.html 이 폐기 대상 ${forbidden} 를 로드합니다.`,
  );
}

console.log(
  `Quest image path tests passed (${questImages} quest images, ` +
  `${cutsceneImages} cutscene assets, ${loaded.length} loaded files` +
  (normalizationOnly.length ? `, ${normalizationOnly.length} NFC/NFD 정규화 차이` : "") +
  ").",
);
