/**
 * L3-L4 컷신 렌더러 — B_AFTER_Q3A · B_AFTER_Q3B · B_AFTER_Q3C.
 *
 * dev/cutscenes/cutscene-review-l3-l4.js 의 시각 코드를 그대로 옮겼다.
 * 좌표와 색을 바꾸면 승인된 검토본과 화면이 달라진다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const ROOT = "assets/cutscenes/l3-l4/";
  const TYPE_MS = 34;
  const INPUT_LOCK_MS = 120;

  const PAL = Object.freeze({
    ink: "#171310",
    panel: "#1D1814",
    panelLight: "#3E332A",
    cream: "#E9DFC9",
    gold: "#D8A94B",
    goldDim: "#8F6E31",
    teal: "#4A7471",
    rust: "#A05C43",
    blue: "#6D9397",
    wet: "#547A7D",
    paper: "#B9AA83",
  });

  const T = global.CutsceneText;

  const ASSETS = Object.freeze({
    police: ROOT + "backgrounds/police-station-evening.png",
    square: ROOT + "backgrounds/harbor-square-dusk.png",
    warehouse: ROOT + "backgrounds/windowless-warehouse.png",
    sealComparison: ROOT + "inserts/seal-three-vs-chalk-four.png",
    ledgerUnread: ROOT + "inserts/waterlogged-ledger-unread.png",
    tattooRecord: ROOT + "inserts/fresh-anchor-record.png",
    overpaintedPortrait: ROOT + "inserts/overpainted-young-man.png",
    tornLogbook: ROOT + "inserts/torn-waterlogged-logbook.png",
    mistFound: ROOT + "inserts/mist-found.png",
    playerCalm: ROOT + "portraits/player-calm.png",
    playerThinking: ROOT + "portraits/player-thinking.png",
    playerReady: ROOT + "portraits/player-ready.png",
    reedCalm: ROOT + "portraits/reed-calm.png",
    reedHigh: ROOT + "portraits/reed-high.png",
    reedTense: ROOT + "portraits/reed-tense.png",
    holtCalm: ROOT + "portraits/holt-calm.png",
    holtHigh: ROOT + "portraits/holt-high.png",
    holtTense: ROOT + "portraits/holt-tense.png",
    coraCalm: ROOT + "portraits/cora-calm.png",
    coraHigh: ROOT + "portraits/cora-high.png",
    coraTense: ROOT + "portraits/cora-tense.png",
    ramCalm: ROOT + "portraits/ram-calm.png",
    ramHigh: ROOT + "portraits/ram-high.png",
    ramTense: ROOT + "portraits/ram-tense.png",
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

  function drawPair(npcImage, npcSpeaking, playerSpeaking, playerImage) {
    drawPortrait(playerSpeaking ? (playerImage || images.playerReady) : images.playerCalm, 22, 286, 204, playerSpeaking ? null : 0.52);
    const npcHeight = 212;
    const npcWidth = Math.round(npcImage.width * npcHeight / npcImage.height);
    drawPortrait(npcImage, 614 - npcWidth, 286, npcHeight, npcSpeaking ? null : 0.54);
  }

  function drawEvidence(image, zoom) {
    const amount = zoom || 0;
    panel(147 - amount, 25 - amount, 346 + amount * 2, 226 + amount * 2);
    drawImageFit(image, 152 - amount, 30 - amount, 336 + amount * 2, 216 + amount * 2);
  }

  function drawLamp(now, key) {
    const pulse = 0.07 + (Math.sin(now / 170) + 1) * 0.035;
    ctx.save();
    ctx.globalAlpha = pulse;
    const gradient = ctx.createRadialGradient(key === "warehouse" ? 322 : 312, 92, 10, key === "warehouse" ? 322 : 312, 92, 180);
    gradient.addColorStop(0, "#FFD58A");
    gradient.addColorStop(1, "rgba(255, 190, 92, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(120, 0, 420, 276);
    ctx.restore();
  }

  function drawRain(now) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    [[92, 22, 124, 190], [451, 24, 116, 190]].forEach(function (zone, zoneIndex) {
      for (let index = 0; index < 9; index += 1) {
        const x = zone[0] + (index * 19 + zoneIndex * 7) % zone[2];
        const y = zone[1] + ((now / 12 + index * 29) % zone[3]);
        px(x, y, 1, 7, "#71959A");
      }
    });
    ctx.restore();
  }

  function drawCrowd(now) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    for (let index = 0; index < 7; index += 1) {
      const x = 38 + index * 88 + (index % 2) * 8;
      const bob = Math.floor(Math.sin(now / 380 + index) * 2);
      px(x, 224 + bob, 13, 28, "#101416");
      px(x + 2, 215 + bob, 9, 10, "#101416");
    }
    ctx.restore();
  }

  function drawFeatureMarker(view, now) {
    const pulse = 0.65 + Math.sin(now / 170) * 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = view === "featureNose" ? PAL.gold : view === "featureBrow" ? PAL.rust : PAL.teal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (view === "featureNose") {
      ctx.moveTo(334, 93); ctx.lineTo(328, 122); ctx.lineTo(339, 130);
    } else if (view === "featureBrow") {
      ctx.moveTo(327, 86); ctx.lineTo(353, 82);
    } else {
      ctx.moveTo(293, 161); ctx.lineTo(320, 183); ctx.lineTo(354, 176); ctx.lineTo(367, 154);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawLedgerColumns(now) {
    ctx.save();
    ctx.globalAlpha = 0.52 + Math.sin(now / 210) * 0.13;
    [215, 302, 367, 431].forEach(function (x) { px(x, 57, 2, 145, PAL.gold); });
    [83, 117, 151, 185].forEach(function (y) { px(202, y, 242, 2, PAL.teal); });
    ctx.restore();
  }

  function drawPaperEdges(now, local) {
    const revealed = Math.min(3, 1 + Math.floor(Math.max(0, local - 360) / 620));
    const joins = [
      [[286, 111], [304, 119], [326, 105]],
      [[305, 151], [320, 169], [334, 151]],
      [[304, 207], [321, 198], [338, 208]],
    ];
    ctx.save();
    ctx.globalAlpha = 0.46 + Math.sin(now / 190) * 0.16;
    ctx.strokeStyle = PAL.teal;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    joins.slice(0, revealed).forEach(function (join) {
      ctx.beginPath();
      ctx.moveTo(join[0][0], join[0][1]);
      ctx.lineTo(join[1][0], join[1][1]);
      ctx.lineTo(join[2][0], join[2][1]);
      ctx.stroke();
      px(join[0][0] - 1, join[0][1] - 1, 3, 3, PAL.gold);
      px(join[2][0] - 1, join[2][1] - 1, 3, 3, PAL.gold);
    });
    ctx.restore();
  }

  function drawDrip(now) {
    ctx.save();
    ctx.globalAlpha = 0.65;
    for (let index = 0; index < 4; index += 1) {
      const y = 56 + ((now / 9 + index * 61) % 148);
      px(209 + index * 73, y, 2, 7, PAL.wet);
    }
    ctx.restore();
  }

  function drawEvidenceCaptionBar(beat) {
    const view = beat.view;
    const hasCaption = view.indexOf("seal") === 0
      || view === "ledger" || view === "ledgerColumns"
      || view === "tattoo" || view === "tattooFiled"
      || view === "overpaint" || view.indexOf("feature") === 0
      || view === "catFound"
      || view === "logbook" || view === "logbookEdges";
    if (!hasCaption) return;
    ctx.save();
    ctx.globalAlpha = 0.88;
    px(164, 31, 312, 21, "#101719");
    ctx.globalAlpha = 1;
    px(164, 31, 312, 1, PAL.ink);
    px(164, 51, 312, 1, PAL.ink);
    px(164, 32, 1, 19, PAL.ink);
    px(475, 32, 1, 19, PAL.ink);
    px(166, 50, 308, 1, PAL.goldDim);
    ctx.restore();
  }

  function drawScene(beat, local, now) {
    const npcSpeaking = beat.speaker !== "플레이어";
    const playerSpeaking = beat.speaker === "플레이어";
    const zoom = Math.min(3, Math.max(0, local - 320) / 240);

    if (beat.view.indexOf("square") === 0 || beat.view === "overpaint" || beat.view.indexOf("feature") === 0) {
      drawBackdrop("square", beat.view === "overpaint" || beat.view.indexOf("feature") === 0 ? 0.32 : 0.06);
      drawCrowd(now);
      if (beat.view === "squareRam" || beat.view === "squareArrival") {
        drawPair(beat.speaker === "램" ? images[beat.face] : images.ramCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
      }
      if (beat.view === "overpaint" || beat.view.indexOf("feature") === 0) {
        drawEvidence(images.overpaintedPortrait, zoom);
        if (beat.view.indexOf("feature") === 0) drawFeatureMarker(beat.view, now);
      }
    } else if (beat.view.indexOf("warehouse") === 0 || beat.view === "catFound" || beat.view.indexOf("logbook") === 0) {
      drawBackdrop("warehouse", beat.view === "catFound" || beat.view.indexOf("logbook") === 0 ? 0.28 : 0.04);
      drawLamp(now, "warehouse");
      if (beat.view === "warehouseCora") {
        drawPair(beat.speaker === "코라" ? images[beat.face] : images.coraCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
      }
      if (beat.view === "warehouseArrival" || beat.view === "warehouseGap") {
        drawPortrait(images.playerThinking, 34, 286, 202, null);
        if (beat.view === "warehouseGap") {
          ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(now / 160) * 0.2; px(306, 128, 34, 4, PAL.gold); ctx.restore();
        }
      }
      if (beat.view === "catFound") drawEvidence(images.mistFound, zoom);
      if (beat.view === "logbook" || beat.view === "logbookEdges") {
        drawEvidence(images.tornLogbook, zoom);
        drawDrip(now);
        if (beat.view === "logbookEdges") drawPaperEdges(now, local);
      }
    } else {
      drawBackdrop("police", beat.view.indexOf("seal") === 0 || beat.view.indexOf("ledger") === 0 || beat.view === "tattoo" || beat.view === "tattooFiled" ? 0.34 : 0.06);
      drawRain(now);
      drawLamp(now, "police");
      if (beat.view === "policeReed") {
        drawPair(beat.speaker === "리드" ? images[beat.face] : images.reedCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
      }
      if (beat.view === "sealCompare" || beat.view === "sealHolt" || beat.view === "sealReed") {
        drawEvidence(images.sealComparison, zoom);
        if (beat.view === "sealHolt") {
          const width = Math.round(images[beat.face].width * 202 / images[beat.face].height);
          drawPortrait(images[beat.face], 620 - width, 286, 202, null);
        }
        if (beat.view === "sealReed") {
          const width = Math.round(images[beat.face].width * 202 / images[beat.face].height);
          drawPortrait(images[beat.face], 620 - width, 286, 202, null);
        }
      }
      if (beat.view === "ledger" || beat.view === "ledgerColumns") {
        drawEvidence(images.ledgerUnread, zoom);
        drawDrip(now);
        if (beat.view === "ledgerColumns") drawLedgerColumns(now);
      }
      if (beat.view === "tattoo" || beat.view === "tattooFiled") {
        drawEvidence(images.tattooRecord, zoom);
        if (beat.effect === "pulseRed") {
          ctx.save(); ctx.globalAlpha = 0.16 + Math.sin(now / 150) * 0.08; px(287, 92, 68, 74, "#BD554C"); ctx.restore();
        }
        if (beat.effect === "file") {
          ctx.save(); ctx.globalAlpha = Math.min(0.35, local / 1800); px(165, 40, 310, 196, "#81735A"); ctx.restore();
        }
      }
    }

    if (beat.effect === "fadeIn") {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - local / 850);
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
    drawEvidenceCaptionBar(beat);
  }

  function drawEvidenceLabels(textCtx, beat) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (beat.view.indexOf("seal") === 0) {
      textCtx.fillText("복원 결과와 현장 기록 · 같은 배율 대조", 320, 36);
      textCtx.fillStyle = PAL.gold; textCtx.fillText("편지+밀랍 · 세 줄", 244, 220);
      textCtx.fillStyle = "#A8C7C1"; textCtx.fillText("칠판 · 네 줄", 396, 220);
    }
    if (beat.view === "ledger" || beat.view === "ledgerColumns") textCtx.fillText("복원 전 · 침수된 열두 해 재산 관리 장부", 320, 36);
    if (beat.view === "tattoo" || beat.view === "tattooFiled") textCtx.fillText("조서용 현장 기록 · 선명한 먹 / 붉은 피부", 320, 36);
    if (beat.view === "overpaint" || beat.view.indexOf("feature") === 0) textCtx.fillText("현장 관찰 · 두꺼운 덧칠 아래 남은 붓질", 320, 36);
    if (beat.view === "catFound") textCtx.fillText("전단과 일치 · 옅은 회색 / 흰 귀 하나 / 붉은 리본", 320, 36);
    if (beat.view === "logbook" || beat.view === "logbookEdges") textCtx.fillText("발견 당시 · 젖고 찢어진 종이 뭉치", 320, 36);
    if (beat.view.indexOf("feature") === 0) {
      textCtx.font = '900 12px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = beat.view === "featureNose" ? PAL.gold : beat.view === "featureBrow" ? "#D48468" : "#8CB7B2";
      textCtx.fillText(beat.view === "featureNose" ? "굽은 코" : beat.view === "featureBrow" ? "두꺼운 오른눈썹" : "네모난 턱", 320, 222);
    }
    textCtx.textAlign = "left";
  }

    return {
      id: "l3-l4",
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
        return speaker === "플레이어" ? 88 : 82;
      },

      speakerStyle(speaker) {
        const color = speaker === "플레이어" ? "#9BC0B6"
          : speaker === "리드" ? "#9FC3C7"
            : speaker === "홀트" ? "#A7BBC2"
              : speaker === "코라" ? "#D3A9C4" : "#D28B73";
        return { accent: color, text: color };
      },

      leaveScene() {},

      dispose() { images = null; ctx = null; },
    };
  }

  const RENDERER_ID = "l3-l4";
  global.CutsceneRenderer_l3_l4 = Object.freeze({ id: RENDERER_ID, ASSETS, create });
  global.CutsceneRegistry?.registerRenderer(RENDERER_ID, create);
})(typeof window !== "undefined" ? window : globalThis);
