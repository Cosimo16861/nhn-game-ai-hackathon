/**
 * 증거판 — 퀘스트 가지 맵 화면.
 * 근거: docs/QUEST_BRANCH.md 2·3장
 *
 * 별도 UI 화면이 아니라 탐정 사무소 벽에 걸린 코르크 증거판이다(디에게틱).
 * 원 = 압정에 꽂힌 종이, 간선 = 실(본선 붉은 실 / 가지 흰 실).
 *
 * 레이어는 순차 공개된다. `OPEN` 이상인 노드가 하나도 없는 레이어는
 * 열 자체가 존재하지 않는다. L0을 클리어하기 전에는 L1~L6이 보이지 않는다.
 *
 * 그리는 방식
 *   - 판·종이·압정·실은 640×384 캔버스에 그리고 nearest-neighbor로 확대한다
 *   - 라벨과 클릭 대상은 그 위에 DOM으로 얹는다.
 *     캔버스 fillText는 안티앨리어싱이 걸리고(9.1 위반) 키보드 접근성도 없다
 *
 * 사용법
 *   BranchMap.mount(el, { onSelect(nodeId) })
 *   BranchMap.render(State)            // State.has(flag) 만 쓴다
 *   BranchMap.setThumbnail(id, canvas) // 복원 통과 시 결과 축소본 등록
 */
