/**
 * 탐정 사무소 — 증거판을 둘러싼 방 자체.
 * 근거: GAME_DESIGN 7.1(화면 3종), 9.1(아트 기준), docs/게임배경이미지.png
 *
 * 증거판만 도트로 그리고 나머지를 HTML 패널로 두면 화면이 둘로 쪼개져 보인다.
 * 그래서 벽·창·몰딩·책상·조명·필기도구까지 전부 같은 640×384 안에서 그린다.
 *
 * 화면 분할 (y 좌표)
 *     0  ─ 292  벽. 왼쪽에 창과 시계, 오른쪽 대부분이 증거판
 *   292  ─ 300  걸레받이 몰딩
 *   300  ─ 384  책상 상판. 스탠드와 필기도구
 *
 * 광원은 왼쪽 위(9.1). 창의 찬 빛이 벽 왼쪽을, 스탠드의 더운 빛이 책상 왼쪽을 비춘다.
 */
(function () {
  "use strict";

  const S = window.PixelScreen;
  const P = S.PAL;
  const W = S.W;

  const WALL_TOP = 0;
  const WALL_BOTTOM = 292;
  const DESK_TOP = 300;

  const WIN = { x: 12, y: 62, w: 78, h: 116 };

  let seedTable = null;

  /** 벽지 얼룩과 나뭇결은 매 프레임 달라지면 안 된다. 한 번만 만들어 재사용한다. */
  function noise() {
    if (seedTable) return seedTable;
    const out = [];
    let s = 0x9e3779b9;
    for (let i = 0; i < 4096; i += 1) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      out.push(s / 4294967296);
    }
    seedTable = out;
    return out;
  }

  // ── 벽 ───────────────────────────────────────────────────────────
  function drawWall(ctx) {
    S.px(ctx, 0, WALL_TOP, W, WALL_BOTTOM - WALL_TOP, P.wall);

    // 넓은 간격의 2px 줄무늬. 1px 반복은 화면 전체를 노이즈로 만든다.
    for (let x = 0; x < W; x += 18) {
      S.px(ctx, x, WALL_TOP, 2, WALL_BOTTOM - WALL_TOP, P.wallStripe);
    }

    // 창에서 들어오는 찬 빛. 왼쪽 위가 밝고 오른쪽으로 갈수록 어둡다.
    S.glow(ctx, 52, 118, 150, 130, P.wallLit, 0.8, 6);
    S.fade(ctx, 340, WALL_TOP, 300, WALL_BOTTOM - WALL_TOP, P.wallStripe, 0, 0.9, 8);
    S.fade(ctx, 470, WALL_TOP, 170, WALL_BOTTOM - WALL_TOP, P.wallDark, 0, 0.8, 6);
    // 천장 쪽으로도 어두워진다
    S.fade(ctx, 0, WALL_TOP, W, 26, P.wallDark, 0.5, 0, 6, true);

    // 세월. 벽에 남은 얼룩 몇 개.
    const n = noise();
    for (let i = 0; i < 30; i += 1) {
      const x = Math.floor(n[i] * W);
      const y = WALL_TOP + Math.floor(n[i + 300] * (WALL_BOTTOM - WALL_TOP));
      S.px(ctx, x, y, 2 + (n[i + 600] > 0.8 ? 2 : 0), 2, P.wallDark);
    }
  }

  function drawMolding(ctx) {
    S.px(ctx, 0, WALL_BOTTOM, W, 8, P.molding);
    S.px(ctx, 0, WALL_BOTTOM, W, 1, P.moldingLit);
    S.px(ctx, 0, WALL_BOTTOM + 6, W, 2, P.moldingDark);
    for (let x = 0; x < W; x += 24) {
      S.px(ctx, x, WALL_BOTTOM + 2, 1, 4, P.moldingDark);
    }
  }

  // ── 창 ───────────────────────────────────────────────────────────
  /** fog 1 = 아무것도 안 보인다, 0 = 지붕선까지 또렷하다. */
  function drawWindow(ctx, fog) {
    const f = Math.max(0, Math.min(1, fog === undefined ? 1 : fog));
    const { x, y, w, h } = WIN;

    // 창틀
    S.px(ctx, x - 4, y - 4, w + 8, h + 8, P.moldingDark);
    S.px(ctx, x - 3, y - 3, w + 6, h + 6, P.molding);
    S.px(ctx, x - 3, y - 3, w + 6, 1, P.moldingLit);
    S.px(ctx, x - 3, y - 3, 1, h + 6, P.moldingLit);

    // 유리. 작은 디더를 걷어 내고 큰 평면으로 나눈다.
    S.px(ctx, x, y, w, h, P.glass);
    S.px(ctx, x, y, w, Math.floor(h * 0.48), P.fogNear);
    S.px(ctx, x, y + Math.floor(h * 0.48), w, Math.floor(h * 0.28), P.fogFar);

    // 바깥 풍경. 안개가 옅어질수록 지붕이 드러난다.
    if (f < 0.92) {
      const base = y + h - 34;
      S.px(ctx, x, base, w, 34, P.roof);
      // 지붕 능선
      const roofs = [
        [x + 2, base + 6, 22, 28],
        [x + 26, base + 2, 18, 32],
        [x + 46, base + 10, 16, 24],
        [x + 62, base + 4, 16, 30],
      ];
      roofs.forEach(function (r, i) {
        S.px(ctx, r[0], r[1], r[2], r[3], i % 2 ? P.roofDark : P.roof);
      });
    }
    if (f < 0.5) {
      // 가로등 하나. 안개가 걷혔다는 신호.
      S.px(ctx, x + 36, y + h - 26, 1, 18, P.brassDark);
      S.px(ctx, x + 35, y + h - 29, 3, 3, P.lampGlow);
    }

    // 안개도 2×2 덩어리로만 얹는다.
    const n = noise();
    const fogDots = Math.floor(18 + f * 34);
    for (let i = 0; i < fogDots; i += 1) {
      const fx = x + 2 + Math.floor(n[i + 3100] * ((w - 4) / 2)) * 2;
      const fy = y + 2 + Math.floor(n[i + 3400] * ((h - 4) / 2)) * 2;
      S.px(ctx, fx, fy, 2, 2, i % 3 ? P.fogNear : P.fogFar);
    }

    // 창살
    S.px(ctx, x + Math.floor(w / 2) - 1, y, 2, h, P.molding);
    S.px(ctx, x, y + Math.floor(h / 2) - 1, w, 2, P.molding);
    S.px(ctx, x + Math.floor(w / 2) - 1, y, 1, h, P.moldingLit);

    // 유리 안쪽 반사
    S.px(ctx, x + 3, y + 3, 1, h - 8, P.fogNear);
    S.px(ctx, x + 3, y + 3, w - 8, 1, P.fogNear);

    // 창턱
    S.px(ctx, x - 6, y + h + 4, w + 12, 4, P.molding);
    S.px(ctx, x - 6, y + h + 4, w + 12, 1, P.moldingLit);
    S.px(ctx, x - 6, y + h + 7, w + 12, 1, P.moldingDark);
  }

  // ── 책상 ─────────────────────────────────────────────────────────
  function drawDesk(ctx) {
    S.px(ctx, 0, DESK_TOP, W, 384 - DESK_TOP, P.deskTop);
    // 뒷전 그림자 — 벽과 상판이 만나는 곳
    S.px(ctx, 0, DESK_TOP, W, 3, P.deskEdge);
    S.fade(ctx, 0, DESK_TOP + 3, W, 12, P.deskDark, 0.85, 0, 5, true);

    // 나뭇결. 길고 굵은 선 몇 개만 남긴다.
    const n = noise();
    for (let i = 0; i < 26; i += 1) {
      const x = Math.floor(n[i + 900] * W);
      const y = DESK_TOP + 6 + Math.floor(n[i + 1200] * (384 - DESK_TOP - 8));
      const len = 6 + Math.floor(n[i + 1500] * 26);
      S.px(ctx, x, y, len, 2, n[i + 1800] > 0.6 ? P.deskGrain : P.deskDark);
    }

    // 조명도 넓은 색면으로 읽히게 한다.
    S.px(ctx, 0, DESK_TOP + 4, 112, 70, P.deskLit);
    S.px(ctx, 112, DESK_TOP + 4, 54, 70, P.deskTop);
    S.px(ctx, 520, DESK_TOP + 4, 120, 75, P.deskDark);

    // 상판 앞 모서리
    S.px(ctx, 0, 380, W, 4, P.deskEdge);
    S.px(ctx, 0, 379, W, 1, P.deskLit);
  }

  // ── 스탠드 ───────────────────────────────────────────────────────
  function drawLamp(ctx) {
    const bx = 30;
    const by = 372;

    // 받침
    S.px(ctx, bx - 14, by - 4, 28, 5, P.brassDark);
    S.px(ctx, bx - 12, by - 6, 24, 3, P.brass);
    S.px(ctx, bx - 12, by - 6, 24, 1, P.brassLit);

    // 기둥
    S.px(ctx, bx - 1, by - 40, 3, 35, P.brass);
    S.px(ctx, bx - 1, by - 40, 1, 35, P.brassLit);
    // 관절
    S.px(ctx, bx - 3, by - 43, 7, 4, P.brassDark);
    // 팔
    for (let i = 0; i < 26; i += 1) {
      S.px(ctx, bx + i, by - 44 - Math.floor(i * 0.55), 2, 2, P.brass);
    }

    // 갓
    const sx = bx + 24;
    const sy = by - 62;
    S.px(ctx, sx, sy, 30, 4, P.lampShadeLit);
    S.px(ctx, sx + 1, sy + 4, 28, 4, P.lampShade);
    S.px(ctx, sx + 3, sy + 8, 24, 3, P.lampShade);
    S.px(ctx, sx + 5, sy + 11, 20, 2, P.brassDark);
    S.px(ctx, sx, sy, 30, 1, P.lampShadeLit);

    // 전구와 빛
    S.px(ctx, sx + 12, sy + 13, 6, 3, P.lampGlow);
    S.glow(ctx, sx + 15, sy + 26, 22, 16, P.lampGlow, 0.35, 4);
  }

  // ── 책상 위 물건 ─────────────────────────────────────────────────
  function drawPapers(ctx, x, y) {
    for (let i = 0; i < 3; i += 1) {
      const ox = x + i * 2;
      const oy = y - i * 2;
      S.px(ctx, ox + 1, oy + 1, 44, 26, P.shadow);
      S.px(ctx, ox, oy, 44, 26, i === 2 ? P.paper : P.paperBack);
    }
    for (let i = 0; i < 4; i += 1) {
      S.px(ctx, x + 9, y - 1 + 5 + i * 4, 28 - (i % 2) * 8, 1, P.paperLine);
    }
  }

  function drawPencils(ctx, x, y) {
    const set = [
      [0, 0, P.terracotta],
      [5, 3, P.teal],
      [10, 1, P.goldDim],
    ];
    set.forEach(function (p) {
      const px0 = x + p[0];
      const py0 = y + p[1];
      // 몸통 (오른쪽 위로 살짝 기운다)
      for (let i = 0; i < 26; i += 1) {
        S.px(ctx, px0 + i, py0 - Math.floor(i * 0.22), 1, 3, p[2]);
      }
      // 깎인 끝과 심
      S.px(ctx, px0 + 26, py0 - 6, 3, 2, P.cream);
      S.px(ctx, px0 + 29, py0 - 7, 2, 2, P.ink);
      // 쇠테
      S.px(ctx, px0, py0, 2, 3, P.brass);
    });
  }

  function drawBrush(ctx, x, y) {
    for (let i = 0; i < 24; i += 1) {
      S.px(ctx, x + i, y - Math.floor(i * 0.3), 1, 3, P.deskEdge);
    }
    S.px(ctx, x + 22, y - 7, 4, 3, P.brass);
    S.px(ctx, x + 25, y - 9, 5, 4, P.inkSoft);
    S.px(ctx, x + 29, y - 10, 3, 2, P.ink);
  }

  function drawInkpot(ctx, x, y) {
    S.px(ctx, x + 1, y + 15, 20, 3, P.shadow);
    // 유리 몸통 — 아래가 넓은 사다리꼴
    S.px(ctx, x, y + 8, 20, 8, P.inkSoft);
    S.px(ctx, x + 2, y + 3, 16, 6, P.inkSoft);
    S.px(ctx, x + 2, y + 3, 2, 12, P.teal);
    S.px(ctx, x + 4, y + 10, 12, 5, P.ink);
    // 마개
    S.px(ctx, x + 7, y, 6, 4, P.molding);
    S.px(ctx, x + 7, y, 6, 1, P.moldingLit);
  }

  /** 붉은 실타래. 증거판의 실이 어디서 나왔는지 보여준다. */
  function drawThreadSpool(ctx, cx, cy) {
    S.px(ctx, cx - 8, cy + 7, 17, 3, P.shadow);
    for (let j = -8; j <= 8; j += 1) {
      const half = Math.floor(Math.sqrt(64 - j * j));
      S.px(ctx, cx - half, cy + j, half * 2 + 1, 1, P.threadRed);
    }
    for (let j = -8; j <= 8; j += 3) {
      const half = Math.floor(Math.sqrt(Math.max(0, 64 - j * j)));
      S.px(ctx, cx - half, cy + j, half * 2 + 1, 1, P.pinRed);
    }
    S.px(ctx, cx - 4, cy - 5, 3, 2, P.paperEdge);
    // 풀려 나온 실 한 가닥
    for (let i = 0; i < 22; i += 1) {
      S.px(ctx, cx + 8 + i, cy + 2 + Math.floor(Math.sin(i / 4) * 3), 1, 1, P.threadRed);
    }
  }

  function drawPinTin(ctx, x, y) {
    S.px(ctx, x + 1, y + 11, 16, 3, P.shadow);
    S.px(ctx, x, y + 2, 16, 10, P.brassDark);
    S.px(ctx, x, y + 2, 16, 2, P.brass);
    S.px(ctx, x, y + 2, 1, 10, P.brassLit);
    S.px(ctx, x + 3, y, 3, 3, P.pinRed);
    S.px(ctx, x + 8, y + 1, 3, 2, P.pinRed);
    S.px(ctx, x + 12, y, 2, 3, P.gold);
  }

  function drawCup(ctx, x, y) {
    S.px(ctx, x + 1, y + 15, 18, 3, P.shadow);
    S.px(ctx, x, y + 2, 18, 14, P.cream);
    S.px(ctx, x, y + 2, 18, 2, P.creamDim);
    S.px(ctx, x + 2, y + 4, 14, 3, P.inkSoft);
    S.px(ctx, x, y + 14, 18, 2, P.creamDim);
    // 손잡이
    S.px(ctx, x + 18, y + 5, 3, 2, P.cream);
    S.px(ctx, x + 20, y + 6, 2, 4, P.cream);
    S.px(ctx, x + 18, y + 10, 3, 2, P.cream);
    // 김
    S.px(ctx, x + 5, y - 4, 1, 3, P.creamDim);
    S.px(ctx, x + 9, y - 6, 1, 4, P.creamDim);
  }

  /** 펼쳐진 스케치북. 이 방 주인이 무엇으로 먹고사는지 한눈에 보인다. */
  function drawSketchbook(ctx, x, y) {
    S.px(ctx, x + 2, y + 2, 74, 34, P.shadow);
    S.px(ctx, x, y, 74, 34, P.paper);
    S.px(ctx, x, y + 33, 74, 1, P.paperEdge);
    S.px(ctx, x + 36, y, 2, 34, P.paperEdge); // 접힌 가운데
    // 왼쪽 면에 그리다 만 얼굴
    S.px(ctx, x + 12, y + 8, 14, 17, P.paperBack);
    S.px(ctx, x + 14, y + 11, 3, 2, P.ink);
    S.px(ctx, x + 21, y + 11, 3, 2, P.ink);
    S.px(ctx, x + 16, y + 19, 7, 1, P.ink);
    // 오른쪽 면에 적어 둔 메모
    for (let i = 0; i < 5; i += 1) {
      S.px(ctx, x + 43, y + 7 + i * 5, 24 - (i % 2) * 9, 1, P.paperLine);
    }
  }

  function drawRuler(ctx, x, y) {
    S.px(ctx, x + 1, y + 5, 50, 2, P.shadow);
    S.px(ctx, x, y, 50, 5, "#C4B287");
    S.px(ctx, x, y, 50, 1, "#DCCBA0");
    for (let i = 3; i < 50; i += 5) S.px(ctx, x + i, y + 2, 1, 3, P.deskEdge);
  }

  function drawDeskProps(ctx) {
    drawSketchbook(ctx, 120, 328);
    drawPencils(ctx, 206, 348);
    drawBrush(ctx, 206, 366);
    drawRuler(ctx, 210, 372);
    drawInkpot(ctx, 262, 326);
    drawPinTin(ctx, 300, 336);
    drawThreadSpool(ctx, 352, 342);
    drawPapers(ctx, 420, 342);
    drawCup(ctx, 552, 330);

    // 잉크 얼룩. 이 책상은 오래 쓴 물건이다.
    const n = noise();
    for (let i = 0; i < 22; i += 1) {
      const x = 250 + Math.floor(n[i + 2100] * 120);
      const y = 318 + Math.floor(n[i + 2400] * 58);
      S.px(ctx, x, y, 1 + (n[i + 2700] > 0.75 ? 1 : 0), 1, P.ink);
    }
  }

  function drawPixelLine(ctx, x0, y0, x1, y1, color, width) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const w = width || 1;
    for (let i = 0; i <= steps; i += 1) {
      const t = steps ? i / steps : 0;
      S.px(ctx, Math.round(x0 + dx * t) - Math.floor(w / 2),
        Math.round(y0 + dy * t) - Math.floor(w / 2), w, w, color);
    }
  }

  /**
   * 복원 작업대의 바탕. 증거판의 방을 그대로 옮기지 않고 카메라를 책상 바로 위로
   * 당긴 장면이다. 작업대 위 물건은 workbench.js가 그리며, 여기서는 같은 사무소의
   * 상판·나뭇결·왼쪽 위 광원만 제공한다. drawRoom에는 영향을 주지 않는다.
   */
  function drawWorkbenchBackdrop(ctx) {
    S.px(ctx, 0, 0, 640, 384, P.deskTop);
    S.px(ctx, 0, 0, 640, 5, P.deskEdge);
    S.px(ctx, 0, 5, 640, 3, P.deskDark);

    // 넓은 판재. 증거판 책상의 색과 선 굵기를 그대로 쓴다.
    const seams = [92, 192, 298];
    seams.forEach(function (y) {
      S.px(ctx, 0, y, 640, 3, P.deskEdge);
      S.px(ctx, 0, y + 3, 640, 2, P.deskLit);
    });

    // 캔버스로 모이는 스탠드 빛. 디더 계조라 픽셀 밀도도 기존 화면과 같다.
    S.glow(ctx, 326, 172, 278, 210, P.lampGlow, 0.22, 7);
    S.fade(ctx, 0, 0, 128, 384, P.deskDark, 0.28, 0, 6);
    S.fade(ctx, 520, 0, 120, 384, P.deskDark, 0, 0.42, 6);

    // 나뭇결은 1px 점무늬 대신 긴 2px 색면으로만 둔다.
    const n = noise();
    for (let i = 0; i < 42; i += 1) {
      const x = Math.floor(n[i + 40] * 610);
      const y = 12 + Math.floor(n[i + 440] * 360);
      const len = 8 + Math.floor(n[i + 840] * 42);
      S.px(ctx, x, y, len, 2, i % 3 ? P.deskGrain : P.deskDark);
      if (i % 7 === 0) S.px(ctx, x + 5, y + 2, Math.max(4, len - 12), 1, P.deskLit);
    }

    // 화면 가장자리는 책상 위로 몸을 숙여 보고 있는 듯 어둡게 닫는다.
    S.fade(ctx, 0, 0, 640, 18, P.ink, 0.34, 0, 5, true);
    S.fade(ctx, 0, 366, 640, 18, P.ink, 0, 0.34, 5, true);
  }

  /** 왼쪽 창 아래의 경과 시간 아날로그 시계. */
  function drawWallClock(ctx, clock) {
    const cx = 51;
    const cy = 236;
    const radius = 26;
    const casePad = 4;

    // 사각 시계 칸과 원형 프레임은 같은 중심점을 쓴다.
    S.px(ctx, cx - radius - casePad, cy - radius - casePad,
      (radius + casePad) * 2 + 1, (radius + casePad) * 2 + 1, P.wallDark);
    for (let y = -radius; y <= radius; y += 1) {
      const half = Math.floor(Math.sqrt(radius * radius - y * y));
      S.px(ctx, cx - half, cy + y, half * 2 + 1, 1, P.moldingDark);
    }
    for (let y = -23; y <= 23; y += 1) {
      const half = Math.floor(Math.sqrt(529 - y * y));
      S.px(ctx, cx - half, cy + y, half * 2 + 1, 1, P.brass);
    }
    for (let y = -20; y <= 20; y += 1) {
      const half = Math.floor(Math.sqrt(400 - y * y));
      S.px(ctx, cx - half, cy + y, half * 2 + 1, 1, P.paper);
    }
    S.px(ctx, cx - 16, cy - 17, 21, 2, P.pinHi);

    // 시각 눈금
    for (let i = 0; i < 12; i += 1) {
      const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      const tx = cx + Math.round(Math.cos(a) * 16);
      const ty = cy + Math.round(Math.sin(a) * 16);
      const major = i % 3 === 0;
      S.px(ctx, tx - 1, ty - 1, major ? 3 : 2, major ? 3 : 2, P.ink);
    }

    const parts = String(clock || "00:00:00").split(":").map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;
    const hourAngle = ((hours % 12) + minutes / 60) * Math.PI / 6 - Math.PI / 2;
    const minuteAngle = (minutes + seconds / 60) * Math.PI / 30 - Math.PI / 2;
    const secondAngle = seconds * Math.PI / 30 - Math.PI / 2;

    drawPixelLine(ctx, cx, cy,
      cx + Math.round(Math.cos(hourAngle) * 9),
      cy + Math.round(Math.sin(hourAngle) * 9), P.ink, 3);
    drawPixelLine(ctx, cx, cy,
      cx + Math.round(Math.cos(minuteAngle) * 14),
      cy + Math.round(Math.sin(minuteAngle) * 14), P.inkSoft, 2);
    drawPixelLine(ctx, cx, cy,
      cx + Math.round(Math.cos(secondAngle) * 17),
      cy + Math.round(Math.sin(secondAngle) * 17), P.pinRed, 1);
    S.px(ctx, cx - 2, cy - 2, 5, 5, P.brassDark);
    S.px(ctx, cx - 1, cy - 1, 3, 3, P.brassLit);
  }

  window.Office = Object.freeze({
    WALL_TOP,
    WALL_BOTTOM,
    DESK_TOP,
    WIN,
    drawWall,
    drawWallClock,
    drawMolding,
    drawWindow,
    drawDesk,
    drawLamp,
    drawDeskProps,
    drawWorkbenchBackdrop,
    /** 증거판을 뺀 방 전체. 판은 이 위에 그린다. */
    drawRoom(ctx, opts) {
      const o = opts || {};
      drawWall(ctx);
      drawWindow(ctx, o.fog);
      drawWallClock(ctx, o.clock);
      drawMolding(ctx);
      drawDesk(ctx);
      drawLamp(ctx);
      drawDeskProps(ctx);
    },
  });
})();
