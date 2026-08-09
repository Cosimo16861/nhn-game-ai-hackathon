/**
 * L0→L1 컷신 렌더러 — B_AFTER_Q0 (C1A_RETURNED_HEIR, C1B_TWELVE_YEARS_UNDER).
 *
 * dev/cutscenes/cutscene-review-l0-l1.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 *
 * renderer 인터페이스 (GAME_INTEGRATION_PLAN 5.2)
 *   preload(assetLoader) -> Promise<void>
 *   enterScene(scene, context)
 *   renderBeat(scene, beat, elapsed, context)   // 640×384 art 캔버스
 *   renderTextOverlay(scene, beat, context)     // 1920×1152 글씨 캔버스
 *   speakerStyle(speaker)
 *   leaveScene(scene, context)
 *   dispose()
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l0-l1/";
  const C0B = "assets/cutscenes/c0b/portraits/";
  const T = global.CutsceneText;
  const PAL = T.PAL;

  const ASSETS = Object.freeze({
    background: ROOT + "backgrounds/police-station-rain.png",
    portraitEvidence: ROOT + "inserts/damaged-edmund-portrait.png",
    wallEvidence: ROOT + "inserts/tavern-wall-layers.png",
    montage: "assets/q0-montage/montage-target.png",
    reedCalm: C0B + "reed-calm.png",
    reedTense: C0B + "reed-tense.png",
    reedHigh: C0B + "reed-high.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
  });

  function create() {
    let images = null;

    function px(ctx, x, y, width, height, color) {
      T.px(ctx, x, y, width, height, color);
    }

    function drawImageFit(ctx, image, x, y, width, height) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
      ctx.restore();
    }

    function drawPortrait(ctx, image, x, bottom, height, dim) {
      const width = Math.round(image.width * height / image.height);
      ctx.save();
      if (dim) ctx.filter = "brightness(" + dim + ") saturate(58%)";
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x), Math.round(bottom - height), width, height);
      ctx.restore();
      return width;
    }

    function drawBackdrop(ctx, darkness) {
      ctx.clearRect(0, 0, W, H);
      drawImageFit(ctx, images.background, 0, 0, W, H);
      if (darkness) {
        ctx.save();
        ctx.globalAlpha = darkness;
        px(ctx, 0, 0, W, H, "#050708");
        ctx.restore();
      }
    }

    function drawThird(ctx, beat) {
      const playerSpeaking = beat.speaker === "플레이어";
      const reedSpeaking = beat.speaker === "리드 경위";
      const playerImage = beat.face && beat.face.indexOf("player") === 0
        ? images[beat.face] : images.playerCalm;
      const reedImage = beat.face && beat.face.indexOf("reed") === 0
        ? images[beat.face] : images.reedCalm;
      drawPortrait(ctx, playerImage, 24, 286, 202, playerSpeaking ? null : 0.54);
      const reedHeight = 216;
      const reedWidth = Math.round(reedImage.width * reedHeight / reedImage.height);
      drawPortrait(ctx, reedImage, 610 - reedWidth, 286, reedHeight, reedSpeaking ? null : 0.54);
      px(ctx, 300, 244, 38, 3, playerSpeaking ? PAL.teal : PAL.goldDim);
    }

    function drawEvidenceFrame(ctx, image) {
      T.panel(ctx, 147, 25, 346, 226);
      drawImageFit(ctx, image, 152, 30, 336, 216);
    }

    function drawPoster(ctx) {
      drawBackdrop(ctx, 0.22);
      const x = 229;
      const y = 28;
      T.panel(ctx, x - 5, y - 5, 192, 228);
      px(ctx, x, y, 182, 218, PAL.paper);
      px(ctx, x + 8, y + 8, 166, 26, PAL.paperDark);
      drawImageFit(ctx, images.montage, x + 34, y + 43, 114, 114);
      px(ctx, x + 15, y + 168, 152, 3, PAL.inkSoft);
      px(ctx, x + 28, y + 180, 126, 3, PAL.inkSoft);
      px(ctx, x + 47, y + 192, 88, 3, PAL.inkSoft);
      drawPortrait(ctx, images.reedCalm, 492, 281, 160, 0.58);
    }

    function drawNewspaper(ctx) {
      drawBackdrop(ctx, 0.3);
      const x = 72;
      const y = 30;
      const width = 496;
      const height = 238;
      T.panel(ctx, x - 5, y - 5, width + 10, height + 10);
      px(ctx, x, y, width, height, PAL.paper);
      px(ctx, x, y, width, 2, PAL.paperDark);
      px(ctx, x + 10, y + 21, width - 20, 2, PAL.inkSoft);
      px(ctx, x + 10, y + 59, width - 20, 3, PAL.inkSoft);
      px(ctx, x + 10, y + 74, width - 20, 1, PAL.paperDark);

      // 왼쪽 단신 — 실종과 시신 미발견을 기사 구조로 보이게 한다.
      px(ctx, x + 10, y + 82, 121, 3, PAL.inkSoft);
      for (let row = 0; row < 8; row += 1) {
        px(ctx, x + 10, y + 94 + row * 11, 113 - (row % 3) * 12, 2,
          row % 2 ? PAL.paperDark : PAL.inkSoft);
      }

      // 중앙 기사 삽화 — 폭풍 속 세이렌 호. 얼굴을 선공개하지 않고 사건은 읽히게 한다.
      const imageX = x + 141;
      const imageY = y + 82;
      const imageW = 214;
      const imageH = 101;
      px(ctx, imageX - 4, imageY - 4, imageW + 8, imageH + 8, PAL.paperDark);
      px(ctx, imageX, imageY, imageW, imageH, "#81745E");
      px(ctx, imageX, imageY + 52, imageW, 49, "#504A41");
      px(ctx, imageX + 24, imageY + 26, 3, 40, "#2E2A25");
      px(ctx, imageX + 112, imageY + 17, 3, 52, "#2E2A25");
      px(ctx, imageX + 25, imageY + 27, 90, 2, "#3A342C");
      px(ctx, imageX + 55, imageY + 38, 103, 8, "#3A342C");
      px(ctx, imageX + 69, imageY + 31, 51, 7, "#665B4A");
      px(ctx, imageX + 91, imageY + 20, 12, 11, "#3A342C");
      px(ctx, imageX + 49, imageY + 46, 130, 7, "#2E2A25");
      px(ctx, imageX + 63, imageY + 53, 103, 6, "#2E2A25");
      px(ctx, imageX + 78, imageY + 59, 70, 5, "#2E2A25");
      for (let windowIndex = 0; windowIndex < 6; windowIndex += 1) {
        px(ctx, imageX + 66 + windowIndex * 15, imageY + 41, 6, 3, PAL.paperDark);
      }
      for (let wave = 0; wave < 5; wave += 1) {
        px(ctx, imageX + 8 + wave * 42, imageY + 69 + (wave % 2) * 9, 31, 3, "#A09378");
        px(ctx, imageX + 22 + wave * 38, imageY + 86 - (wave % 2) * 8, 25, 2, "#302D29");
      }
      px(ctx, imageX + 165, imageY + 8, 28, 3, PAL.paperDark);
      px(ctx, imageX + 174, imageY + 14, 18, 2, PAL.paperDark);

      // 오른쪽 단신 — 귀환 주장과 가문의 반응.
      px(ctx, x + 365, y + 82, 121, 3, PAL.inkSoft);
      for (let row = 0; row < 8; row += 1) {
        px(ctx, x + 365, y + 94 + row * 11, 113 - ((row + 1) % 3) * 11, 2,
          row % 2 ? PAL.paperDark : PAL.inkSoft);
      }

      px(ctx, x + 10, y + 198, width - 20, 25, "#9A896C");
      px(ctx, x + 10, y + 226, width - 20, 2, PAL.inkSoft);
    }

    return {
      id: "l0-l1",
      assets: ASSETS,

      preload(assetLoader) {
        return assetLoader.loadImageMap(ASSETS).then((loaded) => {
          images = loaded;
        });
      },

      enterScene() {},

      renderBeat(scene, beat, elapsed, context) {
        const ctx = context.ctx;
        if (beat.view === "poster") {
          drawPoster(ctx);
        } else if (beat.view === "newspaper") {
          drawNewspaper(ctx);
        } else {
          drawBackdrop(ctx, beat.view === "third" ? 0.1 : 0.34);
          if (beat.view === "third") drawThird(ctx, beat);
          if (beat.view === "portrait") drawEvidenceFrame(ctx, images.portraitEvidence);
          if (beat.view === "wall") drawEvidenceFrame(ctx, images.wallEvidence);
        }
      },

      renderTextOverlay(scene, beat, context) {
        const textCtx = context.textCtx;
        textCtx.textAlign = "center";
        textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        if (beat.view === "poster") {
          textCtx.fillStyle = PAL.inkSoft;
          textCtx.fillText("수배 전단", 320, 42);
          textCtx.save();
          textCtx.translate(365, 209);
          textCtx.rotate(-0.12);
          textCtx.font = '900 22px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = "#8D302B";
          textCtx.fillText("검거", 0, 0);
          textCtx.restore();
        } else if (beat.view === "newspaper") {
          textCtx.textAlign = "left";
          textCtx.font = '900 8px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = PAL.inkSoft;
          textCtx.fillText("안개항 일보", 84, 36);
          textCtx.textAlign = "right";
          textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillText("제408호 · 10월 14일", 556, 37);
          textCtx.textAlign = "center";
          textCtx.font = '900 16px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = PAL.inkSoft;
          textCtx.fillText("아셔튼 가의 상속자, 12년 만에 귀환?", 320, 58);
          textCtx.font = '700 8px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = "#40382E";
          textCtx.fillText("세이렌 호 침몰 실종자 에드먼드 · 토마스 카버, 생존자라 주장", 320, 79);

          textCtx.textAlign = "left";
          textCtx.font = '900 9px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = PAL.inkSoft;
          textCtx.fillText("시신 없는 실종", 84, 116);
          textCtx.fillText("가문은 확인 중", 437, 116);
          textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = "#645847";
          textCtx.fillText("12년 전 침몰 뒤", 84, 131);
          textCtx.fillText("시신은 발견되지 않았다.", 84, 142);
          textCtx.fillText("엘리너 아셔튼은", 437, 131);
          textCtx.fillText("사망 신고를 거부했다.", 437, 142);

          textCtx.textAlign = "center";
          textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = PAL.paper;
          textCtx.fillText("12년 전 폭풍 속에서 침몰한 세이렌 호", 320, 206);
          textCtx.font = '900 10px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillStyle = PAL.inkSoft;
          textCtx.fillText("경찰, 토마스 카버 신원 확인 착수", 320, 237);
        } else if (beat.view === "portrait") {
          textCtx.fillStyle = PAL.cream;
          textCtx.fillText("엘리너 아셔튼의 쪽지 · 훼손된 옛 초상", 320, 36);
        } else if (beat.view === "wall") {
          textCtx.fillStyle = PAL.cream;
          textCtx.fillText("코라의 서면 진술 · 선술집 벽 탁본", 320, 36);
        }
        textCtx.textAlign = "left";
      },

      speakerStyle(speaker) {
        if (speaker === "코라의 진술") return { accent: PAL.rust, text: PAL.rustText };
        return T.defaultSpeakerStyle(speaker);
      },

      leaveScene() {},

      dispose() {
        images = null;
      },
    };
  }

  global.CutsceneRendererL0L1 = Object.freeze({ id: "l0-l1", ASSETS, create });
  global.CutsceneRegistry?.registerRenderer("l0-l1", create);
})(typeof window !== "undefined" ? window : globalThis);
