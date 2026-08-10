/**
 * L2-L3 컷신 렌더러 — B_AFTER_Q2A · B_AFTER_Q2B · B_AFTER_Q2C.
 *
 * dev/cutscenes/cutscene-review-l2-l3.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l2-l3/";
  const C0B = "assets/cutscenes/c0b/portraits/";
  const L1L2 = "assets/cutscenes/l1-l2/portraits/";
  const TYPE_MS = 31;
  const INPUT_LOCK_MS = 120;

  const PAL = Object.freeze({
    ink: "#171310",
    inkSoft: "#2e241e",
    panel: "#1d1814",
    panelLight: "#3e332a",
    cream: "#e9dfc9",
    creamDim: "#b8ad96",
    gold: "#d8a94b",
    goldDim: "#8f6e31",
    teal: "#4a7471",
    rust: "#a05c43",
    blue: "#6d9397",
    rain: "#779da3",
    chalk: "#d5cbaf",
    red: "#c96355",
  });

  const T = global.CutsceneText;

  const ASSETS = Object.freeze({
    police: ROOT + "backgrounds/police-station-rain.png",
    dock: ROOT + "backgrounds/dock-warehouse-dusk.png",
    childRoom: ROOT + "backgrounds/open-child-room.png",
    trueFace: ROOT + "inserts/restored-true-face.png",
    flyer: ROOT + "inserts/completed-cat-flyer.png",
    letterWax: ROOT + "inserts/letter-and-broken-wax.png",
    anchorWrist: ROOT + "inserts/fresh-anchor-wrist.png",
    childDrawing: ROOT + "inserts/transferred-child-drawing.png",
    carverCalm: ROOT + "portraits/carver-calm.png",
    carverHigh: ROOT + "portraits/carver-high.png",
    carverTense: ROOT + "portraits/carver-tense.png",
    julianCalm: ROOT + "portraits/julian-calm.png",
    julianHigh: ROOT + "portraits/julian-high.png",
    julianTense: ROOT + "portraits/julian-tense.png",
    dockworkerCalm: ROOT + "portraits/dockworker-calm.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
    reedCalm: C0B + "reed-calm.png",
    reedHigh: C0B + "reed-high.png",
    reedTense: C0B + "reed-tense.png",
    eleanorCalm: L1L2 + "eleanor-calm.png",
    eleanorHigh: L1L2 + "eleanor-high.png",
    eleanorTense: L1L2 + "eleanor-tense.png",
    holtCalm: L1L2 + "holt-calm.png",
    coraCalm: L1L2 + "cora-calm.png",
    coraHigh: L1L2 + "cora-high.png",
    coraTense: L1L2 + "cora-tense.png",
  });

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

  function drawPortrait(image, x, bottom, height, dim, slide) {
    const width = Math.round(image.width * height / image.height);
    ctx.save();
    if (dim) ctx.filter = "brightness(" + dim + ") saturate(62%)";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round(x + (slide || 0)), Math.round(bottom - height), width, height);
    ctx.restore();
    return width;
  }

  function drawBackdrop(key, darkness) {
    ctx.clearRect(0, 0, W, H);
    drawImageFit(images[key], 0, 0, W, H);
    if (darkness) {
      ctx.save();
      ctx.globalAlpha = darkness;
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
  }

  function drawPair(npcImage, npcSpeaking, playerSpeaking, playerImage, slide) {
    drawPortrait(playerSpeaking ? (playerImage || images.playerReady) : images.playerCalm, 22, 286, 204, playerSpeaking ? null : 0.5);
    const npcHeight = 210;
    const npcWidth = Math.round(npcImage.width * npcHeight / npcImage.height);
    drawPortrait(npcImage, 614 - npcWidth, 286, npcHeight, npcSpeaking ? null : 0.5, slide);
  }

  function drawEvidence(image, zoom) {
    const amount = zoom || 0;
    panel(147 - amount, 25 - amount, 346 + amount * 2, 226 + amount * 2);
    drawImageFit(image, 152 - amount, 30 - amount, 336 + amount * 2, 216 + amount * 2);
  }

  function drawRain(now, dock) {
    ctx.save();
    ctx.globalAlpha = dock ? 0.12 : 0.22;
    for (let index = 0; index < 24; index += 1) {
      const x = (index * 47 + (dock ? 19 : 7)) % W;
      const y = (index * 31 + now / (dock ? 20 : 11)) % 270;
      px(x, y, 1, dock ? 2 : 6, PAL.rain);
    }
    ctx.restore();
  }

  function drawCompare(feature, now) {
    drawBackdrop("police", 0.28);
    panel(42, 34, 246, 208);
    panel(352, 34, 246, 208);
    px(49, 41, 232, 194, "#292b27");
    // Extract the portrait itself from the 336×216 evidence plate, then crop both heads
    // to the same 178px display height. This preserves the approved Q2A pixels.
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images.trueFace, 104, 18, 130, 164, 94, 52, 141, 178);
    ctx.restore();
    px(359, 41, 232, 194, "#252a27");
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const carverCropWidth = images.carverCalm.width - 28;
    ctx.drawImage(images.carverCalm, 14, 0, carverCropWidth, 210, 383, 52, 184, 178);
    ctx.restore();

    // The Q2A result is tiny; reinforce only the already-restored traits with pixel marks.
    ctx.save();
    ctx.strokeStyle = PAL.chalk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(181, 105); ctx.lineTo(204, 99); // raised left eyebrow
    ctx.moveTo(124, 112); ctx.lineTo(119, 124); // temple scar
    ctx.moveTo(128, 173); ctx.lineTo(164, 193); ctx.lineTo(204, 171); // angular jaw
    ctx.stroke();
    ctx.restore();
    if (feature) {
      ctx.save();
      ctx.strokeStyle = feature === "jaw" ? PAL.gold : feature === "brow" ? PAL.blue : PAL.red;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      const points = feature === "jaw" ? [[165, 180], [475, 181]]
        : feature === "brow" ? [[192, 102], [492, 104]] : [[121, 119], [432, 118]];
      points.forEach(function (point) { ctx.arc(point[0], point[1], 17 + Math.sin(now / 160) * 2, 0, Math.PI * 2); });
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPoliceWideCompare() {
    drawBackdrop("police", 0.1);
    drawPortrait(images.playerCalm, 8, 286, 168, 0.56);
    drawPortrait(images.reedTense, 125, 286, 172, null);
    drawPortrait(images.holtCalm, 238, 286, 170, null);
    panel(349, 61, 104, 153);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(images.trueFace, 104, 18, 130, 164, 356, 68, 90, 139);
    ctx.restore();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const cropWidth = images.carverCalm.width - 28;
    ctx.drawImage(images.carverCalm, 14, 0, cropWidth, 210, 472, 68, 143, 139);
    ctx.restore();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(356, 68, 90, 139);
    ctx.strokeRect(472, 68, 143, 139);
  }

  function drawPolicePair(beat, local) {
    drawBackdrop("police", 0.08);
    if (beat.view === "julianEnter") {
      drawPortrait(images.reedTense, 28, 286, 194, null);
      const julianHeight = 212;
      const julianWidth = Math.round(images.julianHigh.width * julianHeight / images.julianHigh.height);
      drawPortrait(images.julianHigh, 612 - julianWidth, 286, julianHeight, 0.62, Math.max(0, 64 - local / 8));
      return;
    }
    const playerSpeaking = beat.speaker === "플레이어";
    let npc = images.carverCalm;
    if (beat.speaker === "리드") npc = images[beat.face];
    if (beat.speaker === "카버") npc = images[beat.face];
    if (beat.speaker === "줄리언") npc = images[beat.face];
    if (beat.speaker === "엘리너") npc = images[beat.face];
    if (beat.view === "policeJulian" && beat.speaker === "플레이어") npc = images.julianCalm;
    if (beat.view === "policeEleanor" && beat.speaker === "플레이어") npc = images.eleanorCalm;
    drawPair(npc, !playerSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
  }

  function drawChalk(beat, local) {
    drawBackdrop("police", 0.32);
    panel(92, 32, 404, 218);
    px(99, 39, 390, 204, "#27342f");
    const progress = beat.chalkLines > 0 ? 1 : Math.min(1, Math.max(0, (local - 250) / 750));
    ctx.save();
    ctx.strokeStyle = PAL.chalk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const crescentStart = Math.PI * 0.15;
    ctx.arc(292, 92, 26, crescentStart, crescentStart + Math.PI * 1.7 * progress);
    ctx.stroke();
    px(306, 65, 20, 54, "#27342f");
    const lines = beat.chalkLines || 0;
    for (let index = 0; index < lines; index += 1) {
      const lineProgress = Math.min(1, Math.max(0, (local - 420 - index * 390) / 300));
      if (lineProgress <= 0) continue;
      ctx.beginPath();
      const y = 137 + index * 20;
      ctx.moveTo(224, y);
      const visibleWidth = Math.round(136 * lineProgress);
      for (let offset = 3; offset <= visibleWidth; offset += 3) {
        const waveY = y + Math.sin(offset / 136 * Math.PI * 2) * 9;
        ctx.lineTo(224 + offset, waveY);
      }
      ctx.stroke();
    }
    ctx.restore();
    drawPortrait(images.carverHigh, 492, 270, 176, null);
  }

  function drawDock(beat, local, now) {
    drawBackdrop("dock", beat.view === "warehousePlan" ? 0.32 : 0.05);
    drawRain(now, true);
    if (beat.view === "flyerCora") {
      drawEvidence(images.flyer, Math.min(3, local / 300));
      drawPortrait(images.coraHigh, 510, 286, 194, null);
    } else if (beat.view === "workerEnter") {
      drawImageFit(images.flyer, 50, 80, 84, 54);
      drawPair(images.dockworkerCalm, true, false, null, Math.max(0, 60 - local / 8));
    } else if (beat.view === "dockCora") {
      drawImageFit(images.flyer, 50, 80, 84, 54);
      drawPair(images[beat.face], true, false);
    } else if (beat.view === "warehousePlan") {
      ctx.save();
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 4]);
      ctx.beginPath();
      ctx.moveTo(438, 166);
      ctx.lineTo(493, 208);
      ctx.lineTo(532, 191);
      ctx.lineTo(566, 232);
      if (beat.effect === "routeComplete") ctx.lineTo(598, 207);
      ctx.stroke();
      ctx.setLineDash([]);
      [438, 493, 532, 566].forEach(function (x, index) {
        ctx.strokeRect(x - 10, 204 - index * 11, 20, 18 + index * 11);
      });
      ctx.restore();
      px(431, 148, 10, 10, "#f0b755");
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(now / 160) * 0.05;
      px(408, 134, 88, 102, "#efb35c");
      ctx.restore();
    } else {
      drawPair(beat.speaker === "코라" ? images[beat.face] : images.coraCalm, beat.speaker !== "플레이어", beat.speaker === "플레이어", beat.speaker === "플레이어" ? images[beat.face] : null);
    }
  }

  function drawChildRoom(beat, local, now) {
    drawBackdrop("childRoom", beat.view === "childDrawing" || beat.view === "childDrawingHair" ? 0.3 : 0.06);
    drawRain(now, false);
    if (beat.view === "childDrawing" || beat.view === "childDrawingHair") {
      drawEvidence(images.childDrawing, Math.min(3, local / 320));
      if (beat.view === "childDrawingHair") {
        ctx.save();
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 4;
        ctx.strokeRect(360, 104, 34, 38);
        ctx.restore();
      }
    } else if (beat.view === "childEleanor" || beat.view === "childPair") {
      const eleanor = beat.speaker === "엘리너" ? images[beat.face] : images.eleanorCalm;
      drawPair(eleanor, beat.speaker === "엘리너", beat.speaker === "플레이어", beat.speaker === "플레이어" ? images[beat.face] : null);
    } else {
      drawPortrait(images.playerCalm, 44, 286, 204, beat.speaker === "플레이어" ? null : 0.5);
      const eleanorWidth = Math.round(images.eleanorCalm.width * 204 / images.eleanorCalm.height);
      drawPortrait(images.eleanorCalm, 606 - eleanorWidth, 286, 204, beat.speaker === "엘리너" ? null : 0.5);
    }
  }

  function drawScene(beat, local, now) {
    if (beat.view === "policeWideCompare") {
      drawPoliceWideCompare();
    } else if (beat.view.indexOf("compare") === 0) {
      const feature = beat.view === "compareJaw" ? "jaw" : beat.view === "compareBrow" ? "brow" : beat.view === "compareScar" ? "scar" : null;
      drawCompare(feature, now);
    } else if (beat.view.indexOf("chalk") === 0) {
      drawChalk(beat, local);
    } else if (beat.view === "letter") {
      drawBackdrop("police", 0.3);
      drawEvidence(images.letterWax, Math.min(3, local / 320));
      drawPortrait(beat.speaker === "엘리너" ? images[beat.face] : images.eleanorCalm, 506, 286, 188, beat.speaker === "플레이어" ? 0.52 : null);
    } else if (beat.view.indexOf("anchor") === 0) {
      drawBackdrop("police", 0.34);
      const anchorZoom = beat.view === "anchorReveal" ? Math.min(5, local / 220) : Math.min(3, local / 320);
      drawEvidence(images.anchorWrist, anchorZoom);
      if (beat.effect === "pulse") {
        ctx.save();
        ctx.globalAlpha = 0.45 + Math.sin(now / 150) * 0.12;
        ctx.strokeStyle = PAL.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(320, 131, 53 + Math.sin(now / 170) * 3, 64 + Math.sin(now / 170) * 3, -0.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (beat.effect === "sketch") {
        ctx.save();
        ctx.strokeStyle = PAL.chalk;
        ctx.lineWidth = 2;
        ctx.strokeRect(394, 51, 70, 160);
        for (let y = 70; y < 192; y += 16) ctx.strokeRect(407, y, 44, 1);
        ctx.restore();
      }
    } else if (beat.view.indexOf("police") === 0 || beat.view === "julianEnter") {
      drawPolicePair(beat, local);
    } else if (beat.view.indexOf("child") === 0) {
      drawChildRoom(beat, local, now);
    } else {
      drawDock(beat, local, now);
    }

    if (beat.effect === "fadeIn") {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - local / 800);
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
    drawEvidenceCaptionBacking(beat);
  }

  function drawEvidenceCaptionBacking(beat) {
    const backedViews = ["letter", "anchor", "anchorReveal", "anchorPulse", "anchorReed", "anchorSketch", "flyerCora", "childDrawing", "childDrawingHair"];
    if (backedViews.indexOf(beat.view) === -1) return;
    ctx.save();
    ctx.globalAlpha = 0.82;
    px(152, 29, 336, 18, PAL.ink);
    ctx.restore();
  }

  function drawEvidenceLabels(textCtx, beat) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (beat.view.indexOf("compare") === 0) {
      textCtx.fillText("Q2A 복원 얼굴 · 동일 배율 대조", 165, 43);
      textCtx.fillText("카버 · 현장 대조", 475, 43);
    }
    if (beat.view === "letter") textCtx.fillText("엘리너 보관 · 에드먼드의 아버지 편지 / 갈라진 봉인 밀랍", 320, 36);
    if (beat.view.indexOf("anchor") === 0) textCtx.fillText("현장 관찰 · 닻 도안 / 선명한 잉크 / 붉은 피부", 320, 36);
    if (beat.view === "flyerCora") textCtx.fillText("완성 전단 · 회색 털 / 흰 귀 하나 / 붉은 리본", 320, 36);
    if (beat.view === "warehousePlan") textCtx.fillText("현장 기록 · 비춘 구역 / 상자 높이 / 젖은 바닥 반사", 320, 36);
    if (beat.view === "childDrawing" || beat.view === "childDrawingHair") textCtx.fillText("종이에 옮긴 그림 · 배 한 척 / 사람 셋 / ‘우리’", 320, 36);
    textCtx.textAlign = "left";
  }

    return {
      id: "l2-l3",
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
        drawEvidenceLabels(context.textCtx, beat);
      },

      nameBoxWidth(speaker) {
        if (speaker.length >= 5) return 102;
        return speaker === "플레이어" ? 88 : 82;
      },

      speakerStyle(speaker) {
        const color = speaker === "플레이어" ? "#9bc0b6"
          : speaker === "리드" ? "#9fc3c7"
            : speaker === "엘리너" ? "#d3a9c4"
              : speaker === "카버" ? "#d28b73"
                : speaker === "줄리언" ? "#d0ad75"
                  : speaker === "코라" ? "#cf8875" : "#a7b8a2";
        return { accent: color, text: color };
      },

      leaveScene() {},

      dispose() { images = null; ctx = null; },
    };
  }

  const RENDERER_ID = "l2-l3";
  global.CutsceneRenderer_l2_l3 = Object.freeze({ id: RENDERER_ID, ASSETS, create });
  global.CutsceneRegistry?.registerRenderer(RENDERER_ID, create);
})(typeof window !== "undefined" ? window : globalThis);
