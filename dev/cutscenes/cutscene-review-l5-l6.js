(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
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

  const SCENES = Object.freeze({
    C6_EVIDENCE_WALL: Object.freeze({
      id: "C6_EVIDENCE_WALL",
      title: "세 줄과 네 줄",
      quest: "Q6_EVIDENCE_ROOM",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "carriageFour", text: "Q5A에서 복원한 마차 문입니다. 초승달 아래 파도는 하나, 둘, 셋, 넷.", duration: 4900, textDelay: 740, visualLock: 1750, effect: "traceFour" },
        { speaker: "리드", face: "reedHigh", view: "compare", text: "마차에는 네 줄, 진품 봉인에는 세 줄이오.", duration: 3500, textDelay: 620, visualLock: 700, effect: "compare" },
        { speaker: "홀트", face: "holtCalm", view: "compareHolt", text: "편지 눌림과 밀랍 조각이 만든 진품도 세 줄이었소. 내가 매주 보던 것과 같소.", duration: 4700, textDelay: 180, effect: "compare" },
        { speaker: "플레이어", face: "playerThinking", view: "threeSources", text: "Q5A의 마차 문은 네 줄, Q3A의 진품은 세 줄입니다. 두 결과를 같은 배율로 놓아 보죠.", duration: 4700, textDelay: 230, visualLock: 620, effect: "chalk" },
        { speaker: "리드", face: "reedTense", view: "threeSources", text: "진품만 세 줄이고, 카버가 외운 네 줄은 마차 문과 같군.", duration: 4000, textDelay: 180, effect: "chalk" },
        { speaker: "플레이어", face: "playerReady", view: "linkCarver", text: "카버가 외운 것은 진품이 아니라 이 마차 문이었습니다.", duration: 4200, textDelay: 180, visualLock: 640, effect: "link" },
        { speaker: "리드", face: "reedCalm", view: "compareReed", text: "소유자는 등록부로 확인하겠소. 아직 이름을 단정하지 맙시다.", duration: 4200, textDelay: 180, effect: "compare" },
        { speaker: "리드", face: "reedHigh", view: "officeArrival", text: "그 전에 우리 손에 든 그림부터 한 벽에 모읍시다.", duration: 3700, textDelay: 760, visualLock: 820, effect: "fadeIn" },
        { speaker: "리드", face: "reedTense", view: "evidenceWall", text: "사건을 입증하는 여섯 장을 빠짐없이 벽에 거시오. 그래야 우연이라는 틈을 막을 수 있소.", duration: 4900, textDelay: 650, visualLock: 720, effect: "cards" },
        { speaker: "홀트", face: "holtHigh", view: "evidenceWallHolt", text: "서로 다른 때, 서로 다른 사람이 남긴 그림들이 한곳을 가리키는지 보아야겠군요.", duration: 4600, textDelay: 180, effect: "cards" },
        { speaker: "플레이어", face: "playerThinking", view: "openThread", text: "이번 일은 사라진 선을 복원하는 것이 아니라, 남은 증거의 관계를 증명하는 일입니다.", duration: 5000, textDelay: 200, visualLock: 620, effect: "thread" },
        { speaker: "플레이어", face: "playerReady", view: "openThread", text: "마지막 실은 제가 잇겠습니다.", duration: 3300, textDelay: 170, effect: "threadPulse" },
      ]),
    }),

    C5B_THAT_NIGHT_CLOSING: Object.freeze({
      id: "C5B_THAT_NIGHT_CLOSING",
      title: "그 밤",
      quest: null,
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "sirenHold", text: "그림은 끝났습니다. 기울어진 선체, 드러난 난간, 두 손으로 매달린 열여덟 살의 모습입니다.", duration: 5300, textDelay: 900, visualLock: 1150, effect: "stormStop" },
        { speaker: "뱅크스", face: "banksTense", view: "sirenBanks", text: "그 각도요. 자세도 맞소. 그 아이는 두 손을 놓지 않으려 몸을 낮추고 있었소.", duration: 5000, textDelay: 200, effect: "memoryWarm" },
        { speaker: "뱅크스", face: "banksTense", view: "sirenClose", text: "영웅이 아니었소. 그저 두려움에 떨던 열여덟 살이었지.", duration: 4200, textDelay: 210, visualLock: 650, effect: "still" },
        { speaker: "뱅크스", face: "banksHigh", view: "sirenClose", text: "파도 소리 사이로 어머니를 불렀소. 끝까지, 몇 번이고.", duration: 4200, textDelay: 180, effect: "still" },
        { speaker: "플레이어", face: "playerCalm", view: "sirenPair", text: "없었던 용기를 덧칠하지 않겠습니다. 당신이 본 두려움 그대로 남기죠.", duration: 4500, textDelay: 190, effect: "memoryWarm" },
        { speaker: "뱅크스", face: "banksTense", view: "banksFirst", text: "엘리너 부인에게는 말하지 못했소. 그분이 듣고 싶은 이야기가 아니었으니까.", duration: 4800, textDelay: 260, visualLock: 680, effect: "warmFade" },
        { speaker: "플레이어", face: "playerThinking", view: "sirenPair", text: "듣고 싶은 이야기와 실제로 남겨야 할 기억은 다를 수 있습니다.", duration: 4300, textDelay: 180, effect: "memoryWarm" },
        { speaker: "뱅크스", face: "banksCalm", view: "sirenBanks", text: q5aState === "complete" ? "증거판에 남은 일이 있다면 마지막 연결까지 끝내시오." : "이제 선생이 쫓던 사람 일로 돌아가시오.", duration: 4100, textDelay: 200, effect: "memoryWarm" },
      ]),
    }),
  });

  const BUNDLES = Object.freeze({
    q5a: Object.freeze(["C6_EVIDENCE_WALL"]),
    q5b: Object.freeze(["C5B_THAT_NIGHT_CLOSING"]),
  });

  const SCENE_DURATIONS = Object.freeze(Object.fromEntries(
    Object.values(SCENES).map(function (scene) {
      return [scene.id, scene.beats.reduce(function (sum, beat) { return sum + beat.duration; }, 0)];
    })
  ));

  const art = document.querySelector('[data-role="art"]');
  const ctx = art.getContext("2d");
  const textCanvas = document.querySelector('[data-role="text"]');
  const textCtx = textCanvas.getContext("2d");
  const live = document.querySelector('[data-role="cutscene-live"]');
  const status = document.querySelector('[data-role="review-status"]');

  let images = null;
  let ready = null;
  let active = false;
  let finishing = false;
  let frame = 0;
  let transitionTimer = 0;
  let currentScene = null;
  let playlist = [];
  let playlistIndex = 0;
  let startedAt = 0;
  let beatIndex = 0;
  let forceCompleteText = false;
  let inputLockedUntil = 0;
  let completedSceneIds = [];
  let restartCount = 0;

  ctx.imageSmoothingEnabled = false;
  textCtx.imageSmoothingEnabled = false;

  function loadImages() {
    return Promise.all(Object.entries(ASSETS).map(function (entry) {
      const image = new Image();
      image.decoding = "async";
      image.src = entry[1];
      return image.decode().catch(function () {
        return new Promise(function (resolve, reject) {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }).then(function () { return [entry[0], image]; });
    })).then(function (entries) { return Object.fromEntries(entries); });
  }

  function preload() {
    if (!ready) ready = loadImages().then(function (loaded) { images = loaded; });
    return ready;
  }

  function px(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  function panel(x, y, width, height) {
    px(x + 3, y, width - 6, height, PAL.ink);
    px(x, y + 3, width, height - 6, PAL.ink);
    px(x + 1, y + 3, 1, height - 6, PAL.panelLight);
    px(x + 3, y + 1, width - 6, 1, PAL.panelLight);
    px(x + 2, y + 3, width - 4, height - 6, PAL.panel);
    px(x + 3, y + 2, width - 6, 1, PAL.goldDim);
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
    drawDialogueBox(beat);
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    const color = beat.speaker === "플레이어" ? PAL.teal
      : beat.speaker === "리드" ? PAL.rust
        : beat.speaker === "홀트" ? PAL.blue : PAL.gold;
    px(BOX.x + 16, BOX.y - 16, 3, 14, color);
  }

  function clearText() {
    textCtx.save();
    textCtx.setTransform(1, 0, 0, 1, 0, 0);
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    textCtx.restore();
    textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
  }

  function wrapLines(text, maxWidth) {
    const lines = [];
    let line = "";
    Array.from(text).forEach(function (character) {
      const candidate = line + character;
      if (line && textCtx.measureText(candidate).width > maxWidth) {
        lines.push(line.trimEnd());
        line = character === " " ? "" : character;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line.trimEnd());
    if (lines.length > 1 && Array.from(lines[lines.length - 1]).length < 5) {
      const previous = Array.from(lines[lines.length - 2]);
      const last = Array.from(lines[lines.length - 1]);
      const moveCount = Math.min(5 - last.length, Math.max(0, previous.length - 6));
      if (moveCount > 0) {
        lines[lines.length - 2] = previous.slice(0, -moveCount).join("").trimEnd();
        lines[lines.length - 1] = previous.slice(-moveCount).join("") + last.join("");
      }
    }
    return lines;
  }

  function visibleText(beat, local) {
    const elapsed = Math.max(0, local - (beat.textDelay || 0));
    const count = forceCompleteText ? beat.text.length : Math.floor(elapsed / TYPE_MS);
    return beat.text.slice(0, Math.min(beat.text.length, count));
  }

  function drawSceneLabels(beat) {
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

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawSceneLabels(beat);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = beat.speaker === "플레이어" ? "#9BC0B6"
      : beat.speaker === "리드" ? "#D28B73"
        : beat.speaker === "홀트" ? "#9FC3C7" : "#E0C77D";
    textCtx.fillText(beat.speaker, BOX.x + 10 + nameWidth / 2, BOX.y - 16);

    textCtx.textAlign = "left";
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    const shown = visibleText(beat, local);
    const fullLines = wrapLines(beat.text, BOX.w - 40);
    let remaining = shown.length;
    fullLines.slice(0, 3).forEach(function (line, index) {
      const length = Math.min(line.length, Math.max(0, remaining));
      textCtx.fillText(line.slice(0, length), BOX.x + 20, BOX.y + 17 + index * 21);
      remaining -= line.length;
    });
  }

  function getBeatAt(scene, elapsed) {
    let cursor = 0;
    for (let index = 0; index < scene.beats.length; index += 1) {
      if (elapsed < cursor + scene.beats[index].duration) {
        return { index: index, local: elapsed - cursor, cursor: cursor };
      }
      cursor += scene.beats[index].duration;
    }
    const lastIndex = scene.beats.length - 1;
    return { index: lastIndex, local: scene.beats[lastIndex].duration, cursor: SCENE_DURATIONS[scene.id] - scene.beats[lastIndex].duration };
  }

  function updateLive(beat) {
    live.textContent = beat.speaker + ": " + beat.text;
  }

  function render(now) {
    if (!active || !currentScene) return;
    const elapsed = now - startedAt;
    if (elapsed >= SCENE_DURATIONS[currentScene.id]) {
      finishScene(false);
      return;
    }
    const current = getBeatAt(currentScene, elapsed);
    if (current.index !== beatIndex) {
      beatIndex = current.index;
      forceCompleteText = false;
      updateLive(currentScene.beats[beatIndex]);
    }
    const beat = currentScene.beats[current.index];
    drawScene(beat, current.local, now);
    drawTextLayer(beat, current.local);
    frame = requestAnimationFrame(render);
  }

  function startScene(sceneId) {
    clearTimeout(transitionTimer);
    cancelAnimationFrame(frame);
    currentScene = SCENES[sceneId];
    active = true;
    finishing = false;
    beatIndex = 0;
    forceCompleteText = false;
    inputLockedUntil = 0;
    startedAt = performance.now();
    updateLive(currentScene.beats[0]);
    status.textContent = currentScene.title + " 재생 중 · " + (playlistIndex + 1) + "/" + playlist.length;
    frame = requestAnimationFrame(render);
  }

  function startPlaylist(sceneIds, isRestart) {
    playlist = sceneIds.slice();
    playlistIndex = 0;
    completedSceneIds = [];
    if (isRestart) restartCount += 1;
    preload().then(function () { startScene(playlist[0]); }).catch(function (error) {
      console.error(error);
      status.textContent = "컷신 자산을 불러오지 못했습니다.";
    });
  }

  function finishScene(skipped) {
    if (!active || finishing) return;
    finishing = true;
    active = false;
    cancelAnimationFrame(frame);
    completedSceneIds.push(currentScene.id + (skipped ? ":skipped" : ":complete"));
    status.textContent = currentScene.title + (skipped ? " · 스킵됨" : " · 검토 재생 완료");
    if (playlistIndex < playlist.length - 1) {
      playlistIndex += 1;
      transitionTimer = window.setTimeout(function () { startScene(playlist[playlistIndex]); }, 760);
    }
  }

  function advance() {
    if (!active || !currentScene) return;
    const now = performance.now();
    if (now < inputLockedUntil) return;
    const current = getBeatAt(currentScene, now - startedAt);
    const beat = currentScene.beats[current.index];
    if (current.local < (beat.visualLock || 0)) return;
    const typed = Math.floor(Math.max(0, current.local - (beat.textDelay || 0)) / TYPE_MS);
    if (!forceCompleteText && typed < beat.text.length) {
      forceCompleteText = true;
      inputLockedUntil = now + INPUT_LOCK_MS;
      return;
    }
    if (current.index >= currentScene.beats.length - 1) {
      finishScene(false);
      return;
    }
    startedAt = now - (current.cursor + beat.duration + 1);
    beatIndex = current.index + 1;
    forceCompleteText = false;
    inputLockedUntil = now + INPUT_LOCK_MS;
    updateLive(currentScene.beats[beatIndex]);
  }

  const selectedBundle = BUNDLES[bundleKey];

  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      event.preventDefault();
      advance();
    }
    if (event.key === "Escape") finishScene(true);
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      startPlaylist(selectedBundle, true);
    }
  });

  window.L5L6CutsceneReview = Object.freeze({
    bundle: bundleKey,
    fixture: Object.freeze({ q5a: q5aState }),
    sceneIds: selectedBundle.slice(),
    scenes: SCENES,
    durations: SCENE_DURATIONS,
    diagnostics: function () {
      return Object.freeze({
        active: active,
        currentSceneId: currentScene ? currentScene.id : null,
        beatIndex: beatIndex,
        playlistIndex: playlistIndex,
        completedSceneIds: completedSceneIds.slice(),
        restartCount: restartCount,
        artSize: [art.width, art.height],
        textSize: [textCanvas.width, textCanvas.height],
      });
    },
  });

  startPlaylist(selectedBundle, false);
})();
