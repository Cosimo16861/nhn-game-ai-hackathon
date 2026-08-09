/**
 * 복원 작업 이력 — GAME_INTEGRATION_PLAN 7.3.
 *
 *   - 한 stroke 는 이력 하나다.
 *   - 메모리 상한은 byte 단위로 관리하되 최소 20단계를 보장한다.
 *   - 새 작업을 하면 redo 는 버려진다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const PaintHistory = require(path.join(root, "src/workbench/paint-history.js"));

function patch(bytes) {
  const box = { x0: 0, y0: 0, x1: 1, y1: 1 };
  return {
    type: "patch",
    x: 0, y: 0, width: 2, height: 2,
    tiles: [{ box, before: new Uint8ClampedArray(bytes), after: new Uint8ClampedArray(bytes) }],
    before: new Uint8ClampedArray(bytes),
    after: new Uint8ClampedArray(bytes),
  };
}

// ── 1. 기본 되돌리기·다시 실행 ──────────────────────────────────────
{
  const history = PaintHistory.create();
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);

  const first = { type: "fill-region", regionId: 3, before: [255, 255, 255, 255], after: [1, 2, 3, 255] };
  history.push(first);
  assert.equal(history.canUndo(), true);
  assert.equal(history.depth(), 1);

  assert.equal(history.undo(), first);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), true);

  assert.equal(history.redo(), first);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);

  assert.equal(history.undo(), first);
  assert.equal(history.undo(), null, "빈 이력에서 undo 는 null 이어야 합니다.");
}

// ── 2. 새 작업은 redo 를 버린다 ─────────────────────────────────────
{
  const history = PaintHistory.create();
  history.push(patch(16));
  history.push(patch(16));
  history.undo();
  assert.equal(history.canRedo(), true);
  history.push(patch(16));
  assert.equal(history.canRedo(), false, "새 작업 뒤에는 다시 실행이 없어야 합니다.");
  assert.equal(history.depth(), 2);
}

// ── 3. 예산을 넘어도 최소 20단계는 남는다 ───────────────────────────
{
  const oneMega = 1024 * 1024;
  const history = PaintHistory.create({ budgetBytes: 4 * oneMega, minSteps: 20 });
  for (let index = 0; index < 40; index += 1) history.push(patch(oneMega));
  assert.equal(history.depth(), 20, "최소 20단계를 보장해야 합니다.");
  assert.ok(history.usedBytes() > 4 * oneMega, "20단계를 지키느라 예산을 넘을 수 있습니다.");
}

// ── 4. 예산 안에서는 오래된 것부터 버린다 ───────────────────────────
{
  const history = PaintHistory.create({ budgetBytes: 100 * 1024, minSteps: 2 });
  for (let index = 0; index < 30; index += 1) history.push(patch(10 * 1024));
  assert.ok(history.depth() < 30, "예산을 넘으면 오래된 이력을 버려야 합니다.");
  assert.ok(history.depth() >= 2, "최소 단계 아래로 내려가면 안 됩니다.");
  assert.ok(history.usedBytes() <= 100 * 1024 + PaintHistory.commandBytes(patch(10 * 1024)));
}

// ── 5. clear ────────────────────────────────────────────────────────
{
  const history = PaintHistory.create();
  history.push(patch(64));
  history.push(patch(64));
  history.undo();
  history.clear();
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);
  assert.equal(history.usedBytes(), 0);
}

console.log("Paint history tests passed.");
