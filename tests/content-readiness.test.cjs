const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(
    path.join(projectRoot, "scripts", "case-data.js"),
    "utf8",
  ),
  sandbox,
);
vm.runInContext(
  fs.readFileSync(
    path.join(projectRoot, "scripts", "content-readiness.js"),
    "utf8",
  ),
  sandbox,
);

const { chapters } = sandbox.window.CaseData;
const { auditChapter, auditChapters } =
  sandbox.window.ContentReadiness;
const audits = auditChapters(chapters);
const museumAudit = audits.find(
  (audit) => audit.chapterId === "museum-robbery",
);
const convenienceAudit = audits.find(
  (audit) => audit.chapterId === "convenience-store-theft",
);

assert.equal(museumAudit.status, "ready");
assert.equal(museumAudit.isReady, true);
assert.equal(museumAudit.completedSlots, 4);
assert.equal(museumAudit.totalSlots, 4);
assert.equal(museumAudit.issues.length, 0);

assert.equal(convenienceAudit.status, "placeholder");
assert.equal(convenienceAudit.isReady, false);
assert.equal(convenienceAudit.completedSlots, 1);
assert.ok(
  convenienceAudit.issues.some(
    (issue) => issue.code === "master-image-placeholder",
  ),
);
assert.ok(
  convenienceAudit.issues.some(
    (issue) => issue.code === "incomplete-stage-grid",
  ),
);

const brokenAudit = auditChapter({
  id: "broken",
  masterImageStatus: "ready",
  layout: { columns: 2, rows: 2 },
  stages: [
    {
      id: "broken-stage",
      crop: { column: 0, row: 0 },
      witnesses: ["한 문장"],
      clipPrompts: ["same", "same"],
      hiddenRegions: [0, 0],
      hints: [],
      difficulty: "impossible",
      passingScore: 101,
    },
  ],
  finalDeduction: null,
});

for (const expectedCode of [
  "incomplete-stage-grid",
  "stage-witness-count",
  "stage-clip-prompts",
  "stage-hidden-regions",
  "stage-hint",
  "stage-difficulty",
  "stage-passing-score",
  "final-deduction",
]) {
  assert.ok(
    brokenAudit.issues.some((issue) => issue.code === expectedCode),
    `Missing audit issue: ${expectedCode}`,
  );
}

console.log("Content readiness tests passed.");
