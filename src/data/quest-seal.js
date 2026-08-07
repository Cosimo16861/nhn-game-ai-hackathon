/** 메인 복원 2: 인장과 문신. 정본: docs/script/03_ACT2.md */
(function () {
  "use strict";

  const GRID_SIZE = 16;
  const ART = [
    "................",
    "..tttttttttttt..",
    ".twwwwwwwwwwwwt.",
    ".t............t.",
    ".t.wwwwwwwwww.t.",
    ".t............t.",
    ".t..wwwwwwww..t.",
    ".t............t.",
    ".t.iiiiiiiiii.t.",
    ".tttttttttttttt.",
    "...aa......aa...",
    "....aa....aa....",
    ".....aaaaaa.....",
    "..ffffffffffff..",
    "..qqqqqqqqqqqq..",
    "................",
  ];
  const COLORS = Object.freeze({
    outline: "#2E241E",
    wave: "#344E59",
    border: "#A76A45",
    anchor: "#65727A",
    incomplete: "#8E4B3D",
    fresh: "#263E49",
    comparison: "#C29545",
  });
  const CHAR_TO_COLOR = Object.freeze({
    t: COLORS.border,
    w: COLORS.wave,
    a: COLORS.anchor,
    i: COLORS.incomplete,
    f: COLORS.fresh,
    q: COLORS.comparison,
  });
  const featureChars = new Set(Object.keys(CHAR_TO_COLOR));
  const cells = [];

  ART.forEach((row, y) => {
    if (row.length !== GRID_SIZE) {
      throw new Error(`인장 아트 ${y}행의 길이가 ${GRID_SIZE}이 아닙니다.`);
    }
    row.split("").forEach((char, x) => cells.push({ index: y * GRID_SIZE + x, char }));
  });

  function indices(char) {
    return cells.filter((cell) => cell.char === char).map((cell) => cell.index);
  }

  window.QuestSeal = Object.freeze({
    id: "REST2",
    title: "아셔튼가의 인장과 닻 문신",
    clearedLabel: "복원 결과를 확인한다",
    mode: "조각조립형·부분채색형",
    gridSize: GRID_SIZE,
    targetPixels: Object.freeze(
      cells.map(({ char }) => CHAR_TO_COLOR[char] || COLORS.outline),
    ),
    hiddenMask: Object.freeze(cells.map(({ char }) => featureChars.has(char))),
    lockedPixels: Object.freeze(cells.map(() => null)),
    paintable: Object.freeze(cells.map(({ char }) => char !== ".")),
    palette: Object.freeze([
      { name: "진품 인장 잉크", hex: COLORS.wave },
      { name: "닳은 밀랍", hex: COLORS.border },
      { name: "오래된 금속색", hex: COLORS.anchor },
      { name: "불완전한 봉인", hex: COLORS.incomplete },
      { name: "새 문신 잉크", hex: COLORS.fresh },
      { name: "대조 표시", hex: COLORS.comparison },
      { name: "검은 잉크", hex: "#22252A" },
    ]),
    requiredFeatures: Object.freeze([
      {
        id: "three-waves",
        label: "초승달 아래 파도 세 줄",
        clue: "CLUE_SEAL_WAVES",
        color: COLORS.wave,
        indices: indices("w"),
      },
      {
        id: "seal-border",
        label: "인장 바깥 테두리",
        clue: "CLUE_SEAL_WAVES",
        color: COLORS.border,
        indices: indices("t"),
      },
      {
        id: "anchor-original",
        label: "에드먼드의 닻 문신",
        clue: "CLUE_ANCHOR_ORIG",
        color: COLORS.anchor,
        indices: indices("a"),
      },
      {
        id: "incomplete-seal",
        label: "편지의 불완전 봉인 자국",
        clue: "CLUE_SEAL_WAVES",
        color: COLORS.incomplete,
        indices: indices("i"),
      },
      {
        id: "fresh-tattoo",
        label: "카버 문신의 과도한 선명함",
        clue: "CLUE_TATTOO_FRESH",
        color: COLORS.fresh,
        indices: indices("f"),
      },
      {
        id: "fourth-wave",
        label: "카버가 기억한 네 번째 파도",
        clue: "CLUE_CARVER_SEAL_4",
        color: COLORS.comparison,
        indices: indices("q"),
      },
    ]),
    clueCards: Object.freeze([
      {
        flag: "CLUE_SEAL_WAVES",
        speaker: "편지 봉인",
        text: "진품은 초승달 아래 파도 세 줄이며 테두리가 닳아 있다.",
      },
      {
        flag: "CLUE_ANCHOR_ORIG",
        speaker: "항해일지",
        text: "에드먼드의 닻 문신은 선이 부드럽고 오래되어 번졌다.",
      },
      {
        flag: "CLUE_TATTOO_FRESH",
        speaker: "카버의 손목",
        text: "닻 문신의 잉크와 피부가 지나치게 새것이다.",
      },
      {
        flag: "CLUE_CARVER_SEAL_4",
        speaker: "카버의 스케치",
        text: "카버는 초승달 아래 파도를 네 줄로 그렸다.",
      },
    ]),
    weights: Object.freeze({ color: 0.4, edge: 0.15, structure: 0.2, palette: 0.25 }),
    passingScore: 80,
  });
})();
