(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
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

  const FIXTURES = Object.freeze({
    "main-only": Object.freeze([]),
    q3b: Object.freeze(["q3b"]),
    "q2c-q3c-q4c": Object.freeze(["q2c", "q3c", "q4c"]),
    "q5b-route": Object.freeze(["q3c", "q5b"]),
    all: Object.freeze(["q2c", "q3b", "q3c", "q4c", "q5b"]),
  });

  function beat(speaker, face, view, text, options) {
    return Object.freeze(Object.assign({
      speaker: speaker,
      face: face,
      view: view,
      text: text,
      duration: 3450,
      textDelay: 150,
    }, options || {}));
  }

  const MAIN_OPENING = Object.freeze([
    beat("플레이어", "playerThinking", "officeBoard", "마지막 실을 이었습니다. 봉인의 세 줄은 마차의 네 줄에 닿았습니다.", { duration: 4100, textDelay: 700, visualLock: 760, effect: "threads" }),
    beat("리드", "reedTense", "registryClosed", "그래도 소유자 이름은 그림으로 단정할 수 없소. 등록부를 펼치시오.", { duration: 3900, textDelay: 680, visualLock: 720, effect: "fadeIn" }),
    beat("리드", "reedHigh", "registryReveal", "해당 마차의 등록 소유자는 줄리언 아셔튼. 그는 십이 년째 같은 문짝 문양을 유지했소.", { duration: 4700, textDelay: 900, visualLock: 1000, effect: "registry" }),
    beat("플레이어", "playerReady", "registryReveal", "이제 등록 소유자 줄리언 아셔튼과 마차의 네 줄이 처음으로 한 행에 놓였습니다.", { duration: 4300, effect: "registry" }),
    beat("줄리언", "julianHigh", "confrontJulian", "그림은 화가의 주관일 뿐이오. 선 몇 개로 사람을 범인으로 만드는군.", { duration: 4000, textDelay: 500, visualLock: 600 }),
    beat("리드", "reedTense", "compareSeal", "진품 봉인은 에드먼드의 아버지가 남기고 엘리너가 보관한 편지와 밀랍 조각에서 복원한 세 줄이오.", { duration: 5100, textDelay: 650, visualLock: 760, effect: "evidence" }),
    beat("리드", "reedHigh", "compareCarriage", "네 줄은 뱅크스의 기억에서 복원한 마차 문이오. 등록부는 그 마차의 소유자를 확인했지.", { duration: 4500, effect: "evidence" }),
    beat("리드", "reedHigh", "compareChalk", "그리고 카버가 모든 사람 앞에서 직접 그린 네 줄. 출처 세 개가 독립적이오.", { duration: 4300, effect: "evidence" }),
    beat("카버", "carverTense", "confessCarver", "줄리언이 종이에 그려 줬습니다. 백 번은 그리게 했습니다.", { duration: 3900, textDelay: 450, visualLock: 550 }),
    beat("카버", "carverHigh", "confessCarver", "저는 에드먼드가 아닙니다. 정육점에서 일하던 토마스 카버입니다.", { duration: 3800 }),
    beat("리드", "reedTense", "ledger", "카버의 백 번 연습 자백과 장부의 T.C. 넉 달 지급은 같은 준비 기간을 가리키오.", { duration: 4500, textDelay: 700, visualLock: 760, effect: "ledger" }),
  ]);

  const Q3B_BEAT = beat("카버", "carverTense", "tattoo", "문신도 넉 달 전에 줄리언이 시켰습니다.", { duration: 3400, textDelay: 620, visualLock: 700, effect: "evidence" });

  const MAIN_CONFRONT_END = Object.freeze([
    beat("리드", "reedHigh", "confrontJulian", "처음부터 카버를 가장 크게 비난했지. 가장 먼저 알고 있었던 사람처럼.", { duration: 4100 }),
    beat("리드", "reedTense", "ledger", "같은 관리 서명 아래 십이 년 동안 비정상 재산 유출이 이어졌소. 장부 감사가 시작되면 숨길 수 없었겠지.", { duration: 4700, textDelay: 640, visualLock: 720, effect: "ledger" }),
    beat("플레이어", "playerThinking", "confrontJulian", "확보한 장부와 카버의 사칭 자백, 등록부를 함께 보면 계획은 하나입니다.", { duration: 3800, textDelay: 620, visualLock: 700 }),
    beat("플레이어", "playerReady", "confrontJulian", "가짜 상속인에게 장부 승인과 재산 처분을 맡겨, 상속 절차 뒤로 횡령을 덮으려 한 겁니다.", { duration: 4500, textDelay: 640, visualLock: 720 }),
    beat("줄리언", "julianTense", "confrontJulian", "…….", { duration: 2300, textDelay: 300 }),
    beat("리드", "reedHigh", "confrontJulian", "경관, 카버는 사칭·공모 혐의로, 줄리언은 공모·횡령 혐의로 구금하시오.", { duration: 4300, textDelay: 620, visualLock: 700 }),
    beat("플레이어", "playerCalm", "parlorArrival", "카버는 에드먼드가 아니었습니다. 이제 의심이 아닌 증거로 말씀드립니다.", { duration: 4700, textDelay: 1700, visualLock: 1650, effect: "fadeIn", transition: Object.freeze({ time: "그날 새벽", place: "아셔튼 저택" }) }),
    beat("플레이어", "playerReady", "trueFace", "대신 열여덟 살 에드먼드의 얼굴을 가져왔습니다.", { duration: 3600, textDelay: 720, visualLock: 820, effect: "evidence" }),
    beat("엘리너", "eleanorTense", "trueFaceEleanor", "각진 턱, 웃을 때 올라가던 왼눈썹, 관자놀이의 작은 흉터…… 맞아요.", { duration: 4300, effect: "evidence" }),
    beat("엘리너", "eleanorHigh", "parlorEleanor", "내가 보고 싶었던 얼굴이 아니라, 그 아이의 얼굴을 돌려주셨군요.", { duration: 4400 }),
  ]);

  const EPILOGUES = Object.freeze({
    q2c: Object.freeze([
      beat("엘리너", "eleanorCalm", "childRoom", "서쪽 복도 문을 열었어요. 이제 빈 방도 그 아이가 살았던 자리예요.", { duration: 4500, textDelay: 1700, visualLock: 1650, effect: "child", transition: Object.freeze({ time: "그날 아침", place: "아셔튼 저택 · 서쪽 복도" }) }),
      beat("플레이어", "playerCalm", "childRoom", "크레용 그림 옆에 진짜 초상이 걸렸습니다. 둘 다 그 애의 기억입니다.", { duration: 4100, effect: "child" }),
    ]),
    q3c: Object.freeze([
      beat("코라", "coraHigh", "tavernCat", "안개야, 거기서 졸면 또 창에 자국이 남아. 그래도 오늘은 꼼짝을 않네.", { duration: 4700, textDelay: 1700, visualLock: 1650, effect: "wipe", transition: Object.freeze({ time: "며칠 뒤", place: "부두 선술집" }) }),
      beat("플레이어", "playerCalm", "tavernCat", "안개가 걷힌 창에서 안개가 잠듭니다. 코라는 오늘도 창을 닦습니다.", { duration: 4000, effect: "wipe" }),
    ]),
    q4c: Object.freeze([
      beat("램", "ramHigh", "squareRam", "복원 초상 한 장! 범인이 아닌 진짜 사람의 얼굴이오! 오늘만 특별가.", { duration: 4500, textDelay: 1700, visualLock: 1650, effect: "crowd", transition: Object.freeze({ time: "며칠 뒤", place: "시장 광장" }) }),
      beat("리드", "reedHigh", "squareReed", "남의 그림을 베껴 팔 시간이 있으면 당장 거기 서시오, 램!", { duration: 3800, effect: "chase" }),
    ]),
    q5b: Object.freeze([
      beat("플레이어", "playerThinking", "siren", "뱅크스의 증언으로 복원한 세이렌 호의 마지막 밤입니다.", { duration: 4400, textDelay: 1700, visualLock: 1650, effect: "storm", transition: Object.freeze({ time: "며칠 뒤 저녁", place: "아셔튼 저택" }) }),
      beat("플레이어", "playerCalm", "siren", "에드먼드는 두 손으로 난간을 잡고 어머니를 불렀습니다. 두려운 열여덟 살이었습니다.", { duration: 4700, effect: "storm" }),
      beat("엘리너", "eleanorTense", "sirenEleanor", "영웅이어서 돌아오지 못한 게 아니었군요. 그 아이는 나를 찾고 있었어요.", { duration: 4400, effect: "storm" }),
      beat("엘리너", "eleanorCalm", "deathCertificate", "십이 년을 미뤄 둔 사망 신고서에 오늘 서명하겠어요. 에드먼드 아셔튼.", { duration: 4500, textDelay: 650, visualLock: 760, effect: "signature" }),
    ]),
  });

  const MAIN_FINALE = Object.freeze([
    beat("플레이어", "playerThinking", "officeReveal", "기억은 원하는 얼굴을 남긴다. 그래서 남은 획을 하나씩 그렸다.", { duration: 4900, textDelay: 1700, visualLock: 1650, effect: "reveal", transition: Object.freeze({ time: "다음 날 새벽", place: "플레이어의 사무소" }) }),
    beat("플레이어", "playerReady", "officeReveal", "진실은 한 장의 그림이 아니라, 서로 다른 사람이 남긴 선 사이에 있었다.", { duration: 4800, effect: "reveal" }),
    beat("플레이어", "playerCalm", "officeDawn", "안개가 걷힌다. 그림은 남고, 사람은 다음 기억으로 걸어간다.", { duration: 4300, effect: "dawn" }),
    beat("플레이어", "playerCalm", "title", "마지막 초상을 완성했다.", { duration: 5200, textDelay: 900, visualLock: 1000, effect: "title" }),
  ]);

  const params = new URLSearchParams(window.location.search);
  const requestedFixture = params.get("fixture") || "main-only";
  const fixtureKey = Object.prototype.hasOwnProperty.call(FIXTURES, requestedFixture) ? requestedFixture : "main-only";
  const flags = new Set(FIXTURES[fixtureKey]);

  function buildBeats() {
    const beats = MAIN_OPENING.slice();
    if (flags.has("q3b")) beats.push(Q3B_BEAT);
    beats.push.apply(beats, MAIN_CONFRONT_END);
    ["q2c", "q3c", "q4c", "q5b"].forEach(function (key) {
      if (flags.has(key)) beats.push.apply(beats, EPILOGUES[key]);
    });
    beats.push.apply(beats, MAIN_FINALE);
    return Object.freeze(beats);
  }

  const SCENE = Object.freeze({
    id: "CE_ENDING",
    title: "마지막 초상",
    beats: buildBeats(),
  });
  const SCENE_DURATION = SCENE.beats.reduce(function (sum, item) { return sum + item.duration; }, 0);

  const art = document.querySelector('[data-role="art"]');
  const ctx = art.getContext("2d");
  const textCanvas = document.querySelector('[data-role="text"]');
  const textCtx = textCanvas.getContext("2d");
  const live = document.querySelector('[data-role="cutscene-live"]');
  const status = document.querySelector('[data-role="review-status"]');

  let images = null;
  let ready = null;
  let active = false;
  let finished = false;
  let frame = 0;
  let startedAt = 0;
  let beatIndex = 0;
  let forceCompleteText = false;
  let inputLockedUntil = 0;
  let heldBeat = null;
  let heldLocal = 0;

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

    drawDialogueBox(item);
    drawMontageTransition(item, local);
  }

  function drawDialogueBox(item) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const nameWidth = item.speaker === "플레이어" ? 88 : 82;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    const color = item.speaker === "플레이어" ? PAL.teal
      : item.speaker === "리드" ? PAL.blue
        : item.speaker === "엘리너" ? "#b58aa6"
          : item.speaker === "줄리언" ? "#c49a62"
            : item.speaker === "카버" ? PAL.rust : PAL.gold;
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

  function visibleText(item, local) {
    const elapsed = Math.max(0, local - (item.textDelay || 0));
    const count = forceCompleteText ? Array.from(item.text).length : Math.floor(elapsed / TYPE_MS);
    return Array.from(item.text).slice(0, count).join("");
  }

  function drawEvidenceLabels(item, local) {
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

  function drawTextLayer(item, local) {
    clearText();
    textCtx.textBaseline = "top";
    if (item.transition && local < 1600) {
      const titleAlpha = local < 1050 ? 1 : Math.max(0, 1 - (local - 1050) / 550);
      textCtx.save();
      textCtx.globalAlpha = titleAlpha;
      textCtx.textAlign = "center";
      textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.gold;
      textCtx.fillText(item.transition.time, 320, 151);
      textCtx.font = '900 18px Georgia, "Apple SD Gothic Neo", serif';
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText(item.transition.place, 320, 174);
      textCtx.restore();
      return;
    }
    drawEvidenceLabels(item, local);
    const nameWidth = item.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = item.speaker === "플레이어" ? "#9bc0b6"
      : item.speaker === "리드" ? "#9fc3c7"
        : item.speaker === "엘리너" ? "#d3a9c4"
          : item.speaker === "줄리언" ? "#ddb77b"
            : item.speaker === "카버" ? "#d28b73" : "#dfbd73";
    textCtx.fillText(item.speaker, BOX.x + 10 + nameWidth / 2, BOX.y - 16);
    textCtx.textAlign = "left";
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    const lines = wrapLines(visibleText(item, local), BOX.w - 40);
    lines.slice(0, 3).forEach(function (line, index) {
      textCtx.fillText(line, BOX.x + 20, BOX.y + 17 + index * 21);
    });
  }

  function getBeatAt(elapsed) {
    let cursor = 0;
    for (let index = 0; index < SCENE.beats.length; index += 1) {
      if (elapsed < cursor + SCENE.beats[index].duration) return { index: index, local: elapsed - cursor, cursor: cursor };
      cursor += SCENE.beats[index].duration;
    }
    const lastIndex = SCENE.beats.length - 1;
    return { index: lastIndex, local: SCENE.beats[lastIndex].duration, cursor: SCENE_DURATION - SCENE.beats[lastIndex].duration };
  }

  function updateLive(item) {
    live.textContent = item.speaker + ": " + item.text;
  }

  function render(now) {
    if (!active) return;
    const elapsed = now - startedAt;
    if (elapsed >= SCENE_DURATION) {
      finishScene(false);
      return;
    }
    const current = getBeatAt(elapsed);
    if (current.index !== beatIndex) {
      beatIndex = current.index;
      forceCompleteText = false;
      updateLive(SCENE.beats[beatIndex]);
    }
    const item = SCENE.beats[current.index];
    drawScene(item, current.local, now);
    drawTextLayer(item, current.local);
    frame = requestAnimationFrame(render);
  }

  function startScene() {
    cancelAnimationFrame(frame);
    active = true;
    finished = false;
    heldBeat = null;
    heldLocal = 0;
    beatIndex = 0;
    forceCompleteText = false;
    inputLockedUntil = 0;
    startedAt = performance.now();
    updateLive(SCENE.beats[0]);
    status.textContent = SCENE.title + " 재생 중 · fixture " + fixtureKey;
    frame = requestAnimationFrame(render);
  }

  function startPlaylist() {
    preload().then(startScene).catch(function (error) {
      console.error(error);
      status.textContent = "컷신 자산을 불러오지 못했습니다.";
    });
  }

  function finishScene(skipped) {
    if (!active) return;
    if (skipped) {
      const current = getBeatAt(performance.now() - startedAt);
      heldBeat = SCENE.beats[current.index];
      heldLocal = current.local;
    } else {
      heldBeat = SCENE.beats[SCENE.beats.length - 1];
      heldLocal = heldBeat.duration;
      forceCompleteText = true;
    }
    active = false;
    finished = true;
    cancelAnimationFrame(frame);
    status.textContent = SCENE.title + (skipped ? " · 스킵됨" : " · 검토 재생 완료");
    frame = requestAnimationFrame(renderHeldFrame);
  }

  function renderHeldFrame(now) {
    if (!finished || !heldBeat) return;
    drawScene(heldBeat, heldLocal, now);
    drawTextLayer(heldBeat, heldLocal);
    frame = requestAnimationFrame(renderHeldFrame);
  }

  function advance() {
    if (!active) return;
    const now = performance.now();
    if (now < inputLockedUntil) return;
    const current = getBeatAt(now - startedAt);
    const item = SCENE.beats[current.index];
    if (current.local < (item.visualLock || 0)) return;
    const typed = Math.floor(Math.max(0, current.local - (item.textDelay || 0)) / TYPE_MS);
    if (!forceCompleteText && typed < Array.from(item.text).length) {
      forceCompleteText = true;
      inputLockedUntil = now + INPUT_LOCK_MS;
      return;
    }
    if (current.index >= SCENE.beats.length - 1) {
      finishScene(false);
      return;
    }
    startedAt = now - (current.cursor + item.duration + 1);
    beatIndex = current.index + 1;
    forceCompleteText = false;
    inputLockedUntil = now + INPUT_LOCK_MS;
    updateLive(SCENE.beats[beatIndex]);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      event.preventDefault();
      advance();
    }
    if (event.key === "Escape") finishScene(true);
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      startPlaylist();
    }
  });

  window.L6EndingCutsceneReview = Object.freeze({
    fixture: fixtureKey,
    flags: Object.freeze(Array.from(flags)),
    sceneIds: Object.freeze(["CE_ENDING"]),
    scene: SCENE,
    durationMs: SCENE_DURATION,
    mainBeatCount: MAIN_OPENING.length + MAIN_CONFRONT_END.length + MAIN_FINALE.length,
    dialogueBox: BOX,
    logicalSize: Object.freeze([W, H]),
    textLayerSize: Object.freeze([1920, 1152]),
    exactRuntimeFacts: Object.freeze(["JULIAN ASHERTON", "12 YEARS", "FOUR-WAVE DOOR", "SEAL:3", "CARRIAGE:4", "CHALK:4", "T.C.:FOUR MONTHS"]),
    restart: startPlaylist,
    isActive: function () { return active; },
    isFinished: function () { return finished; },
    currentBeatIndex: function () { return beatIndex; },
  });

  startPlaylist();
})();
