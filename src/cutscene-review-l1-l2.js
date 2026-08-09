(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
  const ROOT = "assets/cutscenes/l1-l2/";
  const C0B = "assets/cutscenes/c0b/portraits/";
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
  });

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

  const SCENES = Object.freeze({
    C2C_RAIN_BEHIND_THE_DOOR: Object.freeze({
      id: "C2C_RAIN_BEHIND_THE_DOOR",
      title: "문 뒤의 빗물",
      quest: "Q2C_CHILD_ROOM",
      beats: Object.freeze([
        { speaker: "엘리너", face: "eleanorHigh", view: "parlorPortrait", text: "이 눈이…… 그래요. 열여덟 살 때의 그 아이예요.", duration: 3300, textDelay: 560, visualLock: 760 },
        { speaker: "플레이어", face: "playerThinking", view: "parlorEleanor", text: "복원은 끝났습니다. 가까이서 보시면 남아 있던 빛도 확인하실 수 있습니다.", duration: 3700, textDelay: 170 },
        { speaker: "베스", face: "bethTense", view: "parlorBethEnter", text: "부인! 서쪽 복도에 또 물이 들어옵니다. 이번에는 벽 안쪽까지요.", duration: 3900, textDelay: 420, visualLock: 620, effect: "door" },
        { speaker: "엘리너", face: "eleanorTense", view: "parlorBeth", text: "그 방은 열지 말라고 했을 텐데.", duration: 2800, textDelay: 160 },
        { speaker: "베스", face: "bethTense", view: "parlorBeth", text: "열지는 않았어요. 문틈 옆 벽지가 부풀어서 안의 색이 비쳐요.", duration: 3700, textDelay: 170 },
        { speaker: "엘리너", face: "eleanorTense", view: "hallDoor", text: "열쇠를 가져왔어요. 십이 년 만에 이 문을 여는군요.", duration: 3600, textDelay: 740, visualLock: 740, effect: "lightning" },
        { speaker: "플레이어", face: "playerReady", view: "hallDoor", text: "제가 열겠습니다. 기억은 기다려도 비는 기다리지 않습니다.", duration: 3900, textDelay: 210, effect: "doorOpen", doorOpen: true },
        { speaker: "베스", face: "bethTense", view: "wetWall", text: "저기요. 배 한 척이 보여요. 사람은…… 크기가 다른 셋이고요.", duration: 4100, textDelay: 700, visualLock: 760, effect: "drips", doorOpen: true },
        { speaker: "플레이어", face: "playerThinking", view: "wetWall", text: "아래에는 글씨 두 자가 있습니다. 물에 번져 획이 거의 끊겼군요.", duration: 3900, textDelay: 820, visualLock: 820, effect: "drips", doorOpen: true },
        { speaker: "엘리너", face: "eleanorTense", view: "hallEleanor", text: "에드먼드는 가족을 그리면 늘 아래에 ‘우리’라고 썼어요.", duration: 3900, textDelay: 210, effect: "lightningSoft", doorOpen: true },
        { speaker: "플레이어", face: "playerReady", view: "wetWall", text: "배 하나, 사람 셋, 그리고 ‘우리’. 지금 종이에 옮겨 남은 획을 복원해야 합니다.", duration: 4500, textDelay: 190, effect: "drips", doorOpen: true },
      ]),
    }),

    C2A_HOLTS_MEMORY: Object.freeze({
      id: "C2A_HOLTS_MEMORY",
      title: "홀트가 기억한 얼굴",
      quest: "Q2A_TRUE_FACE",
      beats: Object.freeze([
        { speaker: "플레이어", face: "playerCalm", view: "parlorEleanor", text: "베스가 벽에 방수천을 대고 옮길 종이를 준비 중입니다. 그동안 초상을 다시 보죠.", duration: 4500, textDelay: 720, visualLock: 760, effect: "fadeIn" },
        { speaker: "플레이어", face: "playerThinking", view: "parlorPortrait", text: "부인. 관자놀이 쪽은 물감이 두 겹입니다. 원래 선을 덮어 칠했습니다.", duration: 4300, textDelay: 680, visualLock: 760 },
        { speaker: "엘리너", face: "eleanorTense", view: "firstEleanor", text: "그 아이 얼굴에 흠이 있는 걸 견딜 수가 없었어요.", duration: 3400, textDelay: 220 },
        { speaker: "엘리너", face: "eleanorTense", view: "firstEleanor", text: "화가에게 부탁했죠. 턱은 부드럽게, 눈썹은 반듯하게 그려 달라고.", duration: 4000, textDelay: 170 },
        { speaker: "플레이어", face: "playerThinking", view: "parlorEleanor", text: "그렇다면 이 초상만으로는 카버 씨와 비교할 수 없습니다.", duration: 3500, textDelay: 170 },
        { speaker: "플레이어", face: "playerCalm", view: "parlorEleanor", text: "미화되기 전 얼굴을 매일 본 사람이 있습니까.", duration: 3200, textDelay: 150 },
        { speaker: "엘리너", face: "eleanorCalm", view: "parlorEleanor", text: "옛 가정교사 홀트 선생뿐이에요. 아직 학교에 계십니다.", duration: 3600, textDelay: 160 },
        { speaker: "홀트", face: "holtTense", view: "schoolArrival", text: "십이 년 전 얼굴을 말로 다시 세우라니…… 자신은 없습니다만.", duration: 3900, textDelay: 850, visualLock: 900, effect: "fadeIn" },
        { speaker: "홀트", face: "holtCalm", view: "schoolHolt", text: "턱은 어머님을 닮아 각졌습니다. 저 초상처럼 부드럽지 않았지요.", duration: 4200, textDelay: 190 },
        { speaker: "홀트", face: "holtHigh", view: "memoryJaw", text: "웃을 때면 왼쪽 눈썹만 유독 위로 올라갔습니다.", duration: 3800, textDelay: 520, visualLock: 620, effect: "memory" },
        { speaker: "홀트", face: "holtTense", view: "memoryBrow", text: "그리고 관자놀이에 작은 흉터가 있었어요. 나무에서 떨어져서요.", duration: 4100, textDelay: 180, effect: "memory" },
        { speaker: "플레이어", face: "playerThinking", view: "schoolHolt", text: "각진 턱, 웃을 때 올라가는 왼쪽 눈썹, 관자놀이의 작은 흉터.", duration: 4100, textDelay: 180 },
        { speaker: "홀트", face: "holtCalm", view: "schoolHolt", text: "머리도 아주 짙었습니다. 그 네 가지라면 제가 기억하는 에드먼드예요.", duration: 3900, textDelay: 170 },
        { speaker: "플레이어", face: "playerReady", view: "schoolWide", text: "그 증언으로 미화되지 않은 얼굴을 복원하겠습니다. 그래야 카버와 대조할 수 있습니다.", duration: 4600, textDelay: 190, effect: "dust" },
      ]),
    }),

    C2B_MIST_IS_MISSING: Object.freeze({
      id: "C2B_MIST_IS_MISSING",
      title: "안개를 찾습니다",
      quest: "Q2B_CAT",
      beats: Object.freeze([
        { speaker: "코라", face: "coraHigh", view: "ferryWall", text: "세상에, 정말 얼굴이 나왔네! 그런데…… 이 사람은 카버가 아니에요.", duration: 4200, textDelay: 720, visualLock: 820, effect: "fire" },
        { speaker: "플레이어", face: "playerThinking", view: "tavernCora", text: "아는 얼굴입니까.", duration: 2400, textDelay: 140, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "tavernCora", text: "늙은 페리요. 이십 년 전에 바다에서 죽은 선원이에요.", duration: 3500, textDelay: 170, effect: "fire" },
        { speaker: "코라", face: "coraTense", view: "tavernCora", text: "괜히 헛수고를 시켰네요. 미안해서 어쩌지.", duration: 2900, textDelay: 160, effect: "fire" },
        { speaker: "플레이어", face: "playerCalm", view: "ferryWall", text: "아닙니다. 카버가 이 층에는 없었다는 것도 결과입니다.", duration: 3500, textDelay: 170, effect: "fire" },
        { speaker: "코라", face: "coraTense", view: "firstCora", text: "결과라…… 그럼 하나만 더 그려 줄 수 있어요? 우리 안개가 사흘째 안 보여요.", duration: 4300, textDelay: 220, effect: "fire" },
        { speaker: "플레이어", face: "playerThinking", view: "tavernCora", text: "고양이의 생김새를 정확히 말씀해 주세요.", duration: 3000, textDelay: 150, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "catMemory", text: "몸은 옅은 회색이고, 귀는 한쪽만 하얘요.", duration: 3500, textDelay: 700, visualLock: 760, effect: "memoryWarm" },
        { speaker: "코라", face: "coraHigh", view: "catMemory", text: "목에는 붉은 리본을 매 줬어요. 다른 회색 고양이와 헷갈리면 안 돼요.", duration: 4000, textDelay: 180, effect: "ribbon" },
        { speaker: "플레이어", face: "playerReady", view: "tavernCora", text: "흰 귀 하나와 붉은 리본이 보이도록 전단을 그리죠. 글만으로는 찾기 어렵습니다.", duration: 4400, textDelay: 180, effect: "fire" },
        { speaker: "코라", face: "coraCalm", view: "tavernWide", text: "고마워요. 안개가 돌아오면 선생 자리는 평생 비워 둘게요.", duration: 3700, textDelay: 170, effect: "fire" },
      ]),
    }),
  });

  const BUNDLES = Object.freeze({
    q1a: Object.freeze(["C2C_RAIN_BEHIND_THE_DOOR", "C2A_HOLTS_MEMORY"]),
    q1b: Object.freeze(["C2B_MIST_IS_MISSING"]),
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
    drawDialogueBox(beat);
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const longName = beat.speaker.length >= 6;
    const nameWidth = longName ? 112 : beat.speaker === "플레이어" ? 88 : 82;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    const color = beat.speaker === "플레이어" ? PAL.teal
      : beat.speaker === "엘리너" ? "#B58AA6"
        : beat.speaker === "베스" ? "#D2A45D"
          : beat.speaker === "홀트" ? PAL.blue : PAL.rust;
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
    if (beat.view === "parlorPortrait") textCtx.fillText("복원 결과 · 엘리너가 간직한 초상", 320, 36);
    if (beat.view === "wetWall") textCtx.fillText("현장 관찰 · 배 한 척 / 사람 셋 / 번진 글씨", 320, 36);
    if (beat.view === "ferryWall") textCtx.fillText("복원 결과 · 12년 전 선술집 벽 층", 320, 36);
    if (beat.view === "catMemory") textCtx.fillText("코라의 기억 · 옅은 회색 / 흰 귀 하나 / 붉은 리본", 320, 36);
    if (beat.view === "memoryJaw" || beat.view === "memoryBrow") {
      textCtx.fillText("홀트의 직접 증언 · 미화되기 전 얼굴", 210, 42);
      textCtx.font = '900 12px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = beat.view === "memoryJaw" ? PAL.gold : "#D48468";
      textCtx.fillText(beat.view === "memoryJaw" ? "각진 턱 · 왼쪽 눈썹" : "왼쪽 눈썹 · 관자놀이 흉터", 210, 220);
    }
    textCtx.textAlign = "left";
  }

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawEvidenceLabels(beat);
    const longName = beat.speaker.length >= 6;
    const nameWidth = longName ? 112 : beat.speaker === "플레이어" ? 88 : 82;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = beat.speaker === "플레이어" ? "#9BC0B6"
      : beat.speaker === "엘리너" ? "#D3A9C4"
        : beat.speaker === "베스" ? "#E0B66A"
          : beat.speaker === "홀트" ? "#9FC3C7" : "#D28B73";
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

  const params = new URLSearchParams(window.location.search);
  const bundleKey = params.get("bundle") === "q1b" ? "q1b" : "q1a";
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

  window.L1L2CutsceneReview = Object.freeze({
    bundle: bundleKey,
    sceneIds: selectedBundle.slice(),
    scenes: SCENES,
  });

  startPlaylist(selectedBundle);
})();
