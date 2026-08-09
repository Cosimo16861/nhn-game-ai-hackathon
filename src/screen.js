/**
 * 픽셀 화면 프레임워크 — 모든 화면이 공유하는 하나의 디자인 프레임.
 * 근거: GAME_DESIGN 9장(아트 기준), docs/게임배경이미지.png(UI 언어)
 *
 * 화면은 640×384 한 장이다. 증거판·컷신·작업대가 전부 이 안에서 그려진다.
 * HTML 패널을 섞지 않는다. 섞는 순간 "웹사이트"가 된다.
 *
 * 두 가지가 이 파일의 존재 이유다.
 *
 * 1. **정수배 확대.** 1.37배 같은 배율은 픽셀을 들쭉날쭉하게 만든다.
 *    창 크기에 맞춰 2배·3배 중 하나로만 키우고 남는 공간은 여백으로 둔다.
 * 2. **고해상도 한글 레이어.** 작은 한글을 640×384에서 1비트로 이진화하면 복잡한
 *    획이 붙거나 끊어진다. 배경은 저해상도 픽셀 캔버스에 그대로 두고, 글씨만 3배
 *    해상도의 투명 캔버스에 그린다. 장식용 1비트 글씨가 필요하면 mode: "pixel"을 쓴다.
 *
 * 접근성: 눈에 보이는 것은 전부 캔버스지만, 누를 수 있는 것은 그 위에 투명한
 * DOM 버튼으로 겹쳐 둔다. 키보드 이동과 스크린 리더가 그대로 동작하고,
 * 포커스 표시는 캔버스에 도트로 다시 그린다.
 */
