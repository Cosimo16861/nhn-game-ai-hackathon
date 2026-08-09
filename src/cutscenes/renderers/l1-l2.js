/**
 * L1→L2 컷신 렌더러 — B_AFTER_Q1A (C2C_RAIN_BEHIND_THE_DOOR, C2A_HOLTS_MEMORY),
 * B_AFTER_Q1B (C2B_MIST_IS_MISSING).
 *
 * dev/cutscenes/cutscene-review-l1-l2.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 *
 * 이 묶음은 비·불·먼지·번개처럼 절대 시각(now)에 매인 효과가 있어
 * renderBeat 가 context.now 를 함께 받는다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l1-l2/";
  const C0B = "assets/cutscenes/c0b/portraits/";
  const T = global.CutsceneText;
  const PAL = Object.freeze(Object.assign({}, T.PAL, {
    blue: "#6D9397",
    rain: "#779DA3",
    chalk: "#D5CBAF",
  }));

  const ASSETS = Object.freeze({
    parlor: ROOT + "backgrounds/asherton-parlor-rain.png",
    westHall: ROOT + "backgrounds/asherton-west-hall-rain.png",
    school: ROOT + "backgrounds/school-after-rain.png",
    tavern: ROOT + "backgrounds/tavern-evening.png",
    idealizedPortrait: ROOT + "inserts/restored-idealized-portrait.png",
    wetWall: ROOT + "inserts/wet-child-wall-traces.png",
    ferryWall: ROOT + "inserts/restored-ferry-wall.png",
    catMemory: ROOT + "inserts/cora-cat-memory.png",
    eleanorCalm: ROOT + "portraits/eleanor-calm.png",
    eleanorTense: ROOT + "portraits/eleanor-tense.png",
    eleanorHigh: ROOT + "portraits/eleanor-high.png",
    bethTense: ROOT + "portraits/beth-tense.png",
    holtCalm: ROOT + "portraits/holt-calm.png",
    holtTense: ROOT + "portraits/holt-tense.png",
    holtHigh: ROOT + "portraits/holt-high.png",
    coraCalm: ROOT + "portraits/cora-calm.png",
    coraTense: ROOT + "portraits/cora-tense.png",
    coraHigh: ROOT + "portraits/cora-high.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
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

  function drawPair(npcImage, npcSpeaking, playerSpeaking, slide, playerImage) {
    drawPortrait(playerSpeaking ? (playerImage || images.playerReady) : images.playerCalm, 24, 286, 205, playerSpeaking ? null : 0.52);
    const npcHeight = 210;
    const npcWidth = Math.round(npcImage.width * npcHeight / npcImage.height);
    drawPortrait(npcImage, 612 - npcWidth, 286, npcHeight, npcSpeaking ? null : 0.54, slide);
  }

  function drawFirst(image, slide) {
    const height = 244;
    const width = Math.round(image.width * height / image.height);
    drawPortrait(image, (W - width) / 2, 286, height, null, slide);
  }

  function drawEvidence(image, zoom) {
    const amount = zoom || 0;
    panel(147 - amount, 25 - amount, 346 + amount * 2, 226 + amount * 2);
    drawImageFit(image, 152 - amount, 30 - amount, 336 + amount * 2, 216 + amount * 2);
  }

  function drawRain(windowKey, now) {
    const zones = windowKey === "hall" ? [[34, 20, 94, 152]]
      : windowKey === "school" ? [[0, 0, 115, 250]]
        : windowKey === "tavern" ? [[527, 77, 110, 148]] : [[20, 12, 145, 210]];
    ctx.save();
    ctx.globalAlpha = 0.22;
    zones.forEach(function (zone, zoneIndex) {
      for (let index = 0; index < 10; index += 1) {
        const x = zone[0] + (index * 17 + zoneIndex * 11) % zone[2];
        const y = zone[1] + ((now / 10 + index * 31) % zone[3]);
        px(x, y, 1, 7, PAL.rain);
      }
    });
    ctx.restore();
  }

  function drawDrips(now) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    [272, 298, 325].forEach(function (x, index) {
      const y = 93 + ((now / 8 + index * 47) % 120);
      px(x, y, 1, 7, PAL.rain);
      px(x - 2, 220 + (index % 2) * 4, 5, 1, "#5D7E82");
    });
    ctx.restore();
  }

  function drawFire(now) {
    const pulse = Math.floor(now / 130) % 3;
    ctx.save();
    ctx.globalAlpha = 0.35;
    px(522 + pulse, 171 - pulse * 2, 15, 22 + pulse * 2, "#E59A42");
    px(531 - pulse, 177, 8, 15, "#FFD27A");
    ctx.restore();
  }

  function drawDust(now) {
    ctx.save();
    ctx.globalAlpha = 0.38;
    for (let index = 0; index < 18; index += 1) {
      const x = 28 + (index * 37) % 280;
      const y = 44 + ((index * 29 + now / 35) % 180);
      px(x, y, 1, 1, "#E0C98C");
    }
    ctx.restore();
  }

  function drawMemoryDiagram(feature) {
    panel(48, 31, 324, 213);
    px(54, 37, 312, 201, "#29312D");
    ctx.strokeStyle = PAL.chalk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(210, 132, 58, 76, 0, 0, Math.PI * 2);
    ctx.moveTo(171, 112); ctx.lineTo(196, 104);
    ctx.moveTo(224, 101); ctx.lineTo(252, 108);
    ctx.moveTo(209, 112); ctx.lineTo(204, 143); ctx.lineTo(215, 143);
    ctx.moveTo(189, 164); ctx.quadraticCurveTo(210, 176, 231, 162);
    ctx.stroke();
    ctx.strokeStyle = feature === "jaw" ? PAL.gold : PAL.rust;
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (feature === "jaw") {
      ctx.moveTo(162, 139); ctx.lineTo(175, 177); ctx.lineTo(210, 200); ctx.lineTo(246, 176); ctx.lineTo(257, 139);
    } else {
      ctx.moveTo(224, 96); ctx.lineTo(252, 103);
      ctx.moveTo(166, 120); ctx.lineTo(158, 137);
    }
    ctx.stroke();
  }

  function drawScene(beat, local, now) {
    const npcSpeaking = beat.speaker !== "플레이어";
    const playerSpeaking = beat.speaker === "플레이어";
    const slide = beat.view === "parlorBethEnter" ? Math.max(0, 46 - local / 12) : 0;
    const zoom = Math.min(3, Math.max(0, local - 320) / 240);

    if (beat.view.indexOf("parlor") === 0 || beat.view === "firstEleanor") {
      drawBackdrop("parlor", beat.view === "parlorPortrait" ? 0.28 : 0.08);
      drawRain("parlor", now);
      if (beat.view === "parlorPortrait") drawEvidence(images.idealizedPortrait, zoom);
      if (beat.view === "parlorEleanor") {
        drawPair(
          beat.speaker === "엘리너" ? images[beat.face] : images.eleanorCalm,
          npcSpeaking,
          playerSpeaking,
          null,
          playerSpeaking ? images[beat.face] : null
        );
      }
      if (beat.view === "parlorBeth" || beat.view === "parlorBethEnter") {
        drawPortrait(images.eleanorTense, 18, 286, 196, beat.speaker === "엘리너" ? null : 0.54);
        const bethWidth = Math.round(images.bethTense.width * 204 / images.bethTense.height);
        drawPortrait(images.bethTense, 610 - bethWidth, 286, 204, beat.speaker === "베스" ? null : 0.54, slide);
      }
      if (beat.view === "firstEleanor") drawFirst(images[beat.face]);
    } else if (beat.view.indexOf("hall") === 0 || beat.view === "wetWall") {
      drawBackdrop("westHall", beat.view === "wetWall" ? 0.32 : 0.08);
      drawRain("hall", now);
      if (beat.effect === "drips" || beat.view === "wetWall") drawDrips(now);
      if (beat.doorOpen) {
        const opened = beat.effect === "doorOpen" ? Math.min(1, Math.max(0, local - 420) / 650) : 1;
        px(486, 40, 76 * opened, 184, "#090C0D");
        px(489, 43, 5 + 18 * opened, 178, "#395156");
      }
      if (beat.view === "hallWorld") drawPortrait(images.playerReady, 230, 286, 208, null);
      if (beat.view === "hallBeth") drawPair(images.bethTense, npcSpeaking, playerSpeaking, null, playerSpeaking ? images[beat.face] : null);
      if (beat.view === "hallEleanor" || beat.view === "hallDoor") {
        drawPair(
          beat.speaker === "엘리너" ? images[beat.face] : images.eleanorCalm,
          npcSpeaking,
          playerSpeaking,
          null,
          playerSpeaking ? images[beat.face] : null
        );
      }
      if (beat.view === "wetWall") drawEvidence(images.wetWall, zoom);
    } else if (beat.view.indexOf("school") === 0 || beat.view.indexOf("memory") === 0) {
      drawBackdrop("school", beat.view.indexOf("memory") === 0 ? 0.42 : 0.08);
      drawRain("school", now);
      drawDust(now);
      if (beat.view === "schoolHolt" || beat.view === "schoolArrival") {
        drawPair(
          beat.speaker === "홀트" ? images[beat.face] : images.holtCalm,
          npcSpeaking,
          playerSpeaking,
          null,
          playerSpeaking ? images[beat.face] : null
        );
      }
      if (beat.view === "schoolWide") drawPair(images.holtCalm, false, true);
      if (beat.view === "memoryJaw" || beat.view === "memoryBrow") {
        const memoryHeight = 228;
        const memoryWidth = Math.round(images[beat.face].width * memoryHeight / images[beat.face].height);
        drawPortrait(images[beat.face], 624 - memoryWidth, 286, memoryHeight, null);
        drawMemoryDiagram(beat.view === "memoryJaw" ? "jaw" : "brow");
      }
    } else {
      drawBackdrop("tavern", beat.view === "ferryWall" || beat.view === "catMemory" ? 0.28 : 0.06);
      drawRain("tavern", now);
      drawFire(now);
      if (beat.view === "ferryWall") drawEvidence(images.ferryWall, zoom);
      if (beat.view === "catMemory") drawEvidence(images.catMemory, zoom);
      if (beat.view === "tavernCora") {
        drawPair(
          beat.speaker === "코라" ? images[beat.face] : images.coraCalm,
          npcSpeaking,
          playerSpeaking,
          null,
          playerSpeaking ? images[beat.face] : null
        );
      }
      if (beat.view === "firstCora") drawFirst(images[beat.face]);
      if (beat.view === "tavernWide") drawPair(images.coraCalm, false, true);
    }

    if (beat.effect === "lightning" || beat.effect === "lightningSoft") {
      const flashWindow = beat.effect === "lightning" ? 460 : 240;
      if (local > 520 && local < 520 + flashWindow) {
        ctx.save();
        ctx.globalAlpha = beat.effect === "lightning" ? 0.25 : 0.12;
        px(0, 0, W, H, "#D7EDF0");
        ctx.restore();
      }
    }
    if (beat.effect === "fadeIn") {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - local / 800);
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
    if (beat.effect === "ribbon") {
      ctx.save();
      ctx.globalAlpha = 0.2 + Math.sin(now / 180) * 0.08;
      px(352, 169, 32, 3, "#C64E3F");
      ctx.restore();
    }
  }

  function drawEvidenceLabels(textCtx, beat) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (beat.view === "parlorPortrait") textCtx.fillText("복원 결과 · 엘리너가 간직한 초상", 320, 36);
    if (beat.view === "wetWall") textCtx.fillText("현장 관찰 · 배 한 척 / 사람 셋 / 푸른 물 번짐", 320, 36);
    if (beat.view === "ferryWall") textCtx.fillText("복원 결과 · 12년 전 선술집 벽 층", 320, 36);
    if (beat.view === "catMemory") {
      textCtx.fillStyle = "rgba(23, 19, 16, 0.82)";
      textCtx.fillRect(112, 22, 416, 27);
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText("코라의 기억 · 옅은 회색 / 흰 귀 하나 / 붉은 리본", 320, 36);
    }
    if (beat.view === "memoryJaw" || beat.view === "memoryBrow") {
      textCtx.fillText("홀트의 직접 증언 · 미화되기 전 얼굴", 210, 42);
      textCtx.font = '900 12px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = beat.view === "memoryJaw" ? PAL.gold : "#D48468";
      textCtx.fillText(beat.view === "memoryJaw" ? "각진 턱 · 왼쪽 눈썹" : "왼쪽 눈썹 · 관자놀이 흉터", 210, 220);
    }
    textCtx.textAlign = "left";
  }

    return {
      id: "l1-l2",
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

      /** 검토본과 같은 이름표 폭·화자 색을 유지한다. */
      nameBoxWidth(speaker) {
        if (speaker.length >= 6) return 112;
        return speaker === "플레이어" ? 88 : 82;
      },

      speakerStyle(speaker) {
        if (speaker === "플레이어") return { accent: PAL.teal, text: "#9BC0B6" };
        if (speaker === "엘리너") return { accent: "#B58AA6", text: "#B58AA6" };
        if (speaker === "베스") return { accent: "#D2A45D", text: "#D2A45D" };
        if (speaker === "홀트") return { accent: PAL.blue, text: PAL.blue };
        return { accent: PAL.rust, text: "#D28B73" };
      },

      leaveScene() {},

      dispose() { images = null; ctx = null; },
    };
  }

  global.CutsceneRendererL1L2 = Object.freeze({ id: "l1-l2", ASSETS, create });
  global.CutsceneRegistry?.registerRenderer("l1-l2", create);
})(typeof window !== "undefined" ? window : globalThis);