(function () {
  "use strict";

  const W = 640;
  const H = 384;

  // 열은 고정 피치다. 레이어가 공개돼도 기존 노드가 움직이지 않는다.
  const COL_X = [70, 152, 234, 316, 398, 480, 562];
  const ROW_Y = { A: 92, B: 154, C: 216, D: 278 };

  const CARD_W = 46;
  const CARD_H = 34;

  /**
   * 판에 적는 이름. 압정 하나 폭에 들어가야 해서 정본 제목보다 짧다.
   * 정본은 quest-graph.js의 title이고, 여기 없는 노드는 그것을 그대로 쓴다.
   */
  const BOARD_TITLE = Object.freeze({
    Q1B_TAVERN_WALL: "선술집 벽",
    Q2A_TRUE_FACE: "진짜 얼굴",
    Q2B_CAT: "안개 찾기",
    Q3B_TATTOO: "새것인 닻",
    Q4B_LOGBOOK: "항해일지",
    Q5B_SIREN: "세이렌 호",
  });

  /** 노드 배치. col은 layer와 일치하고, row는 이야기 줄기를 나눈다. */
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

  const C = Object.freeze({
    wall: "#2A221C",
    wallLit: "#332A22",
    frameLight: "#8A6448",
    frame: "#6A4A34",
    frameDark: "#4A3324",
    cork: "#A87F4C",
    corkDark: "#96703F",
    corkLight: "#C09A62",
    corkGrain: "#87663A",
    corkHole: "#6E5230",
    corkShade: "#5A4226",
    paperBack: "#C0B296",
    paperBackLine: "#A99B80",
    paper: "#E4DAC2",
    paperEdge: "#B9AD90",
    shadow: "#7C5F3A",
    pinRed: "#A03A2E",
    pinBrass: "#D8A94B",
    pinHi: "#E8D3A0",
    threadRed: "#B03A30",
    threadWhite: "#CFC2A6",
    ink: "#2E241E",
  });

  let root = null;
  let canvas = null;
  let ctx = null;
  let overlay = null;
  let onSelect = null;
  let lastState = null;
  const thumbnails = new Map();

  // ── 결정적 난수 ────────────────────────────────────────────────
  // 코르크 얼룩과 종이 기울기가 다시 그릴 때마다 달라지면 화면이 떨린다.
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

  // ── 스타일 ─────────────────────────────────────────────────────
  function ensureStyle() {
    if (document.getElementById("branchmap-style")) return;
    const style = document.createElement("style");
    style.id = "branchmap-style";
    style.textContent = [
      ".branchmap{position:relative;width:100%;max-width:960px;margin:0 auto;",
      "container-type:inline-size;}",
      ".branchmap canvas{display:block;width:100%;height:auto;",
      "image-rendering:pixelated;image-rendering:crisp-edges;}",
      ".branchmap .bm-overlay{position:absolute;inset:0;}",
      // 클릭 대상은 종이 딱 그만큼이다. 라벨은 종이 밖에 따로 둔다.
      ".branchmap .bm-node{position:absolute;margin:0;padding:0;border:0;",
      "background:none;cursor:pointer;border-radius:0;}",
      ".branchmap .bm-node:focus-visible{outline:2px solid #D8A94B;outline-offset:2px;}",
      ".branchmap .bm-label{position:absolute;pointer-events:none;",
      "color:#F0E6CE;font:inherit;line-height:1.2;",
      // 판이 확대되면 라벨도 같이 커져야 한다. 안 그러면 종이만 크고 글씨는 작다.
      "font-size:clamp(10px,1.45cqw,14px);",
      "letter-spacing:-0.02em;text-align:center;word-break:keep-all;",
      "text-shadow:0 1px 0 #2E241E,0 -1px 0 #2E241E,1px 0 0 #2E241E,-1px 0 0 #2E241E;}",
      ".branchmap .bm-label[data-status=cleared]{color:#CFC2A6;}",
      ".branchmap .bm-node:hover+.bm-label,",
      ".branchmap .bm-node:focus-visible+.bm-label{color:#F6DFA6;}",
      ".branchmap .bm-sr{position:absolute;width:1px;height:1px;overflow:hidden;",
      "clip:rect(0 0 0 0);white-space:nowrap;}",
    ].join("");
    document.head.appendChild(style);
  }

  // ── 판 그리기 ──────────────────────────────────────────────────
  function px(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawBoard() {
    px(0, 0, W, H, C.wall);
    // 왼쪽 위 광원(9.1). 벽에 아주 옅은 밝은 면을 둔다.
    px(0, 0, W, 18, C.wallLit);

    // 나무 액자
    px(24, 36, 592, 316, C.frameDark);
    px(24, 36, 592, 4, C.frameLight);
    px(24, 36, 4, 316, C.frameLight);
    px(28, 40, 584, 308, C.frame);
    px(32, 44, 576, 300, C.cork);

    // 코르크 알갱이. 씨앗 고정 — 다시 그릴 때마다 달라지면 화면이 떨린다.
    const r = rng(0x0c0c0b);
    for (let i = 0; i < 3400; i += 1) {
      const x = 32 + Math.floor(r() * 576);
      const y = 44 + Math.floor(r() * 300);
      const t = r();
      if (t > 0.62) px(x, y, 1, 1, C.corkLight);
      else if (t > 0.24) px(x, y, 1, 1, C.corkDark);
      else px(x, y, 2, 1, C.corkGrain);
    }
    // 굵은 알갱이 몇 개. 판이 평평한 색면으로 보이지 않게 한다.
    for (let i = 0; i < 190; i += 1) {
      const x = 33 + Math.floor(r() * 573);
      const y = 45 + Math.floor(r() * 297);
      const w = 2 + Math.floor(r() * 3);
      px(x, y, w, 2, r() > 0.5 ? C.corkGrain : C.corkLight);
    }
    // 오래된 압정 자국. 빈 코르크가 "쓰던 판"으로 읽히게 한다.
    for (let i = 0; i < 34; i += 1) {
      const x = 40 + Math.floor(r() * 560);
      const y = 52 + Math.floor(r() * 284);
      px(x, y, 2, 2, C.corkHole);
      px(x, y, 1, 1, C.corkShade);
    }

    // 안쪽 그림자
    px(32, 44, 576, 2, C.corkDark);
    px(32, 44, 2, 300, C.corkDark);
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

  function pinPoint(node) {
    const c = nodeCenter(node);
    const j = jitter(node.id);
    return { x: c.x + j.dx, y: c.y + j.dy - CARD_H / 2 + 4 };
  }

  function drawThumbnail(x, y, w, h, node) {
    const supplied = thumbnails.get(node.id);
    if (supplied) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(supplied, x, y, w, h);
      return;
    }
    // 아직 복원 결과가 없을 때의 자리표시. 노드마다 다른 색 덩어리를 얹는다.
    const r = rng(hash(node.id));
    const tones = ["#8C7A5E", "#6E7A6A", "#8A6A58", "#7A6E86", "#9A8A62"];
    px(x, y, w, h, "#CFC3A6");
    for (let i = 0; i < 5; i += 1) {
      const bw = 3 + Math.floor(r() * (w - 6));
      const bh = 3 + Math.floor(r() * (h - 6));
      px(
        x + Math.floor(r() * (w - bw)),
        y + Math.floor(r() * (h - bh)),
        bw,
        bh,
        tones[Math.floor(r() * tones.length)]
      );
    }
  }

  function drawCard(node, status) {
    const c = nodeCenter(node);
    const j = jitter(node.id);
    const x = c.x - CARD_W / 2 + j.dx;
    const y = c.y - CARD_H / 2 + j.dy;

    px(x + 2, y + 3, CARD_W, CARD_H, C.shadow);

    if (status === "cleared") {
      px(x, y, CARD_W, CARD_H, C.paper);
      px(x, y + CARD_H - 1, CARD_W, 1, C.paperEdge);
      px(x + CARD_W - 1, y, 1, CARD_H, C.paperEdge);
      drawThumbnail(x + 3, y + 3, CARD_W - 6, CARD_H - 6, node);
      px(x + 3, y + 3, CARD_W - 6, 1, C.ink);
      px(x + 3, y + CARD_H - 4, CARD_W - 6, 1, C.ink);
      px(x + 3, y + 3, 1, CARD_H - 6, C.ink);
      px(x + CARD_W - 4, y + 3, 1, CARD_H - 6, C.ink);
    } else {
      // 뒤집힌 종이 — 무엇인지 아직 모른다.
      px(x, y, CARD_W, CARD_H, C.paperBack);
      px(x, y + CARD_H - 1, CARD_W, 1, C.paperEdge);
      px(x + CARD_W - 1, y, 1, CARD_H, C.paperEdge);
      for (let i = 0; i < 4; i += 1) {
        px(x + 8, y + 11 + i * 5, CARD_W - 16 - (i % 2) * 8, 1, C.paperBackLine);
      }
    }

    // 압정
    const p = pinPoint(node);
    const head = node.route === "branch" ? C.pinBrass : C.pinRed;
    px(p.x - 2, p.y - 2, 5, 5, C.ink);
    px(p.x - 1, p.y - 1, 3, 3, head);
    px(p.x - 1, p.y - 1, 1, 1, C.pinHi);
  }

  // ── 실 ─────────────────────────────────────────────────────────
  /** 중력을 받아 처지는 실. 압정에서 압정으로 잇는다. */
  function drawThread(a, b, color) {
    const sag = 6 + Math.abs(b.x - a.x) * 0.05;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
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
    G.NODES.forEach((node) => {
      const status = G.statusOf(node.id, state);
      if (status !== G.LOCKED) map.set(node.id, status);
    });
    return map;
  }

  // ── 렌더 ───────────────────────────────────────────────────────
  function render(state) {
    if (!root) return;
    lastState = state;

    const G = window.QuestGraph;
    const visible = visibleNodes(state);

    drawBoard();

    // 실 먼저. 양 끝이 모두 보일 때만 그린다.
    G.edges().forEach((edge) => {
      if (!visible.has(edge.from) || !visible.has(edge.to)) return;
      // 실은 "이어진 결론"이다. 아직 복원하지 않은 종이에는 매지 않는다.
      if (visible.get(edge.from) !== G.CLEARED) return;
      drawThread(
        pinPoint(G.get(edge.from)),
        pinPoint(G.get(edge.to)),
        edge.thread === "red" ? C.threadRed : C.threadWhite
      );
    });

    visible.forEach((status, id) => drawCard(G.get(id), status));

    // 라벨·클릭 대상
    overlay.textContent = "";
    visible.forEach((status, id) => {
      const node = G.get(id);
      const c = nodeCenter(node);
      const j = jitter(id);
      const left = c.x - CARD_W / 2 + j.dx;
      const top = c.y - CARD_H / 2 + j.dy;

      const el = document.createElement(status === G.CLEARED ? "div" : "button");
      if (el.tagName === "BUTTON") el.type = "button";
      el.className = "bm-node";
      el.dataset.status = status;
      el.dataset.node = id;
      el.style.left = pct(left, W);
      el.style.top = pct(top, H);
      el.style.width = pct(CARD_W, W);
      el.style.height = pct(CARD_H, H);

      if (status === G.CLEARED) {
        el.setAttribute("aria-label", node.title + " — 복원을 마쳤다");
        el.style.cursor = "default";
      } else {
        el.setAttribute(
          "aria-label",
          node.title + " — 아직 그리지 않았다. 선택하면 작업대로 간다"
        );
        el.addEventListener("click", () => {
          if (onSelect) onSelect(id);
        });
      }

      // 라벨은 종이 아래에 따로 놓는다. 길어져도 종이를 덮지 않는다.
      const label = document.createElement("div");
      label.className = "bm-label";
      label.dataset.status = status;
      label.textContent = BOARD_TITLE[id] || node.title;
      label.style.left = pct(c.x - 40 + j.dx, W);
      label.style.top = pct(top + CARD_H + 2, H);
      label.style.width = pct(80, W);

      overlay.appendChild(el);
      overlay.appendChild(label);
    });

    const openCount = [...visible.values()].filter((s) => s !== G.CLEARED).length;
    root.querySelector("[data-role=bm-status]").textContent =
      "증거판에 " + visible.size + "장이 걸려 있고, 그중 " + openCount + "장은 아직 그리지 않았다.";
  }

  function pct(value, total) {
    return (value / total) * 100 + "%";
  }

  // ── 마운트 ─────────────────────────────────────────────────────
  function mount(container, options) {
    ensureStyle();
    onSelect = (options || {}).onSelect || null;

    root = document.createElement("div");
    root.className = "branchmap";

    canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute("role", "presentation");
    ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    overlay = document.createElement("div");
    overlay.className = "bm-overlay";

    const status = document.createElement("p");
    status.className = "bm-sr";
    status.setAttribute("role", "status");
    status.dataset.role = "bm-status";

    root.appendChild(canvas);
    root.appendChild(overlay);
    root.appendChild(status);
    container.appendChild(root);
    return root;
  }

  function setThumbnail(nodeId, source) {
    thumbnails.set(nodeId, source);
    if (lastState) render(lastState);
  }

  window.BranchMap = Object.freeze({ mount, render, setThumbnail, W, H });
})();