(function () {
  "use strict";

  const W = 640;
  const H = 384;
  const MAX_SCALE = 3;
  const TEXT_SCALE = 3;

  const FONT = '"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif';

  /** 팔레트. 새 색을 즉흥으로 만들지 말고 여기에 추가한다. */
  const PAL = Object.freeze({
    ink: "#2E241E",
    inkSoft: "#3B2F27",
    cream: "#D9CDB5",
    creamDim: "#B3A88F",
    gold: "#D8A94B",
    goldDim: "#9C7A33",
    teal: "#4A7471",
    terracotta: "#A05C43",

    wall: "#4A3B32",
    wallLit: "#57463A",
    wallDark: "#3B2F28",
    wallStripe: "#513F35",
    molding: "#6B5240",
    moldingLit: "#836648",
    moldingDark: "#43301F",

    deskTop: "#7A5A3C",
    deskLit: "#8E6B48",
    deskDark: "#5C4028",
    deskEdge: "#4A3220",
    deskGrain: "#6C4E33",

    frameLit: "#8A6448",
    frame: "#6A4A34",
    frameDark: "#4A3324",

    cork: "#A87F4C",
    corkMid: "#9F7747",
    corkDark: "#96703F",
    corkDeep: "#855F36",
    corkLight: "#C09A62",
    corkGrain: "#87663A",
    corkHole: "#6E5230",
    corkShade: "#5A4226",

    paper: "#E4DAC2",
    paperBack: "#C0B296",
    paperLine: "#A99B80",
    paperEdge: "#B9AD90",
    shadow: "#7C5F3A",

    pinRed: "#A03A2E",
    pinBrass: "#D8A94B",
    pinHi: "#E8D3A0",
    threadRed: "#B03A30",
    threadRedLit: "#D45A43",
    threadWhite: "#CFC2A6",

    complete: "#58786A",
    completeLit: "#85A58E",
    open: "#F2C14E",
    threadBranch: "#805044",

    glass: "#8FA0A4",
    fogNear: "#C6CDCB",
    fogFar: "#93A2A5",
    roof: "#4E5A5E",
    roofDark: "#3B4548",

    brass: "#B08A3C",
    brassLit: "#D9B45E",
    brassDark: "#6E5522",
    lampShade: "#8A4A38",
    lampShadeLit: "#A85E46",
    lampGlow: "#F0D08A",

    panel: "#2A231C",
    panelLit: "#3E332A",
    panelEdge: "#1A1512",
  });

  // ── 저수준 그리기 ────────────────────────────────────────────────
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  /** 4×4 순서 디더. 그라데이션 금지(9.1) 대신 쓰는 계조 표현. */
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  function dither(ctx, x, y, w, h, color, density) {
    const level = Math.round(density * 16);
    ctx.fillStyle = color;
    for (let j = 0; j < h; j += 1) {
      for (let i = 0; i < w; i += 1) {
        if (BAYER[j & 3][i & 3] < level) ctx.fillRect(x + i, y + j, 1, 1);
      }
    }
  }

  /**
   * 밀도가 변해 가는 디더. 한 덩어리로 칠하면 음영이 아니라 사각형으로 보인다.
   * 그림자와 빛은 반드시 이걸로 그린다.
   */
  function fade(ctx, x, y, w, h, color, from, to, steps, vertical) {
    const n = steps || 6;
    for (let i = 0; i < n; i += 1) {
      const d = from + (to - from) * (n === 1 ? 0 : i / (n - 1));
      if (vertical) {
        const bh = Math.round((h / n) * (i + 1)) - Math.round((h / n) * i);
        dither(ctx, x, y + Math.round((h / n) * i), w, bh, color, d);
      } else {
        const bw = Math.round((w / n) * (i + 1)) - Math.round((w / n) * i);
        dither(ctx, x + Math.round((w / n) * i), y, bw, h, color, d);
      }
    }
  }

  /** 등불처럼 가운데가 밝고 밖으로 옅어지는 빛. 중첩 사각형으로 만든다. */
  function glow(ctx, cx, cy, rx, ry, color, peak, steps) {
    const n = steps || 5;
    for (let i = n; i >= 1; i -= 1) {
      const t = i / n;
      const d = peak * Math.pow(1 - t, 1.4);
      if (d <= 0.02) continue;
      dither(
        ctx,
        Math.round(cx - rx * t),
        Math.round(cy - ry * t),
        Math.round(rx * t * 2),
        Math.round(ry * t * 2),
        color,
        d
      );
    }
    dither(ctx, Math.round(cx - rx * 0.3), Math.round(cy - ry * 0.3),
      Math.round(rx * 0.6), Math.round(ry * 0.6), color, peak);
  }

  /** 모서리를 1px 깎은 사각형. 픽셀 아트에서 둥근 모서리를 대신한다. */
  function chamfer(ctx, x, y, w, h, color, cut) {
    const c = cut === undefined ? 2 : cut;
    ctx.fillStyle = color;
    ctx.fillRect(x + c, y, w - c * 2, h);
    ctx.fillRect(x, y + c, c, h - c * 2);
    ctx.fillRect(x + w - c, y + c, c, h - c * 2);
    for (let i = 0; i < c; i += 1) {
      const inset = c - i - 1;
      ctx.fillRect(x + inset, y + i, c - inset, 1);
      ctx.fillRect(x + w - c, y + i, c - inset, 1);
      ctx.fillRect(x + inset, y + h - 1 - i, c - inset, 1);
      ctx.fillRect(x + w - c, y + h - 1 - i, c - inset, 1);
    }
  }

  /** HUD·대화창이 쓰는 공통 패널. 참고 목업의 UI 언어를 따른다. */
  function panel(ctx, x, y, w, h) {
    chamfer(ctx, x, y, w, h, PAL.panelEdge, 3);
    chamfer(ctx, x + 1, y + 1, w - 2, h - 2, PAL.panel, 3);
    // 왼쪽 위 광원
    px(ctx, x + 3, y + 1, w - 6, 1, PAL.panelLit);
    px(ctx, x + 1, y + 3, 1, h - 6, PAL.panelLit);
  }

  // ── 텍스트 ──────────────────────────────────────────────────────
  const cache = new Map();
  const textLayers = new WeakMap();
  let measure = null;

  function measureCtx() {
    if (!measure) {
      const c = document.createElement("canvas");
      c.width = 8;
      c.height = 8;
      measure = c.getContext("2d");
    }
    return measure;
  }

  /**
   * 글자를 도트로 만든다.
   * 알파 임계값은 눈으로 맞춘 값이다. 낮추면 획이 뭉치고, 높이면 끊어진다.
   */
  function glyphs(str, size, color, weight) {
    const key = size + "|" + weight + "|" + color + "|" + str;
    const hit = cache.get(key);
    if (hit) return hit;

    const font = weight + " " + size + "px " + FONT;
    const m = measureCtx();
    m.font = font;
    const w = Math.max(1, Math.ceil(m.measureText(str).width) + 2);
    const h = Math.ceil(size * 1.45) + 2;

    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.font = font;
    g.textBaseline = "top";
    g.fillStyle = "#FFFFFF";
    g.fillText(str, 1, 1);

    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i + 3] = d[i + 3] > 118 ? 255 : 0;
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);

    cache.set(key, c);
    return c;
  }

  /** 1비트 픽셀 글씨. 로고처럼 의도적으로 뭉툭한 글자에만 쓴다. */
  function pixelText(ctx, str, x, y, opts) {
    const o = opts || {};
    const size = o.size || 11;
    const color = o.color || PAL.cream;
    const weight = o.weight || "500";
    const sprite = glyphs(str, size, color, weight);
    let left = x;
    if (o.align === "center") left = x - Math.round(sprite.width / 2);
    else if (o.align === "right") left = x - sprite.width;
    left = left | 0;
    const top = o.boxHeight === undefined
      ? y | 0
      : Math.round(y + (o.boxHeight - sprite.height) / 2);

    ctx.save();
    if (o.angle) {
      const originX = o.rotateX === undefined ? x : o.rotateX;
      const originY = o.rotateY === undefined ? y : o.rotateY;
      ctx.translate(originX, originY);
      ctx.rotate(o.angle);
      ctx.translate(-originX, -originY);
    }
    ctx.imageSmoothingEnabled = false;
    if (o.outline) {
      const ring = glyphs(str, size, o.outline, weight);
      ctx.drawImage(ring, left - 1, top);
      ctx.drawImage(ring, left + 1, top);
      ctx.drawImage(ring, left, top - 1);
      ctx.drawImage(ring, left, top + 1);
    }
    ctx.drawImage(sprite, left, top);
    ctx.restore();
    return sprite.width;
  }

  /** 배경과 별도인 3배 해상도 레이어에 UI 글씨를 선명하게 그린다. */
  function crispText(layer, str, x, y, opts) {
    const o = opts || {};
    const size = o.size || 11;
    const color = o.color || PAL.cream;
    const weight = o.weight || "500";
    const g = layer.ctx;

    g.save();
    if (o.angle) {
      const originX = o.rotateX === undefined ? x : o.rotateX;
      const originY = o.rotateY === undefined ? y : o.rotateY;
      g.translate(originX, originY);
      g.rotate(o.angle);
      g.translate(-originX, -originY);
    }
    g.font = weight + " " + size + "px " + FONT;
    g.textBaseline = "alphabetic";
    g.textAlign = o.align || "left";
    g.lineJoin = "miter";
    g.miterLimit = 2;
    const metrics = g.measureText(str);
    const ascent = metrics.actualBoundingBoxAscent || size * 0.8;
    const descent = metrics.actualBoundingBoxDescent || size * 0.2;
    const baseline = o.boxHeight === undefined
      ? y + ascent
      : y + (o.boxHeight - ascent - descent) / 2 + ascent;
    if (o.outline) {
      g.strokeStyle = o.outline;
      g.lineWidth = o.outlineWidth || 0.9;
      g.strokeText(str, x, baseline);
    }
    g.fillStyle = color;
    g.fillText(str, x, baseline);
    const width = metrics.width;
    g.restore();
    return width;
  }

  /**
   * boxHeight를 주면 글자의 실제 획 영역을 그 높이 안에 수직 중앙 정렬한다.
   * 기본 mode는 "crisp". 기존 1비트 글씨가 필요한 곳만 mode: "pixel"을 쓴다.
   */
  function text(ctx, str, x, y, opts) {
    const o = opts || {};
    const layer = textLayers.get(ctx);
    if (layer && o.mode !== "pixel") return crispText(layer, str, x, y, o);
    return pixelText(ctx, str, x, y, o);
  }

  function textWidth(str, size, weight) {
    const m = measureCtx();
    m.font = (weight || "500") + " " + (size || 11) + "px " + FONT;
    return m.measureText(str).width;
  }

  // ── 마운트와 정수배 확대 ─────────────────────────────────────────
  function ensureStyle() {
    if (document.getElementById("pixelscreen-style")) return;
    const s = document.createElement("style");
    s.id = "pixelscreen-style";
    s.textContent = [
      ".pxscreen{position:relative;margin:0 auto;line-height:0;",
      "background:#14100D;box-shadow:0 0 0 1px #14100D;}",
      ".pxscreen canvas{display:block;width:100%;height:100%;",
      "image-rendering:pixelated;image-rendering:crisp-edges;}",
      ".pxscreen .px-text{position:absolute;inset:0;pointer-events:none;",
      "image-rendering:auto;}",
      ".pxscreen .px-hits{position:absolute;inset:0;line-height:normal;}",
      ".pxscreen .px-hit{position:absolute;margin:0;padding:0;border:0;",
      "background:none;cursor:pointer;border-radius:0;outline:none;",
      "-webkit-appearance:none;appearance:none;}",
      ".pxscreen .px-hit:hover:not(:disabled){background:none;}",
      ".pxscreen .px-hit[disabled]{cursor:default;}",
      ".pxscreen .px-sr{position:absolute;width:1px;height:1px;overflow:hidden;",
      "clip:rect(0 0 0 0);white-space:nowrap;}",
    ].join("");
    document.head.appendChild(s);
  }

  function mount(container, options) {
    ensureStyle();
    const opt = options || {};
    // 화면을 자식이 아니라 창 기준으로 잰다. 부모가 flex 라 자식 크기에 맞춰
    // 줄어들면 clientWidth 가 0 이 되고 배율이 1 로 잠긴다(실제로 겪음).
    const reserveW = opt.reserveWidth === undefined ? 24 : opt.reserveWidth;
    const reserveH = opt.reserveHeight === undefined ? 24 : opt.reserveHeight;

    const root = document.createElement("div");
    root.className = "pxscreen";

    const canvas = document.createElement("canvas");
    canvas.className = "px-art";
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute("role", "presentation");

    const textCanvas = document.createElement("canvas");
    textCanvas.className = "px-text";
    textCanvas.width = W * TEXT_SCALE;
    textCanvas.height = H * TEXT_SCALE;
    textCanvas.setAttribute("aria-hidden", "true");

    const hits = document.createElement("div");
    hits.className = "px-hits";

    const live = document.createElement("p");
    live.className = "px-sr";
    live.setAttribute("role", "status");

    root.appendChild(canvas);
    root.appendChild(textCanvas);
    root.appendChild(hits);
    root.appendChild(live);
    container.appendChild(root);

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    const textCtx = textCanvas.getContext("2d");
    textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
    textLayers.set(ctx, { canvas: textCanvas, ctx: textCtx });

    function fit() {
      const availW = window.innerWidth - reserveW;
      const availH = window.innerHeight - reserveH;
      let scale = Math.min(availW / W, availH / H);
      scale = Math.max(1, Math.min(MAX_SCALE, Math.floor(scale)));
      root.style.width = W * scale + "px";
      root.style.height = H * scale + "px";
    }

    fit();
    window.addEventListener("resize", fit);

    /** 핫스팟은 캔버스 좌표로 넣고 % 로 배치한다. 배율이 바뀌어도 따라온다. */
    function hotspot(x, y, w, h, opts) {
      const o = opts || {};
      const el = document.createElement("button");
      el.type = "button";
      el.className = "px-hit";
      el.style.left = (x / W) * 100 + "%";
      el.style.top = (y / H) * 100 + "%";
      el.style.width = (w / W) * 100 + "%";
      el.style.height = (h / H) * 100 + "%";
      if (o.label) el.setAttribute("aria-label", o.label);
      if (o.disabled) el.disabled = true;
      if (o.onClick) el.addEventListener("click", o.onClick);
      hits.appendChild(el);
      return el;
    }

    return {
      root,
      canvas,
      ctx,
      textCanvas,
      textCtx,
      hits,
      fit,
      hotspot,
      clearHotspots() {
        hits.textContent = "";
      },
      clearText() {
        textCtx.save();
        textCtx.setTransform(1, 0, 0, 1, 0, 0);
        textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
        textCtx.restore();
      },
      say(message) {
        live.textContent = message;
      },
    };
  }

  window.PixelScreen = Object.freeze({
    W,
    H,
    TEXT_SCALE,
    PAL,
    FONT,
    mount,
    px,
    dither,
    fade,
    glow,
    chamfer,
    panel,
    text,
    pixelText,
    textWidth,
  });
})();
