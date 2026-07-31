const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.join(__dirname, "..");
assert.equal(
  fs.existsSync(path.join(projectRoot, "README.md")),
  true,
  "README.md is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "dev-server.cjs"),
  ),
  true,
  "Local HTTP server is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "chapter-image-slicer.js"),
  ),
  true,
  "Chapter image slicer is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "difficulty-rules.js"),
  ),
  true,
  "Difficulty rules are required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "hint-manager.js"),
  ),
  true,
  "Hint manager is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "stage-progress-manager.js"),
  ),
  true,
  "Stage progress manager is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "assembly-manager.js"),
  ),
  true,
  "Assembly manager is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "deduction-manager.js"),
  ),
  true,
  "Deduction manager is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "scripts", "content-readiness.js"),
  ),
  true,
  "Content readiness audit is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "docs", "UI_SIMPLIFICATION_PLAN.md"),
  ),
  true,
  "UI simplification plan is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "docs", "DEVELOPMENT_BASELINE.md"),
  ),
  true,
  "Development baseline is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "docs", "ASSET_SOURCES.md"),
  ),
  true,
  "Asset provenance document is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "docs", "CONTENT_EXPANSION_GUIDE.md"),
  ),
  true,
  "Content expansion guide is required",
);
assert.equal(
  fs.existsSync(
    path.join(projectRoot, "docs", "FINAL_VALIDATION.md"),
  ),
  true,
  "Final validation report is required",
);
const html = fs.readFileSync(
  path.join(projectRoot, "index.html"),
  "utf8",
);
const stylesheet = fs.readFileSync(
  path.join(projectRoot, "styles", "game.css"),
  "utf8",
);
assert.match(stylesheet, /color-scheme:\s*light/);
assert.match(stylesheet, /@keyframes\s+screen-enter/);
assert.match(stylesheet, /@keyframes\s+content-enter/);
assert.match(stylesheet, /prefers-reduced-motion:\s*reduce/);
assert.match(stylesheet, /@media\s+\(max-width:\s*820px\)/);
assert.match(stylesheet, /@media\s+\(max-width:\s*420px\)/);
for (const themeToken of [
  "--font-rounded",
  "--cream",
  "--paper",
  "--ink",
  "--mint",
  "--yellow",
  "--coral",
]) {
  assert.match(stylesheet, new RegExp(themeToken));
}
const localReferences = Array.from(
  html.matchAll(/(?:src|href)="([^"]+)"/g),
  (match) => match[1],
).filter(
  (reference) =>
    !/^(?:https?:|data:|#)/.test(reference),
);

for (const reference of localReferences) {
  const relativePath = reference.replace(/^\.\//, "");
  assert.equal(
    fs.existsSync(path.join(projectRoot, relativePath)),
    true,
    `HTML reference is missing: ${reference}`,
  );
}

const ids = Array.from(
  html.matchAll(/\sid="([^"]+)"/g),
  (match) => match[1],
);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
assert.match(html, /id="caseOutcome"/);
assert.doesNotMatch(html, /PIXEL RECONSTRUCTION LAB/);
assert.match(
  html,
  /<header class="hero">[\s\S]*id="appStatus"[\s\S]*<\/header>/,
);
assert.doesNotMatch(html, /id="gridRule"/);
assert.doesNotMatch(html, /id="paletteRule"/);
assert.doesNotMatch(html, /id="hiddenRule"/);
assert.doesNotMatch(html, /EVIDENCE A-01/);
assert.doesNotMatch(html, /class="mask-legend"/);
assert.match(html, /id="previewWitnessList"/);
assert.match(html, /class="clue-link-help"/);
for (const toolId of [
  "brushToolButton",
  "fillToolButton",
  "zoomOutButton",
  "zoomInButton",
  "zoomValue",
]) {
  assert.match(html, new RegExp(`id="${toolId}"`));
}
for (const hudId of [
  "hudStage",
  "hudDifficulty",
  "hudPassingScore",
  "hudProgressBar",
]) {
  assert.match(html, new RegExp(`id="${hudId}"`));
}
for (const hintId of [
  "hintButton",
  "hintRemaining",
  "hintPanel",
  "hintTitle",
  "hintText",
]) {
  assert.match(html, new RegExp(`id="${hintId}"`));
}
for (const resultId of [
  "hintsUsedDetail",
  "hintPenaltyDetail",
  "nextStageButton",
  "stageStarsValue",
  "resultComparison",
  "originalResultFigure",
  "failureFeedback",
  "failureFeedbackList",
]) {
  assert.match(html, new RegExp(`id="${resultId}"`));
}
assert.match(html, /id="assemblyBoard"/);
assert.match(html, /id="assemblyProgress"/);
for (const deductionId of [
  "finalDeduction",
  "deductionQuestion",
  "deductionOptions",
  "submitDeductionButton",
  "deductionResult",
]) {
  assert.match(html, new RegExp(`id="${deductionId}"`));
}
assert.match(html, /id="stageSelection"/);
assert.match(html, /id="stageGrid"/);
assert.match(html, /id="startStageButton"/);
assert.match(html, /<details class="palette-section palette-details">/);
assert.match(
  html,
  /aria-labelledby="caseTitleDisplay"[\s\S]*id="caseTitleDisplay"/,
);
assert.doesNotMatch(html, /CASE FILE/);
assert.doesNotMatch(html, /복원 작업대 · 128 × 128 색칠/);
assert.doesNotMatch(html, />수정 도구</);
assert.match(
  html,
  /class="palette-control-row"[\s\S]*id="eraserButton"/,
);
assert.match(html, /<details class="score-details-disclosure">/);
assert.doesNotMatch(html, /id="scoreGuide"/);
assert.doesNotMatch(html, /id="scoreWeights"/);
assert.match(stylesheet, /\/\* Simplified visual language \*\//);
assert.match(
  stylesheet,
  /\.case-card-image::after,[\s\S]*content:\s*none/,
);
assert.match(stylesheet, /grid-template-columns:\s*repeat\(8,\s*40px\)/);
assert.match(stylesheet, /button:focus-visible/);
assert.match(stylesheet, /\.canvas-zoom-controls/);
assert.match(stylesheet, /\.paint-tool\.is-selected/);
assert.match(stylesheet, /\.game-hud/);
assert.match(stylesheet, /#hudProgressBar/);
assert.match(stylesheet, /\.hint-box/);
assert.match(stylesheet, /\.assembly-board/);
assert.match(stylesheet, /\.deduction-section/);
assert.match(stylesheet, /\.stage-stars-result/);
assert.match(stylesheet, /@media\s+\(pointer:\s*coarse\)/);
assert.match(
  html,
  /id="editorProgress" role="status" aria-live="polite"/,
);
assert.equal(
  Array.from(html.matchAll(/data-game-step="/g)).length,
  4,
);
assert.match(html, /data-game-step="cases" aria-current="step"/);
const uiRendererSource = fs.readFileSync(
  path.join(projectRoot, "scripts", "ui-renderer.js"),
  "utf8",
);
assert.match(uiRendererSource, /mission-card-meta/);
assert.match(uiRendererSource, /단서 \$\{caseDefinition\.witnesses\.length\}개/);
assert.match(uiRendererSource, /function renderChapterCards/);
assert.match(uiRendererSource, /function renderStageCards/);
assert.match(uiRendererSource, /function renderAssemblyBoard/);
assert.match(uiRendererSource, /function renderDeductionOptions/);
assert.match(uiRendererSource, /손상 구역 \$\{regionNumber\}/);

const appSource = fs.readFileSync(
  path.join(projectRoot, "scripts", "app.js"),
  "utf8",
);
assert.match(appSource, /maskStyle:\s*"irregular"/);
const maskGeneratorSource = fs.readFileSync(
  path.join(projectRoot, "scripts", "mask-generator.js"),
  "utf8",
);
assert.match(maskGeneratorSource, /createIrregularRegionTester/);
assert.match(maskGeneratorSource, /function upscaleMask/);
const pixelizerSource = fs.readFileSync(
  path.join(projectRoot, "scripts", "pixelizer.js"),
  "utf8",
);
assert.match(pixelizerSource, /function renderMaskLabels/);
assert.match(pixelizerSource, /MASK_LABEL_COLORS/);

const caseDataSource = fs.readFileSync(
  path.join(projectRoot, "scripts", "case-data.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(caseDataSource, sandbox);

for (const caseDefinition of sandbox.window.CaseData.cases) {
  const imagePath = path.join(
    projectRoot,
    caseDefinition.imageSrc.replace(/^\.\//, ""),
  );
  const image = fs.readFileSync(imagePath);
  assert.equal(
    image.subarray(1, 4).toString("ascii"),
    "PNG",
    `${caseDefinition.id}: case image must be PNG`,
  );
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  assert.equal(width, height);
  assert.ok(width >= 256);
}

for (const chapter of sandbox.window.CaseData.chapters) {
  const masterImagePath = path.join(
    projectRoot,
    chapter.masterImageSrc.replace(/^\.\//, ""),
  );
  assert.equal(
    fs.existsSync(masterImagePath),
    true,
    `Chapter master image is missing: ${chapter.masterImageSrc}`,
  );
  assert.equal(chapter.layout.columns, 2);
  assert.equal(chapter.layout.rows, 2);
  assert.ok(chapter.stages.length >= 1);
  assert.ok(chapter.stages.length <= 4);
  const masterImage = fs.readFileSync(masterImagePath);
  const masterWidth = masterImage.readUInt32BE(16);
  const masterHeight = masterImage.readUInt32BE(20);
  assert.equal(masterWidth, masterHeight);
  assert.equal(masterWidth % chapter.layout.columns, 0);
  assert.equal(masterHeight % chapter.layout.rows, 0);
  if (chapter.masterImageStatus === "ready") {
    assert.ok(masterWidth >= 1024);
  } else {
    assert.ok(masterWidth >= 256);
  }
}

const searchableFiles = [
  "index.html",
  "docs/OPEN_SOURCE_NOTICES.md",
  ...fs
    .readdirSync(path.join(projectRoot, "scripts"))
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => path.join("scripts", fileName)),
];
const legacyPattern =
  /tensorflow|mobilenet|AIImageAnalyzer|ai-analyzer|AI 인식 회복도/i;
for (const relativePath of searchableFiles) {
  const content = fs.readFileSync(
    path.join(projectRoot, relativePath),
    "utf8",
  );
  assert.doesNotMatch(content, legacyPattern, relativePath);
}

console.log("Project integrity tests passed.");
