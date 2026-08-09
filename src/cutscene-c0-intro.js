/** C0_INTRO — latest-cutscene-style opening runtime. */
(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
  const TYPE_MS = 34;
  const INPUT_LOCK_MS = 120;
  const ROOT = "assets/cutscenes/c0-intro/";
  const SHARED = "assets/cutscenes/c0b/";
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
    cold: "#81A6AA",
    paper: "#D9CDB5",
    paperDark: "#9A896C",
  });

  const ASSETS = Object.freeze({
    office: SHARED + "backgrounds/office-night.png",
    knockOffice: ROOT + "backgrounds/office-closed-door.png",
    playerCalm: SHARED + "portraits/player-calm.png",
    playerThinking: SHARED + "portraits/player-thinking.png",
    playerReady: SHARED + "portraits/player-ready.png",
    memories: ROOT + "inserts/client-memory-triptych.png",
    consequence: ROOT + "inserts/wrong-face-consequence.png",
  });

  const BEATS = Object.freeze([
    { speaker: "플레이어", face: "playerCalm", view: "officeWide", text: "헤이번에는 사진기가 없다.", duration: 3300, textDelay: 760, visualLock: 820, effect: "fadeIn" },
    { speaker: "플레이어", face: "playerCalm", view: "pencilClose", text: "사람이 본 것은 머릿속에만 남고, 기억은 말로만 나온다.", duration: 4400, textDelay: 520, visualLock: 620, effect: "pencil" },
    { speaker: "플레이어", face: "playerReady", view: "sketchWork", text: "나는 그 말을 다시 그림으로 되돌리는 일을 한다.", duration: 4100, textDelay: 460, visualLock: 580, effect: "sketch" },
    { speaker: "플레이어", face: "playerCalm", view: "clientMemories", text: "사람들은 잃어버린 얼굴을 들고 온다. 개, 이사 간 딸, 죽은 남편.", duration: 5000, textDelay: 860, visualLock: 1200, effect: "portraits" },
    { speaker: "플레이어", face: "playerCalm", view: "clientMemories", text: "나는 그 얼굴을 종이에 붙잡아 준다. 그게 전부다.", duration: 3900, textDelay: 220, effect: "portraitWarm" },
    { speaker: "플레이어", face: "playerThinking", view: "consequence", text: "가끔은 경찰도 온다.", duration: 3200, textDelay: 680, visualLock: 760, effect: "coldCut" },
    { speaker: "플레이어", face: "playerThinking", view: "consequence", text: "그때는 틀리면 안 된다. 틀린 얼굴은 엉뚱한 사람을 잡아가니까.", duration: 5000, textDelay: 260, visualLock: 520, effect: "bars" },
    { speaker: "플레이어", face: "playerCalm", view: "knock", text: "그날 밤, 경찰이 찾아왔다.", duration: 3900, textDelay: 820, visualLock: 1900, effect: "knock" },
  ]);

  const TOTAL_DURATION = BEATS.reduce(function (sum, beat) { return sum + beat.duration; }, 0);

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

  function create(options) {
    const art = options.art;
    const ctx = art.getContext("2d");
    const textCanvas = options.textCanvas;
    const textCtx = textCanvas.getContext("2d");
    const progress = options.progress;
    const live = options.live;
    const onComplete = options.onComplete || function () {};

    let images = null;
    let ready = null;
    let active = false;
    let finishing = false;
    let startedAt = 0;
    let beatIndex = 0;
    let forceCompleteText = false;
    let inputLockedUntil = 0;
    let frame = 0;

    ctx.imageSmoothingEnabled = false;
    textCtx.imageSmoothingEnabled = false;

    function preload() {
      if (!ready) ready = loadImages().then(function (loaded) { images = loaded; });
      return ready;
    }

    function px(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    function panel(x, y, w, h) {
      px(x + 3, y, w - 6, h, PAL.ink);
      px(x, y + 3, w, h - 6, PAL.ink);
      px(x + 1, y + 3, 1, h - 6, PAL.panelLight);
      px(x + 3, y + 1, w - 6, 1, PAL.panelLight);
      px(x + 2, y + 3, w - 4, h - 6, PAL.panel);
      px(x + 3, y + 2, w - 6, 1, PAL.goldDim);
    }

    function clearText() {
      textCtx.save();
      textCtx.setTransform(1, 0, 0, 1, 0, 0);
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      textCtx.restore();
      textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
    }

    function drawRain(now, alpha) {
      const step = Math.floor(now / 85);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = PAL.cold;
      ctx.lineWidth = 1;
      for (let i = 0; i < 22; i += 1) {
        const x = 30 + ((i * 17 + step * 3) % 104);
        const y = 18 + ((i * 29 + step * 8) % 184);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 9);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBackdrop(now, darkness) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(images.office, 0, 0, W, H);
      drawRain(now, 0.42);
      const lamp = 0.035 + Math.sin(now / 630) * 0.012;
      ctx.save();
      ctx.globalAlpha = lamp;
      ctx.fillStyle = PAL.gold;
      ctx.beginPath();
      ctx.moveTo(180, 180);
      ctx.lineTo(80, 310);
      ctx.lineTo(360, 310);
      ctx.fill();
      ctx.restore();
      if (darkness) {
        ctx.save();
        ctx.globalAlpha = darkness;
        px(0, 0, W, H, "#050708");
        ctx.restore();
      }
    }

    function drawPortrait(image, x, bottom, height, dim) {
      const width = Math.round(image.width * height / image.height);
      ctx.save();
      if (dim) ctx.filter = "brightness(" + dim + ") saturate(65%)";
      ctx.drawImage(image, Math.round(x), Math.round(bottom - height), width, height);
      ctx.restore();
      return width;
    }

    function drawOffice(beat, local, now) {
      drawBackdrop(now, 0.06);
      const image = images[beat.face];
      const height = beat.view === "officeWide" ? 196 : 174;
      const width = Math.round(image.width * height / image.height);
      drawPortrait(image, 608 - width, 286, height, beat.view === "pencilClose" ? 0.7 : null);
      if (beat.view === "officeWide") {
        const enter = Math.min(1, local / 700);
        ctx.save();
        ctx.globalAlpha = enter * (0.25 + Math.sin(local / 540) * 0.04);
        px(194, 53, 267, 165, PAL.gold);
        ctx.restore();
      }
    }

    function drawPencil(local, now) {
      drawBackdrop(now, 0.24);
      panel(111, 42, 360, 204);
      px(120, 51, 342, 186, "#5B3F2A");
      for (let y = 58; y < 232; y += 14) px(126, y, 328, 1, y % 28 ? "#493321" : "#735137");
      px(183, 76, 178, 128, PAL.paper);
      px(190, 83, 164, 114, "#C8B993");
      const strokes = Math.min(9, Math.floor(Math.max(0, local - 350) / 260));
      const face = [[250,105,286,93],[286,93,319,107],[250,105,242,144],[319,107,326,144],[242,144,259,174],[326,144,308,174],[259,174,308,174],[263,129,274,128],[296,128,308,129]];
      ctx.strokeStyle = "#514638";
      ctx.lineWidth = 2;
      face.slice(0, strokes).forEach(function (line) {
        ctx.beginPath(); ctx.moveTo(line[0], line[1]); ctx.lineTo(line[2], line[3]); ctx.stroke();
      });
      const handX = 344 + Math.sin(local / 115) * 12;
      px(handX, 168, 42, 18, "#806A50");
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(handX - 24, 193); ctx.lineTo(handX + 21, 172); ctx.stroke();
      const shavings = Math.min(10, Math.floor(local / 280));
      for (let i = 0; i < shavings; i += 1) {
        px(382 + (i * 13) % 58, 190 + (i * 7) % 31, 5 + (i % 3), 2, i % 2 ? "#C28B46" : "#8B5E31");
      }
    }

    function drawSketch(beat, local, now) {
      drawPencil(local + 600, now);
      const image = images[beat.face];
      const width = Math.round(image.width * 158 / image.height);
      drawPortrait(image, 590 - width, 282, 158, null);
      if (local > 1000 && local < 1080) {
        ctx.save(); ctx.globalAlpha = 0.15; px(111, 42, 360, 204, PAL.cream); ctx.restore();
      }
    }

    function drawEvidence(image, local, warm) {
      ctx.save();
      ctx.globalAlpha = 0.54;
      px(0, 0, W, 266, "#050708");
      ctx.restore();
      const step = local < 420 ? 0.94 : local < 850 ? 1 : 1.06;
      const width = Math.round(336 * step);
      const height = Math.round(216 * step);
      panel(Math.round((W - width) / 2) - 4, Math.round((260 - height) / 2) - 4, width + 8, height + 8);
      ctx.drawImage(image, Math.round((W - width) / 2), Math.round((260 - height) / 2), width, height);
      if (warm) {
        ctx.save(); ctx.globalAlpha = 0.12 + Math.sin(local / 520) * 0.025; px(0, 0, W, 260, PAL.gold); ctx.restore();
      }
    }

    function drawMemories(beat, local, now) {
      drawBackdrop(now, 0.4);
      drawEvidence(images.memories, local, beat.effect === "portraitWarm");
      if (beat.effect === "portraits") {
        const index = Math.min(2, Math.floor(Math.max(0, local - 950) / 720));
        const boxes = [[162, 61, 100, 139], [270, 61, 100, 139], [378, 61, 100, 139]];
        boxes.slice(0, index + 1).forEach(function (box, i) {
          ctx.save(); ctx.globalAlpha = i === index ? 0.9 : 0.38; ctx.strokeStyle = PAL.gold; ctx.lineWidth = 2;
          ctx.strokeRect(box[0], box[1], box[2], box[3]); ctx.restore();
        });
      }
    }

    function drawConsequence(beat, local, now) {
      drawBackdrop(now, 0.58);
      drawEvidence(images.consequence, local, false);
      if (beat.effect === "bars") {
        const pulse = 0.34 + Math.sin(local / 410) * 0.06;
        ctx.save(); ctx.globalAlpha = pulse; px(353, 29, 4, 210, "#050708"); px(402, 29, 4, 210, "#050708"); px(451, 29, 4, 210, "#050708"); px(500, 29, 4, 210, "#050708"); ctx.restore();
      }
    }

    function drawDoorKnock(local) {
      const knockPhase = local % 650;
      const shake = knockPhase < 90 && local < 2100 ? (Math.floor(local / 30) % 2 ? 1 : -1) : 0;
      if (shake) ctx.drawImage(images.knockOffice, 494, 35, 108, 233, 494 + shake, 35, 108, 233);
      if (knockPhase < 110 && local < 2100) {
        const strength = 1 - knockPhase / 110;
        ctx.save();
        ctx.globalAlpha = 0.46 * strength;
        ctx.strokeStyle = PAL.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(500, 40, 97, 225);
        ctx.beginPath();
        ctx.arc(509, 176, 7 + strength * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawKnock(beat, local, now) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(images.knockOffice, 0, 0, W, H);
      drawRain(now, 0.42);
      drawDoorKnock(local);
      const image = images[beat.face];
      drawPortrait(image, 38, 286, 192, null);
      ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.moveTo(500, 265); ctx.lineTo(600, 265); ctx.lineTo(640, 315); ctx.lineTo(460, 315); ctx.fill(); ctx.restore();
    }

    function drawDialogueBox() {
      panel(BOX.x, BOX.y, BOX.w, BOX.h);
      panel(BOX.x + 10, BOX.y - 20, 88, 23);
      px(BOX.x + 16, BOX.y - 16, 3, 14, PAL.teal);
    }

    function drawScene(beat, local, now) {
      if (beat.view === "officeWide") drawOffice(beat, local, now);
      if (beat.view === "pencilClose") drawPencil(local, now);
      if (beat.view === "sketchWork") drawSketch(beat, local, now);
      if (beat.view === "clientMemories") drawMemories(beat, local, now);
      if (beat.view === "consequence") drawConsequence(beat, local, now);
      if (beat.view === "knock") drawKnock(beat, local, now);
      if (local < 260) {
        ctx.save(); ctx.globalAlpha = 1 - local / 260; px(0, 0, W, 266, "#050708"); ctx.restore();
      }
      drawDialogueBox();
    }

    function wrapLines(text, maxWidth) {
      const lines = [];
      let line = "";
      Array.from(text).forEach(function (character) {
        const candidate = line + character;
        if (line && textCtx.measureText(candidate).width > maxWidth) {
          lines.push(line.trimEnd());
          line = character === " " ? "" : character;
        } else line = candidate;
      });
      if (line) lines.push(line.trimEnd());
      return lines.slice(0, 3);
    }

    function visibleText(beat, local) {
      const elapsed = Math.max(0, local - beat.textDelay);
      const count = forceCompleteText ? beat.text.length : Math.floor(elapsed / TYPE_MS);
      return beat.text.slice(0, Math.min(beat.text.length, count));
    }

    function drawTextLayer(beat, local) {
      clearText();
      textCtx.textBaseline = "top";
      textCtx.textAlign = "center";
      textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = "#9BC0B6";
      textCtx.fillText("플레이어", BOX.x + 54, BOX.y - 16);

      if (beat.view === "clientMemories") {
        textCtx.fillStyle = "rgba(23, 19, 16, 0.84)";
        textCtx.fillRect(135, 20, 370, 26);
        textCtx.fillStyle = PAL.cream;
        textCtx.fillText("의뢰 기록 · 잃어버린 개 / 이사 간 딸 / 죽은 남편", 320, 34);
      }
      if (beat.view === "consequence") {
        textCtx.fillStyle = "rgba(23, 19, 16, 0.84)";
        textCtx.fillRect(143, 20, 354, 26);
        textCtx.fillStyle = PAL.cream;
        textCtx.fillText("경찰 기록 · 그림 속 얼굴과 붙잡힌 얼굴", 320, 34);
      }

      textCtx.textAlign = "left";
      textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.cream;
      const shown = visibleText(beat, local);
      const lines = wrapLines(beat.text, BOX.w - 32);
      let remaining = shown.length;
      lines.forEach(function (line, index) {
        const length = Math.min(line.length, Math.max(0, remaining));
        textCtx.fillText(line.slice(0, length), BOX.x + 20, BOX.y + 17 + index * 21);
        remaining -= line.length;
      });
    }

    function getBeatAt(elapsed) {
      let cursor = 0;
      for (let index = 0; index < BEATS.length; index += 1) {
        if (elapsed < cursor + BEATS[index].duration) return { index: index, local: elapsed - cursor, cursor: cursor };
        cursor += BEATS[index].duration;
      }
      return { index: BEATS.length - 1, local: BEATS[BEATS.length - 1].duration, cursor: TOTAL_DURATION - BEATS[BEATS.length - 1].duration };
    }

    function updateLive(beat) {
      if (live) live.textContent = beat.speaker + ": " + beat.text;
    }

    function render(now) {
      if (!active) return;
      const elapsed = now - startedAt;
      if (elapsed >= TOTAL_DURATION) return finish(false);
      const current = getBeatAt(elapsed);
      if (current.index !== beatIndex) {
        beatIndex = current.index;
        forceCompleteText = false;
        updateLive(BEATS[beatIndex]);
      }
      const beat = BEATS[beatIndex];
      drawScene(beat, current.local, now);
      drawTextLayer(beat, current.local);
      if (progress) progress.style.width = Math.min(100, elapsed / TOTAL_DURATION * 100) + "%";
      frame = requestAnimationFrame(render);
    }

    function start() {
      return preload().then(function () {
        cancelAnimationFrame(frame);
        active = true;
        finishing = false;
        beatIndex = 0;
        forceCompleteText = false;
        inputLockedUntil = 0;
        startedAt = performance.now();
        if (progress) progress.style.width = "0%";
        updateLive(BEATS[0]);
        frame = requestAnimationFrame(render);
      });
    }

    function advance() {
      if (!active) return;
      const now = performance.now();
      if (now < inputLockedUntil) return;
      const current = getBeatAt(now - startedAt);
      const beat = BEATS[current.index];
      if (current.local < (beat.visualLock || 0)) return;
      const typed = Math.floor(Math.max(0, current.local - beat.textDelay) / TYPE_MS);
      if (!forceCompleteText && typed < beat.text.length) {
        forceCompleteText = true;
        inputLockedUntil = now + INPUT_LOCK_MS;
        return;
      }
      if (current.index >= BEATS.length - 1) return finish(false);
      startedAt = now - current.cursor - beat.duration - 1;
      beatIndex = current.index + 1;
      forceCompleteText = false;
      inputLockedUntil = now + INPUT_LOCK_MS;
      updateLive(BEATS[beatIndex]);
    }

    function finish(skipped) {
      if (!active || finishing) return;
      finishing = true;
      active = false;
      cancelAnimationFrame(frame);
      if (progress) progress.style.width = "100%";
      clearText();
      onComplete({ skipped: Boolean(skipped) });
    }

    return Object.freeze({
      preload: preload,
      start: start,
      advance: advance,
      restart: start,
      finish: function () { finish(true); },
      get active() { return active; },
      get duration() { return TOTAL_DURATION; },
    });
  }

  window.C0IntroCutscene = Object.freeze({ create: create, duration: TOTAL_DURATION, beats: BEATS });
})();
