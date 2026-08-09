const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const registry = require(path.join(root, "src", "data", "questimage-quests.js"));
const quests = registry.list();

assert.equal(registry.resolution, 1254);
assert.equal(quests.length, 14);
assert.equal(new Set(quests.map((quest) => quest.id)).size, 14);

function pngDimensions(file) {
  const header = fs.readFileSync(file).subarray(0, 24);
  assert.equal(header.toString("hex", 0, 8), "89504e470d0a1a0a");
  return [header.readUInt32BE(16), header.readUInt32BE(20)];
}

quests.forEach((quest) => {
  assert.ok(quest.targetSource.startsWith("assets/questimage/"));
  assert.ok(quest.outlineSource.startsWith("assets/questimage/"));
  assert.ok(quest.targetSource.endsWith("__완성이미지.png"));
  assert.ok(quest.outlineSource.endsWith("__윤곽선.png"));
  assert.ok(quest.palette.length >= 4 && quest.palette.length <= 8);
  assert.ok(quest.witnessNotes.length >= 2);
  assert.ok(quest.clipPrompts.length >= 2);

  for (const source of [quest.targetSource, quest.outlineSource]) {
    const file = path.join(root, source);
    assert.ok(fs.existsSync(file), `${source}가 존재해야 합니다.`);
    assert.deepEqual(pngDimensions(file), [1254, 1254]);
  }
});

console.log("Questimage contract tests passed.");
