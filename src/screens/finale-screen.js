/**
 * Q6 증거의 방 — 마지막 추리 단계.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 9.1
 *
 * Q6 는 복원 퀘스트가 아니다. 그림을 그리지 않고, 이미 그린 여섯 장을 주장에 잇는다.
 *
 * 계약
 *   - 본선 여섯 장을 ArtworkStore 썸네일에서 읽는다.
 *   - 없으면 assets/cutscenes/l5-l6/evidence 를 fallback 으로 쓴다.
 *   - 여섯 연결이 모두 맞아야 완료다. 그전에는 엔딩이 재생되지 않는다.
 *   - 도중에 나가도 연결 상태가 남는다(ProgressStore 플래그).
 *
 * 화면은 640×384 도트 한 장이다. HTML 패널을 섞지 않는다.
 */
(function (global) {
  "use strict";

  const LINK_FLAG_PREFIX = "Q6_LINKED_";

  /**
   * 여섯 증거와 그것이 증명하는 주장.
   * 카드 이미지는 플레이어의 복원 결과이고, fallback 은 컷신용 완성본이다.
   */
  const LINKS = Object.freeze([
    Object.freeze({
      questId: "Q0_MONTAGE", card: "골목의 손",
      claim: "말이 아니라 그림이 사람을 찾는다",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_WANTED.png",
    }),
    Object.freeze({
      questId: "Q1A_IDEALIZED", card: "미화된 초상",
      claim: "어머니의 기억은 미화됐다",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_IDEALIZED.png",
    }),
    Object.freeze({
      questId: "Q2A_TRUE_FACE", card: "기억되지 않은 얼굴",
      claim: "카버는 에드먼드가 아니다",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_TRUE_FACE.png",
    }),
    Object.freeze({
      questId: "Q3A_SEAL", card: "봉인의 세 줄",
      claim: "진품 인장은 파도 세 줄",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_SEAL_3.png",
    }),
    Object.freeze({
      questId: "Q4A_LEDGER", card: "번진 장부",
      claim: "넉 달 동안 T.C.에게 지급됐다",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_LEDGER_TC.png",
    }),
    Object.freeze({
      questId: "Q5A_DOCK", card: "안개 낀 부두",
      claim: "카버가 외운 문양은 마차의 네 줄",
      fallback: "assets/cutscenes/l5-l6/evidence/EV_CARRIAGE_4.png",
    }),
  ]);

  const REQUIRED_QUEST_IDS = Object.freeze(LINKS.map((link) => link.questId));

  // 판 위 주장 슬롯과 책상 위 카드 자리. 640×384 좌표계다.
  const SLOT = Object.freeze({ x: 330, y: 60, w: 268, h: 34, gap: 6 });
  const CARD = Object.freeze({ x: 28, y: 62, w: 82, h: 62, gap: 8 });

  function linkFlag(questId) {
    return LINK_FLAG_PREFIX + questId;
  }

  /** 여섯 연결이 모두 끝났는가. Director 의 엔딩 진입 조건이다. */
  function isSolved(progressStore) {
    return LINKS.every((link) => progressStore.has(linkFlag(link.questId)));
  }

  function mount(container, options) {
    const stage = container.querySelector('[data-role="finale-stage"]');
    const progressStore = options.progressStore;
    const artworkStore = options.artworkStore;

    const S = global.PixelScreen;
    const P = S.PAL;
    const screen = S.mount(stage, { reserveHeight: options.reserveHeight ?? 0 });
    const ctx = screen.ctx;

    let disposed = false;
    let selectedIndex = -1;
    let message = "증거 한 장을 고르고, 그것이 증명하는 주장에 실을 이으세요.";
    const thumbnails = new Map();
    const objectUrls = [];

    function isLinked(index) {
      return progressStore.has(linkFlag(LINKS[index].questId));
    }

    function slotRect(index) {
      return {
        x: SLOT.x, y: SLOT.y + index * (SLOT.h + SLOT.gap), w: SLOT.w, h: SLOT.h,
      };
    }

    function cardRect(index) {
      const column = index % 2;
      const row = Math.floor(index / 2);
      return {
        x: CARD.x + column * (CARD.w + CARD.gap),
        y: CARD.y + row * (CARD.h + CARD.gap),
        w: CARD.w, h: CARD.h,
      };
    }

    // ── 그리기 ───────────────────────────────────────────────────────

    function drawCard(index) {
      const rect = cardRect(index);
      const linked = isLinked(index);
      const selected = selectedIndex === index;
      S.px(ctx, rect.x + 3, rect.y + 4, rect.w, rect.h, P.shadow);
      S.px(ctx, rect.x, rect.y, rect.w, rect.h, P.ink);
      S.px(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4,
        linked ? P.complete : selected ? P.gold : P.cream);

      const image = thumbnails.get(LINKS[index].questId);
      if (image) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 24);
        ctx.restore();
      } else {
        S.px(ctx, rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 24, P.paperBack);
      }
      S.px(ctx, rect.x + 4, rect.y + rect.h - 18, rect.w - 8, 14, P.paper);
      S.text(ctx, LINKS[index].card, rect.x + rect.w / 2, rect.y + rect.h - 18, {
        size: 8, color: P.ink, align: "center", weight: "700", boxHeight: 14,
      });
      // 압정 하나. 이미 이은 카드는 붉은 실이 나간다.
      S.px(ctx, rect.x + rect.w / 2 - 2, rect.y - 2, 5, 5, linked ? P.threadRed : P.pinBrass);
    }

    function drawSlot(index) {
      const rect = slotRect(index);
      const linked = isLinked(index);
      S.px(ctx, rect.x + 2, rect.y + 3, rect.w, rect.h, P.shadow);
      S.px(ctx, rect.x, rect.y, rect.w, rect.h, P.ink);
      S.px(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4,
        linked ? P.completeLit : P.panel);
      S.text(ctx, LINKS[index].claim, rect.x + 12, rect.y, {
        size: 9.5, color: linked ? P.ink : P.creamDim, weight: "700", boxHeight: rect.h,
      });
      S.px(ctx, rect.x + 4, rect.y + rect.h / 2 - 2, 4, 4, linked ? P.threadRed : P.corkHole);
    }

    /** 카드 압정에서 주장 슬롯까지 늘어진 붉은 실. */
    function drawThread(index) {
      const from = cardRect(index);
      const to = slotRect(index);
      const x1 = from.x + from.w / 2;
      const y1 = from.y - 2;
      const x2 = to.x + 6;
      const y2 = to.y + to.h / 2;
      ctx.save();
      ctx.strokeStyle = P.threadRedLit;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 26, x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    function draw() {
      if (disposed) return;
      screen.clearText();
      global.Office.drawRoom(ctx, { fog: 0 });

      // 증거판
      S.px(ctx, 316, 40, 300, 300, P.frameDark);
      S.px(ctx, 320, 44, 292, 292, P.cork);
      S.text(ctx, "증거의 방", 466, 20, {
        size: 12, color: P.cream, align: "center", weight: "800", boxHeight: 18,
      });

      LINKS.forEach((_, index) => drawSlot(index));
      LINKS.forEach((_, index) => { if (isLinked(index)) drawThread(index); });
      LINKS.forEach((_, index) => drawCard(index));

      const done = LINKS.filter((_, index) => isLinked(index)).length;
      S.chamfer(ctx, 22, 300, 276, 26, P.panelEdge, 3);
      S.chamfer(ctx, 24, 302, 272, 22, P.panel, 2);
      S.text(ctx, message, 160, 302, {
        size: 9.5, color: P.cream, align: "center", weight: "600", boxHeight: 22,
      });
      S.text(ctx, `${done} / ${LINKS.length}`, 160, 332, {
        size: 9, color: P.creamDim, align: "center", weight: "700", boxHeight: 14,
      });

      rebuildHotspots();
    }

    // ── 조작 ─────────────────────────────────────────────────────────

    function selectCard(index) {
      if (isLinked(index)) {
        message = "이미 이어 둔 증거입니다.";
        draw();
        return;
      }
      selectedIndex = index;
      message = `‘${LINKS[index].card}’를 골랐습니다. 증명하는 주장을 고르세요.`;
      draw();
      screen.say(message);
    }

    function selectSlot(index) {
      if (isLinked(index)) {
        message = "이 주장은 이미 증명됐습니다.";
        draw();
        return;
      }
      if (selectedIndex < 0) {
        message = "먼저 책상 위 증거를 고르세요.";
        draw();
        return;
      }
      if (selectedIndex !== index) {
        message = "그 증거는 이 주장을 증명하지 못합니다.";
        selectedIndex = -1;
        draw();
        screen.say(message);
        return;
      }

      try {
        progressStore.setFlag(linkFlag(LINKS[index].questId));
      } catch (error) {
        console.error("[finale] 연결 상태를 저장하지 못했습니다.", error);
        message = "연결을 저장하지 못했습니다. 다시 시도하세요.";
        draw();
        return;
      }
      selectedIndex = -1;
      message = "실을 이었습니다.";
      draw();

      if (isSolved(progressStore)) {
        message = "여섯 장이 한곳을 가리킵니다.";
        draw();
        screen.say(message);
        options.onSolved?.();
      }
    }

    function rebuildHotspots() {
      screen.clearHotspots();
      LINKS.forEach((link, index) => {
        const rect = cardRect(index);
        screen.hotspot(rect.x, rect.y - 4, rect.w, rect.h + 4, {
          label: `증거 ${link.card}` + (isLinked(index) ? " — 이미 이었다" : " 고르기"),
          disabled: isLinked(index),
          onClick: () => selectCard(index),
        });
      });
      LINKS.forEach((link, index) => {
        const rect = slotRect(index);
        screen.hotspot(rect.x, rect.y, rect.w, rect.h, {
          label: `주장 ${link.claim}` + (isLinked(index) ? " — 증명됨" : " 에 잇기"),
          disabled: isLinked(index),
          onClick: () => selectSlot(index),
        });
      });
      screen.hotspot(22, 300, 276, 26, {
        label: "증거판으로 돌아가기",
        onClick: () => options.onBackToBoard?.(),
      });
    }

    // ── 증거 카드 그림 ───────────────────────────────────────────────

    function loadFallback(link) {
      return global.AssetLoader.loadImage(link.fallback).catch((error) => {
        console.warn("[finale] 증거 대체 이미지를 불러오지 못했습니다.", link.questId, error);
        return null;
      });
    }

    async function loadThumbnails() {
      for (const link of LINKS) {
        if (disposed) return;
        let image = null;
        try {
          const record = await artworkStore?.loadThumbnail(link.questId);
          if (record?.blob && typeof global.createImageBitmap === "function") {
            image = await global.createImageBitmap(record.blob);
          }
        } catch (error) {
          console.warn("[finale] 복원 결과를 불러오지 못했습니다.", link.questId, error);
        }
        // 결과가 없는 구 세이브는 컷신용 완성본으로 대신한다.
        if (!image) image = await loadFallback(link);
        if (disposed || !image) continue;
        thumbnails.set(link.questId, image);
        draw();
      }
    }

    draw();
    loadThumbnails();

    return Object.freeze({
      LINKS,
      dispose() {
        disposed = true;
        global.removeEventListener("resize", screen.fit);
        objectUrls.forEach((url) => global.URL.revokeObjectURL(url));
        thumbnails.forEach((image) => image.close?.());
        thumbnails.clear();
        screen.root.remove();
        stage.replaceChildren();
      },
    });
  }

  global.FinaleScreen = Object.freeze({
    LINKS, REQUIRED_QUEST_IDS, LINK_FLAG_PREFIX, linkFlag, isSolved, mount,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = global.FinaleScreen;
})(typeof window !== "undefined" ? window : globalThis);
