const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "case-data.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { createCaseDefinition, validateCaseDefinitions, cases } =
  sandbox.window.CaseData;

assert.equal(cases.length, 2);
assert.deepEqual(
  Array.from(cases, (caseDefinition) => caseDefinition.id),
  ["museum-robbery", "convenience-store-theft"],
);

const sample = createCaseDefinition({
  id: "museum-robbery",
  title: "박물관 절도 사건",
  imageSrc: "./assets/cases/museum-robbery.png",
  imageAlt: "박물관 전시실의 픽셀 그림",
  witnesses: [
    "범인은 파란 모자를 쓰고 있었습니다.",
    "오른손에 붉은 가방이 보였습니다.",
    "바닥에는 긴 그림자가 있었습니다.",
  ],
  hiddenRegions: [0, 4, 15],
  difficulty: "normal",
  passingScore: 65,
});

assert.equal(sample.id, "museum-robbery");
assert.equal(sample.witnesses.length, 3);
assert.deepEqual(Array.from(sample.hiddenRegions), [0, 4, 15]);
assert.equal(Object.isFrozen(sample), true);

assert.throws(
  () =>
    createCaseDefinition({
      ...sample,
      witnesses: ["첫 번째 목격담", "두 번째 목격담"],
    }),
  /목격담 3개/,
);

assert.throws(
  () =>
    createCaseDefinition({
      ...sample,
      hiddenRegions: [0, 4, 4],
    }),
  /가림 구역 3개/,
);

assert.throws(
  () => validateCaseDefinitions([sample, sample]),
  /사건 ID가 중복/,
);

console.log("Case data tests passed.");
