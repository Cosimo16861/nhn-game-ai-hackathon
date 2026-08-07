/** 메인 복원 1: 에드먼드의 초상. 정본: docs/script/02_ACT1.md */
(function () {
  "use strict";

  const GRID_SIZE = 16;
  const ART = [
    "................",
    "....########....",
    "...#hhhhhhhh#...",
    "..#hhhhhhhhhh#..",
    "..#hhffffffhh#..",
    ".#hhffffffffff#.",
    ".#hbbfffffbbbh#.",
    ".#hbbfffffbbbh#.",
    ".#sssffffffffh#.",
    ".#sssffffffffh#.",
    ".#hffffffffffh#.",
    "..#ffffffffff#..",
    "...#ffffffff#...",
    "...#cccccccc#...",
    "..#cccccccccc#..",
    "................",
  ];

  const COLORS = Object.freeze({
    outline: "#2E241E",
    skin: "#C99A78",
    hair: "#45342D",
    clothes: "#354B52",
    brow: "#30241F",
    scar: "#9E6556",
  });
  const CHAR_TO_COLOR = Object.freeze({
    "#": COLORS.outline,
    f: COLORS.skin,
    h: COLORS.hair,
    c: COLORS.clothes,
    b: COLORS.brow,
    s: COLORS.scar,
  });
  const hiddenChars = new Set(["f", "h", "c", "b", "s"]);
  const cells = [];

  ART.forEach((row, y) => {
    if (row.length !== GRID_SIZE) {
      throw new Error(`초상 아트 ${y}행의 길이가 ${GRID_SIZE}이 아닙니다.`);
    }
    row.split("").forEach((char, x) => cells.push({ index: y * GRID_SIZE + x, char }));
  });

  function indices(char) {
    return cells.filter((cell) => cell.char === char).map((cell) => cell.index);
  }

  window.QuestPortrait = Object.freeze({
    id: "REST1",
    title: "에드먼드 아셔튼의 초상",
    clearedLabel: "복원 결과를 확인한다",
    mode: "희미한 윤곽 수정형",
    gridSize: GRID_SIZE,
    targetPixels: Object.freeze(
      cells.map(({ char }) => CHAR_TO_COLOR[char] || COLORS.outline),
    ),
    hiddenMask: Object.freeze(cells.map(({ char }) => hiddenChars.has(char))),
    lockedPixels: Object.freeze(
      cells.map(({ char }) => (char === "#" ? COLORS.outline : null)),
    ),
    paintable: Object.freeze(cells.map(({ char }) => char !== ".")),
    palette: Object.freeze([
      { name: "피부색", hex: COLORS.skin },
      { name: "짙은 갈색", hex: COLORS.hair },
      { name: "청회색", hex: COLORS.clothes },
      { name: "눈썹색", hex: COLORS.brow },
      { name: "흉터색", hex: COLORS.scar },
      { name: "밝은 갈색", hex: "#8B684D" },
    ]),
    requiredFeatures: Object.freeze([
      {
        id: "face",
        label: "얼굴·턱 실제 윤곽",
        clue: "CLUE_ELEANOR_PORTRAIT",
        color: COLORS.skin,
        indices: indices("f"),
      },
      {
        id: "hair",
        label: "짙은 머리색",
        clue: "CLUE_ELEANOR_PORTRAIT",
        color: COLORS.hair,
        indices: indices("h"),
      },
      {
        id: "clothes",
        label: "짙은 의복색",
        clue: "CLUE_ELEANOR_PORTRAIT",
        color: COLORS.clothes,
        indices: indices("c"),
      },
      {
        id: "left-brow",
        label: "왼눈썹 비대칭",
        clue: "EV_FACE",
        color: COLORS.brow,
        indices: indices("b"),
      },
      {
        id: "temple-scar",
        label: "관자놀이의 작은 흉터",
        clue: "EV_FACE",
        color: COLORS.scar,
        indices: indices("s"),
      },
    ]),
    clueCards: Object.freeze([
      {
        flag: "CLUE_ELEANOR_PORTRAIT",
        speaker: "옛 초상",
        text: "얼굴과 턱의 윤곽, 짙은 머리와 의복색이 남아 있다.",
      },
      {
        flag: "EV_FACE",
        speaker: "홀트",
        text: "웃을 때 왼쪽 눈썹만 올라갔고 관자놀이에 작은 흉터가 있었다.",
      },
    ]),
    weights: Object.freeze({ color: 0.4, edge: 0.15, structure: 0.15, palette: 0.3 }),
    passingScore: 80,
  });
})();
