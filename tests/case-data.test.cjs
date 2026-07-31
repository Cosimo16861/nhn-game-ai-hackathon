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

const {
  createCaseDefinition,
  createChapterDefinition,
  validateCaseDefinitions,
  validateChapterDefinitions,
  chapters,
  cases,
} = sandbox.window.CaseData;

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
  clipPrompts: [
    "A blue hat worn by a thief.",
    "A red bag held in the right hand.",
    "A long dark shadow across the floor.",
  ],
  hiddenRegions: [0, 4, 15],
  difficulty: "normal",
  passingScore: 65,
});

assert.equal(sample.id, "museum-robbery");
assert.equal(sample.witnesses.length, 3);
assert.equal(sample.clipPrompts.length, 3);
assert.equal(sample.clipPrompts[0], "A blue hat worn by a thief.");
assert.deepEqual(Array.from(sample.hiddenRegions), [0, 4, 15]);
assert.equal(Object.isFrozen(sample), true);
assert.equal(Object.isFrozen(sample.clipPrompts), true);

assert.equal(chapters.length, 2);
assert.deepEqual(
  Array.from(chapters, (chapter) => chapter.id),
  ["museum-robbery", "convenience-store-theft"],
);
assert.equal(chapters[0].masterImageStatus, "ready");
assert.equal(
  chapters[0].masterImageSrc,
  "./assets/cases/museum-robbery-master-dark-color.png",
);
assert.equal(chapters[1].masterImageStatus, "placeholder");
for (const chapter of chapters) {
  assert.equal(chapter.layout.columns, 2);
  assert.equal(chapter.layout.rows, 2);
  assert.equal(chapter.stages[0].chapterId, chapter.id);
  assert.equal(chapter.stages[0].order, 1);
  assert.equal(Object.isFrozen(chapter), true);
  assert.equal(Object.isFrozen(chapter.stages), true);
  assert.equal(Object.isFrozen(chapter.stages[0].crop), true);
}
assert.equal(chapters[0].stages.length, 4);
assert.equal(chapters[1].stages.length, 1);
assert.equal(chapters[0].finalDeduction.answerIndex, 0);
assert.equal(chapters[0].finalDeduction.options.length, 3);
assert.equal(Object.isFrozen(chapters[0].finalDeduction), true);
assert.deepEqual(
  Array.from(chapters[0].stages, (stage) => [
    stage.crop.column,
    stage.crop.row,
  ]),
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
);
assert.deepEqual(
  Array.from(chapters[0].stages, (stage) => stage.order),
  [1, 2, 3, 4],
);

const chapterSample = createChapterDefinition({
  id: "sample-chapter",
  title: "샘플 대형 사건",
  summary: "연결된 두 현장을 조사하는 샘플 사건입니다.",
  masterImageSrc: "./assets/cases/museum-robbery.png",
  masterImageAlt: "샘플 사건의 전체 현장",
  stages: [
    {
      ...sample,
      id: "sample-stage-1",
      title: "첫 번째 현장",
      summary: "왼쪽 위 현장을 조사합니다.",
      crop: { column: 0, row: 0 },
      hints: ["깨진 창문 주변을 확인하세요."],
    },
    {
      ...sample,
      id: "sample-stage-2",
      title: "두 번째 현장",
      summary: "오른쪽 위 현장을 조사합니다.",
      crop: { column: 1, row: 0 },
      deductionQuestion: {
        prompt: "범인이 지나간 곳은 어디입니까?",
        options: ["창문", "정문", "계단"],
        answerIndex: 0,
        explanation: "깨진 유리 조각이 창문 아래에 남았습니다.",
      },
    },
  ],
});
assert.equal(chapterSample.stages.length, 2);
assert.deepEqual(
  Array.from(chapterSample.stages, (stage) => stage.order),
  [1, 2],
);
assert.equal(chapterSample.stages[1].deductionQuestion.answerIndex, 0);
assert.equal(Object.isFrozen(chapterSample.stages[1].deductionQuestion), true);

for (const caseDefinition of cases) {
  assert.equal(caseDefinition.clipPrompts.length, 3);
  assert.equal(
    new Set(caseDefinition.clipPrompts).size,
    caseDefinition.clipPrompts.length,
  );
  assert.deepEqual(
    caseDefinition.clipPrompts.map((_, index) =>
      caseDefinition.hiddenRegions[index],
    ),
    caseDefinition.hiddenRegions,
  );
}

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
      clipPrompts: ["한국어 문장", "두 번째 문장", "세 번째 문장"],
    }),
  /영문 CLIP 문장 3개/,
);

assert.throws(
  () =>
    createCaseDefinition({
      ...sample,
      clipPrompts: [
        "A repeated prompt.",
        "A repeated prompt.",
        "A third prompt.",
      ],
    }),
  /영문 CLIP 문장 3개/,
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

assert.throws(
  () =>
    createChapterDefinition({
      ...chapterSample,
      stages: [
        chapterSample.stages[0],
        {
          ...chapterSample.stages[1],
          crop: { column: 0, row: 0 },
        },
      ],
    }),
  /조각 위치가 중복/,
);

assert.throws(
  () =>
    createChapterDefinition({
      ...chapterSample,
      stages: [
        {
          ...chapterSample.stages[0],
          crop: { column: 2, row: 0 },
        },
      ],
    }),
  /2×2 범위/,
);

assert.throws(
  () =>
    validateChapterDefinitions([
      chapterSample,
      {
        ...chapterSample,
        stages: [
          {
            ...chapterSample.stages[0],
            id: "another-stage",
          },
        ],
      },
    ]),
  /대형 사건 ID가 중복/,
);

console.log("Case data tests passed.");
