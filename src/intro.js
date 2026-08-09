(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const STORY_DURATION = 27000;
  const SCENE_FADE = 620;
  const PAL = Object.freeze({
    black: "#06090a",
    ink: "#11191b",
    ink2: "#1b282a",
    fog: "#61706d",
    fogLight: "#89918a",
    cream: "#d9cdb5",
    gold: "#d8a94b",
    teal: "#4a7471",
    rust: "#a05c43",
    paper: "#c4b28e",
    paperDark: "#7e6e53",
    rain: "#40565a",
  });

  const scenes = [
    {
      duration: 3900,
      copy: "안개가 삼킨 항구 도시,<br><span class=\"accent\">헤이번</span>.",
      draw: drawHarbor,
    },
    {
      duration: 3600,
      copy: "이곳에는 얼굴을 남길<br><span class=\"accent\">사진기</span>가 없다.",
      draw: drawEmptyFrame,
    },
    {
      duration: 3900,
      copy: "본 것은 기억에 남고,<br>기억은 <span class=\"accent\">말</span>이 된다.",
      draw: drawWitness,
    },
    {
      duration: 4100,
      copy: "당신은 증언을 듣고,<br>사라진 얼굴을 <span class=\"accent\">그린다</span>.",
      draw: drawRestorer,
    },
    {
      duration: 3700,
      copy: "당신의 그림은<br>이름 없는 이를 찾아내고—",
      draw: drawPoster,
    },
    {
      duration: 3700,
      copy: "하지만 잘못된 얼굴은<br><span class=\"accent\">죄 없는 이의 운명</span>을 가른다.",
      draw: drawConsequence,
    },
    {
      duration: 4100,
      copy: "그날 밤, 경찰이 찾아왔다.<br><span class=\"quote\">“말 대신 얼굴을 주시오.”</span>",
      draw: drawKnock,
    },
  ];

  const art = document.querySelector("[data-role=art]");
  const ctx = art.getContext("2d");
  const textCanvas = document.querySelector("[data-role=text]");
  const textCtx = textCanvas.getContext("2d");
  const titleView = document.querySelector('[data-view="title"]');
  const introView = document.querySelector('[data-view="intro"]');
  const cutsceneView = document.querySelector('[data-view="c0b"]');
  const roleView = document.querySelector('[data-view="role"]');
  const copy = document.querySelector("[data-role=story-copy]");
  const progress = document.querySelector("[data-role=progress]");
  const fade = document.querySelector("[data-role=fade]");
  const titleReplay = titleView.querySelector('[data-action="replay"]');
  const muteButton = document.querySelector('[data-action="mute"]');
  const startLabel = document.querySelector('[data-role="start-label"]');
  const c0bProgress = document.querySelector('[data-role="c0b-progress"]');
  const c0bLive = document.querySelector('[data-role="c0b-live"]');
  const c0bSkipHint = document.querySelector('[data-role="c0b-skip-hint"]');

  let mode = window.IndexWorkbench?.getActiveQuestId() ? "workbench" : "title";
  let sceneIndex = 0;
  let sceneStarted = 0;
  let storyElapsed = 0;
  let frame = 0;
  let muted = false;
  let audio = null;
  let titleStarted = performance.now();
  let sceneSeed = 13;
  let c0bCanSkip = false;

  const c0b = window.C0BCutscene.create({
    art,
    textCanvas,
    progress: c0bProgress,
    live: c0bLive,
    onComplete: finishC0B,
  });

  ctx.imageSmoothingEnabled = false;
  textCtx.imageSmoothingEnabled = false;

  function px(x, y, w, h, color, target = ctx) {
    target.fillStyle = color;
    target.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function dither(x, y, w, h, color, density, offset = 0) {
    ctx.fillStyle = color;
    for (let yy = y; yy < y + h; yy += 2) {
      for (let xx = x; xx < x + w; xx += 2) {
        const hash = (xx * 17 + yy * 29 + offset * 11) % 100;
        if (hash < density * 100) ctx.fillRect(xx, yy, 1, 1);
      }
    }
  }

  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    ctx.stroke();
  }

  function clear(color = PAL.black) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  }

  function seedNoise(seed, count, bounds, palette) {
    let n = seed;
    for (let i = 0; i < count; i += 1) {
      n = (n * 16807) % 2147483647;
      const x = bounds.x + (n % bounds.w);
      n = (n * 16807) % 2147483647;
      const y = bounds.y + (n % bounds.h);
      px(x, y, 1, 1, palette[i % palette.length]);
    }
  }

  function vignette() {
    const g = ctx.createRadialGradient(320, 170, 80, 320, 190, 370);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.72, "rgba(0,0,0,.18)");
    g.addColorStop(1, "rgba(0,0,0,.76)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawRain(t, amount = 36) {
    const step = Math.floor(t / 70);
    for (let i = 0; i < amount; i += 1) {
      const x = (i * 79 + step * 7) % 680 - 20;
      const y = (i * 47 + step * 13) % 310 - 24;
      line(x, y, x - 3, y + 11, i % 3 === 0 ? "#5b7375" : PAL.rain, 1);
    }
  }

  function drawHarbor(t) {
    clear("#10191b");
    px(0, 0, W, 220, "#1a292b");
    dither(0, 0, W, 210, "#304043", .18, Math.floor(t / 160));

    // 멀리 보이는 헤이번의 지붕과 굴뚝
    const roofs = [[-12,179,108,36],[70,158,112,58],[158,181,104,35],[246,148,132,69],[356,174,105,43],[442,153,116,63],[540,180,112,36]];
    roofs.forEach((r, i) => {
      px(r[0], r[1], r[2], 220-r[1], i % 2 ? "#1b2525" : "#162122");
      ctx.fillStyle = i % 2 ? "#293333" : "#222d2e";
      ctx.beginPath();
      ctx.moveTo(r[0]-7, r[1]); ctx.lineTo(r[0]+r[2]/2, r[1]-27-(i%3)*8); ctx.lineTo(r[0]+r[2]+8, r[1]); ctx.fill();
      if (i % 2) px(r[0]+r[2]*.55, r[1]+16, 7, 9, "#8f7139");
    });
    px(303, 74, 22, 78, "#172020");
    px(298, 70, 32, 7, "#23302f");
    px(310, 42, 8, 31, "#192324");

    px(0, 216, W, 96, "#101b1c");
    for (let y = 226; y < 307; y += 8) {
      for (let x = (y % 16) - 18; x < W; x += 42) line(x, y, x + 25, y, y % 24 ? "#294042" : "#3b5453");
    }
    // 부두와 계류 말뚝
    px(0, 283, W, 20, "#312a24");
    px(0, 303, W, 11, "#1c1917");
    for (let x = 21; x < W; x += 66) { px(x, 268, 8, 50, "#332a22"); px(x-2, 266, 12, 5, "#4d3d2f"); }

    drawRain(t, 48);
    const drift = Math.sin(t / 900) * 24;
    ctx.globalAlpha = .16;
    px(-80 + drift, 120, 390, 65, PAL.fogLight);
    px(290 - drift * .6, 190, 420, 48, PAL.fog);
    ctx.globalAlpha = 1;
    vignette();
  }

  function drawEmptyFrame(t) {
    clear("#111718");
    // 벽과 창문
    px(0, 0, W, 278, "#293231");
    dither(0, 0, W, 278, "#39423e", .13, 4);
    px(0, 278, W, 11, "#171d1d");
    px(0, 289, W, 95, "#241f1b");
    for (let x = 0; x < W; x += 56) line(x, 289, x - 32, 384, "#171412");
    px(62, 48, 145, 164, "#101819");
    px(69, 55, 131, 150, "#33484a");
    px(132, 55, 6, 150, "#172020"); px(69, 124, 131, 6, "#172020");
    drawRain(t, 24);
    // 비어 있는 초상 틀
    px(276, 42, 209, 213, "#3d2d20");
    px(284, 50, 193, 197, PAL.gold);
    px(291, 57, 179, 183, "#6e5129");
    px(303, 69, 155, 159, "#121616");
    dither(303, 69, 155, 159, "#303c3b", .12, 9);
    // 얼굴 위치에 남은 지워진 흔적
    ctx.globalAlpha = .25 + Math.sin(t / 700) * .04;
    px(352, 92, 58, 70, PAL.fog);
    px(333, 159, 96, 57, PAL.fog);
    ctx.globalAlpha = 1;
    vignette();
  }

  function drawWitness(t) {
    clear("#0d1213");
    // 두 얼굴이 서로 다른 기억을 말하는 대칭 구도
    drawBust(154, 170, false, "#5d6f6c", "#202b2c");
    drawBust(486, 170, true, "#7a6650", "#2c2622");
    // 가운데 빈 종이
    px(260, 54, 120, 168, "#786b53");
    px(266, 60, 108, 156, PAL.paper);
    dither(266, 60, 108, 156, "#a28f6e", .1, 2);
    // 기억의 말 — 실제 글자 대신 도트 선
    const pulse = Math.floor(t / 440) % 5;
    for (let i = 0; i < 5; i += 1) {
      px(281, 83 + i * 21, Math.min(78, 22 + i * 14), 3, i <= pulse ? PAL.ink2 : PAL.paperDark);
    }
    // 말풍선을 종이로 이어 주는 점선
    for (let i = 0; i < 6; i += 1) { px(207 + i * 8, 116 + i * 3, 3, 3, PAL.fog); px(407 + i * 8, 133 - i * 3, 3, 3, PAL.paperDark); }
    seedNoise(17, 80, {x: 40, y: 40, w: 560, h: 200}, ["#182022", "#232c2d"]);
    vignette();
  }

  function drawBust(cx, cy, flip, skin, coat) {
    ctx.save();
    ctx.translate(cx, 0); ctx.scale(flip ? -1 : 1, 1); ctx.translate(-cx, 0);
    px(cx-26, cy-60, 52, 55, skin);
    px(cx-31, cy-51, 6, 35, "#182020");
    px(cx-24, cy-68, 44, 12, "#182020");
    px(cx-16, cy-35, 5, 4, "#111516");
    px(cx+9, cy-35, 5, 4, "#111516");
    px(cx-6, cy-15, 14, 3, "#342b27");
    ctx.fillStyle = coat;
    ctx.beginPath(); ctx.moveTo(cx-57, cy+48); ctx.lineTo(cx-42, cy-4); ctx.lineTo(cx+42, cy-4); ctx.lineTo(cx+57, cy+48); ctx.fill();
    ctx.restore();
  }

  function drawRestorer(t) {
    clear("#101414");
    // 사무소 책상
    px(0, 0, W, 251, "#302d28");
    dither(0, 0, W, 251, "#4a443a", .11, 7);
    px(0, 251, W, 133, "#4b3524");
    for (let y = 263; y < 382; y += 16) line(0, y, W, y, "#3a281d");
    // 스탠드와 따뜻한 빛
    ctx.globalAlpha = .12;
    ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.moveTo(128, 105); ctx.lineTo(55, 315); ctx.lineTo(304, 315); ctx.fill();
    ctx.globalAlpha = 1;
    line(108, 101, 74, 254, "#9b773b", 5); px(74, 247, 75, 8, "#7b592d");
    ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.moveTo(84, 83); ctx.lineTo(139, 83); ctx.lineTo(151, 111); ctx.lineTo(69, 111); ctx.fill();
    // 플레이어의 손과 종이
    px(238, 270, 215, 83, "#6b4b31");
    px(258, 245, 164, 99, PAL.paper);
    dither(258, 245, 164, 99, "#9b8968", .08, 3);
    drawPortraitOnPaper(340, 289, Math.min(1, t / 2700));
    // 상체 실루엣
    px(450, 125, 62, 82, "#4d5e5b");
    px(438, 201, 106, 94, "#1d292a");
    px(460, 113, 44, 20, "#161e1f");
    // 움직이는 연필과 손
    const handX = 384 + Math.sin(t / 135) * 16;
    px(handX, 268, 33, 17, "#6d5a45");
    line(handX-26, 295, handX+13, 273, PAL.gold, 3);
    vignette();
  }

  function drawPortraitOnPaper(cx, cy, reveal) {
    const strokes = [
      [cx-20,cy-24,cx+20,cy-24],[cx-24,cy-20,cx-28,cy+14],[cx+24,cy-20,cx+28,cy+14],
      [cx-28,cy+14,cx-13,cy+29],[cx+28,cy+14,cx+13,cy+29],[cx-13,cy+29,cx+13,cy+29],
      [cx-15,cy-5,cx-6,cy-5],[cx+7,cy-5,cx+16,cy-5],[cx-8,cy+15,cx+9,cy+15],
    ];
    strokes.slice(0, Math.ceil(strokes.length * reveal)).forEach(s => line(s[0],s[1],s[2],s[3],"#4b4134",2));
  }

  function drawPoster(t) {
    clear("#111817");
    px(0, 0, W, H, "#26302d");
    dither(0, 0, W, H, "#3c4540", .12, 6);
    // 게시판
    px(112, 28, 416, 272, "#3a2a20");
    px(121, 37, 398, 254, "#8d6842");
    dither(121, 37, 398, 254, "#a47b4d", .22, 11);
    // 수배 전단
    px(219, 46, 202, 237, "#6d5b43");
    px(225, 40, 190, 237, PAL.paper);
    px(231, 46, 178, 8, "#514737");
    px(263, 65, 114, 8, "#6f5e45");
    px(270, 84, 100, 122, "#9f8e6e");
    // 얼굴
    px(295, 103, 50, 54, "#61594c");
    px(285, 95, 70, 17, "#3d403c");
    px(278, 92, 84, 8, "#515650");
    px(286, 156, 68, 38, "#4a5d59");
    px(303, 129, 4, 3, PAL.ink); px(334, 129, 4, 3, PAL.ink);
    px(317, 149, 12, 3, PAL.ink);
    // 압정과 검거 도장 암시
    px(315, 38, 10, 10, PAL.rust);
    if (t > 1800) {
      ctx.save(); ctx.translate(320, 180); ctx.rotate(-.18);
      ctx.strokeStyle = PAL.rust; ctx.lineWidth = 5; ctx.strokeRect(-71, -22, 142, 44);
      ctx.fillStyle = PAL.rust; ctx.font = "bold 25px serif"; ctx.textAlign = "center"; ctx.fillText("검 거", 0, 9);
      ctx.restore();
    }
    vignette();
  }

  function drawConsequence(t) {
    clear("#0a0d0e");
    // 종이에 그려진 얼굴과 감옥의 실제 얼굴을 겹친다
    px(80, 50, 214, 236, "#6f604a"); px(88, 58, 198, 220, PAL.paper);
    dither(88,58,198,220,"#aa9878",.09,3);
    px(151, 82, 74, 83, "#6d6252");
    px(135, 74, 105, 22, "#303837");
    px(132, 163, 111, 80, "#465c58");
    px(170, 121, 5, 4, PAL.ink); px(207, 121, 5, 4, PAL.ink); px(185, 148, 18, 3, PAL.ink);
    // 오른쪽의 다른 얼굴
    px(392, 82, 92, 109, "#5f5144");
    px(380, 69, 116, 27, "#202525");
    px(364, 191, 147, 113, "#243234");
    px(418, 129, 5, 4, "#0c1010"); px(461, 129, 5, 4, "#0c1010"); px(435, 164, 17, 3, "#211b19");
    // 창살
    const close = Math.min(1, t / 1300);
    for (let i = 0; i < 6; i += 1) {
      const x = 345 + i * 34;
      px(x, -H + H * close, 8, H, "#15191a");
      px(x+2, -H + H * close, 2, H, "#343b3b");
    }
    px(332, 61, 210 * close, 10, "#15191a"); px(332, 286, 210 * close, 10, "#15191a");
    vignette();
  }

  function drawKnock(t) {
    clear("#0c1112");
    // 사무소 문과 복원가의 그림자
    px(0, 0, W, H, "#252a27");
    dither(0, 0, W, H, "#3a3d37", .08, 5);
    px(190, 27, 260, 357, "#36291f");
    px(205, 42, 230, 342, "#211b17");
    px(218, 55, 204, 315, "#423125");
    px(236, 72, 168, 123, "#2d241e"); px(236, 212, 168, 140, "#2d241e");
    px(384, 198, 12, 12, PAL.goldDark || "#8e6828");
    // 문 아래 비치는 경찰의 그림자
    const glow = .16 + Math.sin(t / 240) * .03;
    ctx.globalAlpha = glow; ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.moveTo(205, 370); ctx.lineTo(435, 370); ctx.lineTo(510, 384); ctx.lineTo(130, 384); ctx.fill(); ctx.globalAlpha = 1;
    // 세 번 두드릴 때마다 문이 미세하게 밝아진다
    const beat = t % 950;
    if (beat < 110 && t < 2850) {
      ctx.globalAlpha = .45 * (1 - beat / 110);
      px(218,55,204,315,PAL.gold);
      ctx.globalAlpha = 1;
    }
    // 경찰 실루엣과 챙
    ctx.globalAlpha = .34;
    px(286, 286, 68, 98, "#050708"); px(295, 247, 50, 52, "#050708"); px(276, 241, 88, 11, "#050708");
    ctx.globalAlpha = 1;
    vignette();
  }

  function drawTitle(t) {
    drawHarbor(t * .55);
    // 제목 가독성을 위한 상부 암막과 먼 등불
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, "rgba(4,7,8,.92)"); g.addColorStop(.7, "rgba(4,7,8,.34)"); g.addColorStop(1, "rgba(4,7,8,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 300);
    const blink = .48 + Math.sin(t / 850) * .08;
    ctx.globalAlpha = blink; px(93, 173, 8, 9, PAL.gold); px(474, 188, 7, 8, PAL.gold); ctx.globalAlpha = 1;
  }

  function drawRole(t) {
    clear("#0a0e0f");
    drawRestorer(t * .22);
    ctx.globalAlpha = .72; px(0, 0, W, H, "#050708"); ctx.globalAlpha = 1;
  }

  function getSceneAt(elapsed) {
    let cursor = 0;
    for (let i = 0; i < scenes.length; i += 1) {
      if (elapsed < cursor + scenes[i].duration) return { index: i, local: elapsed - cursor, cursor };
      cursor += scenes[i].duration;
    }
    return { index: scenes.length - 1, local: scenes.at(-1).duration, cursor: STORY_DURATION - scenes.at(-1).duration };
  }

  function sceneOpacity(local, duration) {
    const enter = Math.min(1, local / SCENE_FADE);
    const exit = Math.min(1, (duration - local) / SCENE_FADE);
    return Math.max(0, Math.min(enter, exit));
  }

  function render(now) {
    if (mode === "title") {
      drawTitle(now - titleStarted);
    } else if (mode === "intro") {
      storyElapsed = now - sceneStarted;
      if (storyElapsed >= STORY_DURATION) {
        finishIntro();
      } else {
        const current = getSceneAt(storyElapsed);
        if (current.index !== sceneIndex) {
          sceneIndex = current.index;
          sceneSeed += 7;
          setSceneCopy(sceneIndex);
          ping(sceneIndex);
        }
        scenes[current.index].draw(current.local, sceneSeed);
        const opacity = sceneOpacity(current.local, scenes[current.index].duration);
        fade.style.opacity = String(1 - opacity);
        copy.style.opacity = String(Math.min(1, current.local / 420) * Math.min(1, (scenes[current.index].duration - current.local) / 480));
        progress.style.width = `${Math.min(100, storyElapsed / STORY_DURATION * 100)}%`;
      }
    } else if (mode === "role") {
      drawRole(now);
    }
    frame = requestAnimationFrame(render);
  }

  function showOnly(view) {
    titleView.hidden = view !== "title";
    introView.hidden = view !== "intro";
    cutsceneView.hidden = view !== "c0b";
    roleView.hidden = view !== "role";
  }

  function setSceneCopy(index) {
    copy.innerHTML = `<span class="story-text">${scenes[index].copy}</span>`;
  }

  function startIntro() {
    ensureAudio();
    mode = "intro";
    sceneIndex = 0;
    sceneStarted = performance.now();
    storyElapsed = 0;
    setSceneCopy(0);
    progress.style.width = "0%";
    fade.style.opacity = "1";
    showOnly("intro");
    ping(0);
  }

  function hasSeenCutscene(id, legacyKey) {
    if (window.GameProgress) return window.GameProgress.has("CUTSCENE_SEEN_" + id);
    return localStorage.getItem(legacyKey) === "1";
  }

  function startGame() {
    if (!hasSeenCutscene("C0_INTRO", "heir_intro_seen")) startIntro();
    else if (!hasSeenCutscene("C0B_THE_JOB", "heir_c0b_seen")) startC0B();
    else startTutorial();
  }

  function nextScene() {
    if (mode !== "intro") return;
    const current = getSceneAt(storyElapsed);
    if (current.index >= scenes.length - 1) return finishIntro();
    sceneStarted = performance.now() - current.cursor - scenes[current.index].duration - 1;
  }

  function finishIntro() {
    if (mode === "c0b" || mode === "role") return;
    localStorage.setItem("heir_intro_seen", "1");
    window.GameProgress?.markCutsceneSeen("C0_INTRO");
    startC0B();
  }

  function startC0B(recordFilename) {
    ensureAudio();
    mode = "c0b";
    c0bCanSkip = hasSeenCutscene("C0B_THE_JOB", "heir_c0b_seen");
    c0bSkipHint.hidden = !c0bCanSkip;
    fade.style.opacity = "0";
    showOnly("c0b");
    const playback = recordFilename ? c0b.record(recordFilename) : c0b.start();
    playback.catch((error) => {
      console.error("C0B 컷신을 시작하지 못했습니다.", error);
      finishC0B({ skipped: true });
    });
  }

  function finishC0B() {
    localStorage.setItem("heir_c0b_seen", "1");
    window.GameProgress?.markCutsceneSeen("C0B_THE_JOB");
    if (new URLSearchParams(window.location.search).get("stay") === "1") showRole();
    else startTutorial();
  }

  function startTutorial() {
    mode = "workbench";
    window.GameProgress?.selectQuest("Q0_MONTAGE");
    if (window.IndexWorkbench) {
      window.IndexWorkbench.open("Q0_MONTAGE").catch((error) => {
        console.error(error);
        window.location.href = "workbench.html?tutorial=Q0_MONTAGE";
      });
    } else {
      window.location.href = "workbench.html?tutorial=Q0_MONTAGE";
    }
  }

  function showRole() {
    mode = "role";
    fade.style.opacity = "0";
    showOnly("role");
    ping(8);
    setTimeout(() => document.querySelector('[data-action="tutorial"]').focus(), 80);
  }

  function ensureAudio() {
    if (audio) { if (audio.ctx.state === "suspended") audio.ctx.resume(); return; }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const master = audioCtx.createGain();
    master.gain.value = muted ? 0 : .1;
    master.connect(audioCtx.destination);
    audio = { ctx: audioCtx, master };
  }

  function ping(index) {
    if (!audio || muted) return;
    const now = audio.ctx.currentTime;
    const notes = [146.83, 174.61, 196, 220, 196, 164.81, 146.83, 110];
    [0, .18].forEach((delay, n) => {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = n ? "triangle" : "sine";
      osc.frequency.value = notes[index % notes.length] * (n ? 1.5 : 1);
      gain.gain.setValueAtTime(.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(n ? .025 : .055, now + delay + .03);
      gain.gain.exponentialRampToValueAtTime(.0001, now + delay + 1.35);
      osc.connect(gain); gain.connect(audio.master);
      osc.start(now + delay); osc.stop(now + delay + 1.4);
    });
  }

  function toggleMute() {
    muted = !muted;
    muteButton.setAttribute("aria-pressed", String(muted));
    muteButton.setAttribute("aria-label", muted ? "소리 켜기" : "소리 끄기");
    muteButton.textContent = muted ? "×" : "♪";
    if (audio) audio.master.gain.setTargetAtTime(muted ? 0 : .1, audio.ctx.currentTime, .03);
  }

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "start") startGame();
    if (action === "replay") startIntro();
    if (action === "skip") finishIntro();
    if (action === "mute") toggleMute();
    if (action === "tutorial") startTutorial();
  });

  document.addEventListener("keydown", (event) => {
    if (["Enter", " "].includes(event.key)) {
      if (event.target.matches("button")) return;
      event.preventDefault();
      if (mode === "title") startGame();
      else if (mode === "intro") nextScene();
      else if (mode === "c0b") c0b.advance();
    }
    if (event.key === "Escape" && mode === "intro") finishIntro();
    if (event.key === "Escape" && mode === "c0b" && c0bCanSkip) c0b.finish();
    if ((event.key === "m" || event.key === "M") && mode === "intro") toggleMute();
  });

  if (hasSeenCutscene("C0_INTRO", "heir_intro_seen")) {
    startLabel.textContent = "이어하기";
    titleReplay.hidden = false;
  }

  const launchParams = new URLSearchParams(window.location.search);
  if (launchParams.get("c0b") === "1" && launchParams.get("record") === "1") {
    startC0B("c0b-the-job.webm");
  }

  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(render);
})();
