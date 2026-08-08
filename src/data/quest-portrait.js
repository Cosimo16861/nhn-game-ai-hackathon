/**
 * 메인 복원 1: 에드먼드의 초상 (256×256)
 * 정본: docs/script/02_ACT1.md
 *
 * 아트는 기존 픽셀 초상 자산을 밑그림으로 깔고, 증언에 해당하는 특징
 * (올라간 왼쪽 눈썹 · 관자놀이의 흉터)을 그 위에 별도 색으로 덧그린다.
 * 그래야 "그 특징을 알아야 제대로 칠할 수 있다"가 성립한다.
 *
 * 복원 목표는 설계 용어가 아니라 **증언자의 말** 그대로 보여 준다.
 */
(function () {
  "use strict";

  const FACE_SHEET =
    "assets/게임_이미지_모음/07_NPC_스프라이트/03_표정초상화_시트/04-teacher-portraits.png";

  // 외곽선과 다른 색은 충분히 떨어뜨려야 한다.
  // 너무 가까우면 양자화에서 선화에 흡수되어 칠할 영역이 사라진다.
  const COLORS = Object.freeze({
    outline: "#241C17", // 선화 (플레이어가 고를 수 없음)
    skin: "#E0B48C",
    skinShade: "#B07E5E",
    hair: "#5A4230", // 선화보다 확실히 밝은 갈색
    coat: "#4A5A62",
    vest: "#8A6A3E",
    brow: "#3A2A1E", // 올라간 왼쪽 눈썹
    scar: "#C4705E", // 관자놀이의 흉터
  });

  /** 밑그림을 깔고 그 위에 증언 속 특징을 덧그린다. */
  async function drawSource(context, size, api) {
    const sheet = await api.loadImage(FACE_SHEET);
    const faceWidth = sheet.width / 4; // 표정 4종 시트에서 첫 번째만 사용

    context.imageSmoothingEnabled = false;
    const scale = Math.min(size / faceWidth, size / sheet.height);
    const w = Math.round(faceWidth * scale);
    const h = Math.round(sheet.height * scale);
    context.drawImage(
      sheet,
      0, 0, faceWidth, sheet.height,
      ((size - w) / 2) | 0, ((size - h) / 2) | 0, w, h,
    );

    // 왼쪽 눈썹만 위로 — 홀트의 증언
    context.fillStyle = COLORS.brow;
    context.fillRect(Math.round(size * 0.34), Math.round(size * 0.33), Math.round(size * 0.11), Math.round(size * 0.028));

    // 관자놀이의 작은 흉터 — 홀트의 증언
    context.fillStyle = COLORS.scar;
    context.fillRect(Math.round(size * 0.29), Math.round(size * 0.39), Math.round(size * 0.022), Math.round(size * 0.055));
  }

  window.QuestPortrait = Object.freeze({
    id: "REST1",
    title: "에드먼드의 초상",
    mode: "부분채색형",
    gridSize: 256,
    source: drawSource,
    outline: COLORS.outline,
    minRegion: 24,

    palette: Object.freeze([
      { name: "살빛", hex: COLORS.skin },
      { name: "그늘진 살빛", hex: COLORS.skinShade },
      { name: "짙은 머리색", hex: COLORS.hair },
      { name: "코트의 청록", hex: COLORS.coat },
      { name: "조끼의 황갈", hex: COLORS.vest },
      { name: "눈썹의 검정", hex: COLORS.brow },
      { name: "흉터의 붉은 기", hex: COLORS.scar },
    ]),

    // 확보한 증언으로 해금된 것만 목표에 뜨고 채점 필수가 된다(00_SYSTEM 4.1).
    requiredFeatures: Object.freeze([
      {
        id: "skin",
        always: true,
        color: COLORS.skin,
        label: "얼굴빛",
        speaker: "엘리너",
        quote: "볕에 그을리지 않은 아이였어요. 늘 실내에만 있었으니까.",
        missNote: "그 아이 얼굴빛을 그렇게 말했다. 지금 얼굴은 그 색이 아니다.",
      },
      {
        id: "hair",
        always: true,
        color: COLORS.hair,
        label: "짙은 머리색",
        speaker: "엘리너",
        quote: "머리가 아주 짙었죠. 검은색에 가까운, 곱슬거리는 머리였어요.",
        missNote: "머리가 검은색에 가깝다고 했다. 지금은 그만큼 짙지 않다.",
      },
      {
        id: "coat",
        always: true,
        color: COLORS.coat,
        label: "의복색",
        speaker: "엘리너",
        quote: "떠나던 날 입은 건 바다빛 코트였어요. 제가 골라 준 거예요.",
        missNote: "바다빛 코트라고 했다. 지금 옷은 그 색이 아니다.",
      },
      {
        id: "brow",
        clue: "EV_FACE",
        color: COLORS.brow,
        label: "왼눈썹 비대칭",
        speaker: "홀트",
        quote: "웃을 때요, 왼쪽 눈썹만 유독 위로 올라갔습니다. 오른쪽은 가만있는데.",
        missNote: "왼쪽 눈썹만 올라갔다고 했다. 지금은 양쪽이 같아 보인다.",
      },
      {
        id: "scar",
        clue: "EV_FACE",
        color: COLORS.scar,
        label: "관자놀이의 흉터",
        speaker: "홀트",
        quote: "관자놀이에 작은 흉터가 있었습니다. 넘어져서 생긴, 지워지지 않는.",
        missNote: "관자놀이에 흉터가 있었다고 했다. 지금 그 자리는 매끈하다.",
      },
    ]),

    clueCards: Object.freeze([
      {
        speaker: "옛 초상",
        text: "화가가 미화한 그림이다. 윤곽과 머리색 정도만 믿을 수 있다.",
      },
      {
        speaker: "엘리너",
        text: "볕에 그을리지 않은 얼굴, 검은색에 가까운 곱슬머리, 바다빛 코트.",
      },
      {
        speaker: "홀트",
        flag: "EV_FACE",
        text: "웃을 때 왼쪽 눈썹만 올라갔고, 관자놀이엔 작은 흉터가 있었다.",
      },
    ]),

    weights: Object.freeze({ color: 0.4, edge: 0.15, structure: 0.15, palette: 0.3 }),
    passingScore: 78,
  });
})();
