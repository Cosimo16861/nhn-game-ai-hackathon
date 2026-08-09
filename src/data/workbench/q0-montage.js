(function (global) {
  "use strict";

  const palette = Object.freeze([
    Object.freeze({ name: "모자 회색", hex: "#696864" }),
    Object.freeze({ name: "모자 그림자", hex: "#292A2D" }),
    Object.freeze({ name: "피부 황금빛", hex: "#E7B365" }),
    Object.freeze({ name: "피부 그늘", hex: "#A65B13" }),
    Object.freeze({ name: "목도리 초록", hex: "#087A51" }),
    Object.freeze({ name: "목도리 그림자", hex: "#07563D" }),
    Object.freeze({ name: "코트 자주색", hex: "#341522" }),
    Object.freeze({ name: "밤 배경색", hex: "#061A45" }),
  ]);

  const config = Object.freeze({
    id: "Q0_MONTAGE",
    title: "골목의 손 · 몽타주",
    description: "목격자의 증언을 바탕으로 소매치기의 몽타주를 완성한다.",
    ariaLabel: "소매치기 몽타주 복원 작업대",
    drawingLabel: "몽타주 그림 영역",
    helpText: "색과 도구를 고른 뒤 선화 안을 드래그하세요 · 팔레트와 도구에 마우스를 올리면 금빛 포인터가 표시됩니다.",

    gridSize: 64,
    paperColor: "#E8E3D5",
    outlineColor: "#120F0D",
    outlineLuminanceThreshold: 160,
    historyLimit: 60,
    lineSource: "assets/q0-montage/montage-line.png",
    targetSource: "assets/q0-montage/montage-target.png",
    maskMode: "closed-regions",

    palette,
    activeColor: palette[2].hex,
    activeTool: "brush",
    brushSize: 2,

    quotes: Object.freeze([
      Object.freeze({
        speaker: "마르타",
        text: "회색 중절모를 깊게 눌러써 눈이 챙 아래 가려졌어요.",
      }),
      Object.freeze({
        speaker: "경관 리드",
        text: "초록 목도리와 짙은 자주색 코트가 가장 눈에 띄었습니다.",
      }),
    ]),

    regions: Object.freeze([
      Object.freeze({
        id: "background",
        label: "배경",
        weight: 0.1,
        seeds: Object.freeze([[3, 3]]),
        paletteIndexes: Object.freeze([7]),
      }),
      Object.freeze({
        id: "hat",
        label: "모자",
        weight: 0.2,
        seeds: Object.freeze([[32, 9], [31, 20], [34, 23]]),
        paletteIndexes: Object.freeze([0, 1]),
      }),
      Object.freeze({
        id: "face",
        label: "얼굴",
        weight: 0.25,
        seeds: Object.freeze([[32, 34]]),
        paletteIndexes: Object.freeze([2, 3]),
      }),
      Object.freeze({
        id: "scarf",
        label: "목도리",
        weight: 0.2,
        seeds: Object.freeze([[33, 45], [29, 57], [39, 53]]),
        paletteIndexes: Object.freeze([4, 5]),
      }),
      Object.freeze({
        id: "coat",
        label: "코트",
        weight: 0.25,
        seeds: Object.freeze([[20, 50], [49, 49], [14, 56], [54, 56], [49, 44]]),
        paletteIndexes: Object.freeze([6]),
      }),
    ]),

    scoring: Object.freeze({
      passingScore: 80,
      minimumRegionScore: 65,
      minimumRegionCoverage: 0.8,
      scoreWeights: Object.freeze({
        color: 0.5,
        edge: 0.3,
        structure: 0.15,
        palette: 0.05,
      }),
    }),

    feedback: Object.freeze({
      preparing: "선화를 준비하고 있습니다",
      ready: "",
      loadingMasks: "부위 마스크를 준비하는 중입니다",
      submitted: "제출하였습니다",
      submittedAnnouncement: "몽타주를 제출하였습니다.",
      loadError: "몽타주 이미지를 불러오지 못했습니다",
    }),
    completionCutscene: "C1_THE_CASE",
    afterPassUrl: "board.html",
    backUrl: "board.html",
  });

  global.WorkbenchQuestConfig.register(config);
})(window);
