/**
 * 서브 퀘스트 복원 데이터: 고양이 '안개' (튜토리얼)
 * 근거: docs/script/02_ACT1.md — 방식 부분채색형, 필수 특징 3종
 *
 * 아트는 문자맵으로 관리한다.
 *   '.' 배경(채점 제외)  '#' 선화(제공·잠금)
 *   'f' 회색 털  'w' 흰 귀  'r' 붉은 리본   ← 플레이어가 채우는 채점 대상
 */
(function () {
  "use strict";

  const GRID_SIZE = 16;

  const ART = [
    "................",
    "...##......##...",
    "..#ff#....#ww#..",
    ".#ffff#..#wwww#.",
    ".#ffffffffffff#.",
    ".#ffffffffffff#.",
    ".#ffffffffffff#.",
    ".#f##ffffff##f#.",
    ".#ffffffffffff#.",
    ".#fffff##fffff#.",
    ".#ffff#ff#ffff#.",
    ".#ffffffffffff#.",
    "..############..",
    "..#rrrrrrrrrr#..",
    "..#rrrrrrrrrr#..",
    "..############..",
  ];

  const COLORS = {
    outline: "#2E241E",
    fur: "#7A7A82",
    white: "#E4E0D8",
    ribbon: "#A0413A",
  };

  const CHAR_TO_COLOR = {
    "#": COLORS.outline,
    f: COLORS.fur,
    w: COLORS.white,
    r: COLORS.ribbon,
  };

  // 제한형 팔레트: 정답 3색 + 그럴듯한 오답 2색.
  // 증언을 읽지 않으면 고를 수 없게 만드는 것이 목적이다.
  const PALETTE = [
    { name: "회색", hex: COLORS.fur },
    { name: "짙은 회색", hex: "#55555C" },
    { name: "흰색", hex: COLORS.white },
    { name: "붉은색", hex: COLORS.ribbon },
    { name: "갈색", hex: "#6A4A34" },
  ];

  const cells = [];
  ART.forEach((row, y) => {
    if (row.length !== GRID_SIZE) {
      throw new Error(`고양이 아트 ${y}행의 길이가 ${GRID_SIZE}이 아닙니다.`);
    }
    row.split("").forEach((char, x) => {
      cells.push({ index: y * GRID_SIZE + x, char });
    });
  });

  // targetPixels: 채점 기준 전체 색. 배경은 채점하지 않지만 배열은 채워 둔다.
  const targetPixels = cells.map(({ char }) =>
    CHAR_TO_COLOR[char] ? CHAR_TO_COLOR[char] : COLORS.outline,
  );

  // hiddenMask: 플레이어가 채워야 하고 채점되는 칸
  const hiddenMask = cells.map(({ char }) => char === "f" || char === "w" || char === "r");

  // lockedPixels: 시작 시 제공되는 선화(수정 불가). 배경은 null.
  const lockedPixels = cells.map(({ char }) =>
    char === "#" ? COLORS.outline : null,
  );

  const paintable = cells.map(({ char }) => char !== ".");

  // 필수 특징: 증언으로 해금된 특징만 목표에 표시되고 채점 필수가 된다.
  const requiredFeatures = [
    {
      id: "fur",
      label: "회색 털",
      clue: "CLUE_CAT_FUR",
      color: COLORS.fur,
      indices: cells.filter((c) => c.char === "f").map((c) => c.index),
    },
    {
      id: "ear",
      label: "한쪽만 흰 귀",
      clue: "CLUE_CAT_EAR",
      color: COLORS.white,
      indices: cells.filter((c) => c.char === "w").map((c) => c.index),
    },
    {
      id: "ribbon",
      label: "붉은 목 리본",
      clue: "CLUE_CAT_RIBBON",
      color: COLORS.ribbon,
      indices: cells.filter((c) => c.char === "r").map((c) => c.index),
    },
  ];

  window.QuestCat = Object.freeze({
    id: "REST_CAT",
    title: "고양이 '안개'의 초상",
    mode: "부분채색형",
    gridSize: GRID_SIZE,
    targetPixels: Object.freeze(targetPixels),
    hiddenMask: Object.freeze(hiddenMask),
    lockedPixels: Object.freeze(lockedPixels),
    paintable: Object.freeze(paintable),
    palette: Object.freeze(PALETTE),
    requiredFeatures: Object.freeze(requiredFeatures),
    // 숨은 채점 설정 — 플레이어에게 절대 노출하지 않는다.
    weights: Object.freeze({ color: 0.4, edge: 0.15, structure: 0.15, palette: 0.3 }),
    passingScore: 82,
  });
})();
