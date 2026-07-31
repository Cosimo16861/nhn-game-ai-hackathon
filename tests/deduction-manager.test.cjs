const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "deduction-manager.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const question = {
  prompt: "범인의 침입 경로는?",
  options: ["깨진 창문", "정문", "지하 통로"],
  answerIndex: 0,
  explanation: "창문 아래에 깨진 유리가 남았습니다.",
};
const correct = sandbox.window.DeductionManager.evaluate(question, 0);
assert.equal(correct.correct, true);
assert.equal(correct.correctAnswer, "깨진 창문");
assert.equal(correct.message, question.explanation);
assert.equal(Object.isFrozen(correct), true);

const incorrect = sandbox.window.DeductionManager.evaluate(question, 2);
assert.equal(incorrect.correct, false);
assert.match(incorrect.message, /다시 비교/);
assert.throws(
  () => sandbox.window.DeductionManager.evaluate(question, 4),
  /답안 정보/,
);

console.log("Deduction manager tests passed.");
