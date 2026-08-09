(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
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

  const SCENES = Object.freeze({
    C4A_LEDGER_TRAIL: Object.freeze({
      id: "C4A_LEDGER_TRAIL",
      title: "세 줄이 남긴 장부",
      quest: "Q4A_LEDGER",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "sealCompare", text: "밀랍 조각과 편지 눌림이 같은 모양을 만들었습니다. 파도는 세 줄입니다.", duration: 4600, textDelay: 720, visualLock: 800, effect: "sealThree" },
        { speaker: "홀트", face: "holtCalm", view: "sealHolt", text: "맞습니다. 제가 매주 서신에서 보던 진품도 초승달 아래 세 줄이었습니다.", duration: 4300, textDelay: 180, effect: "sealThree" },
        { speaker: "리드", face: "reedTense", view: "sealReed", text: "칠판에는 네 줄이오. 지어낸 게 아니라 다른 것을 보고 배운 거라면?", duration: 4300, textDelay: 170, effect: "sealFour" },
        { speaker: "플레이어", face: "playerThinking", view: "policeReed", text: "한동안 누군가를 먹이고 재웠다면 비용이 들었을 겁니다.", duration: 3500, textDelay: 160, effect: "lamp" },
        { speaker: "플레이어", face: "playerReady", view: "policeReed", text: "사람은 숨겨도 계속된 지출은 숨기기 어렵습니다.", duration: 3300, textDelay: 150, effect: "lamp" },
        { speaker: "리드", face: "reedHigh", view: "ledger", text: "아셔튼 가의 열두 해 재산 관리 장부요. 보관 창고가 침수돼 장마다 붙었소.", duration: 4500, textDelay: 700, visualLock: 760, effect: "water" },
        { speaker: "리드", face: "reedTense", view: "ledger", text: "관리 서명과 지급행까지 번져서 남은 획만 간신히 보이는군.", duration: 3900, textDelay: 180, effect: "water" },
        { speaker: "플레이어", face: "playerThinking", view: "ledgerColumns", text: "서명 열과 지출 열, 반복된 지급행의 남은 획을 이어 보겠습니다.", duration: 4400, textDelay: 180, effect: "ledgerColumns" },
      ]),
    }),

    C4C_SQUARE_CHALLENGE: Object.freeze({
      id: "C4C_SQUARE_CHALLENGE",
      title: "광장의 덧칠",
      quest: "Q4C_SQUARE_BET",
      beats: Object.freeze([
        { speaker: "램", face: "ramTense", view: "squareArrival", text: "거기, 사건 그림쟁이! 경찰서에만 숨어 있지 말고 광장으로 나오시지!", duration: 4300, textDelay: 820, visualLock: 880, effect: "fadeIn" },
        { speaker: "램", face: "ramTense", view: "squareRam", text: "이것도 못 맞추면 오늘로 간판을 내리시오. 사람들 앞에서 말이야.", duration: 4100, textDelay: 170, effect: "crowd" },
        { speaker: "플레이어", face: "playerThinking", view: "overpaint", text: "두꺼운 덧칠 아래에 오래된 젊은 남자의 얼굴 윤곽이 남아 있습니다.", duration: 4400, textDelay: 690, visualLock: 760, effect: "paint" },
        { speaker: "램", face: "ramTense", view: "squareRam", text: "누구인지는 묻지 마시오. 맞히는 게 선생 일 아닌가.", duration: 3300, textDelay: 160, effect: "crowd" },
        { speaker: "플레이어", face: "playerThinking", view: "featureNose", text: "덧칠이 비껴 간 곳에 굽은 코의 긴 붓질이 보입니다.", duration: 3600, textDelay: 420, visualLock: 520, effect: "feature" },
        { speaker: "플레이어", face: "playerThinking", view: "featureBrow", text: "오른눈썹에는 유독 두꺼운 짧은 획이 남았고요.", duration: 3400, textDelay: 160, effect: "feature" },
        { speaker: "플레이어", face: "playerReady", view: "featureJaw", text: "네모난 턱을 닫는 두 선도 찾았습니다. 이 세 붓질을 따라 덧칠 전 얼굴을 복원하죠.", duration: 4700, textDelay: 180, effect: "feature" },
      ]),
    }),

    C3B_TOO_NEW_CLOSING: Object.freeze({
      id: "C3B_TOO_NEW_CLOSING",
      title: "아물지 않은 것",
      quest: null,
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "tattoo", text: "조서에 옮긴 닻 도안입니다. 먹색은 선명하고 바늘 주변 피부는 아직 붉습니다.", duration: 4700, textDelay: 700, visualLock: 780, effect: "pulseRed" },
        { speaker: "플레이어", face: "playerThinking", view: "tattoo", text: "오래된 문신의 바랜 먹과 아문 피부에는 맞지 않습니다.", duration: 3700, textDelay: 170, effect: "pulseRed" },
        { speaker: "리드", face: "reedTense", view: "policeReed", text: "최근에 새겼다는 강한 심증은 나도 인정하오.", duration: 3200, textDelay: 150, effect: "lamp" },
        { speaker: "리드", face: "reedCalm", view: "policeReed", text: "하지만 그림만으로 정확한 날짜를 법정에서 확정할 수는 없소.", duration: 3900, textDelay: 160, effect: "lamp" },
        { speaker: "플레이어", face: "playerCalm", view: "tattooFiled", text: "관찰한 모습 그대로 조서에 붙이겠습니다. 넘겨짚은 날짜는 적지 않겠습니다.", duration: 4200, textDelay: 190, effect: "file" },
      ]),
      pendingBeat: Object.freeze({ speaker: "리드", face: "reedCalm", view: "policeReed", text: "이제 엘리너 부인이 보관한 편지와 밀랍 봉인 실물을 확인합시다.", duration: 4100, textDelay: 170, effect: "lamp" }),
      completeBeat: Object.freeze({ speaker: "리드", face: "reedCalm", view: "policeReed", text: "이 기록은 조서에 붙이고, 증거판에 남은 일로 돌아갑시다.", duration: 3800, textDelay: 170, effect: "lamp" }),
    }),

    C4B_CAT_FOUND_PAPERS: Object.freeze({
      id: "C4B_CAT_FOUND_PAPERS",
      title: "상자 틈의 종이",
      quest: "Q4B_LOGBOOK",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerThinking", view: "warehouseArrival", text: "등불이 비춘 구역과 젖은 바닥 반사를 이으면 저 상자 틈으로 이어집니다.", duration: 4600, textDelay: 820, visualLock: 900, effect: "fadeIn" },
        { speaker: "코라", face: "coraTense", view: "warehouseCora", text: "안개야! 옅은 회색 몸, 흰 귀 하나, 붉은 리본까지 맞아요.", duration: 4100, textDelay: 180, effect: "lantern" },
        { speaker: "코라", face: "coraCalm", view: "catFound", text: "겁먹긴 했어도 다친 데는 없네요. 어디에 몸을 숨겼던 거니?", duration: 3900, textDelay: 650, visualLock: 720, effect: "catEyes" },
        { speaker: "플레이어", face: "playerThinking", view: "warehouseGap", text: "고양이가 나온 틈에 젖고 찢어진 종이 뭉치가 있습니다.", duration: 3900, textDelay: 240, effect: "lantern" },
        { speaker: "코라", face: "coraTense", view: "logbook", text: "기름 먹인 표지예요. 뱅크스 영감이 늘 들고 다니던 작은 일지예요.", duration: 4500, textDelay: 700, visualLock: 780, effect: "drip" },
        { speaker: "코라", face: "coraCalm", view: "logbook", text: "매일 빠짐없이 적는 버릇이 있었으니 제가 알아봐요.", duration: 3500, textDelay: 160, effect: "drip" },
        { speaker: "플레이어", face: "playerThinking", view: "logbookEdges", text: "글을 추측하지 않겠습니다. 결·모서리·남은 획이 이어지는 조각부터 맞추죠.", duration: 4700, textDelay: 180, effect: "paperEdges" },
        { speaker: "코라", face: "coraTense", view: "warehouseCora", text: "세이렌 호에서 건져 온 물건이라 했어요. 돌려줘야 해요.", duration: 3900, textDelay: 170, effect: "lantern" },
      ]),
    }),
  });

  const params = new URLSearchParams(window.location.search);
  const requestedBundle = params.get("bundle");
  const bundleKey = requestedBundle === "q3b" || requestedBundle === "q3c" ? requestedBundle : "q3a";
  const mainState = params.get("main") === "q3a-complete" ? "q3a-complete" : "q3a-pending";

  function sceneWithFixture(scene) {
    if (scene.id !== "C3B_TOO_NEW_CLOSING") return scene;
    const finalBeat = mainState === "q3a-complete" ? scene.completeBeat : scene.pendingBeat;
    return Object.freeze(Object.assign({}, scene, { beats: Object.freeze(scene.beats.concat([finalBeat])) }));
  }

  const BUNDLES = Object.freeze({
    q3a: Object.freeze(["C4A_LEDGER_TRAIL", "C4C_SQUARE_CHALLENGE"]),
    q3b: Object.freeze(["C3B_TOO_NEW_CLOSING"]),
    q3c: Object.freeze(["C4B_CAT_FOUND_PAPERS"]),
  });

  const sceneRuntime = Object.freeze(Object.fromEntries(Object.entries(SCENES).map(function (entry) {
    return [entry[0], sceneWithFixture(entry[1])];
  })));
  const SCENE_DURATIONS = Object.freeze(Object.fromEntries(Object.values(sceneRuntime).map(function (scene) {
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
  let transitionFrame = 0;
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
    drawDialogueBox(beat);
  }

  function speakerColor(speaker) {
    if (speaker === "플레이어") return "#9BC0B6";
    if (speaker === "리드") return "#9FC3C7";
    if (speaker === "홀트") return "#A7BBC2";
    if (speaker === "코라") return "#D3A9C4";
    return "#D28B73";
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
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
    const count = forceCompleteText ? beat.text.length : Math.floor(elapsed / TYPE_MS);
    return beat.text.slice(0, Math.min(beat.text.length, count));
  }

  function drawEvidenceLabels(beat) {
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

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawEvidenceLabels(beat);
    const nameWidth = beat.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = speakerColor(beat.speaker);
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
    cancelAnimationFrame(transitionFrame);
    cancelAnimationFrame(frame);
    currentScene = sceneRuntime[sceneId];
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
      clearText();
      status.textContent = "경찰서를 나와 광장으로 이동 중 · " + (playlistIndex + 1) + "/" + playlist.length;
      const fadeStartedAt = performance.now();
      function fadeOut(now) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0, now - fadeStartedAt) / 560);
        px(0, 0, W, H, "#050708");
        ctx.restore();
        if (now - fadeStartedAt < 560) {
          transitionFrame = requestAnimationFrame(fadeOut);
        } else {
          transitionTimer = window.setTimeout(function () { startScene(playlist[playlistIndex]); }, 140);
        }
      }
      transitionFrame = requestAnimationFrame(fadeOut);
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
      startPlaylist(selectedBundle);
    }
  });

  window.L3L4CutsceneReview = Object.freeze({
    bundle: bundleKey,
    mainState: mainState,
    sceneIds: selectedBundle.slice(),
    scenes: sceneRuntime,
    durations: SCENE_DURATIONS,
    getState: function () {
      return Object.freeze({
        active: active,
        sceneId: currentScene && currentScene.id,
        playlistIndex: playlistIndex,
        beatIndex: beatIndex,
        status: status.textContent,
      });
    },
  });

  startPlaylist(selectedBundle);
})();
