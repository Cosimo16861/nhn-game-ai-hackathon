const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "case-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const createCase = sandbox.window.CaseManager.createCase;

const custom = createCase({
  title: "  박물관   침입 사건  ",
  witnesses: ["  파란색이었어요.  ", "", "둥근 형태였습니다."],
  fileName: "sample.png",
});
assert.equal(custom.title, "박물관 침입 사건");
assert.deepEqual(
  Array.from(custom.witnesses),
  ["파란색이었어요.", "둥근 형태였습니다."],
);

const fallback = createCase({
  title: "",
  witnesses: ["", " "],
  fileName: "cat.photo.jpg",
});
assert.equal(fallback.title, "cat.photo 복원 사건");
assert.equal(fallback.witnesses.length, 1);
assert.match(fallback.witnesses[0], /목격 기록이 없습니다/);

console.log("Case manager tests passed.");
