(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
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

  const SCENE_BLUEPRINTS = Object.freeze({
    C3A_CARVERS_CREST: Object.freeze({
      id: "C3A_CARVERS_CREST",
      title: "카버가 그린 네 줄",
      beats: Object.freeze([
        { speaker: "리드", face: "reedTense", view: "policeWideCompare", text: "학교에서 홀트 선생을 모셔 왔고, 카버 씨도 경찰서로 불렀소.", duration: 4300, textDelay: 650, visualLock: 820, effect: "fadeIn" },
        { speaker: "리드", face: "reedTense", view: "policeWideCompare", text: "홀트 선생의 증언으로 복원한 얼굴을 카버 씨와 대조하겠소.", duration: 4200, textDelay: 220 },
        { speaker: "리드", face: "reedTense", view: "compare", text: "두 얼굴을 같은 크기로 놓고, 남은 차이를 확인하겠소.", duration: 3800, textDelay: 520, visualLock: 700 },
        { speaker: "리드", face: "reedTense", view: "compareJaw", text: "그림은 턱이 각지고, 카버 씨는 둥글군.", duration: 3400, textDelay: 250, effect: "markJaw" },
        { speaker: "리드", face: "reedTense", view: "compareBrow", text: "그림은 왼눈썹이 올라가 있소. 카버 씨 눈썹은 대칭이고.", duration: 3900, textDelay: 210, effect: "markBrow" },
        { speaker: "리드", face: "reedTense", view: "compareScar", text: "그림엔 관자놀이 흉터도 있소. 카버 씨에게는 없고.", duration: 3800, textDelay: 190, effect: "markScar" },
        { speaker: "카버", face: "carverTense", view: "policeCarver", text: "열두 해와 난파를 겪은 얼굴이 그대로일 리 없습니다.", duration: 3900, textDelay: 210 },
        { speaker: "리드", face: "reedTense", view: "julianEnter", text: "줄리언 아셔튼 씨요. 엘리너 부인의 조카이자 지난 열두 해 재산을 관리한 사람이오.", duration: 4500, textDelay: 430, visualLock: 680, effect: "door" },
        { speaker: "줄리언", face: "julianHigh", view: "policeJulian", text: "숙모님, 차이만으로도 충분합니다. 저자는 사기꾼이에요.", duration: 3900, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "policeJulian", text: "차이는 의심의 근거입니다. 신원을 끝낸 판결은 아닙니다.", duration: 3900, textDelay: 190 },
        { speaker: "카버", face: "carverHigh", view: "policeCarver", text: "그렇다면 제가 아는 가문의 표식을 그리겠습니다.", duration: 3700, textDelay: 180 },
        { speaker: "카버", face: "carverHigh", view: "chalkCrescent", text: "먼저 초승달입니다.", duration: 2700, textDelay: 520, visualLock: 660, chalkLines: 0 },
        { speaker: "카버", face: "carverHigh", view: "chalkFour", text: "초승달 아래 파도 네 줄. 어릴 때부터 봤습니다.", duration: 4400, textDelay: 480, visualLock: 2050, chalkLines: 4 },
        { speaker: "엘리너", face: "eleanorTense", view: "policeEleanor", text: "익숙한 문양이에요. 하지만 제 기억만으로는…….", duration: 3700, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "policeEleanor", text: "부인, 기억이 아니라 대조할 실물이 남아 있습니까.", duration: 3900, textDelay: 190 },
        { speaker: "엘리너", face: "eleanorCalm", view: "letter", text: "에드먼드의 아버지가 남긴 편지가 있어요. 제가 갈라진 봉인 밀랍과 함께 보관했습니다.", duration: 4800, textDelay: 650, visualLock: 760 },
        { speaker: "플레이어", face: "playerReady", view: "letter", text: "조각과 편지 눌림을 맞춰 원래 문양을 복원하고, 이 네 줄 그림과 대조하겠습니다.", duration: 4600, textDelay: 190 },
      ]),
    }),
    C3B_FRESH_ANCHOR: Object.freeze({
      id: "C3B_FRESH_ANCHOR",
      title: "소매 아래의 닻",
      beats: Object.freeze([
        { speaker: "카버", face: "carverHigh", view: "anchorReveal", text: "열여덟 살 때 제가 새긴 닻입니다. 이것도 신원의 증거입니다.", duration: 4100, textDelay: 400, visualLock: 680, effect: "wristReveal" },
        { speaker: "플레이어", face: "playerThinking", view: "anchor", text: "닻 도안은 확인했습니다. 손목을 그대로 두십시오.", duration: 3500, textDelay: 620, visualLock: 760 },
        { speaker: "플레이어", face: "playerThinking", view: "anchorPulse", text: "잉크가 선명하고 바늘 주변 피부는 아직 붉군요.", duration: 3900, textDelay: 180, effect: "pulse" },
        { speaker: "리드", face: "reedTense", view: "anchorReed", text: "내일 소매를 감추면 우리에게 남는 게 없소. 지금 그려 주시오.", duration: 4300, textDelay: 190 },
        { speaker: "플레이어", face: "playerReady", view: "anchorSketch", text: "날짜는 단정하지 않겠습니다. 현재 모습부터 조서에 남기죠.", duration: 4100, textDelay: 190, effect: "sketch" },
      ]),
    }),
    C3C_FOLLOW_THE_FLYER: Object.freeze({
      id: "C3C_FOLLOW_THE_FLYER",
      title: "전단이 찾은 창고",
      beats: Object.freeze([
        { speaker: "코라", face: "coraHigh", view: "flyerCora", text: "귀 하나와 붉은 리본까지 맞아요. 여기 붙이면 보이겠죠.", duration: 4100, textDelay: 620, visualLock: 760, effect: "flyer" },
        { speaker: "부두 인부", face: "dockworkerCalm", view: "workerEnter", text: "그 회색 고양이, 한쪽 귀만 하얗고 목에는 붉은 리본을 맸더군.", duration: 4500, textDelay: 420, visualLock: 580 },
        { speaker: "코라", face: "coraTense", view: "dockCora", text: "안개가 맞아요. 한쪽 흰 귀와 붉은 리본을 둘 다 보셨으니까.", duration: 4200, textDelay: 190 },
        { speaker: "플레이어", face: "playerThinking", view: "warehouse", text: "창고 밖에서는 안쪽이 거의 보이지 않는군요.", duration: 3400, textDelay: 520, visualLock: 680 },
        { speaker: "코라", face: "coraCalm", view: "warehouse", text: "창문이 하나도 없어요. 등불 하나로는 발밑만 보여요.", duration: 3900, textDelay: 180, effect: "lantern" },
        { speaker: "플레이어", face: "playerThinking", view: "warehousePlan", text: "비춘 구역, 상자 높이, 젖은 바닥 반사를 차례로 그리겠습니다.", duration: 4400, textDelay: 560, visualLock: 760, effect: "route" },
        { speaker: "플레이어", face: "playerReady", view: "warehousePlan", text: "그 동선을 이어 붙이면 고양이가 숨은 틈까지 찾을 수 있습니다.", duration: 4300, textDelay: 190, effect: "routeComplete" },
      ]),
    }),
    C2C_OPEN_DOOR_CLOSING: Object.freeze({
      id: "C2C_OPEN_DOOR_CLOSING",
      title: "열린 문간",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerCalm", view: "childDoor", text: "문은 열린 채로 두겠습니다. 이제 방 안을 피하지 않아도 됩니다.", duration: 4100, textDelay: 620, visualLock: 760, effect: "fadeIn" },
        { speaker: "플레이어", face: "playerThinking", view: "childDrawing", text: "배 한 척, 사람 셋, 그리고 ‘우리’. 종이에 모두 옮겼습니다.", duration: 4200, textDelay: 650, visualLock: 780 },
        { speaker: "플레이어", face: "playerThinking", view: "childDrawing", text: "한 주만 늦었어도 이 흔적을 모두 잃었을 겁니다.", duration: 3500, textDelay: 180, effect: "drip" },
        { speaker: "엘리너", face: "eleanorTense", view: "childEleanor", text: "문을 열면 아이가 없다는 걸 확인하게 될까 봐 피했어요.", duration: 4300, textDelay: 200 },
        { speaker: "엘리너", face: "eleanorTense", view: "childEleanor", text: "열두 해 동안, 닫힌 문 뒤에는 아직 그 아이가 있다고 생각했죠.", duration: 4300, textDelay: 190 },
        { speaker: "플레이어", face: "playerCalm", view: "childPair", text: "방은 비어 있어도 아이가 남긴 관찰은 사라지지 않습니다.", duration: 3900, textDelay: 190 },
      ]),
      incompleteBeat: Object.freeze({ speaker: "플레이어", face: "playerThinking", view: "childDrawingHair", text: "아이의 머리를 아주 짙게 칠했군요. 이 관찰도 홀트의 증언에 보태겠습니다.", duration: 4500, textDelay: 530, visualLock: 720, effect: "hair" }),
      incompleteFinal: Object.freeze({ speaker: "플레이어", face: "playerReady", view: "childPair", text: "그 증언과 그림으로 미화되기 전 얼굴을 복원하겠습니다.", duration: 4000, textDelay: 180 }),
      completeBeat: Object.freeze({ speaker: "플레이어", face: "playerThinking", view: "childDrawingHair", text: "아주 짙은 머리색도 홀트의 증언과 일치합니다.", duration: 3800, textDelay: 530, visualLock: 720, effect: "hair" }),
      completeFinal: Object.freeze({ speaker: "엘리너", face: "eleanorCalm", view: "childPair", text: "닫힌 문보다, 남아 있는 아이의 흔적을 보겠습니다.", duration: 3800, textDelay: 180 }),
    }),
  });

  const params = new URLSearchParams(window.location.search);
  const requestedBundle = params.get("bundle");
  const bundleKey = requestedBundle === "q2b" || requestedBundle === "q2c" ? requestedBundle : "q2a";
  const q2aFixture = params.get("q2a") === "complete" ? "complete" : "incomplete";

  function materializeScenes() {
    const scenes = {};
    Object.keys(SCENE_BLUEPRINTS).forEach(function (id) {
      const source = SCENE_BLUEPRINTS[id];
      let beats = source.beats.slice();
      if (id === "C2C_OPEN_DOOR_CLOSING") {
        beats = beats.concat(q2aFixture === "complete"
          ? [source.completeBeat, source.completeFinal]
          : [source.incompleteBeat, source.incompleteFinal]);
      }
      scenes[id] = Object.freeze({ id: source.id, title: source.title, beats: Object.freeze(beats) });
    });
    return Object.freeze(scenes);
  }

  const SCENES = materializeScenes();
  const BUNDLES = Object.freeze({
    q2a: Object.freeze(["C3A_CARVERS_CREST", "C3B_FRESH_ANCHOR"]),
    q2b: Object.freeze(["C3C_FOLLOW_THE_FLYER"]),
    q2c: Object.freeze(["C2C_OPEN_DOOR_CLOSING"]),
  });
  const selectedBundle = BUNDLES[bundleKey];
  const SCENE_DURATIONS = Object.freeze(Object.fromEntries(Object.values(SCENES).map(function (scene) {
    return [scene.id, scene.beats.reduce(function (sum, beat) { return sum + beat.duration; }, 0)];
  })));

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
    drawDialogueBox(beat);
  }

  function drawEvidenceCaptionBacking(beat) {
    const backedViews = ["letter", "anchor", "anchorReveal", "anchorPulse", "anchorReed", "anchorSketch", "flyerCora", "childDrawing", "childDrawingHair"];
    if (backedViews.indexOf(beat.view) === -1) return;
    ctx.save();
    ctx.globalAlpha = 0.82;
    px(152, 29, 336, 18, PAL.ink);
    ctx.restore();
  }

  function speakerColor(speaker) {
    if (speaker === "플레이어") return "#9bc0b6";
    if (speaker === "리드") return "#9fc3c7";
    if (speaker === "엘리너") return "#d3a9c4";
    if (speaker === "카버") return "#d28b73";
    if (speaker === "줄리언") return "#d0ad75";
    if (speaker === "코라") return "#cf8875";
    return "#a7b8a2";
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const nameWidth = beat.speaker.length >= 5 ? 102 : beat.speaker === "플레이어" ? 88 : 82;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    px(BOX.x + 16, BOX.y - 16, 3, 14, speakerColor(beat.speaker));
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
    const count = forceCompleteText ? Array.from(beat.text).length : Math.floor(elapsed / TYPE_MS);
    return Array.from(beat.text).slice(0, count).join("");
  }

  function drawEvidenceLabels(beat) {
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

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawEvidenceLabels(beat);
    const nameWidth = beat.speaker.length >= 5 ? 102 : beat.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = speakerColor(beat.speaker);
    textCtx.fillText(beat.speaker, BOX.x + 10 + nameWidth / 2, BOX.y - 16);

    textCtx.textAlign = "left";
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    const shown = Array.from(visibleText(beat, local));
    const fullLines = wrapLines(beat.text, BOX.w - 40);
    let remaining = shown.length;
    fullLines.forEach(function (line, index) {
      const characters = Array.from(line);
      const length = Math.min(characters.length, Math.max(0, remaining));
      textCtx.fillText(characters.slice(0, length).join(""), BOX.x + 20, BOX.y + 17 + index * 21);
      remaining -= characters.length;
    });
  }

  function validateDialogue() {
    textCtx.save();
    textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    Object.values(SCENES).forEach(function (scene) {
      scene.beats.forEach(function (beat) {
        const lines = wrapLines(beat.text, BOX.w - 40);
        if (lines.length > 3) throw new Error(scene.id + " dialogue exceeds three lines: " + beat.text);
      });
    });
    textCtx.restore();
  }

  function getBeatAt(scene, elapsed) {
    let cursor = 0;
    for (let index = 0; index < scene.beats.length; index += 1) {
      if (elapsed < cursor + scene.beats[index].duration) return { index: index, local: elapsed - cursor, cursor: cursor };
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

  function startPlaylist(sceneIds) {
    playlist = sceneIds.slice();
    playlistIndex = 0;
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
    status.textContent = currentScene.title + (skipped ? " · 스킵됨" : " · 검토 재생 완료");
    if (playlistIndex < playlist.length - 1) {
      playlistIndex += 1;
      transitionTimer = window.setTimeout(function () { startScene(playlist[playlistIndex]); }, 650);
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
    if (!forceCompleteText && typed < Array.from(beat.text).length) {
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

  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      event.preventDefault();
      advance();
    }
    if (event.key === "Escape") finishScene(true);
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      startPlaylist(selectedBundle);
    }
  });

  validateDialogue();
  window.L2L3CutsceneReview = Object.freeze({
    bundle: bundleKey,
    fixture: q2aFixture,
    sceneIds: selectedBundle.slice(),
    scenes: SCENES,
    dialogueBox: BOX,
    logicalSize: Object.freeze([W, H]),
    controls: Object.freeze(["SPACE", "ESC", "R"]),
    hasGameplaySideEffects: false,
  });

  startPlaylist(selectedBundle);
})();
