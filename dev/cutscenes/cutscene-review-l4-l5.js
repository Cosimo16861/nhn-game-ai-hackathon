(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
  const ROOT = "assets/cutscenes/l4-l5/";
  const C0B = "assets/cutscenes/c0b/portraits/";
  const TYPE_MS = 32;
  const INPUT_LOCK_MS = 120;

  const PAL = Object.freeze({
    ink: "#171310",
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
  });

  const ASSETS = Object.freeze({
    station: ROOT + "backgrounds/police-station-ledger.png",
    dock: ROOT + "backgrounds/foggy-dock-night.png",
    square: ROOT + "backgrounds/square-painter-evening.png",
    ledger: ROOT + "inserts/restored-ledger.png",
    journal: ROOT + "inserts/restored-banks-journal.png",
    carriage1: ROOT + "inserts/carriage-layout-1.png",
    carriage2: ROOT + "inserts/carriage-layout-2.png",
    carriage3: ROOT + "inserts/carriage-layout-3.png",
    carriage4: ROOT + "inserts/carriage-layout-4.png",
    carriage5: ROOT + "inserts/carriage-layout-5.png",
    carriageGate: ROOT + "inserts/carriage-door-gate.png",
    siren: ROOT + "inserts/siren-memory.png",
    sirenHands: ROOT + "inserts/siren-hands-memory.png",
    ramPortrait: ROOT + "inserts/ram-self-portrait.png",
    banksCalm: ROOT + "portraits/banks-calm.png",
    banksHigh: ROOT + "portraits/banks-high.png",
    banksTense: ROOT + "portraits/banks-tense.png",
    ramCalm: ROOT + "portraits/ram-calm.png",
    ramHigh: ROOT + "portraits/ram-high.png",
    ramTense: ROOT + "portraits/ram-tense.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
    reedCalm: C0B + "reed-calm.png",
    reedHigh: C0B + "reed-high.png",
    reedTense: C0B + "reed-tense.png",
  });

  const C5A_BEATS = Object.freeze([
    { speaker: "리드", face: "reedCalm", view: "ledgerManager", text: "복원한 장부요. 먼저 재산 관리 서명 열부터 확인합시다.", duration: 3500, textDelay: 650, visualLock: 760, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerManager", text: "번진 획이 이어집니다. 관리 서명은 ‘줄리언 아셔튼’입니다.", duration: 3900, textDelay: 190, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerYears", text: "같은 관리 서명 아래, 십이 년 동안 재산이 비정상 지출로 빠져나갔습니다.", duration: 4400, textDelay: 190, effect: "ink" },
    { speaker: "리드", face: "reedTense", view: "ledgerExpense", text: "그중 같은 금액이 통상 지출과 다른 열에서 반복됐소.", duration: 3700, textDelay: 180, effect: "ink" },
    { speaker: "플레이어", face: "playerThinking", view: "ledgerTC", text: "지급 대상은 ‘T.C.’. 끊기지 않고 넉 달 동안 이어졌습니다.", duration: 3900, textDelay: 190, effect: "ink" },
    { speaker: "리드", face: "reedHigh", view: "stationPair", text: "토마스 카버의 머리글자와 같군. 그에게 넉 달 돈을 댄 셈이오.", duration: 4000, textDelay: 180 },
    { speaker: "플레이어", face: "playerThinking", view: "stationPair", text: "추론은 됩니다. 하지만 관리인이 고용인에게 준 정상 지출이라 반박할 수 있습니다.", duration: 4500, textDelay: 190 },
    { speaker: "리드", face: "reedCalm", view: "stationPair", text: "두 사람이 직접 만났다는 별도 증거가 필요하겠소.", duration: 3400, textDelay: 170 },
    { speaker: "플레이어", face: "playerCalm", view: "dockArrival", text: "뱅크스 씨. 세이렌 호에서 살아남은 선원이라 들었습니다. 토마스 카버를 아십니까.", duration: 4700, textDelay: 760, visualLock: 900, effect: "fadeIn" },
    { speaker: "뱅크스", face: "banksCalm", view: "dockBanks", text: "카버? 선원은 무슨. 정육점에서 고기 손질하던 토마스였소.", duration: 4100, textDelay: 180, effect: "fog" },
    { speaker: "플레이어", face: "playerThinking", view: "dockBanks", text: "그가 시내로 올라가기 전, 누군가 찾아온 적은 없습니까.", duration: 3700, textDelay: 180, effect: "fog" },
    { speaker: "뱅크스", face: "banksTense", view: "dockBanks", text: "그 전 일주일, 밤마다 검은 마차가 저 가스등 밑에 왔소.", duration: 3900, textDelay: 190, effect: "fog" },
    { speaker: "뱅크스", face: "banksHigh", view: "carriageWitness", text: "마차가 서면 토마스가 타고, 얼마 뒤 혼자 돌아왔지.", duration: 3900, textDelay: 640, visualLock: 720, effect: "memory" },
    { speaker: "플레이어", face: "playerThinking", view: "carriageLayout", text: "가스등, 마차, 카버의 식별할 수 없는 실루엣, 정박한 배.", duration: 4700, textDelay: 180, visualLock: 3200, effect: "memory" },
    { speaker: "뱅크스", face: "banksTense", view: "carriageBlur", text: "문에 초승달과 물결 같은 표식이 있었소. 안개 탓에 수와 세부는 모르오.", duration: 4700, textDelay: 180, effect: "memory" },
    { speaker: "플레이어", face: "playerReady", view: "carriageComplete", text: "젖은 돌바닥의 반사까지 먼저 놓으면, 문짝의 위치를 좁힐 수 있습니다.", duration: 4500, textDelay: 180, visualLock: 1200, effect: "layout" },
    { speaker: "플레이어", face: "playerThinking", view: "carriageGate", text: "문짝을 확대해도 초승달 아래에는 안개에 끊긴 흔적만 남아 있습니다.", duration: 4300, textDelay: 720, visualLock: 850, effect: "gateFog" },
    { speaker: "뱅크스", face: "banksTense", view: "carriageGate", text: "나는 저 흐린 잔흔까지만 기억하오. 그 이상은 증언할 수 없소.", duration: 3900, textDelay: 180, effect: "gateFog" },
    { speaker: "플레이어", face: "playerReady", view: "carriageGate", text: "문짝의 끊긴 흔적은 작업대에서 이어 보겠습니다.", duration: 3900, textDelay: 180, effect: "gateFog" },
    { speaker: "리드", face: "reedCalm", view: "dockWide", text: "소유자는 단정하지 맙시다. 먼저 그 밤의 배치를 그림으로 남기시오.", duration: 4300, textDelay: 190, effect: "fog" },
  ]);

  const C5B_BEATS = Object.freeze([
    { speaker: "플레이어", face: "playerCalm", view: "dockArrival", text: "뱅크스 씨, 세이렌 호 생존 선원께서 맡긴 일지를 복원했습니다. 돌려드립니다.", duration: 4600, textDelay: 680, visualLock: 820, effect: "fadeIn" },
    { speaker: "뱅크스", face: "banksCalm", view: "journalReturn", text: "고맙소. 젖어 붙었던 줄은 선생이 먼저 읽어 주시오.", duration: 3600, textDelay: 180, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalMidnight", text: "복원된 첫 기록입니다. ‘자정.’", duration: 2800, textDelay: 680, visualLock: 730, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalCarriage", text: "다음 획은 ‘검은 마차.’", duration: 2700, textDelay: 150, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalPost", text: "‘가스등 두 번째 기둥 옆.’ 장소도 남아 있습니다.", duration: 3500, textDelay: 160, effect: "journal" },
    { speaker: "플레이어", face: "playerThinking", view: "journalThomas", text: "‘토마스가 탔다.’ 인물의 행동까지 적혀 있습니다.", duration: 3500, textDelay: 160, effect: "journal" },
    { speaker: "플레이어", face: "playerReady", view: "journalThird", text: "마지막은 ‘사흘째 같은 자리.’ 반복 방문을 직접 기록했군요.", duration: 4100, textDelay: 160, effect: "journal" },
    { speaker: "뱅크스", face: "banksTense", view: "dockBanks", text: "마차 주인은 몰랐소. 안개 속 문짝만 봤으니 그 이상은 내 증언이 아니오.", duration: 4600, textDelay: 210, effect: "fog" },
    { speaker: "뱅크스", face: "banksCalm", view: "journalReturn", text: "일지를 돌려받았으니, 이번에는 내가 남겨야 할 밤이 있소.", duration: 4000, textDelay: 180, effect: "journal" },
    { speaker: "플레이어", face: "playerCalm", view: "dockBanks", text: "세이렌 호가 침몰한 밤을 말씀하시는군요.", duration: 3300, textDelay: 170, effect: "fog" },
    { speaker: "뱅크스", face: "banksHigh", view: "stormTilt", text: "폭풍이 선체를 크게 기울였소. 갑판은 걷는 바닥이 아니라 벽처럼 솟았지.", duration: 4500, textDelay: 730, visualLock: 800, effect: "storm" },
    { speaker: "플레이어", face: "playerThinking", view: "stormTilt", text: "선체 기울기와 폭풍의 방향부터 고정하겠습니다.", duration: 3500, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksTense", view: "stormRail", text: "난간이 보였소. 에드먼드는 거기에 매달려 있었소.", duration: 3700, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksTense", view: "stormHands", text: "두 손으로 난간을 붙들고, 미끄러지지 않으려 온몸으로 버텼소.", duration: 4400, textDelay: 180, visualLock: 1200, effect: "stormHands" },
    { speaker: "플레이어", face: "playerThinking", view: "stormHands", text: "두 손의 위치와 몸의 무게가 난간 아래로 쏠린 자세를 남기겠습니다.", duration: 4500, textDelay: 180, effect: "stormBothHands" },
    { speaker: "뱅크스", face: "banksHigh", view: "stormHands", text: "그 애는 어머니를 불렀소. 계속, 어머니를.", duration: 3900, textDelay: 180, effect: "stormMute" },
    { speaker: "뱅크스", face: "banksTense", view: "stormHands", text: "누굴 구하려고 영웅처럼 선 게 아니오. 두려워 매달린 열여덟 살이었소.", duration: 4800, textDelay: 180, effect: "stormMute" },
    { speaker: "플레이어", face: "playerReady", view: "stormWide", text: "기울어진 선체, 폭풍, 난간, 두 손 자세. 들은 그대로 그리겠습니다.", duration: 4600, textDelay: 180, effect: "storm" },
    { speaker: "뱅크스", face: "banksCalm", view: "dockBanks", text: "그래 주시오. 내가 보태지도, 덜어내지도 못하게.", duration: 3700, textDelay: 200, effect: "fog" },
  ]);

  function closingBeats(q5aDone) {
    return Object.freeze([
      { speaker: "램", face: "ramHigh", view: "ramReveal", text: "덧칠 아래서 나온 젊은 얼굴, 내 자화상이오.", duration: 3900, textDelay: 700, visualLock: 760, effect: "paint" },
      { speaker: "플레이어", face: "playerThinking", view: "ramCompare", text: "굽은 코, 유독 두꺼운 오른눈썹, 네모난 턱. 지금 얼굴과 같은 붓질입니다.", duration: 4700, textDelay: 190, effect: "paint" },
      { speaker: "램", face: "ramTense", view: "squareRam", text: "젊을 적엔 저 얼굴이면 무엇이든 팔 수 있다고 믿었지.", duration: 4000, textDelay: 180 },
      { speaker: "램", face: "ramCalm", view: "ramPortrait", text: "하지만 사람들은 자기가 기억하고 싶은 얼굴만 산다.", duration: 4300, textDelay: 180, effect: "paint" },
      { speaker: "플레이어", face: "playerCalm", view: "squareRam", text: "그래도 덧칠 전 얼굴은 사라지지 않았습니다.", duration: 3500, textDelay: 170 },
      { speaker: "램", face: "ramCalm", view: "squareWide", text: q5aDone
        ? "증거판에 남은 일이 있다면 마지막 연결까지 마치시오."
        : "이제 사건으로 돌아가시오. 선생이 쫓던 사람을 놓치기 전에.", duration: 4300, textDelay: 180 },
    ]);
  }

  const params = new URLSearchParams(window.location.search);
  const q5aDone = params.get("q5a") === "1";
  const SCENES = Object.freeze({
    C5A_CARRIAGE_WITNESS: Object.freeze({ id: "C5A_CARRIAGE_WITNESS", title: "넉 달과 검은 마차", beats: C5A_BEATS }),
    C5B_SIREN_WITNESS: Object.freeze({ id: "C5B_SIREN_WITNESS", title: "남겨야 할 그 밤", beats: C5B_BEATS }),
    C4C_PAINTER_CLOSING: Object.freeze({ id: "C4C_PAINTER_CLOSING", title: "사가는 얼굴", beats: closingBeats(q5aDone) }),
  });
  const BUNDLES = Object.freeze({
    q4a: Object.freeze(["C5A_CARRIAGE_WITNESS"]),
    q4b: Object.freeze(["C5B_SIREN_WITNESS"]),
    q4c: Object.freeze(["C4C_PAINTER_CLOSING"]),
  });
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

  function drawPair(npcImage, npcSpeaking, playerSpeaking, playerImage) {
    drawPortrait(playerSpeaking ? (playerImage || images.playerReady) : images.playerCalm, 24, 286, 205, playerSpeaking ? null : 0.5);
    const height = 214;
    const width = Math.round(npcImage.width * height / npcImage.height);
    drawPortrait(npcImage, 614 - width, 286, height, npcSpeaking ? null : 0.52);
  }

  function drawEvidence(image, zoom) {
    const amount = zoom || 0;
    panel(147 - amount, 25 - amount, 346 + amount * 2, 226 + amount * 2);
    drawImageFit(image, 152 - amount, 30 - amount, 336 + amount * 2, 216 + amount * 2);
    ctx.save();
    ctx.globalAlpha = 0.86;
    px(158, 27, 324, 20, "#0B0F10");
    ctx.restore();
  }

  function drawFog(now) {
    ctx.save();
    for (let index = 0; index < 5; index += 1) {
      ctx.globalAlpha = 0.06 + index * 0.012;
      const x = -150 + ((now / (28 + index * 4) + index * 170) % 940);
      ctx.fillStyle = "#B8C4BE";
      ctx.beginPath();
      ctx.ellipse(x, 124 + index * 21, 180, 35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRain(now, hard) {
    ctx.save();
    ctx.globalAlpha = hard ? 0.68 : 0.24;
    ctx.strokeStyle = hard ? "#9CB2B5" : PAL.rain;
    ctx.lineWidth = hard ? 2 : 1;
    for (let index = 0; index < (hard ? 42 : 18); index += 1) {
      const x = (index * 41 + now / 9) % 700 - 30;
      const y = (index * 29 + now / 5) % 280;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (hard ? 15 : 5), y + (hard ? 34 : 13));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLedgerOverlay(view, local) {
    const phase = view === "ledgerManager" ? 1 : view === "ledgerYears" ? 2 : view === "ledgerExpense" ? 3 : 4;
    ctx.save();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 2;
    if (phase >= 1) ctx.strokeRect(181, 55, 131, 38);
    if (phase >= 2) ctx.strokeRect(181, 84, 131, 118);
    if (phase >= 3) ctx.strokeRect(318, 85, 120, 46);
    if (phase >= 4) ctx.strokeRect(318, 116, 120, 82);
    ctx.globalAlpha = 0.25 + Math.sin(local / 130) * 0.08;
    const pulse = phase === 1 ? [181, 55, 131, 38]
      : phase === 2 ? [181, 84, 131, 118]
        : phase === 3 ? [318, 85, 120, 46] : [318, 116, 120, 82];
    px(pulse[0], pulse[1], pulse[2], pulse[3], PAL.gold);
    ctx.restore();
  }

  function drawGate(local) {
    drawEvidence(images.carriageGate, Math.min(4, local / 220));
    ctx.save();
    ctx.globalAlpha = 0.11 + Math.sin(local / 260) * 0.03;
    ctx.fillStyle = "#C4D0CB";
    ctx.beginPath();
    ctx.ellipse(320, 158, 96, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCarriageEvidence(view, local) {
    let step = 5;
    if (view === "carriageWitness") step = 2;
    if (view === "carriageLayout") step = Math.min(5, Math.max(1, Math.floor(local / 560) + 1));
    drawEvidence(images["carriage" + step], Math.min(3, local / 260));
    return step;
  }

  function drawHandHighlights(local, sequential) {
    const count = sequential && local < 920 ? 1 : 2;
    const centers = [[344, 156], [365, 161]];
    ctx.save();
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 3;
    centers.slice(0, count).forEach(function (center, index) {
      ctx.globalAlpha = 0.72 + Math.sin(local / 150 + index) * 0.18;
      ctx.beginPath();
      ctx.arc(center[0], center[1], 12, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawScene(beat, local, now) {
    const npcSpeaking = beat.speaker !== "플레이어";
    const playerSpeaking = beat.speaker === "플레이어";

    if (beat.view.indexOf("ledger") === 0) {
      drawBackdrop("station", 0.32);
      drawEvidence(images.ledger, Math.min(4, local / 260));
      drawLedgerOverlay(beat.view, local);
    } else if (beat.view.indexOf("station") === 0) {
      drawBackdrop("station", 0.08);
      drawPair(beat.speaker === "리드" ? images[beat.face] : images.reedCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
      drawRain(now, false);
    } else if (beat.view.indexOf("journal") === 0) {
      drawBackdrop("dock", 0.48);
      drawEvidence(images.journal, Math.min(3, local / 260));
      drawFog(now);
    } else if (beat.view.indexOf("carriageGate") === 0) {
      drawBackdrop("dock", 0.58);
      drawFog(now);
      drawGate(local);
    } else if (beat.view.indexOf("carriage") === 0) {
      drawBackdrop("dock", 0.48);
      drawFog(now);
      const placementStep = drawCarriageEvidence(beat.view, local);
      if (beat.view === "carriageBlur") {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#C5D0CA";
        ctx.beginPath();
        ctx.ellipse(356, 148, 49, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (beat.effect === "layout") {
        ctx.save();
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 2;
        const boxes = [[416, 65, 35, 126], [287, 92, 152, 90], [260, 119, 32, 62], [168, 81, 90, 95], [168, 207, 278, 18]];
        boxes.slice(0, placementStep).forEach(function (box) { ctx.strokeRect(box[0], box[1], box[2], box[3]); });
        ctx.restore();
      }
    } else if (beat.view.indexOf("storm") === 0) {
      drawBackdrop("dock", 0.74);
      drawEvidence(beat.view === "stormHands" ? images.sirenHands : images.siren, Math.min(5, local / 220));
      if (beat.view === "stormHands") drawHandHighlights(local, beat.effect === "stormHands");
      if (beat.effect === "stormMute") {
        ctx.save();
        ctx.globalAlpha = 0.12;
        px(0, 0, W, H, "#E4EDF0");
        ctx.restore();
      }
    } else if (beat.view.indexOf("ram") === 0) {
      drawBackdrop("square", beat.view === "ramCompare" || beat.view === "ramPortrait" ? 0.32 : 0.08);
      if (beat.view === "ramReveal" || beat.view === "ramPortrait") drawEvidence(images.ramPortrait, Math.min(4, local / 260));
      if (beat.view === "ramCompare") {
        drawEvidence(images.ramPortrait, 0);
        const width = Math.round(images.ramCalm.width * 196 / images.ramCalm.height);
        drawPortrait(images.ramCalm, 607 - width, 280, 196, null);
      }
    } else if (beat.view.indexOf("square") === 0) {
      drawBackdrop("square", 0.08);
      if (beat.view === "squareWide") drawPortrait(images.ramCalm, 402, 286, 210, 0.3);
      else drawPair(beat.speaker === "램" ? images[beat.face] : images.ramCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
    } else {
      drawBackdrop("dock", 0.08);
      drawFog(now);
      if (beat.view === "dockWide") {
        drawPortrait(images.reedCalm, 452, 286, 196, beat.speaker === "리드" ? null : 0.52);
        drawPortrait(images.banksCalm, 288, 286, 196, 0.54);
        drawPortrait(images.playerCalm, 26, 286, 200, 0.54);
      } else {
        drawPair(beat.speaker === "뱅크스" ? images[beat.face] : images.banksCalm, npcSpeaking, playerSpeaking, playerSpeaking ? images[beat.face] : null);
      }
    }

    if (beat.effect === "paint") {
      ctx.save();
      ctx.globalAlpha = 0.12 + Math.sin(now / 210) * 0.04;
      px(72, 40, 4, 196, "#D8A94B");
      ctx.restore();
    }
    if (beat.effect === "ink") {
      ctx.save();
      ctx.globalAlpha = Math.min(0.18, local / 2000);
      px(145, 22, 350, 232, "#8F6E31");
      ctx.restore();
    }
    if (beat.effect === "fadeIn") {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - local / 900);
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
    drawDialogueBox(beat);
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    const color = beat.speaker === "플레이어" ? PAL.teal : beat.speaker === "리드" ? PAL.blue : beat.speaker === "뱅크스" ? "#8FA7A3" : PAL.rust;
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
    return lines.slice(0, 3);
  }

  function visibleText(beat, local) {
    const elapsed = Math.max(0, local - (beat.textDelay || 0));
    const count = forceCompleteText ? beat.text.length : Math.floor(elapsed / TYPE_MS);
    return beat.text.slice(0, Math.min(beat.text.length, count));
  }

  function drawEvidenceLabels(beat) {
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    if (beat.view.indexOf("ledger") === 0) textCtx.fillText("복원 장부 · 관리 서명 → 12년 자산 → 반복 지급", 320, 36);
    if (beat.view.indexOf("journal") === 0) {
      const labels = {
        journalMidnight: "복원 일지 1 · 자정",
        journalCarriage: "복원 일지 2 · 검은 마차",
        journalPost: "복원 일지 3 · 가스등 두 번째 기둥 옆",
        journalThomas: "복원 일지 4 · 토마스가 탔다",
        journalThird: "복원 일지 5 · 사흘째 같은 자리",
        journalReturn: "복원한 항해일지 · 뱅크스에게 인계",
      };
      textCtx.fillText(labels[beat.view], 320, 36);
    }
    if (beat.view.indexOf("carriage") === 0) {
      textCtx.fillText(beat.view === "carriageGate" ? "문짝 확대 · 안개 속에 남은 흔적" : "뱅크스의 기억 · 다른 배치를 먼저 고정", 320, 36);
    }
    if (beat.view.indexOf("storm") === 0) textCtx.fillText("뱅크스의 직접 증언 · 기울기 / 폭풍 / 난간 / 두 손", 320, 36);
    if (beat.view.indexOf("ram") === 0) textCtx.fillText("복원 결과 · 램의 젊은 자화상", 320, 36);
    textCtx.textAlign = "left";
  }

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawEvidenceLabels(beat);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = beat.speaker === "플레이어" ? "#9BC0B6" : beat.speaker === "리드" ? "#9FC3C7" : beat.speaker === "뱅크스" ? "#B5C7BF" : "#D28B73";
    textCtx.fillText(beat.speaker, BOX.x + 10 + nameWidth / 2, BOX.y - 16);

    textCtx.textAlign = "left";
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    const shown = visibleText(beat, local);
    const fullLines = wrapLines(beat.text, BOX.w - 40);
    let remaining = shown.length;
    fullLines.forEach(function (line, index) {
      const length = Math.min(line.length, Math.max(0, remaining));
      textCtx.fillText(line.slice(0, length), BOX.x + 20, BOX.y + 17 + index * 21);
      remaining -= line.length;
    });
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

  function updateLive(beat) { live.textContent = beat.speaker + ": " + beat.text; }

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

  const requestedBundle = params.get("bundle");
  const bundleKey = requestedBundle === "q4b" || requestedBundle === "q4c" ? requestedBundle : "q4a";
  const selectedBundle = BUNDLES[bundleKey];

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

  window.L4L5CutsceneReview = Object.freeze({
    bundle: bundleKey,
    q5aDone: q5aDone,
    sceneIds: selectedBundle.slice(),
    scenes: SCENES,
    dialogueBox: BOX,
    logicalScreen: Object.freeze([W, H]),
  });

  startPlaylist(selectedBundle);
})();
