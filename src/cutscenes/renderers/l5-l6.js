/**
 * L5-L6 컷신 렌더러 — B_AFTER_Q5A · B_AFTER_Q5B.
 *
 * dev/cutscenes/cutscene-review-l5-l6.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l5-l6/";
  const C0B = "assets/cutscenes/c0b/portraits/";
  const L1L2 = "assets/cutscenes/l1-l2/portraits/";
  const TYPE_MS = 34;
  const INPUT_LOCK_MS = 120;

  const PAL = Object.freeze({
    ink: "#171310",
    inkSoft: "#2E241E",
    panel: "#1D1814",
    panelLight: "#3E332A",
    cream: "#E9DFC9",
    creamDim: "#B8AD96",
    gold: "#D8A94B",
    goldDim: "#8F6E31",
    teal: "#4A7471",
    rust: "#A05C43",
    blue: "#6D9397",
    rain: "#779DA3",
    chalk: "#D5CBAF",
    paper: "#C9B991",
    red: "#8D3532",
  });

  const T = global.CutsceneText;

  const ASSETS = Object.freeze({
    police: ROOT + "backgrounds/police-evidence-room-night.png",
    office: ROOT + "backgrounds/office-evidence-wall-dawn.png",
    siren: ROOT + "inserts/siren-night-memory.png",
    wanted: ROOT + "evidence/EV_WANTED.png",
    idealized: ROOT + "evidence/EV_IDEALIZED.png",
    trueFace: ROOT + "evidence/EV_TRUE_FACE.png",
    seal3: ROOT + "evidence/EV_SEAL_3.png",
    ledger: ROOT + "evidence/EV_LEDGER_TC.png",
    carriage4: ROOT + "evidence/EV_CARRIAGE_4.png",
    banksCalm: ROOT + "portraits/banks-calm.png",
    banksHigh: ROOT + "portraits/banks-high.png",
    banksTense: ROOT + "portraits/banks-tense.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
    reedCalm: C0B + "reed-calm.png",
    reedHigh: C0B + "reed-high.png",
    reedTense: C0B + "reed-tense.png",
    holtCalm: L1L2 + "holt-calm.png",
    holtHigh: L1L2 + "holt-high.png",
  });

  const params = new URLSearchParams(window.location.search);
  const bundleKey = params.get("bundle") === "q5b" ? "q5b" : "q5a";
  const q5aState = params.get("q5a") === "complete" ? "complete" : "incomplete";

  function create() {
    let images = null;
    let ctx = null;

    function px(x, y, width, height, color) {
      T.px(ctx, x, y, width, height, color);
    }

    function panel(x, y, width, height) {
      T.panel(ctx, x, y, width, height);
    }

  function drawImageFit(image, x, y, width, height) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    ctx.restore();
  }

  function drawBackdrop(image, darkness) {
    ctx.clearRect(0, 0, W, H);
    drawImageFit(image, 0, 0, W, H);
    if (darkness) {
      ctx.save();
      ctx.globalAlpha = darkness;
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
  }

  function drawPortrait(image, x, bottom, height, dim, slide) {
    const width = Math.round(image.width * height / image.height);
    ctx.save();
    if (dim) ctx.filter = "brightness(" + dim + ") saturate(62%)";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round(x + (slide || 0)), Math.round(bottom - height), width, height);
    ctx.restore();
    return width;
  }

  function drawPair(leftImage, leftSpeaking, rightImage, rightSpeaking) {
    drawPortrait(leftImage, 22, 286, 208, leftSpeaking ? null : 0.52);
    const rightHeight = 218;
    const rightWidth = Math.round(rightImage.width * rightHeight / rightImage.height);
    drawPortrait(rightImage, 618 - rightWidth, 286, rightHeight, rightSpeaking ? null : 0.52);
  }

  function drawMoonWaves(cx, cy, waveCount, scale, color, chalk) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = chalk ? 3 * scale : 2 * scale;
    ctx.lineCap = chalk ? "butt" : "round";
    ctx.beginPath();
    ctx.arc(cx, cy - 29 * scale, 18 * scale, Math.PI * 0.3, Math.PI * 1.7);
    ctx.arc(cx + 8 * scale, cy - 29 * scale, 15 * scale, Math.PI * 1.65, Math.PI * 0.35, true);
    for (let index = 0; index < waveCount; index += 1) {
      const y = cy + index * 13 * scale;
      ctx.moveTo(cx - 35 * scale, y);
      ctx.bezierCurveTo(cx - 22 * scale, y - 8 * scale, cx - 12 * scale, y + 8 * scale, cx, y);
      ctx.bezierCurveTo(cx + 12 * scale, y - 8 * scale, cx + 22 * scale, y + 8 * scale, cx + 35 * scale, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawEvidenceCard(x, y, width, height, waves, kind, glow) {
    panel(x, y, width, height);
    px(x + 7, y + 7, width - 14, height - 14, kind === "chalk" ? "#26302C" : "#9A8767");
    ctx.save();
    if (glow && kind !== "seal") {
      ctx.globalAlpha = 0.16 + Math.sin(performance.now() / 180) * 0.04;
      px(x + 5, y + 5, width - 10, height - 10, PAL.gold);
    }
    ctx.restore();
    drawMoonWaves(x + width / 2, y + 53, waves, 0.72, kind === "chalk" ? PAL.chalk : "#3A2920", kind === "chalk");
    if (kind === "door") {
      px(x + 15, y + 15, 3, height - 30, "#513B2C");
      px(x + width - 18, y + 15, 3, height - 30, "#513B2C");
      px(x + width - 31, y + height / 2, 6, 6, PAL.goldDim);
    }
    if (kind === "seal") {
      ctx.save();
      ctx.strokeStyle = "#63352E";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height / 2 - 20, Math.min(width, height) * 0.27, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      if (glow) {
        ctx.save();
        ctx.globalAlpha = 0.48 + Math.sin(performance.now() / 170) * 0.18;
        drawMoonWaves(x + width / 2, y + 53, waves, 0.72, "#F2D991", false);
        ctx.restore();
      }
    }
  }

  function drawCompare(view, local) {
    const reveal = view === "carriageFour" ? Math.min(4, Math.floor(Math.max(0, local - 420) / 420) + 1) : 4;
    if (view === "carriageFour") {
      drawEvidenceCard(177, 35, 286, 210, reveal, "door", true);
      return;
    }
    if (view === "threeSources" || view === "linkCarver") {
      drawEvidenceCard(110, 56, 180, 160, 3, "seal", false);
      drawEvidenceCard(350, 56, 180, 160, 4, "door", view === "linkCarver");
      if (view === "linkCarver") {
        ctx.save();
        ctx.strokeStyle = PAL.red;
        ctx.lineWidth = 3;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(290, 136);
        ctx.lineTo(350, 136);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    drawEvidenceCard(82, 43, 210, 184, 4, "door", false);
    drawEvidenceCard(348, 43, 210, 184, 3, "seal", true);
  }

  function drawDust(now) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    for (let index = 0; index < 20; index += 1) {
      const x = 32 + (index * 41) % 570;
      const y = 38 + ((index * 37 + now / 42) % 215);
      px(x, y, 1, 1, "#D8C28A");
    }
    ctx.restore();
  }

  const WALL_CARDS = Object.freeze([
    { x: 52, y: 58, w: 96, h: 62, label: "수배화", image: "wanted", kind: "wanted" },
    { x: 184, y: 40, w: 96, h: 62, label: "미화 초상", image: "idealized", kind: "idealized" },
    { x: 316, y: 58, w: 96, h: 62, label: "복원 얼굴", image: "trueFace", kind: "trueFace" },
    { x: 448, y: 40, w: 96, h: 62, label: "진품 봉인", image: "seal3", kind: "seal3" },
    { x: 156, y: 156, w: 96, h: 62, label: "장부", image: "ledger", kind: "ledger" },
    { x: 388, y: 152, w: 96, h: 62, label: "마차 기억", image: "carriage4", kind: "carriage4" },
  ]);

  function drawWallEvidenceOverlay(card) {
    if (card.kind === "idealized") {
      ctx.save();
      ctx.globalAlpha = 0.84;
      px(card.x + 4, card.y + 4, 25, 11, PAL.ink);
      ctx.restore();
    }
    if (card.kind === "trueFace") {
      ctx.save();
      ctx.globalAlpha = 0.88;
      px(card.x + 8, card.y + card.h - 15, card.w - 16, 12, PAL.ink);
      ctx.strokeStyle = PAL.rust;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(card.x + 37, card.y + 42);
      ctx.lineTo(card.x + 48, card.y + 51);
      ctx.lineTo(card.x + 59, card.y + 42);
      ctx.moveTo(card.x + 62, card.y + 17);
      ctx.lineTo(card.x + 67, card.y + 22);
      ctx.stroke();
      ctx.restore();
    }
    if (card.kind === "seal3" || card.kind === "carriage4") {
      ctx.save();
      ctx.globalAlpha = 0.82;
      px(card.x + 28, card.y + 7, 40, 42, card.kind === "seal3" ? "#6F302E" : "#382A22");
      ctx.restore();
      drawMoonWaves(
        card.x + card.w / 2,
        card.y + 27,
        card.kind === "seal3" ? 3 : 4,
        0.26,
        "#F1D59B",
        false
      );
    }
    if (card.kind === "ledger") {
      ctx.save();
      ctx.globalAlpha = 0.88;
      px(card.x + 25, card.y + 12, 46, 34, PAL.ink);
      ctx.restore();
    }
  }

  function drawWallCards(effect, local, now) {
    WALL_CARDS.forEach(function (card, index) {
      const appear = effect === "cards" ? Math.min(1, Math.max(0, local - index * 110) / 280) : 1;
      if (appear <= 0) return;
      ctx.save();
      ctx.globalAlpha = appear;
      px(card.x + 3, card.y + 3, card.w, card.h, "#15110E");
      drawImageFit(images[card.image], card.x, card.y, card.w, card.h);
      drawWallEvidenceOverlay(card);
      px(card.x + card.w / 2 - 2, card.y - 3, 4, 6, index === 5 ? PAL.red : PAL.goldDim);
      ctx.restore();
    });

    if (effect === "thread" || effect === "threadPulse") {
      const centers = WALL_CARDS.map(function (card) { return [card.x + card.w / 2, card.y + card.h / 2]; });
      ctx.save();
      ctx.strokeStyle = PAL.red;
      ctx.lineWidth = 2;
      ctx.globalAlpha = effect === "threadPulse" ? 0.72 + Math.sin(now / 150) * 0.2 : 0.76;
      ctx.beginPath();
      ctx.moveTo(centers[0][0], centers[0][1]); ctx.lineTo(centers[1][0], centers[1][1]);
      ctx.moveTo(centers[1][0], centers[1][1]); ctx.lineTo(centers[2][0], centers[2][1]);
      ctx.moveTo(centers[2][0], centers[2][1]); ctx.lineTo(centers[3][0], centers[3][1]);
      ctx.moveTo(centers[2][0], centers[2][1]); ctx.lineTo(centers[4][0], centers[4][1]);
      ctx.moveTo(centers[4][0], centers[4][1]); ctx.lineTo(centers[5][0], centers[5][1]);
      ctx.stroke();
      ctx.setLineDash([4, 5]);
      ctx.globalAlpha = 0.38;
      ctx.beginPath();
      ctx.moveTo(centers[3][0], centers[3][1]);
      ctx.lineTo(centers[5][0] - 30, centers[5][1]);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRain(now, strength) {
    ctx.save();
    ctx.globalAlpha = strength;
    for (let index = 0; index < 32; index += 1) {
      const x = (index * 43 + 19) % W;
      const y = (index * 29 + now / 8) % 270;
      px(x, y, 1, 8, PAL.rain);
    }
    ctx.restore();
  }

  function drawSirenMemory(darkness, now) {
    ctx.clearRect(0, 0, W, H);
    drawImageFit(images.siren, -13, -25, 666, 400);
    if (darkness) {
      ctx.save();
      ctx.globalAlpha = darkness;
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = 0.48 + Math.sin(now / 210) * 0.08;
    px(320, 207, 7, 3, "#C6B7A0");
    px(338, 207, 7, 3, "#C6B7A0");
    px(324, 210, 3, 3, "#8EA4A6");
    px(338, 210, 3, 3, "#8EA4A6");
    ctx.restore();
  }

  function drawScene(beat, local, now) {
    const speakerIsPlayer = beat.speaker === "플레이어";
    if (beat.view === "carriageFour" || beat.view.indexOf("compare") === 0 || beat.view === "threeSources" || beat.view === "linkCarver") {
      drawBackdrop(images.police, 0.34);
      drawCompare(beat.view, local);
      if (beat.view === "compareHolt") {
        const width = Math.round(images[beat.face].width * 194 / images[beat.face].height);
        drawPortrait(images[beat.face], 623 - width, 286, 194, null);
      } else if (beat.view === "compareReed") {
        drawPortrait(images[beat.face], 26, 286, 202, null);
      } else if (beat.view !== "threeSources" && beat.view !== "linkCarver") {
        drawPortrait(speakerIsPlayer ? images[beat.face] : images.playerCalm, 22, 286, 196, speakerIsPlayer ? null : 0.50);
      }
      drawRain(now, 0.16);
    } else if (beat.view.indexOf("office") === 0 || beat.view.indexOf("evidenceWall") === 0 || beat.view === "openThread") {
      drawBackdrop(images.office, 0.14);
      drawDust(now);
      if (beat.view !== "officeArrival") drawWallCards(beat.effect, local, now);
      if (beat.view === "officeArrival") drawPair(images.playerCalm, false, images[beat.face], true);
      if (beat.view === "evidenceWallHolt") {
        drawPortrait(images[beat.face], 18, 286, 145, null);
      }
      if (beat.view === "openThread") drawPortrait(images[beat.face], 12, 286, 145, null);
      if (beat.effect === "fadeIn") {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - local / 900);
        px(0, 0, W, H, "#050708");
        ctx.restore();
      }
    } else {
      drawSirenMemory(beat.view === "banksFirst" ? 0.52 : beat.view === "sirenHold" ? 0.07 : 0.13, now);
      const stormStrength = beat.effect === "stormStop" ? Math.max(0, 0.36 - local / 9000) : 0.03;
      drawRain(now, stormStrength);
      if (beat.effect === "memoryWarm" || beat.effect === "warmFade") {
        ctx.save();
        ctx.globalAlpha = beat.effect === "warmFade" ? Math.min(0.30, local / 2600) : 0.13;
        px(0, 0, W, H, "#7B4C2D");
        ctx.restore();
      }
      if (beat.view === "sirenBanks") {
        const rightHeight = 218;
        const rightWidth = Math.round(images[beat.face].width * rightHeight / images[beat.face].height);
        drawPortrait(images[beat.face], 620 - rightWidth, 286, rightHeight, null);
      }
      if (beat.view === "sirenPair") drawPair(images[beat.face], speakerIsPlayer, images.banksCalm, !speakerIsPlayer);
      if (beat.view === "banksFirst") {
        const height = 240;
        const width = Math.round(images[beat.face].width * height / images[beat.face].height);
        drawPortrait(images[beat.face], (W - width) / 2, 286, height, null);
      }
      if (beat.view === "sirenClose") {
        panel(40, 34, 390, 212);
        ctx.save();
        ctx.beginPath();
        ctx.rect(46, 40, 378, 200);
        ctx.clip();
        drawImageFit(images.siren, -22, -30, 500, 300);
        ctx.restore();
        const rightHeight = 196;
        const rightWidth = Math.round(images[beat.face].width * rightHeight / images[beat.face].height);
        drawPortrait(images[beat.face], 620 - rightWidth, 286, rightHeight, null);
      }
    }
  }

  function drawSceneLabels(textCtx, beat) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (beat.view.indexOf("compare") === 0) {
      textCtx.fillText("마차 문 · 네 줄", 187, 52);
      textCtx.fillText("진품 봉인 · 세 줄", 453, 52);
    }
    if (beat.view === "threeSources" || beat.view === "linkCarver") {
      textCtx.fillText("Q3A 진품 · 세 줄", 200, 220);
      textCtx.fillText("Q5A 마차 · 네 줄", 440, 220);
    }
    if (beat.view.indexOf("evidenceWall") === 0 || beat.view === "openThread") {
      WALL_CARDS.forEach(function (card) {
        textCtx.fillStyle = PAL.cream;
        textCtx.font = '700 9px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        textCtx.fillText(card.label, card.x + card.w / 2, card.y + card.h + 3);
        textCtx.font = '800 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        if (card.kind === "idealized") textCtx.fillText("미화", card.x + 16, card.y + 6);
        if (card.kind === "trueFace") textCtx.fillText("각진 턱 · 흉터", card.x + card.w / 2, card.y + card.h - 13);
        if (card.kind === "seal3") textCtx.fillText("봉인 · 3줄", card.x + card.w / 2, card.y + card.h - 13);
        if (card.kind === "ledger") {
          textCtx.font = '900 9px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
          textCtx.fillText("T.C.", card.x + card.w / 2, card.y + 17);
          textCtx.fillText("4 MO", card.x + card.w / 2, card.y + 31);
        }
        if (card.kind === "carriage4") textCtx.fillText("마차 · 4줄", card.x + card.w / 2, card.y + card.h - 13);
      });
    }
    textCtx.textAlign = "left";
  }

    return {
      id: "l5-l6",
      assets: ASSETS,

      preload(assetLoader) {
        return assetLoader.loadImageMap(ASSETS).then((loaded) => { images = loaded; });
      },

      enterScene() {},

      renderBeat(scene, beat, local, context) {
        ctx = context.ctx;
        drawScene(beat, local, context.now);
      },

      renderTextOverlay(scene, beat, context) {
        drawSceneLabels(context.textCtx, beat);
      },

      nameBoxWidth(speaker) {
        return speaker === "플레이어" ? 88 : 82;
      },

      speakerStyle(speaker) {
        const accent = speaker === "플레이어" ? PAL.teal
          : speaker === "리드" ? PAL.rust
            : speaker === "홀트" ? PAL.blue : PAL.gold;
        const text = speaker === "플레이어" ? "#9BC0B6"
          : speaker === "리드" ? "#D28B73"
            : speaker === "홀트" ? "#9FC3C7" : "#E0C77D";
        return { accent, text };
      },

      leaveScene() {},

      dispose() { images = null; ctx = null; },
    };
  }

  const RENDERER_ID = "l5-l6";
  global.CutsceneRenderer_l5_l6 = Object.freeze({ id: RENDERER_ID, ASSETS, create });
  global.CutsceneRegistry?.registerRenderer(RENDERER_ID, create);
})(typeof window !== "undefined" ? window : globalThis);
