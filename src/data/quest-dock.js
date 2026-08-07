/** 메인 복원 3: 안개 낀 부두. 정본: docs/script/04_ACT3.md */
(function () {
  "use strict";

  const GRID_SIZE = 16;
  const ART = [
    "................",
    "..bbbbbbbbbbbb..",
    "..bbbbbbbbbbbb..",
    "................",
    "..mmmmmmmmmmmm..",
    "..mmmmmmmmmmmm..",
    "..mmmeeeeeemmm..",
    "..mmmmmmmmmmmm..",
    "....cccccccc....",
    "....cccccccc....",
    "................",
    "..gggggggggggg..",
    "..gggg....gggg..",
    "..gggggggggggg..",
    "..gggggggggggg..",
    "................",
  ];
  const COLORS = Object.freeze({
    outline: "#2E241E",
    carriage: "#202328",
    boat: "#526773",
    carver: "#5A453C",
    ground: "#6E665B",
    emblem: "#D0A34B",
  });
  const CHAR_TO_COLOR = Object.freeze({
    m: COLORS.carriage,
    b: COLORS.boat,
    c: COLORS.carver,
    g: COLORS.ground,
    e: COLORS.emblem,
  });
  const featureChars = new Set(Object.keys(CHAR_TO_COLOR));
  const cells = [];

  ART.forEach((row, y) => {
    if (row.length !== GRID_SIZE) {
      throw new Error(`부두 아트 ${y}행의 길이가 ${GRID_SIZE}이 아닙니다.`);
    }
    row.split("").forEach((char, x) => cells.push({ index: y * GRID_SIZE + x, char }));
  });

  function indices(char) {
    return cells.filter((cell) => cell.char === char).map((cell) => cell.index);
  }

  window.QuestDock = Object.freeze({
    id: "REST3",
    title: "안개 낀 부두",
    clearedLabel: "복원 결과를 확인한다",
    mode: "빈 캔버스 배치형",
    gridSize: GRID_SIZE,
    targetPixels: Object.freeze(
      cells.map(({ char }) => CHAR_TO_COLOR[char] || COLORS.outline),
    ),
    hiddenMask: Object.freeze(cells.map(({ char }) => featureChars.has(char))),
    lockedPixels: Object.freeze(cells.map(() => null)),
    paintable: Object.freeze(cells.map(({ char }) => char !== ".")),
    palette: Object.freeze([
      { name: "검은 마차", hex: COLORS.carriage },
      { name: "안개 속 배", hex: COLORS.boat },
      { name: "카버의 실루엣", hex: COLORS.carver },
      { name: "젖은 돌과 상자", hex: COLORS.ground },
      { name: "초승달·파도 문양", hex: COLORS.emblem },
      { name: "가스등 빛", hex: "#D6BA70" },
    ]),
    requiredFeatures: Object.freeze([
      {
        id: "black-carriage",
        label: "가스등 아래 검은 마차",
        always: true,
        color: COLORS.carriage,
        indices: indices("m"),
      },
      {
        id: "moored-boat",
        label: "부두에 정박한 배",
        always: true,
        color: COLORS.boat,
        indices: indices("b"),
      },
      {
        id: "carver-silhouette",
        label: "카버의 실루엣",
        always: true,
        color: COLORS.carver,
        indices: indices("c"),
      },
      {
        id: "wet-ground-boxes",
        label: "젖은 돌바닥과 상자",
        always: true,
        color: COLORS.ground,
        indices: indices("g"),
      },
      {
        id: "carriage-emblem",
        label: "마차 문의 초승달·파도 문양",
        cluesAny: ["EV_CARRIAGE", "CLUE_LOGBOOK"],
        color: COLORS.emblem,
        indices: indices("e"),
      },
    ]),
    clueCards: Object.freeze([
      {
        speaker: "현장 기준선",
        text: "검은 마차와 배, 인물, 젖은 돌바닥과 상자의 위치를 복원한다.",
      },
      {
        flagsAny: ["EV_CARRIAGE", "CLUE_LOGBOOK"],
        speaker: "마차 기록",
        text: "마차 문에는 초승달과 파도 문양이 있었다.",
      },
    ]),
    weights: Object.freeze({ color: 0.4, edge: 0.15, structure: 0.2, palette: 0.25 }),
    passingScore: 80,
  });
})();
