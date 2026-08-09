(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
  const ROOT = "assets/cutscenes/l0-l1/";
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
    paper: "#D9CDB5",
    paperDark: "#9A896C",
    cold: "#81A6AA",
  });

  const ASSETS = Object.freeze({
    background: ROOT + "backgrounds/police-station-rain.png",
    portraitEvidence: ROOT + "inserts/damaged-edmund-portrait.png",
    wallEvidence: ROOT + "inserts/tavern-wall-layers.png",
    montage: "assets/q0-montage/montage-target.png",
    reedCalm: C0B + "reed-calm.png",
    reedTense: C0B + "reed-tense.png",
    reedHigh: C0B + "reed-high.png",
    playerCalm: C0B + "player-calm.png",
    playerThinking: C0B + "player-thinking.png",
    playerReady: C0B + "player-ready.png",
  });

  const SCENES = Object.freeze({
    C1A_RETURNED_HEIR: Object.freeze({
      id: "C1A_RETURNED_HEIR",
      title: "돌아온 상속자",
      quest: "Q1A_IDEALIZED · 미화된 초상",
      purpose: "아셔튼 사건을 소개하고, 훼손된 유일한 18세 초상을 왜 복원해야 하는지 설명합니다.",
      clues: Object.freeze([
        "출처: 리드 경위가 전달한 엘리너 아셔튼의 쪽지",
        "남은 유일한 열여덟 살 초상",
        "습기로 색이 거의 빠지고 검은 선만 남음",
        "짙은 머리·청록 코트·화면 왼쪽 창가 빛이 메모에 남음",
        "복원해야 카버와 비교할 얼굴이 생김",
      ]),
      beats: Object.freeze([
        { speaker: "리드 경위", face: "reedCalm", view: "poster", text: "사흘 걸렸소. 당신 그림 덕분이라고 서장이 말하더군.", duration: 3100, textDelay: 360, visualLock: 720 },
        { speaker: "플레이어", face: "playerCalm", view: "third", text: "마르타 씨 덕분입니다. 저는 손만 빌려드렸죠.", duration: 2800, textDelay: 160 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "그 손을 좀 더 빌려야겠소. 이번 건은 훨씬 크오.", duration: 3000, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "newspaper", text: "12년 전 세이렌 호가 침몰했소. 아셔튼 가 외아들 에드먼드가 그 배에 있었지.", duration: 4100, textDelay: 740, visualLock: 740 },
        { speaker: "리드 경위", face: "reedCalm", view: "newspaper", text: "시신은 없었고, 어머니 엘리너는 사망 신고를 끝내 거부했소.", duration: 3400, textDelay: 160 },
        { speaker: "리드 경위", face: "reedTense", view: "newspaper", text: "그런데 토마스 카버라는 사내가 나타나 자기가 에드먼드라고 하오.", duration: 3600, textDelay: 180 },
        { speaker: "플레이어", face: "playerThinking", view: "third", text: "열여덟 살 얼굴과 지금 얼굴을 비교할 기록은요.", duration: 2800, textDelay: 150 },
        { speaker: "리드 경위", face: "reedHigh", view: "portrait", text: "하나뿐이오. 엘리너 부인이 간직한 그 아이의 옛 초상.", duration: 3300, textDelay: 900, visualLock: 900 },
        { speaker: "리드 경위", face: "reedTense", view: "portrait", text: "습기를 먹어 색이 거의 빠졌소. 지금은 검은 선만 남았고.", duration: 3300, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "portrait", text: "부인의 쪽지요. 짙은 머리, 청록 코트, 왼쪽 창가의 따뜻한 빛이었다는군.", duration: 4100, textDelay: 240 },
        { speaker: "플레이어", face: "playerThinking", view: "portrait", text: "그 흔적을 복원해야 카버와 비교할 열여덟 살 얼굴이 생기겠군요.", duration: 3900, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "그렇소. 저택 응접실에서 초상을 직접 보고 되살려 주시오.", duration: 3500, textDelay: 170 },
      ]),
    }),

    C1B_TWELVE_YEARS_UNDER: Object.freeze({
      id: "C1B_TWELVE_YEARS_UNDER",
      title: "벽 아래의 열두 해",
      quest: "Q1B_TAVERN_WALL · 선술집 벽",
      purpose: "코라의 서면 진술을 통해 12년 전 벽 층을 복원해야 하는 이유와 조사 한계를 설명합니다.",
      clues: Object.freeze([
        "출처: 선술집 주인 코라의 서면 진술",
        "벽에는 20년 동안 얼굴 위에 얼굴이 덧그려짐",
        "약 12년 전 아래층에 사람 얼굴 하나가 남아 있음",
        "회벽·숯가루·후대 낙서가 겹쳐 현재는 식별 불가",
        "복원 결과가 카버라는 보장은 없으며, 대조를 위해 그려야 함",
      ]),
      beats: Object.freeze([
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "그리고 확인할 길이 하나 더 있소.", duration: 2300, textDelay: 260 },
        { speaker: "플레이어", face: "playerThinking", view: "third", text: "카버가 12년 전에도 이 도시에 있었는지요.", duration: 2800, textDelay: 160 },
        { speaker: "리드 경위", face: "reedCalm", view: "wall", text: "부둣가 선술집의 코라에게 순경을 보냈소. 이건 그 여자의 진술이오.", duration: 3900, textDelay: 860, visualLock: 860 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "우리 벽은 스무 해 동안 손님들이 얼굴 위에 얼굴을 덧그렸어요.", duration: 3700, textDelay: 200 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "겉의 낙서 말고, 12년 전쯤 아래층에 사람 얼굴 하나가 남아 있어요.", duration: 3900, textDelay: 200 },
        { speaker: "코라의 진술", face: null, view: "wall", text: "회벽과 숯가루가 겹쳐서 지금은 누구 얼굴인지 볼 수 없고요.", duration: 3700, textDelay: 180 },
        { speaker: "플레이어", face: "playerThinking", view: "wall", text: "그 층을 꺼내 복원하면, 카버가 그때 이 도시에 있었는지 대조할 수 있겠군요.", duration: 4400, textDelay: 220 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "맞소. 다만 나온 얼굴이 카버라는 보장은 없소.", duration: 3000, textDelay: 170 },
        { speaker: "리드 경위", face: "reedTense", view: "third", text: "그래서 그리는 거요. 맞는지 틀린지, 기억만으로는 남길 수 없으니까.", duration: 3900, textDelay: 180 },
        { speaker: "리드 경위", face: "reedCalm", view: "third", text: "저택과 선술집, 두 곳 모두 열어 두겠소. 어디부터 볼지는 선생이 정하시오.", duration: 4100, textDelay: 180 },
      ]),
    }),
  });

  const SCENE_DURATIONS = Object.freeze(Object.fromEntries(
    Object.values(SCENES).map(function (scene) {
      return [scene.id, scene.beats.reduce(function (sum, beat) {
        return sum + beat.duration;
      }, 0)];
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

  function drawPortrait(image, x, bottom, height, dim) {
    const width = Math.round(image.width * height / image.height);
    ctx.save();
    if (dim) ctx.filter = "brightness(" + dim + ") saturate(58%)";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, Math.round(x), Math.round(bottom - height), width, height);
    ctx.restore();
    return width;
  }

  function drawBackdrop(darkness) {
    ctx.clearRect(0, 0, W, H);
    drawImageFit(images.background, 0, 0, W, H);
    if (darkness) {
      ctx.save();
      ctx.globalAlpha = darkness;
      px(0, 0, W, H, "#050708");
      ctx.restore();
    }
  }

  function drawThird(beat) {
    const playerSpeaking = beat.speaker === "플레이어";
    const reedSpeaking = beat.speaker === "리드 경위";
    const playerImage = beat.face && beat.face.indexOf("player") === 0
      ? images[beat.face] : images.playerCalm;
    const reedImage = beat.face && beat.face.indexOf("reed") === 0
      ? images[beat.face] : images.reedCalm;
    drawPortrait(playerImage, 24, 286, 202, playerSpeaking ? null : 0.54);
    const reedHeight = 216;
    const reedWidth = Math.round(reedImage.width * reedHeight / reedImage.height);
    drawPortrait(reedImage, 610 - reedWidth, 286, reedHeight, reedSpeaking ? null : 0.54);
    px(300, 244, 38, 3, playerSpeaking ? PAL.teal : PAL.goldDim);
  }

  function drawEvidenceFrame(image) {
    panel(147, 25, 346, 226);
    drawImageFit(image, 152, 30, 336, 216);
  }

  function drawPoster() {
    drawBackdrop(0.22);
    const x = 229;
    const y = 28;
    panel(x - 5, y - 5, 192, 228);
    px(x, y, 182, 218, PAL.paper);
    px(x + 8, y + 8, 166, 26, PAL.paperDark);
    drawImageFit(images.montage, x + 34, y + 43, 114, 114);
    px(x + 15, y + 168, 152, 3, PAL.inkSoft);
    px(x + 28, y + 180, 126, 3, PAL.inkSoft);
    px(x + 47, y + 192, 88, 3, PAL.inkSoft);
    drawPortrait(images.reedCalm, 492, 281, 160, 0.58);
  }

  function drawNewspaper() {
    drawBackdrop(0.3);
    const x = 72;
    const y = 30;
    const width = 496;
    const height = 238;
    panel(x - 5, y - 5, width + 10, height + 10);
    px(x, y, width, height, PAL.paper);
    px(x, y, width, 2, PAL.paperDark);
    px(x + 10, y + 21, width - 20, 2, PAL.inkSoft);
    px(x + 10, y + 59, width - 20, 3, PAL.inkSoft);
    px(x + 10, y + 74, width - 20, 1, PAL.paperDark);

    // 왼쪽 단신 — 실종과 시신 미발견을 기사 구조로 보이게 한다.
    px(x + 10, y + 82, 121, 3, PAL.inkSoft);
    for (let row = 0; row < 8; row += 1) {
      px(x + 10, y + 94 + row * 11, 113 - (row % 3) * 12, 2,
        row % 2 ? PAL.paperDark : PAL.inkSoft);
    }

    // 중앙 기사 삽화 — 폭풍 속 세이렌 호. 얼굴을 선공개하지 않고 사건은 읽히게 한다.
    const imageX = x + 141;
    const imageY = y + 82;
    const imageW = 214;
    const imageH = 101;
    px(imageX - 4, imageY - 4, imageW + 8, imageH + 8, PAL.paperDark);
    px(imageX, imageY, imageW, imageH, "#81745E");
    px(imageX, imageY + 52, imageW, 49, "#504A41");
    px(imageX + 24, imageY + 26, 3, 40, "#2E2A25");
    px(imageX + 112, imageY + 17, 3, 52, "#2E2A25");
    px(imageX + 25, imageY + 27, 90, 2, "#3A342C");
    px(imageX + 55, imageY + 38, 103, 8, "#3A342C");
    px(imageX + 69, imageY + 31, 51, 7, "#665B4A");
    px(imageX + 91, imageY + 20, 12, 11, "#3A342C");
    px(imageX + 49, imageY + 46, 130, 7, "#2E2A25");
    px(imageX + 63, imageY + 53, 103, 6, "#2E2A25");
    px(imageX + 78, imageY + 59, 70, 5, "#2E2A25");
    for (let windowIndex = 0; windowIndex < 6; windowIndex += 1) {
      px(imageX + 66 + windowIndex * 15, imageY + 41, 6, 3, PAL.paperDark);
    }
    for (let wave = 0; wave < 5; wave += 1) {
      px(imageX + 8 + wave * 42, imageY + 69 + (wave % 2) * 9, 31, 3, "#A09378");
      px(imageX + 22 + wave * 38, imageY + 86 - (wave % 2) * 8, 25, 2, "#302D29");
    }
    px(imageX + 165, imageY + 8, 28, 3, PAL.paperDark);
    px(imageX + 174, imageY + 14, 18, 2, PAL.paperDark);

    // 오른쪽 단신 — 귀환 주장과 가문의 반응.
    px(x + 365, y + 82, 121, 3, PAL.inkSoft);
    for (let row = 0; row < 8; row += 1) {
      px(x + 365, y + 94 + row * 11, 113 - ((row + 1) % 3) * 11, 2,
        row % 2 ? PAL.paperDark : PAL.inkSoft);
    }

    px(x + 10, y + 198, width - 20, 25, "#9A896C");
    px(x + 10, y + 226, width - 20, 2, PAL.inkSoft);
  }

  function drawScene(beat) {
    if (beat.view === "poster") {
      drawPoster();
    } else if (beat.view === "newspaper") {
      drawNewspaper();
    } else {
      drawBackdrop(beat.view === "third" ? 0.1 : 0.34);
      if (beat.view === "third") drawThird(beat);
      if (beat.view === "portrait") drawEvidenceFrame(images.portraitEvidence);
      if (beat.view === "wall") drawEvidenceFrame(images.wallEvidence);
    }
    drawDialogueBox(beat);
  }

  function drawDialogueBox(beat) {
    panel(BOX.x, BOX.y, BOX.w, BOX.h);
    const longName = beat.speaker.length >= 6;
    const nameWidth = longName ? 112 : beat.speaker === "플레이어" ? 88 : 96;
    panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
    const color = beat.speaker === "플레이어" ? PAL.teal
      : beat.speaker === "코라의 진술" ? PAL.rust : PAL.gold;
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
      } else if (last.every(function (character) { return /[.!?…,]/.test(character); })) {
        lines[lines.length - 2] += last.join("");
        lines.pop();
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
    if (beat.view === "poster") {
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("수배 전단", 320, 42);
      textCtx.save();
      textCtx.translate(365, 209);
      textCtx.rotate(-0.12);
      textCtx.font = '900 22px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = "#8D302B";
      textCtx.fillText("검거", 0, 0);
      textCtx.restore();
    } else if (beat.view === "newspaper") {
      textCtx.textAlign = "left";
      textCtx.font = '900 8px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("안개항 일보", 84, 36);
      textCtx.textAlign = "right";
      textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillText("제408호 · 10월 14일", 556, 37);
      textCtx.textAlign = "center";
      textCtx.font = '900 16px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("아셔튼 가의 상속자, 12년 만에 귀환?", 320, 58);
      textCtx.font = '700 8px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = "#40382E";
      textCtx.fillText("세이렌 호 침몰 실종자 에드먼드 · 토마스 카버, 생존자라 주장", 320, 79);

      textCtx.textAlign = "left";
      textCtx.font = '900 9px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("시신 없는 실종", 84, 116);
      textCtx.fillText("가문은 확인 중", 437, 116);
      textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = "#645847";
      textCtx.fillText("12년 전 침몰 뒤", 84, 131);
      textCtx.fillText("시신은 발견되지 않았다.", 84, 142);
      textCtx.fillText("엘리너 아셔튼은", 437, 131);
      textCtx.fillText("사망 신고를 거부했다.", 437, 142);

      textCtx.textAlign = "center";
      textCtx.font = '700 7px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.paper;
      textCtx.fillText("12년 전 폭풍 속에서 침몰한 세이렌 호", 320, 206);
      textCtx.font = '900 10px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.fillText("경찰, 토마스 카버 신원 확인 착수", 320, 237);
    } else if (beat.view === "portrait") {
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText("엘리너 아셔튼의 쪽지 · 훼손된 옛 초상", 320, 36);
    } else if (beat.view === "wall") {
      textCtx.fillStyle = PAL.cream;
      textCtx.fillText("코라의 서면 진술 · 선술집 벽 탁본", 320, 36);
    }
    textCtx.textAlign = "left";
  }

  function drawTextLayer(beat, local) {
    clearText();
    textCtx.textBaseline = "top";
    drawEvidenceLabels(beat);

    const longName = beat.speaker.length >= 6;
    const nameWidth = longName ? 112 : beat.speaker === "플레이어" ? 88 : 96;
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = beat.speaker === "플레이어" ? "#9BC0B6"
      : beat.speaker === "코라의 진술" ? "#D28B73" : PAL.gold;
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
    return {
      index: lastIndex,
      local: scene.beats[lastIndex].duration,
      cursor: SCENE_DURATIONS[scene.id] - scene.beats[lastIndex].duration,
    };
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
    drawScene(beat);
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
    preload().then(function () {
      startScene(playlist[0]);
    }).catch(function (error) {
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
      transitionTimer = window.setTimeout(function () {
        startScene(playlist[playlistIndex]);
      }, 720);
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
    const nextElapsed = current.cursor + beat.duration + 1;
    startedAt = now - nextElapsed;
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
      startPlaylist(["C1A_RETURNED_HEIR", "C1B_TWELVE_YEARS_UNDER"]);
    }
  });

  startPlaylist(["C1A_RETURNED_HEIR", "C1B_TWELVE_YEARS_UNDER"]);
})();
