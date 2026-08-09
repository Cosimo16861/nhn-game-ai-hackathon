/**
 * 복원 작업 이력 — 실행 취소·다시 실행.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7.2·7.3
 *
 * 1254² ImageData 전체 스냅샷(약 6.3MB)을 쌓지 않는다. 명령 두 종류만 기록한다.
 *
 *   { type: "fill-region", regionId, before, after }
 *       before 가 색 하나면 채우기 직전 영역이 단색이었다는 뜻이고,
 *       Uint8ClampedArray 면 붓질로 얼룩진 영역을 픽셀 단위로 되돌린다.
 *   { type: "patch", x, y, width, height, before, after }
 *       한 stroke 가 여러 pointermove 를 포함해도 이력은 하나다.
 *
 * 메모리는 byte 단위로 관리하되 최소 20단계를 보장한다.
 */
(function (global) {
  "use strict";

  const MIN_STEPS = 20;
  const DEFAULT_BUDGET_BYTES = 64 * 1024 * 1024;

  function commandBytes(command) {
    if (!command) return 0;
    let bytes = 64;
    for (const key of ["before", "after"]) {
      const value = command[key];
      if (value && value.byteLength) bytes += value.byteLength;
    }
    return bytes;
  }

  function create(options = {}) {
    const budget = options.budgetBytes || DEFAULT_BUDGET_BYTES;
    const minSteps = options.minSteps || MIN_STEPS;
    let undoStack = [];
    let redoStack = [];
    let bytes = 0;

    function recount() {
      bytes = undoStack.concat(redoStack).reduce(
        (total, command) => total + commandBytes(command),
        0,
      );
    }

    /** 예산을 넘으면 가장 오래된 것부터 버린다. 단 최소 단계 수는 지킨다. */
    function trim() {
      while (bytes > budget && undoStack.length > minSteps) {
        bytes -= commandBytes(undoStack.shift());
      }
      // 그래도 넘치면 redo 를 먼저 포기한다. 실행 취소가 더 중요하다.
      while (bytes > budget && redoStack.length > 0) {
        bytes -= commandBytes(redoStack.pop());
      }
    }

    return Object.freeze({
      push(command) {
        if (!command) return;
        undoStack.push(command);
        redoStack.forEach((entry) => { bytes -= commandBytes(entry); });
        redoStack = [];
        bytes += commandBytes(command);
        trim();
      },
      undo() {
        const command = undoStack.pop();
        if (!command) return null;
        redoStack.push(command);
        return command;
      },
      redo() {
        const command = redoStack.pop();
        if (!command) return null;
        undoStack.push(command);
        return command;
      },
      clear() {
        undoStack = [];
        redoStack = [];
        bytes = 0;
      },
      canUndo: () => undoStack.length > 0,
      canRedo: () => redoStack.length > 0,
      depth: () => undoStack.length,
      usedBytes: () => bytes,
      /** 테스트·진단용. 저장된 명령을 바꾸지 않는다. */
      inspect: () => ({ undo: undoStack.slice(), redo: redoStack.slice(), bytes, recount }),
    });
  }

  global.PaintHistory = Object.freeze({ MIN_STEPS, DEFAULT_BUDGET_BYTES, commandBytes, create });
  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.PaintHistory;
  }
})(typeof window !== "undefined" ? window : globalThis);
