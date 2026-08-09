/**
 * C0B_THE_JOB — 인트로와 Q0_MONTAGE 사이의 기준 컷신.
 *
 * 배경·인물은 생성 이미지 레이어, 글자·진술서의 정확한 정보·효과는 코드 레이어다.
 * 내부 화면은 640×384이며 축소된 하단 대사창은 모든 숏에서 고정한다.
 */
(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const TEXT_SCALE = 3;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });
  const ASSET_ROOT = "assets/cutscenes/c0b/";
  const HANDWRITING_FONT = "C0B Handwriting";
  const HANDWRITING_FONT_URL = 'fonts/나눔손글씨 강부장님체.ttf';
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
    cold: "#81A6AA",
    paper: "#D9CDB5",
    paperDark: "#9A896C",
  });

  const ASSETS = Object.freeze({
    background: "backgrounds/office-night.png",
    reedCalm: "portraits/reed-calm.png",
    reedTense: "portraits/reed-tense.png",
    reedHigh: "portraits/reed-high.png",
    playerCalm: "portraits/player-calm.png",
    playerThinking: "portraits/player-thinking.png",
    playerReady: "portraits/player-ready.png",
  });

  const BEATS = Object.freeze([
    {
      speaker: "리드 경위",
      text: "아직 안 자고 있었군. 다행이오.",
      face: "reedCalm",
      view: "world",
      duration: 2300,
      textDelay: 420,
    },
    {
      speaker: "리드 경위",
      text: "세 시간 전에 빵집이 털렸소. 목격자는 마르타 한 사람뿐이고.",
      face: "reedTense",
      view: "third",
      duration: 3000,
      textDelay: 180,
    },
    {
      speaker: "플레이어",
      text: "인상착의는요.",
      face: "playerCalm",
      view: "third",
      duration: 1900,
      textDelay: 120,
    },
    {
      speaker: "리드 경위",
      text: "그게 문제요. 그 여자 말로는 다 아는데, 우리는 아무것도 모르오.",
      face: "reedTense",
      view: "third",
      duration: 3000,
      textDelay: 140,
    },
    {
      speaker: "리드 경위",
      text: "회색 모자를 쓴 사내를 잡으라고 순찰을 돌릴 수는 없지 않소.",
      face: "reedTense",
      view: "third",
      duration: 3100,
      textDelay: 120,
    },
    {
      speaker: "플레이어",
      text: "…얼굴이 필요하시군요.",
      face: "playerThinking",
      view: "third",
      duration: 2200,
      textDelay: 240,
    },
    {
      speaker: "리드 경위",
      text: "말로는 잡을 수가 없소. 얼굴을 주시오.",
      accent: "얼굴을 주시오.",
      face: "reedHigh",
      view: "first",
      duration: 3600,
      textDelay: 480,
    },
    {
      speaker: "플레이어",
      text: "마르타 씨를 데려와 주십시오. 제가 그리는 걸 보면서 말해 주셔야 합니다.",
      face: "playerReady",
      view: "evidence",
      duration: 3800,
      textDelay: 1340,
      visualLock: 1340,
    },
    {
      speaker: "리드 경위",
      text: "그럼 그 여자가 틀리게 기억하면 어쩌겠소.",
      face: "reedCalm",
      view: "third",
      duration: 2500,
      textDelay: 160,
    },
    {
      speaker: "플레이어",
      text: "틀린 얼굴이 나옵니다. 그래서 여러 번 물을 겁니다.",
      accent: "여러 번",
      face: "playerReady",
      view: "third",
      duration: 3500,
      textDelay: 140,
    },
  ]);

  const TOTAL_DURATION = BEATS.reduce(function (sum, beat) {
    return sum + beat.duration;
  }, 0);

  function loadImages() {
    const entries = Object.entries(ASSETS);
    return Promise.all(entries.map(function (entry) {
      const key = entry[0];
      const image = new Image();
      image.decoding = "async";
      image.src = ASSET_ROOT + entry[1];
      return image.decode().catch(function () {
        return new Promise(function (resolve, reject) {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }).then(function () { return [key, image]; });
    })).then(function (loaded) { return Object.fromEntries(loaded); });
  }

  function loadHandwritingFont() {
    if (typeof FontFace === "undefined" || !document.fonts) return Promise.resolve();
    const face = new FontFace(HANDWRITING_FONT, 'url("' + HANDWRITING_FONT_URL + '") format("truetype")');
    return face.load().then(function (loaded) {
      document.fonts.add(loaded);
    });
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
    let startedAt = 0;
    let beatStartedAt = 0;
    let beatIndex = 0;
    let frame = 0;
    let forceCompleteText = false;
    let inputLockedUntil = 0;
    let finishing = false;
    let recorder = null;
    let recorderChunks = [];
    let recorderResolve = null;
    let captureCanvas = null;
    let captureCtx = null;

    ctx.imageSmoothingEnabled = false;
    textCtx.imageSmoothingEnabled = false;

    function preload() {
      if (!ready) {
        ready = Promise.all([loadImages(), loadHandwritingFont()]).then(function (loaded) {
          images = loaded[0];
        });
      }
      return ready;
    }

    function clearText() {
      textCtx.save();
      textCtx.setTransform(1, 0, 0, 1, 0, 0);
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      textCtx.restore();
      textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
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

    function drawImageAt(image, x, bottom, height, alpha, dim) {
      const width = Math.round(image.width * height / image.height);
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      if (dim) ctx.filter = "brightness(" + dim + ") saturate(62%)";
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, Math.round(x), Math.round(bottom - height), width, height);
      ctx.restore();
      return width;
    }

    function drawRain(now) {
      const step = Math.floor(now / 90);
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = PAL.cold;
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i += 1) {
        const leftX = 28 + ((i * 19 + step * 3) % 92);
        const leftY = 24 + ((i * 31 + step * 9) % 154);
        ctx.beginPath();
        ctx.moveTo(leftX, leftY);
        ctx.lineTo(leftX - 2, leftY + 9);
        ctx.stroke();
        const doorX = 500 + ((i * 23 + step * 2) % 70);
        const doorY = 46 + ((i * 29 + step * 8) % 188);
        ctx.beginPath();
        ctx.moveTo(doorX, doorY);
        ctx.lineTo(doorX - 2, doorY + 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawBackdrop(now, darkness) {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(images.background, 0, 0, W, H);
      drawRain(now);
      if (darkness > 0) {
        ctx.save();
        ctx.globalAlpha = darkness;
        px(0, 0, W, H, "#050708");
        ctx.restore();
      }
    }

    function drawWorld(local) {
      const enter = Math.min(1, local / 520);
      const reedHeight = 190;
      drawImageAt(images.reedCalm, 444 + (1 - enter) * 24, 286, reedHeight, enter);
    }

    function drawThird(beat) {
      const playerActive = beat.speaker === "플레이어";
      const reedImage = beat.face.startsWith("reed") ? images[beat.face] : images.reedCalm;
      const playerImage = beat.face.startsWith("player") ? images[beat.face] : images.playerCalm;
      drawImageAt(playerImage, 36, 286, 202, 1, playerActive ? null : 0.54);
      const reedWidth = Math.round(reedImage.width * 216 / reedImage.height);
      drawImageAt(reedImage, 604 - reedWidth, 286, 216, 1, playerActive ? 0.54 : null);
      px(300, 244, 38, 3, playerActive ? PAL.teal : PAL.goldDim);
    }

    function drawFirst(local) {
      const settle = Math.min(1, local / 300);
      const hold = Math.max(0, Math.min(1, (local - 1250) / 900));
      const height = 252 + Math.round(hold * 12);
      const image = images.reedHigh;
      const width = Math.round(image.width * height / image.height);
      drawImageAt(image, Math.round((W - width) / 2), 300, height, settle);
      ctx.save();
      ctx.globalAlpha = 0.28 * settle;
      px(0, 0, 108, 264, "#050708");
      px(532, 0, 108, 264, "#050708");
      ctx.restore();
      if (local > 1580 && local < 1660) {
        ctx.save();
        ctx.globalAlpha = 0.16;
        px(0, 0, W, 264, PAL.cream);
        ctx.restore();
      }
    }

    function drawStatement(local) {
      const fall = Math.max(0, Math.min(1, local / 520));
      const eased = 1 - Math.pow(1 - fall, 3);
      const y = 38 + (1 - eased) * -52 + Math.sin(fall * Math.PI) * 5;
      ctx.save();
      ctx.translate(320, y + 91);
      ctx.rotate(-0.018);
      px(-122, -86, 244, 168, PAL.paper);
      ctx.restore();
      drawImageAt(images.playerReady, 18, 277, 164, 1, 0.66);
    }

    function drawScene(beat, local, now) {
      const darkness = beat.view === "first" ? 0.22 : beat.view === "evidence" ? 0.31 : 0.08;
      drawBackdrop(now, darkness);
      if (beat.view === "world") drawWorld(local);
      else if (beat.view === "third") drawThird(beat);
      else if (beat.view === "first") drawFirst(local);
      else if (beat.view === "evidence") drawStatement(local);
      drawDialogueBox(beat);
    }

    function splitLines(text, maxChars) {
      const result = [];
      let rest = text;
      while (rest.length > maxChars) {
        let cut = rest.lastIndexOf(" ", maxChars);
        if (cut < Math.floor(maxChars * 0.62)) cut = maxChars;
        result.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) result.push(rest);
      return result.slice(0, 3);
    }

    function drawDialogueBox(beat) {
      panel(BOX.x, BOX.y, BOX.w, BOX.h);
      const nameWidth = beat.speaker === "플레이어" ? 88 : 96;
      panel(BOX.x + 10, BOX.y - 20, nameWidth, 23);
      px(BOX.x + 16, BOX.y - 16, 3, 14, beat.speaker === "플레이어" ? PAL.teal : PAL.gold);
    }

    function visibleText(beat, local) {
      const elapsed = Math.max(0, local - beat.textDelay);
      const count = forceCompleteText ? beat.text.length : Math.floor(elapsed / 34);
      return beat.text.slice(0, Math.min(beat.text.length, count));
    }

    function drawWornText(text, x, y, font, centered, opacity) {
      textCtx.save();
      textCtx.font = font;
      textCtx.fillStyle = PAL.inkSoft;
      textCtx.globalAlpha = opacity;
      textCtx.textAlign = centered ? "center" : "left";
      textCtx.fillText(text, x, y);
      textCtx.restore();
    }

    function drawTextLayer(beat, local) {
      clearText();
      textCtx.textBaseline = "top";
      const playerSpeaking = beat.speaker === "플레이어";
      const nameWidth = playerSpeaking ? 88 : 96;
      textCtx.textAlign = "center";
      textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = playerSpeaking ? "#9BC0B6" : PAL.gold;
      textCtx.fillText(beat.speaker, BOX.x + 10 + nameWidth / 2, BOX.y - 16);
      textCtx.textAlign = "left";

      const shown = visibleText(beat, local);
      const fullLines = splitLines(beat.text, 20);
      let remaining = shown.length;
      const lines = fullLines.map(function (line) {
        const visible = line.slice(0, Math.max(0, remaining));
        remaining -= line.length + 1;
        return visible;
      });
      textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      textCtx.fillStyle = PAL.cream;
      lines.forEach(function (line, index) {
        textCtx.fillText(line, BOX.x + 20, BOX.y + 17 + index * 21);
      });

      if (beat.accent && shown.includes(beat.accent)) {
        lines.forEach(function (line, index) {
          const accentAt = line.indexOf(beat.accent);
          if (accentAt < 0) return;
          const prefix = line.slice(0, accentAt);
          const x = BOX.x + 20 + textCtx.measureText(prefix).width;
          const y = BOX.y + 17 + index * 21;
          textCtx.fillStyle = PAL.gold;
          textCtx.fillText(beat.accent, x, y);
        });
      }

      if (beat.view === "evidence" && local > 430) {
        drawWornText("목격자 진술서", 320, 50, '13px "' + HANDWRITING_FONT + '", cursive', true, 0.78);
        drawWornText("목격자  마르타", 235, 78, '12px "' + HANDWRITING_FONT + '", cursive', false, 0.72);
        drawWornText("회색 모자 · 얼굴 특징 불명", 235, 98, '12px "' + HANDWRITING_FONT + '", cursive', false, 0.72);
      }
    }

    function getBeatAt(elapsed) {
      let cursor = 0;
      for (let index = 0; index < BEATS.length; index += 1) {
        if (elapsed < cursor + BEATS[index].duration) {
          return { index: index, local: elapsed - cursor, cursor: cursor };
        }
        cursor += BEATS[index].duration;
      }
      return { index: BEATS.length - 1, local: BEATS[BEATS.length - 1].duration, cursor: TOTAL_DURATION - BEATS[BEATS.length - 1].duration };
    }

    function updateLive(beat) {
      if (live) live.textContent = beat.speaker + ": " + beat.text;
    }

    function composeCaptureFrame() {
      if (!captureCtx) return;
      captureCtx.clearRect(0, 0, W, H);
      captureCtx.imageSmoothingEnabled = false;
      captureCtx.drawImage(art, 0, 0, W, H);
      captureCtx.drawImage(textCanvas, 0, 0, textCanvas.width, textCanvas.height, 0, 0, W, H);
    }

    function render(now) {
      if (!active) return;
      const elapsed = now - startedAt;
      if (elapsed >= TOTAL_DURATION) {
        finish(false);
        return;
      }

      const current = getBeatAt(elapsed);
      if (current.index !== beatIndex) {
        beatIndex = current.index;
        beatStartedAt = now - current.local;
        forceCompleteText = false;
        updateLive(BEATS[beatIndex]);
      }
      const beat = BEATS[beatIndex];
      drawScene(beat, current.local, now);
      drawTextLayer(beat, current.local);
      composeCaptureFrame();
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
        beatStartedAt = startedAt;
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
      if (current.index !== beatIndex) {
        beatIndex = current.index;
        beatStartedAt = now - current.local;
        forceCompleteText = false;
        updateLive(BEATS[beatIndex]);
      }
      const beat = BEATS[current.index];
      const local = current.local;
      if (local < (beat.visualLock || 0)) return;
      const typed = Math.floor(Math.max(0, local - beat.textDelay) / 34);
      if (!forceCompleteText && typed < beat.text.length) {
        forceCompleteText = true;
        inputLockedUntil = now + 120;
        return;
      }
      if (current.index >= BEATS.length - 1) {
        finish(false);
        return;
      }
      const nextIndex = current.index + 1;
      const nextElapsed = current.cursor + BEATS[current.index].duration + 1;
      startedAt = now - nextElapsed;
      beatIndex = nextIndex;
      beatStartedAt = now;
      forceCompleteText = false;
      inputLockedUntil = now + 120;
      updateLive(BEATS[nextIndex]);
    }

    function stopRecorder() {
      if (recorder && recorder.state !== "inactive") recorder.stop();
    }

    function finish(skipped) {
      if (!active || finishing) return;
      finishing = true;
      active = false;
      cancelAnimationFrame(frame);
      if (progress) progress.style.width = "100%";
      composeCaptureFrame();
      stopRecorder();
      window.setTimeout(function () {
        clearText();
        onComplete({ skipped: Boolean(skipped) });
      }, recorder ? 180 : 0);
    }

    function record(filename) {
      if (typeof MediaRecorder === "undefined") {
        return Promise.reject(new Error("MediaRecorder를 지원하지 않는 브라우저입니다."));
      }
      captureCanvas = document.createElement("canvas");
      captureCanvas.width = W;
      captureCanvas.height = H;
      captureCtx = captureCanvas.getContext("2d");
      const stream = captureCanvas.captureStream(30);
      const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mimeType = candidates.find(function (type) { return MediaRecorder.isTypeSupported(type); }) || "";
      recorderChunks = [];
      recorder = new MediaRecorder(stream, mimeType ? { mimeType: mimeType, videoBitsPerSecond: 3200000 } : undefined);
      recorder.addEventListener("dataavailable", function (event) {
        if (event.data && event.data.size) recorderChunks.push(event.data);
      });
      const promise = new Promise(function (resolve) { recorderResolve = resolve; });
      recorder.addEventListener("stop", async function () {
        const blob = new Blob(recorderChunks, { type: recorder.mimeType || "video/webm" });
        let savedToProject = false;
        if (filename) {
          if (window.location.protocol === "http:" || window.location.protocol === "https:") {
            try {
              const response = await fetch("/__capture/" + encodeURIComponent(filename), {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
              });
              savedToProject = response.ok;
            } catch (error) {
              console.warn("컷신 영상을 프로젝트에 저장하지 못했습니다.", error);
            }
          }
        }
        if (filename && !savedToProject) {
          const anchor = document.createElement("a");
          anchor.href = URL.createObjectURL(blob);
          anchor.download = filename;
          anchor.click();
          window.setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 1000);
        }
        if (recorderResolve) recorderResolve({ blob: blob, savedToProject: savedToProject });
        recorderResolve = null;
        recorder = null;
      }, { once: true });
      recorder.start(250);
      return start().then(function () { return promise; });
    }

    return Object.freeze({
      preload: preload,
      start: start,
      advance: advance,
      finish: function () { finish(true); },
      record: record,
      get duration() { return TOTAL_DURATION; },
      get active() { return active; },
    });
  }

  window.C0BCutscene = Object.freeze({ create: create, duration: TOTAL_DURATION });
})();
