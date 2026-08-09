/**
 * 증거판 — 퀘스트 가지 맵.
 * 근거: docs/QUEST_BRANCH.md 2·3장
 *
 * 별도 UI 화면이 아니라 탐정 사무소 벽에 걸린 코르크판이다(디에게틱).
 * 방 전체를 `Office`가 그리고, 이 파일은 그 위의 판과 종이·압정·실을 맡는다.
 * 화면은 전부 640×384 도트다. HTML 패널을 섞지 않는다.
 *
 * 레이어는 순차 공개된다. `OPEN` 이상인 노드가 하나도 없는 레이어는
 * 열 자체가 존재하지 않는다. L0을 클리어하기 전에는 L1~L6이 보이지 않는다.
 *
 * 사용법
 *   BranchMap.mount(el, { onSelect(nodeId) })
 *   BranchMap.render(State, { objective, clock })
 *   BranchMap.setThumbnail(id, canvasOrImage)
 */
(function () {
  "use strict";

  const S = window.PixelScreen;
  const P = S.PAL;

  // 판 (벽에 걸린 액자 바깥 치수)
  const BOARD = { x: 106, y: 38, w: 524, h: 244 };
  const INNER = { x: BOARD.x + 8, y: BOARD.y + 8, w: BOARD.w - 16, h: BOARD.h - 16 };

  // 열은 고정 피치다. 레이어가 공개돼도 기존 노드가 움직이지 않는다.
  const COL_X = [145, 219, 293, 367, 441, 515, 589];
  const ROW_Y = { A: 77, B: 133, C: 189, D: 245 };

  const CARD_W = 62;
  const CARD_H = 46;
  const LABEL_SIZE = 9;
  const LABEL_MAX = 54;

  /** 노드 배치. col은 layer와 같고, row는 이야기 줄기를 나눈다. */
  const LAYOUT = Object.freeze({
    Q0_MONTAGE: "C",
    Q1A_IDEALIZED: "B",
    Q1B_TAVERN_WALL: "D",
    Q2A_TRUE_FACE: "B",
    Q2B_CAT: "D",
    Q2C_CHILD_ROOM: "A",
    Q3A_SEAL: "B",
    Q3B_TATTOO: "C",
    Q3C_WAREHOUSE: "D",
    Q4A_LEDGER: "B",
    Q4B_LOGBOOK: "D",
    Q4C_SQUARE_BET: "C",
    Q5A_DOCK: "B",
    Q5B_SIREN: "D",
    Q6_FINALE: "B",
  });

  /**
   * 판에 적는 이름. 압정 하나 폭에 들어가야 해서 정본 제목보다 짧다.
   * 정본은 quest-graph.js의 title이고, 여기 없는 노드는 그것을 그대로 쓴다.
   */
  const BOARD_TITLE = Object.freeze({
    Q0_MONTAGE: "골목의 손",
    Q1A_IDEALIZED: "미화 초상",
    Q1B_TAVERN_WALL: "선술집 벽",
    Q2A_TRUE_FACE: "진짜 얼굴",
    Q2B_CAT: "안개 찾기",
    Q2C_CHILD_ROOM: "닫힌 방",
    Q3A_SEAL: "봉인 세 줄",
    Q3B_TATTOO: "새것인 닻",
    Q3C_WAREHOUSE: "창고 불빛",
    Q4A_LEDGER: "번진 장부",
    Q4B_LOGBOOK: "항해일지",
    Q4C_SQUARE_BET: "광장 내기",
    Q5A_DOCK: "안개 부두",
    Q5B_SIREN: "세이렌 호",
    Q6_FINALE: "증거의 방",
  });

  let screen = null;
  let ctx = null;
  let onSelect = null;
  let lastState = null;
  let lastOpts = {};
  let focusedId = null;
  const thumbnails = new Map();

  // ── 결정적 난수 ────────────────────────────────────────────────
  // 코르크 알갱이와 종이 기울기가 다시 그릴 때마다 달라지면 화면이 떨린다.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    let s = seed >>> 0;
    return function next() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // ── 판 ─────────────────────────────────────────────────────────
  function drawBoard() {
    // 벽에 드리우는 그림자
    S.fade(ctx, BOARD.x + 5, BOARD.y + BOARD.h, BOARD.w, 7, P.wallDark, 0.85, 0, 4, true);
    S.fade(ctx, BOARD.x + BOARD.w, BOARD.y + 5, 7, BOARD.h, P.wallDark, 0.85, 0, 4);

    // 나무 액자
    S.px(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, P.frameDark);
    S.px(ctx, BOARD.x, BOARD.y, BOARD.w, 3, P.frameLit);
    S.px(ctx, BOARD.x, BOARD.y, 3, BOARD.h, P.frameLit);
    S.px(ctx, BOARD.x + 3, BOARD.y + 3, BOARD.w - 6, BOARD.h - 6, P.frame);
    S.px(ctx, INNER.x, INNER.y, INNER.w, INNER.h, P.cork);

    // 코르크는 큰 색면이 먼저 읽혀야 한다. 질감은 2px 덩어리로 성기게 얹는다.
    S.px(ctx, INNER.x + INNER.w - 190, INNER.y, 190, INNER.h, P.corkMid);
    S.px(ctx, INNER.x + INNER.w - 82, INNER.y, 82, INNER.h, P.corkDark);
    S.px(ctx, INNER.x + INNER.w - 28, INNER.y, 28, INNER.h, P.corkDeep);
    const r = rng(0x0c0c0b);
    for (let i = 0; i < 520; i += 1) {
      const x = INNER.x + Math.floor(r() * (INNER.w / 2)) * 2;
      const y = INNER.y + Math.floor(r() * (INNER.h / 2)) * 2;
      const t = r();
      if (t > 0.72) S.px(ctx, x, y, 2, 2, P.corkLight);
      else if (t > 0.28) S.px(ctx, x, y, 2, 2, P.corkDark);
      else S.px(ctx, x, y, 4, 2, P.corkGrain);
    }
    for (let i = 0; i < 44; i += 1) {
      const x = INNER.x + 1 + Math.floor(r() * (INNER.w - 4));
      const y = INNER.y + 1 + Math.floor(r() * (INNER.h - 3));
      S.px(ctx, x, y, 2 + Math.floor(r() * 3), 2, r() > 0.5 ? P.corkGrain : P.corkLight);
    }
    // 오래된 압정 자국. 빈 코르크가 "쓰던 판"으로 읽히게 한다.
    for (let i = 0; i < 30; i += 1) {
      const x = INNER.x + 6 + Math.floor(r() * (INNER.w - 12));
      const y = INNER.y + 6 + Math.floor(r() * (INNER.h - 12));
      S.px(ctx, x, y, 2, 2, P.corkHole);
      S.px(ctx, x, y, 1, 1, P.corkShade);
    }

    // 안쪽 그림자 (왼쪽 위 광원)
    S.px(ctx, INNER.x, INNER.y, INNER.w, 2, P.corkShade);
    S.px(ctx, INNER.x, INNER.y, 2, INNER.h, P.corkShade);
    S.fade(ctx, INNER.x, INNER.y, INNER.w, 12, P.corkGrain, 0.55, 0, 5, true);
    S.fade(ctx, INNER.x, INNER.y, 12, INNER.h, P.corkGrain, 0.5, 0, 5);

    drawCaseTag();
  }

  /** 판 왼쪽 위에 꽂힌 사건 표찰. 이 판이 무엇을 위한 것인지 알려준다. */
  function drawCaseTag() {
    const x = INNER.x + 5;
    const y = INNER.y + 4;
    S.px(ctx, x + 3, y + 3, 132, 20, P.shadow);
    S.px(ctx, x, y, 132, 20, P.ink);
    S.px(ctx, x + 2, y + 2, 128, 16, P.goldDim);
    S.px(ctx, x + 4, y + 4, 124, 12, P.panel);
    S.text(ctx, "애셔튼 상속 사건", x + 66, y, {
      size: 10,
      color: P.cream,
      align: "center",
      outline: P.ink,
      weight: "700",
      boxHeight: 20,
    });
  }

  // ── 노드 ───────────────────────────────────────────────────────
  function nodeCenter(node) {
    return { x: COL_X[node.layer], y: ROW_Y[LAYOUT[node.id]] };
  }

  /** 손으로 꽂은 느낌. id마다 고정된 ±2px 흔들림. */
  function jitter(id) {
    const h = hash(id);
    return { dx: ((h >> 3) % 3) - 1, dy: ((h >> 7) % 5) - 2 };
  }

  function cardRect(node) {
    const c = nodeCenter(node);
    const j = jitter(node.id);
    return {
      x: c.x - CARD_W / 2 + j.dx,
      y: c.y - CARD_H / 2 + j.dy,
      w: CARD_W,
      h: CARD_H,
    };
  }

  function pinPoint(node) {
    const r = cardRect(node);
    return { x: r.x + CARD_W / 2, y: r.y + 3 };
  }

  function drawThumbnail(x, y, w, h, node) {
    const supplied = thumbnails.get(node.id);
    if (supplied) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(supplied, x, y, w, h);
      return;
    }
    // 복원 결과가 아직 없을 때의 자리표시. 노드마다 다른 색 덩어리를 얹는다.
    const r = rng(hash(node.id));
    const tones = ["#8C7A5E", "#6E7A6A", "#8A6A58", "#7A6E86", "#9A8A62", "#A08052"];
    S.px(ctx, x, y, w, h, "#CFC3A6");
    for (let i = 0; i < 5; i += 1) {
      const bw = 3 + Math.floor(r() * (w - 5));
      const bh = 3 + Math.floor(r() * (h - 5));
      S.px(
        ctx,
        x + Math.floor(r() * (w - bw)),
        y + Math.floor(r() * (h - bh)),
        bw,
        bh,
        tones[Math.floor(r() * tones.length)]
      );
    }
  }

  function drawCard(node, status) {
    const r = cardRect(node);

    const open = status !== window.QuestGraph.CLEARED;
    const active = open && focusedId === node.id;
    const border = open ? (active ? P.open : P.cream) : P.complete;
    const borderSize = active ? 3 : 2;
    S.px(ctx, r.x + 3, r.y + 4, r.w, r.h, P.shadow);
    S.px(ctx, r.x, r.y, r.w, r.h, P.ink);
    S.px(ctx, r.x + borderSize, r.y + borderSize,
      r.w - borderSize * 2, r.h - borderSize * 2, border);

    if (status === "cleared") {
      drawThumbnail(r.x + 4, r.y + 4, r.w - 8, 26, node);
      S.px(ctx, r.x + 3, r.y + 30, r.w - 6, 13, P.paperBack);
      S.px(ctx, r.x + 3, r.y + 30, r.w - 6, 2, P.completeLit);
      // 완료 체크 도장
      S.px(ctx, r.x + r.w - 11, r.y + 3, 12, 12, P.ink);
      S.px(ctx, r.x + r.w - 10, r.y + 4, 10, 10, "#3F7057");
      S.px(ctx, r.x + r.w - 8, r.y + 8, 2, 3, P.cream);
      S.px(ctx, r.x + r.w - 6, r.y + 10, 2, 2, P.cream);
      S.px(ctx, r.x + r.w - 4, r.y + 7, 2, 4, P.cream);
      S.px(ctx, r.x + r.w - 2, r.y + 5, 2, 3, P.cream);
    } else {
      S.px(ctx, r.x + 4, r.y + 4, r.w - 8, 26, P.paper);
      S.px(ctx, r.x + 7, r.y + 7, r.w - 14, 20, P.paperBack);
      S.px(ctx, r.x + 12, r.y + 11, r.w - 24, 3, P.goldDim);
      S.px(ctx, r.x + 17, r.y + 17, r.w - 34, 3, P.inkSoft);
      S.px(ctx, r.x + 3, r.y + 30, r.w - 6, 13, P.paper);
      S.px(ctx, r.x + 3, r.y + 30, r.w - 6, 2, active ? P.open : P.creamDim);
    }

    // 압정
    const p = pinPoint(node);
    const head = node.route === "branch" ? P.pinBrass : P.pinRed;
    S.px(ctx, p.x - 3, p.y - 3, 7, 7, P.ink);
    S.px(ctx, p.x - 2, p.y - 2, 5, 5, head);
    S.px(ctx, p.x - 2, p.y - 2, 2, 2, P.pinHi);

    if (active) {
      // 선택 카드는 배지와 굵은 화살표로 첫 1초 안에 보이게 한다.
      S.px(ctx, r.x + 13, r.y - 14, 38, 14, P.shadow);
      S.px(ctx, r.x + 12, r.y - 15, 38, 13, P.ink);
      S.px(ctx, r.x + 14, r.y - 13, 34, 9, P.open);
      S.text(ctx, "복원", r.x + 31, r.y - 15, {
        size: 9.5,
        color: P.ink,
        align: "center",
        weight: "700",
        boxHeight: 13,
      });
      S.px(ctx, r.x + r.w / 2 - 2, r.y - 3, 5, 5, P.open);
      S.px(ctx, r.x + r.w / 2 - 5, r.y, 11, 3, P.open);
    }
  }

  function drawLabel(node, status) {
    const r = cardRect(node);
    const cx = r.x + CARD_W / 2;
    const color = status === "cleared" ? P.inkSoft : P.ink;
    S.text(ctx, BOARD_TITLE[node.id] || node.title, cx, r.y + 30.5, {
      size: LABEL_SIZE,
      color: color,
      align: "center",
      weight: "700",
      boxHeight: 13,
    });
  }

  /** 포커스 표시도 도트로 그린다. CSS outline 을 쓰면 거기만 웹처럼 보인다. */
  function drawFocus(node) {
    const r = cardRect(node);
    const x = r.x - 3;
    const y = r.y - 3;
    S.px(ctx, x, y, r.w + 6, 3, P.open);
    S.px(ctx, x, y + r.h + 3, r.w + 6, 3, P.open);
    S.px(ctx, x, y, 3, r.h + 6, P.open);
    S.px(ctx, x + r.w + 3, y, 3, r.h + 6, P.open);
  }

  // ── 실 ─────────────────────────────────────────────────────────
  /** 중력을 받아 처지는 실. 압정에서 압정으로 잇는다. */
  function drawThread(a, b, color, width) {
    const sag = 5 + Math.abs(b.x - a.x) * 0.05;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x + 0.5, a.y + 0.5);
    ctx.quadraticCurveTo(
      (a.x + b.x) / 2 + 0.5,
      (a.y + b.y) / 2 + sag + 0.5,
      b.x + 0.5,
      b.y + 0.5
    );
    ctx.stroke();
  }

  // ── 공개 규칙 ──────────────────────────────────────────────────
  function visibleNodes(state) {
    const G = window.QuestGraph;
    const map = new Map();
    G.NODES.forEach(function (node) {
      const status = G.statusOf(node.id, state);
      if (status !== G.LOCKED) map.set(node.id, status);
    });
    return map;
  }

  /** 본선을 밟을수록 창밖 안개가 걷힌다(GAME_DESIGN 7.1). */
  function fogLevel(state) {
    const G = window.QuestGraph;
    const main = G.mainRoute();
    const done = main.filter(function (id) {
      return state.has("NODE_CLEARED_" + id);
    }).length;
    return Math.max(0.08, 1 - done / (main.length - 1));
  }

  // ── 렌더 ───────────────────────────────────────────────────────
  function render(state, opts) {
    if (!screen) return;
    screen.clearText();
    lastState = state;
    lastOpts = opts || lastOpts || {};

    const G = window.QuestGraph;
    const visible = visibleNodes(state);
    const openIds = [];
    visible.forEach(function (status, id) {
      if (status !== G.CLEARED) openIds.push(id);
    });
    if (!focusedId || !openIds.includes(focusedId)) focusedId = openIds[0] || null;

    window.Office.drawRoom(ctx, { fog: fogLevel(state), clock: lastOpts.clock });
    drawBoard();

    // 실 먼저. 부모를 끝냈고 양 끝이 보일 때만 그린다.
    G.edges().forEach(function (edge) {
      if (!visible.has(edge.from) || !visible.has(edge.to)) return;
      if (visible.get(edge.from) !== G.CLEARED) return;
      const target = edge.to === focusedId;
      const color = target ? P.open : edge.thread === "red" ? P.threadRedLit : P.threadBranch;
      const width = target ? 3 : edge.thread === "red" ? 3 : 2;
      drawThread(pinPoint(G.get(edge.from)), pinPoint(G.get(edge.to)), P.inkSoft, width + 2);
      drawThread(pinPoint(G.get(edge.from)), pinPoint(G.get(edge.to)), color, width);
    });

    visible.forEach(function (status, id) {
      drawCard(G.get(id), status);
    });
    visible.forEach(function (status, id) {
      drawLabel(G.get(id), status);
    });
    if (focusedId && visible.has(focusedId)) drawFocus(G.get(focusedId));

    // 클릭 대상. 보이는 것은 캔버스, 누르는 것은 그 위의 투명한 버튼이다.
    screen.clearHotspots();
    visible.forEach(function (status, id) {
      const node = G.get(id);
      const r = cardRect(node);
      const done = status === G.CLEARED;
      const el = screen.hotspot(r.x - 2, r.y - 8, r.w + 4, r.h + 10, {
        label: done
          ? node.title + " — 복원을 마쳤다"
          : node.title + " — 아직 그리지 않았다. 선택하면 작업대로 간다",
        disabled: done,
        onClick: done
          ? null
          : function () {
              if (onSelect) onSelect(id);
            },
      });
      if (done) return;
      el.addEventListener("focus", function () {
        focusedId = id;
        render(lastState, lastOpts);
      });
      el.addEventListener("blur", function () {
        if (focusedId === id) focusedId = null;
        render(lastState, lastOpts);
      });
      el.addEventListener("mouseenter", function () {
        if (focusedId === id) return;
        focusedId = id;
        render(lastState, lastOpts);
      });
      el.addEventListener("mouseleave", function () {
        if (focusedId === id) focusedId = null;
        render(lastState, lastOpts);
      });
    });

    screen.say(
      "증거판에 " + visible.size + "장이 걸려 있고, 그중 " + openIds.length +
        "장은 아직 그리지 않았다."
    );
  }

  // ── 마운트 ─────────────────────────────────────────────────────
  function mount(container, options) {
    const o = options || {};
    onSelect = o.onSelect || null;
    screen = S.mount(container, {
      reserveWidth: o.reserveWidth,
      reserveHeight: o.reserveHeight,
    });
    ctx = screen.ctx;
    return screen.root;
  }

  function setThumbnail(nodeId, source) {
    thumbnails.set(nodeId, source);
    if (lastState) render(lastState, lastOpts);
  }

  window.BranchMap = Object.freeze({ mount, render, setThumbnail, BOARD });
})();
