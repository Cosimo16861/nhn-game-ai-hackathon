/**
 * 엔딩 컷신 렌더러 — B_AFTER_Q6 (CE_ENDING).
 *
 * dev/cutscenes/cutscene-review-l6-ending.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l6-ending/";
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
    red: "#9d3f37",
    chalk: "#d5cbaf",
    fog: "#b8c9c6",
  });

  const T = global.CutsceneText;

  const ASSETS = Object.freeze({
    police: ROOT + "backgrounds/police-registry.png",
    parlor: ROOT + "backgrounds/asherton-parlor-dawn.png",
    tavern: ROOT + "backgrounds/tavern-window.png",
    square: ROOT + "backgrounds/market-square-morning.png",
    office: ROOT + "backgrounds/office-clearing-fog.png",
    playerCalm: ROOT + "portraits/player-calm.png",
    playerThinking: ROOT + "portraits/player-thinking.png",
    playerReady: ROOT + "portraits/player-ready.png",
    reedCalm: ROOT + "portraits/reed-calm.png",
    reedHigh: ROOT + "portraits/reed-high.png",
    reedTense: ROOT + "portraits/reed-tense.png",
    eleanorCalm: ROOT + "portraits/eleanor-calm.png",
    eleanorHigh: ROOT + "portraits/eleanor-high.png",
    eleanorTense: ROOT + "portraits/eleanor-tense.png",
    julianCalm: ROOT + "portraits/julian-calm.png",
    julianHigh: ROOT + "portraits/julian-high.png",
    julianTense: ROOT + "portraits/julian-tense.png",
    carverCalm: ROOT + "portraits/carver-calm.png",
    carverHigh: ROOT + "portraits/carver-high.png",
    carverTense: ROOT + "portraits/carver-tense.png",
    coraCalm: ROOT + "portraits/cora-calm.png",
    coraHigh: ROOT + "portraits/cora-high.png",
    ramCalm: ROOT + "portraits/ram-calm.png",
    ramHigh: ROOT + "portraits/ram-high.png",
    mistCat: ROOT + "sprites/mist-cat.png",
    EV_WANTED: ROOT + "evidence/EV_WANTED.png",
    EV_IDEALIZED: ROOT + "evidence/EV_IDEALIZED.png",
    EV_TRUE_FACE: ROOT + "evidence/EV_TRUE_FACE.png",
    EV_SEAL_3: ROOT + "evidence/EV_SEAL_3.png",
    EV_LEDGER_TC: ROOT + "evidence/EV_LEDGER_TC.png",
    EV_CARRIAGE_4: ROOT + "evidence/EV_CARRIAGE_4.png",
    EV_CARVER_CHALK_4: ROOT + "evidence/EV_CARVER_CHALK_4.png",
    EV_CHILD_DRAWING: ROOT + "evidence/EV_CHILD_DRAWING.png",
    EV_TATTOO: ROOT + "evidence/EV_TATTOO.png",
    EV_CAT: ROOT + "evidence/EV_CAT.png",
    EV_RAM: ROOT + "evidence/EV_RAM.png",
    EV_SIREN: ROOT + "evidence/EV_SIREN.png",
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

  function drawPortrait(image, x, bottom, height, dim, slide) {
    const width = Math.round(image.width * height / image.height);
    ctx.save();
    if (dim) ctx.filter = "brightness(" + dim + ") saturate(62%)";
    ctx.drawImage(image, Math.round(x + (slide || 0)), Math.round(bottom - height), width, height);
    ctx.restore();
    return width;
  }

  function drawPair(left, right, speaker, local) {
    const height = 216;
    const leftImage = images[left];
    const rightImage = images[right];
    const rightWidth = Math.round(rightImage.width * height / rightImage.height);
    const enter = Math.max(0, 34 - local / 18);
    drawPortrait(leftImage, 20, 286, height, speaker === "left" ? null : 0.5, -enter);
    drawPortrait(rightImage, 620 - rightWidth, 286, height, speaker === "right" ? null : 0.5, enter);
  }

  function drawEvidence(image, x, y, width, height, dim) {
    panel(x - 5, y - 5, width + 10, height + 10);
    ctx.save();
    if (dim) ctx.filter = "brightness(" + dim + ") saturate(65%)";
    drawImageFit(image, x, y, width, height);
    ctx.restore();
  }

  function drawCrescentAndWaves(x, y, scale, waves, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, Math.round(scale * 2));
    ctx.beginPath();
    ctx.arc(x, y, 13 * scale, 0.35, Math.PI * 1.62);
    ctx.arc(x + 6 * scale, y - 2 * scale, 11 * scale, Math.PI * 1.62, 0.35, true);
    ctx.stroke();
    for (let index = 0; index < waves; index += 1) {
      ctx.beginPath();
      const waveY = y + (22 + index * 8) * scale;
      ctx.moveTo(x - 28 * scale, waveY);
      ctx.quadraticCurveTo(x - 14 * scale, waveY - 7 * scale, x, waveY);
      ctx.quadraticCurveTo(x + 14 * scale, waveY + 7 * scale, x + 28 * scale, waveY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRegistryOverlay(progress) {
    const reveal = Math.min(1, Math.max(0, progress));
    ctx.save();
    ctx.globalAlpha = reveal;
    panel(155, 40, 330, 178);
    px(163, 48, 314, 162, "#b9aa8e");
    px(172, 61, 296, 2, "#544737");
    px(172, 88, 296, 2, "#77644b");
    px(172, 115, 296, 2, "#77644b");
    px(172, 142, 296, 2, "#77644b");
    px(172, 169, 296, 2, "#77644b");
    px(188, 94, 4 + 190 * reveal, 16, "#d1bb82");
    ctx.restore();
  }

  function drawEvidenceWall(now, revealAll) {
    const cards = [
      ["EV_WANTED", 247, 58], ["EV_IDEALIZED", 345, 58], ["EV_TRUE_FACE", 443, 58],
      ["EV_SEAL_3", 247, 151], ["EV_LEDGER_TC", 345, 151], ["EV_CARRIAGE_4", 443, 151],
    ];
    cards.forEach(function (card, index) {
      const lit = revealAll ? Math.min(1, Math.max(0, (now - index * 180) / 420)) : 0.6;
      ctx.save();
      ctx.globalAlpha = 0.35 + lit * 0.65;
      drawEvidence(images[card[0]], card[1], card[2], 80, 58, null);
      ctx.restore();
    });
    // Q6 starts with exact completed evidence. Neutral PNGs receive the facts only here at runtime.
    drawCrescentAndWaves(287, 158, 0.23, 3, PAL.gold);
    drawCrescentAndWaves(483, 158, 0.23, 4, PAL.gold);
    ctx.save();
    ctx.fillStyle = PAL.inkSoft;
    ctx.font = '900 7px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText("T.C.", 385, 169);
    ctx.fillText("4 MO", 385, 178);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = PAL.red;
    ctx.lineWidth = 2;
    [
      [287, 87, 385, 87],
      [385, 87, 483, 87],
      [483, 87, 385, 180],
    ].forEach(function (line, index) {
      if (!revealAll || now > index * 180) {
        ctx.beginPath(); ctx.moveTo(line[0], line[1]); ctx.lineTo(line[2], line[3]); ctx.stroke();
      }
    });
    if (!revealAll || now > 720) {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(287, 180);
      ctx.lineTo(287, 225);
      ctx.lineTo(483, 225);
      ctx.lineTo(483, 180);
      ctx.stroke();
      px(283, 176, 8, 8, PAL.gold);
      px(479, 176, 8, 8, PAL.gold);
    }
    ctx.restore();
  }

  function drawCompare(key, waves, labelIndex) {
    const slots = [68, 238, 408];
    const keys = ["EV_SEAL_3", "EV_CARRIAGE_4", "EV_CARVER_CHALK_4"];
    keys.forEach(function (item, index) {
      drawEvidence(images[item], slots[index], 48, 146, 154, index === labelIndex ? null : 0.52);
      if (index <= labelIndex) drawCrescentAndWaves(slots[index] + 73, 88, 0.82, index === 0 ? 3 : 4, index === labelIndex ? PAL.gold : PAL.creamDim);
    });
    void key;
  }

  function drawRain(now) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    for (let index = 0; index < 18; index += 1) {
      const x = 500 + (index * 17) % 132;
      const y = 20 + ((now / 10 + index * 31) % 190);
      px(x, y, 1, 8, PAL.blue);
    }
    ctx.restore();
  }

  function drawMontageTransition(item, local) {
    if (!item.transition || local >= 1600) return;
    const fade = local < 600 ? 1 : Math.max(0, 1 - (local - 600) / 1000);
    ctx.save();
    ctx.globalAlpha = fade;
    px(0, 0, W, H, "#050708");
    ctx.restore();
  }

  function drawScene(item, local, now) {
    const speakingPlayer = item.speaker === "플레이어";
    const registryProgress = Math.max(0, (local - 280) / 850);

    if (item.view.indexOf("office") === 0 || item.view === "title") {
      drawBackdrop("office", item.view === "title" ? 0.32 : 0.06);
      const reveal = item.view !== "officeBoard";
      drawEvidenceWall(local, reveal);
      if (item.view === "officeBoard") drawPortrait(images.playerThinking, 28, 286, 206, null);
      if (item.view === "officeReveal" || item.view === "officeDawn") drawPortrait(images[item.face], 32, 286, 204, null);
      if (item.effect === "dawn" || item.effect === "title") {
        const clearing = item.effect === "title" ? 1 : Math.min(1, Math.max(0, (local - 220) / 1900));
        ctx.save();
        ctx.globalAlpha = 0.42 * (1 - clearing);
        px(0, 0, 210, 278, PAL.fog);
        ctx.globalAlpha = 0.08 + clearing * 0.25;
        px(0, 0, 210, 278, "#f2c987");
        ctx.restore();
      }
      if (item.view === "title") {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, (local - 900) / 1000));
        px(118, 78, 404, 104, "rgba(7,9,10,.82)");
        ctx.restore();
      }
    } else if (item.view.indexOf("parlor") === 0 || item.view === "trueFace" || item.view === "trueFaceEleanor" || item.view === "childRoom" || item.view.indexOf("siren") === 0 || item.view === "deathCertificate") {
      drawBackdrop("parlor", 0.06);
      if (item.view === "parlorArrival" || item.view === "parlorEleanor") {
        drawPair(speakingPlayer ? item.face : "playerCalm", item.speaker === "엘리너" ? item.face : "eleanorCalm", speakingPlayer ? "left" : "right", local);
      }
      if (item.view === "trueFace" || item.view === "trueFaceEleanor") {
        drawEvidence(images.EV_TRUE_FACE, 190, 36, 260, 196);
        if (item.view === "trueFaceEleanor") drawPortrait(images[item.face], 465, 286, 210, null);
      }
      if (item.view === "childRoom") {
        drawEvidence(images.EV_CHILD_DRAWING, 96, 46, 190, 154);
        drawEvidence(images.EV_TRUE_FACE, 354, 46, 190, 154);
      }
      if (item.view === "siren" || item.view === "sirenEleanor") {
        drawEvidence(images.EV_SIREN, 148, 30, 344, 220);
        if (item.view === "sirenEleanor") drawPortrait(images[item.face], 476, 286, 205, null);
        if (Math.floor(now / 210) % 5 === 0) {
          ctx.save(); ctx.globalAlpha = 0.18; px(0, 0, W, 278, "#d8edf0"); ctx.restore();
        }
      }
      if (item.view === "deathCertificate") {
        panel(176, 42, 288, 196);
        px(184, 50, 272, 180, "#b8aa8d");
        for (let y = 72; y < 190; y += 23) px(201, y, 232, 1, "#71634f");
        const signatureProgress = Math.min(1, Math.max(0, (local - 380) / 1500));
        ctx.save();
        ctx.strokeStyle = PAL.inkSoft;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(228, 190);
        if (signatureProgress > 0.15) ctx.lineTo(246, 183);
        if (signatureProgress > 0.3) ctx.quadraticCurveTo(270, 169, 292, 184);
        if (signatureProgress > 0.48) ctx.quadraticCurveTo(310, 201, 329, 190);
        if (signatureProgress > 0.66) ctx.quadraticCurveTo(350, 178, 369, 195);
        if (signatureProgress > 0.84) ctx.quadraticCurveTo(391, 207, 409, 184);
        ctx.stroke();
        if (signatureProgress < 1) {
          const penX = 228 + signatureProgress * 181;
          px(penX, 180 + Math.sin(signatureProgress * Math.PI * 5) * 9, 16, 3, "#33251c");
        }
        ctx.restore();
      }
    } else if (item.view.indexOf("tavern") === 0) {
      drawBackdrop("tavern", 0.03);
      const catBob = Math.round(Math.sin(now / 430) * 2);
      drawImageFit(images.mistCat, 64, 96 + catBob, 82, 104);
      drawPortrait(images[item.speaker === "코라" ? item.face : "playerCalm"], 430, 286, 212, null);
      const wipeProgress = item.speaker === "코라" ? Math.min(1, local / 1800) : 1;
      ctx.save();
      ctx.globalAlpha = 0.46 * (1 - wipeProgress);
      px(42, 24, 205, 190, PAL.fog);
      ctx.globalAlpha = 0.72;
      px(58 + wipeProgress * 156, 51, 5, 104, PAL.cream);
      ctx.restore();
    } else if (item.view.indexOf("square") === 0) {
      drawBackdrop("square", 0.02);
      drawEvidence(images.EV_RAM, 245, 55, 150, 126);
      const chaseProgress = item.effect === "chase" ? Math.min(1, local / 1350) : 0;
      if (item.view === "squareRam") drawPortrait(images[item.face], 34, 286, 216, null);
      else {
        drawPortrait(images.ramHigh, 34 - chaseProgress * 130, 286, 204, 0.72);
        drawPortrait(images[item.face], 448 - chaseProgress * 70, 286, 216, null);
      }
      ctx.save();
      ctx.globalAlpha = 0.44;
      for (let crowdIndex = 0; crowdIndex < 9; crowdIndex += 1) {
        const crowdX = 190 + ((crowdIndex * 41 + now / 38) % 330);
        px(crowdX, 228 + (crowdIndex % 3) * 5, 7, 22, "#283433");
      }
      ctx.restore();
      if (item.effect === "chase") {
        ctx.save(); ctx.globalAlpha = Math.min(1, local / 700); px(378 - chaseProgress * 80, 222, 96, 3, PAL.rust); ctx.restore();
      }
    } else {
      drawBackdrop("police", item.view.indexOf("compare") === 0 || item.view === "ledger" || item.view === "tattoo" ? 0.28 : 0.05);
      drawRain(now);
      if (item.view === "registryClosed") {
        drawPair(speakingPlayer ? item.face : "playerCalm", item.speaker === "리드" ? item.face : "reedCalm", speakingPlayer ? "left" : "right", local);
      }
      if (item.view === "registryReveal") drawRegistryOverlay(registryProgress);
      if (item.view === "confrontJulian") drawPair(item.speaker === "리드" ? item.face : "reedTense", item.speaker === "줄리언" ? item.face : "julianTense", item.speaker === "리드" ? "left" : "right", local);
      if (item.view === "confessCarver") drawPair(item.speaker === "카버" ? item.face : "carverCalm", "reedTense", item.speaker === "카버" ? "left" : "right", local);
      if (item.view === "compareSeal") drawCompare("EV_SEAL_3", 3, 0);
      if (item.view === "compareCarriage") drawCompare("EV_CARRIAGE_4", 4, 1);
      if (item.view === "compareChalk") drawCompare("EV_CARVER_CHALK_4", 4, 2);
      if (item.view === "ledger") {
        drawEvidence(images.EV_LEDGER_TC, 160, 34, 320, 210);
        panel(221, 154, 198, 58);
        px(230, 163, 180, 40, "#c8b58f");
      }
      if (item.view === "tattoo") drawEvidence(images.EV_TATTOO, 160, 34, 320, 210);
    }

    // 대화 상자는 공통 player 가 그린다.
    drawMontageTransition(item, local);
  }

  function drawEvidenceLabels(textCtx, item, local) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (item.view === "registryReveal") {
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("마차 등록부 · 소유자 최초 확정", 320, 54);
      textCtx.font = '900 13px "Courier New", monospace';
      textCtx.fillStyle = PAL.inkSoft;
      const reveal = Math.min(1, Math.max(0, (local - 450) / 900));
      if (reveal > 0.15) textCtx.fillText("JULIAN ASHERTON", 257, 100);
      if (reveal > 0.5) textCtx.fillText("12 YEARS", 384, 100);
      if (reveal > 0.8) textCtx.fillText("FOUR-WAVE DOOR", 320, 127);
    }
    if (item.view === "compareSeal" || item.view === "compareCarriage" || item.view === "compareChalk") {
      textCtx.font = '700 9px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillText("에드먼드 아버지가 남기고", 141, 209);
      textCtx.fillText("엘리너가 보관한 편지·밀랍", 141, 222);
      textCtx.fillText("뱅크스 기억의 마차 문", 311, 216);
      textCtx.fillText("카버의 칠판", 481, 216);
    }
    if (item.view === "ledger") {
      textCtx.font = '900 16px "Courier New", monospace';
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("T.C.  ·  FOUR MONTHS", 320, 174);
      textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText("관리 장부 · 복원 행", 320, 42);
    }
    if (item.view === "trueFace" || item.view === "trueFaceEleanor") textCtx.fillText("복원 초상 · 에드먼드 아셔튼", 320, 44);
    if (item.view === "siren" || item.view === "sirenEleanor") textCtx.fillText("뱅크스의 직접 증언 · 세이렌 호의 밤", 320, 38);
    if (item.view === "title") {
      textCtx.font = '900 24px Georgia, serif';
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText("THE LAST PORTRAIT", 320, 111);
      textCtx.font = '700 10px "Apple SD Gothic Neo", sans-serif';
      textCtx.fillStyle = PAL.gold;
      textCtx.fillText("마지막 초상", 320, 147);
    }
    textCtx.textAlign = "left";
  }

    return {
      id: "l6-ending",
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
        drawEvidenceLabels(context.textCtx, beat, context.local);
      },

      nameBoxWidth(speaker) {
        return speaker === "플레이어" ? 88 : 82;
      },

      speakerStyle(speaker) {
        const accent = speaker === "플레이어" ? PAL.teal
          : speaker === "리드" ? PAL.blue
            : speaker === "엘리너" ? "#b58aa6"
              : speaker === "줄리언" ? "#c49a62"
                : speaker === "카버" ? PAL.rust : PAL.gold;
        // 이름표 액자와 글자 색이 다르다. 검토본 그대로다.
        const text = speaker === "플레이어" ? "#9bc0b6"
          : speaker === "리드" ? "#9fc3c7"
            : speaker === "엘리너" ? "#d3a9c4"
              : speaker === "줄리언" ? "#ddb77b"
                : speaker === "카버" ? "#d28b73" : "#dfbd73";
        return { accent, text };
      },

      leaveScene() {},

      dispose() { images = null; ctx = null; },
    };
  }

  global.CutsceneRendererEnding = Object.freeze({ id: "l6-ending", ASSETS, create });
  global.CutsceneRegistry?.registerRenderer("l6-ending", create);
})(typeof window !== "undefined" ? window : globalThis);
