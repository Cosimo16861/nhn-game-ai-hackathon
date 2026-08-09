/**
 * 복원 작업대 표현 계층.
 * 실제 그림 엔진과 채점은 연결하지 않는다. 화면 속 모든 조작물은 책상 위 사물이다.
 */
(function () {
  "use strict";

  const P = window.PixelScreen;
  const C = P.PAL;
  /**
   * 도구 슬롯 다섯 개. icon 은 책상 위 사물의 생김새, tool·size 는 엔진에 보내는 값이다.
   * 고해상도 복원은 view.tools 로 16·36·72px 붓을 넣어 이 기본값을 대체한다
   * (RESTORATION_QUEST_SPEC 3.3 — 1px 붓·픽셀 격자는 쓰지 않는다).
   */
  const TOOLS = [
    { id: "pencil", icon: "pencil", label: "연필 · 1픽셀", tool: "pencil", size: 1 },
    { id: "brush", icon: "brush", label: "가는 붓 · 2픽셀", tool: "brush", size: 2 },
    { id: "broad", icon: "broad", label: "넓은 붓 · 3픽셀", tool: "brush", size: 3 },
    { id: "fill", icon: "fill", label: "물감 채우기", tool: "fill", size: 1 },
    { id: "eraser", icon: "eraser", label: "지우개", tool: "eraser", size: 1 },
  ];

  function toolsOf(view) {
    return (view && Array.isArray(view.tools) && view.tools.length) ? view.tools : TOOLS;
  }

  function isToolSelected(view, tool) {
    if (view.activeTool !== tool.tool) return false;
    return tool.size == null || Number(view.brushSize) === Number(tool.size);
  }
  const TOOL_X0 = 494;
  const TOOL_PITCH = 25;
  const DEFAULT_VIEW = Object.freeze({
    title: "복원 기록",
    quotes: [
      { speaker: "기록", text: "증언에서 확인한 특징을 캔버스에 복원한다." },
      { speaker: "관찰", text: "색과 도구를 골라 남은 형상을 천천히 채운다." },
    ],
    visibleHintCount: 2,
    showBackButton: true,
    palette: [
      { name: "먹색", hex: "#302A26" },
      { name: "종이색", hex: "#D9CDB5" },
      { name: "황토색", hex: "#C79A4A" },
      { name: "청록색", hex: "#4A7471" },
      { name: "적갈색", hex: "#A05C43" },
      { name: "회청색", hex: "#72888D" },
    ],
    activeColor: "#4A7471",
    activeTool: "brush",
    brushSize: 2,
    canUndo: false,
    canRedo: false,
    isSubmitting: false,
    feedback: "",
  });

  function rect(ctx, x, y, w, h, color) { P.px(ctx, x, y, w, h, color); }

  function line(ctx, x1, y1, x2, y2, color, width) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function polygon(ctx, points, fill, stroke, width) {
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
    ctx.restore();
  }

  /** 중심·크기·회전각으로 네 각이 정확히 90도인 직사각형을 만든다. */
  function rotatedRectPoints(cx, cy, width, height, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2],
    ].map(([x, y]) => [
      cx + x * cos - y * sin,
      cy + x * sin + y * cos,
    ]);
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke, width) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke(); }
    ctx.restore();
  }

  function drawDesk(ctx) {
    rect(ctx, 0, 0, 640, 24, C.wallDark);
    rect(ctx, 0, 17, 640, 7, C.moldingDark);
    rect(ctx, 0, 18, 640, 2, C.moldingLit);
    rect(ctx, 0, 24, 640, 360, C.deskTop);
    rect(ctx, 0, 24, 640, 3, C.deskLit);
    rect(ctx, 0, 378, 640, 6, C.deskEdge);

    // 굵고 드문 나뭇결. 1px 산개 노이즈는 쓰지 않는다.
    const grains = [
      [4, 43, 142, 2], [33, 88, 108, 3], [6, 331, 137, 2],
      [482, 47, 146, 2], [496, 221, 121, 3], [478, 357, 150, 2],
      [161, 367, 309, 2], [157, 31, 324, 2],
    ];
    grains.forEach((g, i) => rect(ctx, g[0], g[1], g[2], g[3], i % 2 ? C.deskDark : C.deskGrain));
    [118, 246, 318].forEach((y) => {
      rect(ctx, 0, y, 640, 2, C.deskDark);
      rect(ctx, 0, y + 2, 640, 1, C.deskLit);
    });

  }

  /**
   * 저녁 조명 레이어처럼 화면 위에 얹는 반투명 광량 맵.
   * 타원 안은 은은한 황색, 가장자리는 아주 얕은 청남색으로 눌러 중앙 캔버스를 모은다.
   */
  function drawCanvasLighting(ctx) {
    ctx.save();
    ctx.translate(320, 178);
    ctx.scale(1, 0.72);
    ctx.translate(-320, -178);

    // 광원과 암부 사이에 중립 구간을 두어 팔레트 색은 유지하고 끝부분만 확실히 누른다.
    const lightingMap = ctx.createRadialGradient(320, 178, 18, 320, 178, 315);
    lightingMap.addColorStop(0, "rgba(252, 218, 135, 0.12)");
    lightingMap.addColorStop(0.34, "rgba(246, 205, 113, 0.07)");
    lightingMap.addColorStop(0.53, "rgba(236, 194, 104, 0.01)");
    lightingMap.addColorStop(0.68, "rgba(25, 31, 49, 0.11)");
    lightingMap.addColorStop(0.84, "rgba(18, 28, 58, 0.23)");
    lightingMap.addColorStop(1, "rgba(13, 20, 39, 0.36)");
    ctx.fillStyle = lightingMap;
    ctx.fillRect(-40, -110, 720, 570);

    ctx.restore();
  }

  function drawEvidenceNotes(ctx, view) {
    // 큰 사건 서류 없이 목격자별 메모지만 책상 위에 직접 붙인다.
    const quotes = (view.quotes || []).slice(0, view.visibleHintCount || 2);
    quotes.forEach((quote, index) => drawMemoSlip(ctx, quote, index));
  }

  function drawMemoSlip(ctx, quote, index) {
    const layouts = [
      { cx: 84, cy: 91, width: 120, height: 66, angle: -3 * Math.PI / 180 },
      { cx: 84, cy: 163, width: 118, height: 66, angle: 4 * Math.PI / 180 },
      { cx: 84, cy: 235, width: 120, height: 66, angle: -2 * Math.PI / 180 },
    ];
    const first = index === 0;
    const memo = layouts[index] || layouts[layouts.length - 1];
    const points = rotatedRectPoints(
      memo.cx, memo.cy, memo.width, memo.height, memo.angle
    );
    const shadowPoints = points.map((point) => [point[0] + 3, point[1] + 4]);
    polygon(ctx, shadowPoints, C.shadow, null);
    polygon(ctx, points, first ? C.paper : C.cream, C.inkSoft, 1);
    const textRotation = {
      angle: memo.angle,
      rotateX: memo.cx,
      rotateY: memo.cy,
    };

    // 서로 다른 테이프 방향과 색으로 급히 붙인 메모의 어수선함을 만든다.
    if (index % 2 === 0) {
      polygon(ctx, rotatedRectPoints(
        memo.cx, memo.cy - memo.height / 2, 24, 7, memo.angle
      ), C.goldDim, C.inkSoft, 1);
    } else {
      polygon(ctx, rotatedRectPoints(
        memo.cx + 34, memo.cy - memo.height / 2 + 1, 20, 7, memo.angle
      ), C.teal, C.inkSoft, 1);
    }

    const top = memo.cy - memo.height / 2 + 9;
    const left = memo.cx - memo.width / 2 + 10;
    ctx.save();
    ctx.translate(textRotation.rotateX, textRotation.rotateY);
    ctx.rotate(memo.angle);
    ctx.translate(-textRotation.rotateX, -textRotation.rotateY);
    rect(ctx, left - 4, top + 1, 3, 11, first ? C.gold : C.teal);
    ctx.restore();
    P.text(ctx, quote.speaker || "기록", left + 3, top - 1, {
      size: 9.5, weight: "700", color: C.ink, boxHeight: 14,
      angle: textRotation.angle, rotateX: textRotation.rotateX, rotateY: textRotation.rotateY,
    });
    const lines = wrapText(quote.text || "", memo.width - 22, 9.5, "500").slice(0, 3);
    lines.forEach((value, lineIndex) => P.text(ctx, value, left, top + 16 + lineIndex * 12, {
      size: 9.5, weight: "500", color: C.inkSoft, boxHeight: 11,
      angle: textRotation.angle, rotateX: textRotation.rotateX, rotateY: textRotation.rotateY,
    }));
  }

  function wrapText(value, maxWidth, size, weight) {
    // 한글은 공백 단위로만 자르면 긴 어절 하나가 종이 밖으로 나간다.
    const units = typeof Intl !== "undefined" && Intl.Segmenter
      ? Array.from(new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(String(value)), (x) => x.segment)
      : Array.from(String(value));
    const lines = [];
    let lineValue = "";
    units.forEach((unit) => {
      const candidate = lineValue + unit;
      if (lineValue && P.textWidth(candidate, size, weight) > maxWidth) {
        lines.push(lineValue.trimEnd());
        lineValue = unit.trimStart();
      } else lineValue = candidate;
    });
    if (lineValue) lines.push(lineValue.trimEnd());
    return lines;
  }

  function drawCanvas(ctx, view, artwork) {
    // 프레임 그림자
    rect(ctx, 174, 31, 302, 312, C.shadow);
    rect(ctx, 166, 23, 306, 318, C.ink);
    rect(ctx, 169, 26, 300, 312, C.frameDark);
    rect(ctx, 173, 30, 292, 304, C.frameLit);
    rect(ctx, 177, 34, 284, 296, C.frame);
    rect(ctx, 180, 37, 278, 290, C.inkSoft);
    rect(ctx, 183, 40, 272, 284, "#E7E0CE");
    rect(ctx, 186, 43, 266, 278, "#DCD6C5");
    rect(ctx, 188, 45, 262, 274, "#E8E3D5");

    // 천 결은 넓은 4px 단위로만 아주 약하게.
    for (let y = 49; y < 317; y += 16) rect(ctx, 190, y, 258, 1, "#D7D1C2");
    for (let x = 194; x < 449; x += 20) rect(ctx, x, 47, 1, 268, "#DED8C9");

    if (artwork && artwork.width && artwork.height) {
      const area = { x: 188, y: 45, w: 262, h: 274 };
      const sw = artwork.width || 1;
      const sh = artwork.height || 1;
      const scale = Math.min(area.w / sw, area.h / sh);
      const dw = Math.max(1, Math.round(sw * scale));
      const dh = Math.max(1, Math.round(sh * scale));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.w, area.h);
      ctx.clip();
      ctx.drawImage(
        artwork,
        Math.round(area.x + (area.w - dw) / 2),
        Math.round(area.y + (area.h - dh) / 2),
        dw,
        dh
      );
      ctx.restore();
    } else if (!view.externalArtwork) {
      drawNeutralStudy(ctx);
    }
    // externalArtwork 일 때는 그림을 DOM 캔버스가 직접 그린다.
    // 그 아래에는 빈 종이만 남겨 중립 선화가 비쳐 보이지 않게 한다.

    // 붓 크기 고스트는 실제 포인터 연결 단계에서 포인터 좌표에 표시한다.
  }

  function drawNeutralStudy(ctx) {
    // 미완성임이 명확한 중립 선화: 답안 이미지가 아니다.
    rect(ctx, 247, 89, 145, 3, C.paperLine);
    line(ctx, 274, 107, 255, 277, C.paperLine, 2);
    line(ctx, 367, 108, 390, 278, C.paperLine, 2);
    ellipse(ctx, 321, 157, 52, 66, null, C.creamDim, 3);
    line(ctx, 287, 147, 307, 140, C.inkSoft, 2);
    line(ctx, 335, 140, 355, 147, C.inkSoft, 2);
    rect(ctx, 294, 151, 14, 3, C.teal);
    rect(ctx, 336, 151, 14, 3, C.teal);
    line(ctx, 322, 158, 316, 181, C.inkSoft, 2);
    line(ctx, 316, 181, 326, 181, C.inkSoft, 2);
    line(ctx, 305, 199, 336, 199, C.terracotta, 2);
    line(ctx, 271, 229, 240, 293, C.creamDim, 3);
    line(ctx, 370, 229, 401, 293, C.creamDim, 3);
    rect(ctx, 242, 292, 157, 3, C.paperLine);
    // 일부만 칠해진 복원 조각
    rect(ctx, 272, 113, 16, 12, C.teal);
    rect(ctx, 360, 113, 12, 10, C.teal);
    rect(ctx, 256, 262, 24, 28, C.terracotta);
    rect(ctx, 371, 260, 19, 31, C.terracotta);
  }

  function drawPalette(ctx, view, focusKey) {
    // 손에 드는 나무 팔레트
    ellipse(ctx, 555, 156, 72, 71, C.shadow, null);
    ellipse(ctx, 551, 151, 70, 70, C.ink, null);
    ellipse(ctx, 551, 149, 67, 67, C.frameLit, null);
    ellipse(ctx, 551, 149, 62, 62, C.deskLit, null);
    ellipse(ctx, 571, 167, 13, 17, C.inkSoft, C.ink, 2);
    ellipse(ctx, 570, 164, 9, 12, C.deskDark, null);
    line(ctx, 508, 104, 541, 91, C.creamDim, 2);

    const colors = (view.palette || []).slice(0, 8);
    const positions = [[517,111],[548,99],[581,110],[600,139],[599,178],[548,201],[512,182],[501,145]];
    colors.forEach((entry, i) => {
      const p = positions[i];
      const active = entry.hex.toLowerCase() === String(view.activeColor || "").toLowerCase();
      if (active) ellipse(ctx, p[0], p[1] - 2, 13, 13, C.gold, C.ink, 2);
      ellipse(ctx, p[0], p[1] - (active ? 2 : 0), active ? 9 : 10, active ? 9 : 10, entry.hex, C.ink, 2);
      rect(ctx, p[0] - 3, p[1] - 6 - (active ? 2 : 0), 5, 3, "#F2E4C8");
      if (focusKey === "color-" + i) dottedFocus(ctx, p[0] - 15, p[1] - 15, 30, 30);
    });
  }

  function drawTools(ctx, view, focusKey) {
    rect(ctx, 483, 239, 145, 101, C.shadow);
    rect(ctx, 479, 235, 145, 101, C.ink);
    rect(ctx, 482, 238, 139, 95, C.deskDark);
    rect(ctx, 486, 242, 131, 87, C.frameDark);
    rect(ctx, 488, 244, 127, 83, C.deskTop);
    toolsOf(view).forEach((tool, i) => {
      const x = TOOL_X0 + i * TOOL_PITCH;
      const selected = isToolSelected(view, tool);
      const lift = selected ? -3 : 0;
      if (selected) {
        P.chamfer(ctx, x - 4, 260, 25, 60, C.goldDim, 3);
        P.chamfer(ctx, x - 2, 258, 21, 58, C.brass, 3);
      }
      drawTool(ctx, tool.icon || tool.id, x, 267 + lift, view.activeColor);
      if (focusKey === "tool-" + i) dottedFocus(ctx, x - 4, 255, 25, 68);
    });
  }

  function drawTool(ctx, id, x, y, activeColor) {
    if (id === "pencil") {
      polygon(ctx, [[x+5,y],[x+11,y],[x+11,y+42],[x+8,y+50],[x+5,y+42]], C.gold, C.ink, 2);
      rect(ctx, x+7, y+5, 2, 34, C.cream);
      polygon(ctx, [[x+5,y+42],[x+11,y+42],[x+8,y+50]], C.paperBack, C.ink, 1);
    } else if (id === "brush" || id === "broad") {
      const wide = id === "broad";
      rect(ctx, x + (wide ? 4 : 6), y, wide ? 10 : 6, 15, C.ink);
      polygon(ctx, [[x+(wide?5:7),y+1],[x+(wide?13:11),y+1],[x+(wide?12:10),y+12],[x+(wide?6:8),y+12]], activeColor || C.teal, null);
      rect(ctx, x + (wide ? 5 : 7), y + 14, wide ? 8 : 4, 6, C.brass);
      rect(ctx, x + (wide ? 7 : 8), y + 20, wide ? 4 : 2, 31, C.creamDim);
      rect(ctx, x + (wide ? 7 : 8), y + 46, wide ? 4 : 2, 5, C.inkSoft);
    } else if (id === "fill") {
      rect(ctx, x+2, y+15, 16, 28, C.ink);
      P.chamfer(ctx, x+4, y+17, 12, 24, C.teal, 2);
      rect(ctx, x+6, y+10, 8, 8, C.brassDark);
      rect(ctx, x+8, y+6, 4, 5, C.brassLit);
      rect(ctx, x+6, y+27, 8, 4, C.cream);
    } else if (id === "eraser") {
      // 낡은 천으로 반쯤 감싼 고무 지우개. 병과 혼동되지 않는 낮고 각진 실루엣.
      P.chamfer(ctx, x + 1, y + 17, 20, 29, C.ink, 3);
      P.chamfer(ctx, x + 3, y + 19, 16, 25, C.terracotta, 2);
      rect(ctx, x + 4, y + 20, 14, 8, C.paperBack);
      rect(ctx, x + 4, y + 28, 14, 3, C.creamDim);
      rect(ctx, x + 5, y + 31, 12, 11, C.paper);
      line(ctx, x + 5, y + 34, x + 16, y + 38, C.paperLine, 2);
      rect(ctx, x + 5, y + 42, 2, 4, C.paperEdge);
      rect(ctx, x + 10, y + 42, 2, 5, C.paperEdge);
      rect(ctx, x + 15, y + 42, 2, 4, C.paperEdge);
    }
  }

  function drawActions(ctx, view, focusKey) {
    // 캔버스 받침 아래의 서로 다른 물건들. 툴바처럼 균일하게 만들지 않는다.
    rect(ctx, 164, 344, 308, 32, C.shadow);
    rect(ctx, 168, 340, 300, 32, C.ink);
    rect(ctx, 171, 343, 294, 26, C.frameDark);
    rect(ctx, 174, 345, 288, 21, C.deskLit);

    drawMetalTag(ctx, 181, 348, 42, 15, "되감기", view.canUndo, focusKey === "undo");
    drawMetalTag(ctx, 229, 348, 42, 15, "다시", view.canRedo, focusKey === "redo");
    drawMetalTag(ctx, 278, 348, 39, 15, "새 종이", true, focusKey === "reset");
    rect(ctx, 327, 350, 123, 12, C.brassDark);
    rect(ctx, 330, 348, 117, 12, C.brass);
    if (view.zoom) {
      // 확대는 20% 단계. 표시 배율만 바뀌고 내부 1254 좌표계는 그대로다.
      P.text(ctx, "−", 337, 347, { align: "center", size: 11, weight: "800", color: C.ink, boxHeight: 13 });
      P.text(ctx, Math.round(view.zoom * 100) + "%", 388, 347, {
        align: "center", size: 9, weight: "700", color: C.ink, boxHeight: 13,
      });
      P.text(ctx, "＋", 439, 347, { align: "center", size: 11, weight: "800", color: C.ink, boxHeight: 13 });
      if (focusKey === "zoom-out") dottedFocus(ctx, 328, 346, 22, 17);
      if (focusKey === "zoom-in") dottedFocus(ctx, 428, 346, 22, 17);
    } else {
      P.text(ctx, "미완성 복원화", 388, 347, { align: "center", size: 9, weight: "700", color: C.ink, boxHeight: 13 });
    }

    // 제출은 별도 봉투와 붉은 밀랍 인장
    polygon(ctx, [[491,336],[620,336],[616,373],[487,373]], C.paper, C.ink, 2);
    line(ctx, 490, 338, 552, 361, C.paperLine, 2);
    line(ctx, 618, 338, 556, 361, C.paperLine, 2);
    ellipse(ctx, 555, 355, 17, 15, C.pinRed, C.ink, 2);
    ellipse(ctx, 555, 355, 11, 9, C.terracotta, null);
    P.text(ctx, view.isSubmitting ? "봉인 중" : "제출", 555, 348, {
      align: "center", size: 9, weight: "800", color: C.cream, boxHeight: 15,
    });
    if (focusKey === "submit") dottedFocus(ctx, 483, 332, 141, 45);

    if (view.feedback) {
      P.chamfer(ctx, 18, 283, 137, 24, C.panelEdge, 3);
      P.chamfer(ctx, 20, 285, 133, 20, C.panel, 2);
      P.text(ctx, view.feedback, 86, 285, {
        align: "center", size: 9.5, weight: "600", color: C.cream, boxHeight: 20,
      });
    }
  }

  function drawBoardReturn(ctx, focusKey) {
    // 기존 표찰의 약 60%. 중심 (60, 349)에 황동 화살표 하나만 둔다.
    P.chamfer(ctx, 39, 339, 50, 28, C.shadow, 3);
    P.chamfer(ctx, 35, 335, 50, 28, C.ink, 3);
    P.chamfer(ctx, 37, 337, 46, 24, C.frameDark, 2);
    P.chamfer(ctx, 39, 339, 42, 20, C.corkDeep, 2);
    rect(ctx, 42, 340, 36, 2, C.corkLight);
    rect(ctx, 42, 356, 36, 2, C.corkShade);

    polygon(ctx, [[47,349],[55,342],[55,346],[72,346],[72,352],[55,352],[55,356]], C.gold, C.ink, 1);
    if (focusKey === "back-to-board") dottedFocus(ctx, 32, 332, 56, 34);
  }

  function drawMetalTag(ctx, x, y, w, h, label, enabled, focused) {
    P.chamfer(ctx, x, y, w, h, enabled ? C.ink : C.panelEdge, 2);
    P.chamfer(ctx, x + 1, y + 1, w - 2, h - 2, enabled ? C.glass : C.panelLit, 2);
    rect(ctx, x + 3, y + 2, w - 6, 2, enabled ? C.fogNear : C.inkSoft);
    P.text(ctx, label, x + w / 2, y, {
      align: "center", size: 9, weight: "700", color: enabled ? C.ink : C.creamDim, boxHeight: h,
    });
    if (focused) dottedFocus(ctx, x - 2, y - 2, w + 4, h + 4);
  }

  function dottedFocus(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
  }

  function drawPointer(ctx, x, y, direction) {
    const points = direction === "down"
      ? [[x - 5, y - 7], [x + 5, y - 7], [x, y]]
      : [[x - 7, y - 5], [x - 7, y + 5], [x, y]];
    polygon(ctx, points, C.gold, C.ink, 1);
  }

  function mount(container, options) {
    const opt = options || {};
    const screen = P.mount(container, {
      reserveWidth: opt.reserveWidth,
      reserveHeight: opt.reserveHeight,
    });
    let current = Object.assign({}, DEFAULT_VIEW);
    let artwork = null;
    let focusedKey = "";
    let hoveredKey = "";
    const listeners = [];

    function emit(action, announcement) {
      if (action.type === "select-color") current.activeColor = action.hex;
      if (action.type === "select-tool") {
        current.activeTool = action.tool;
        current.brushSize = action.size;
      }
      draw();
      if (announcement) screen.say(announcement);
      if (opt.onAction) opt.onAction(action);
    }

    function addHit(key, x, y, w, h, label, action, disabled) {
      const el = screen.hotspot(x, y, w, h, {
        label,
        disabled,
        onClick: () => emit(action, label),
      });
      const onFocus = () => { focusedKey = key; draw(); };
      const onBlur = () => { focusedKey = ""; draw(); };
      const onEnter = () => { hoveredKey = key; draw(); };
      const onLeave = () => { hoveredKey = ""; draw(); };
      el.addEventListener("focus", onFocus);
      el.addEventListener("blur", onBlur);
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      listeners.push(
        [el, "focus", onFocus],
        [el, "blur", onBlur],
        [el, "mouseenter", onEnter],
        [el, "mouseleave", onLeave],
      );
    }

    function rebuildHotspots() {
      screen.clearHotspots();
      listeners.length = 0;
      const positions = [[517,111],[548,99],[581,110],[600,139],[599,178],[548,201],[512,182],[501,145]];
      (current.palette || []).slice(0, 8).forEach((entry, i) => addHit(
        "color-" + i, positions[i][0] - 14, positions[i][1] - 14, 28, 28,
        entry.name + " 물감 선택", { type: "select-color", hex: entry.hex }, false
      ));
      toolsOf(current).forEach((tool, i) => addHit(
        "tool-" + i, TOOL_X0 - 4 + i * TOOL_PITCH, 255, 25, 68, tool.label + " 선택",
        { type: "select-tool", tool: tool.tool, size: tool.size }, false
      ));
      addHit("undo", 179, 345, 46, 21, "되감기", { type: "undo" }, !current.canUndo);
      addHit("redo", 227, 345, 46, 21, "다시 실행", { type: "redo" }, !current.canRedo);
      addHit("reset", 276, 345, 43, 21, "새 종이로 초기화", { type: "reset" }, false);
      if (current.zoom) {
        addHit("zoom-out", 328, 346, 22, 17, "축소", { type: "zoom-out" }, false);
        addHit("zoom-in", 428, 346, 22, 17, "확대", { type: "zoom-in" }, false);
      }
      addHit("submit", 483, 332, 141, 45, "복원 기록 제출", { type: "submit" }, !!current.isSubmitting);
      if (current.showBackButton) {
        addHit(
          "back-to-board", 32, 332, 56, 34,
          "증거판으로 돌아가기", { type: "back-to-board" }, false
        );
      }
    }

    function draw() {
      const ctx = screen.ctx;
      const focusKey = hoveredKey || focusedKey;
      ctx.clearRect(0, 0, P.W, P.H);
      screen.clearText();
      drawDesk(ctx);
      drawEvidenceNotes(ctx, current);
      drawCanvas(ctx, current, artwork);
      drawPalette(ctx, current, focusKey);
      drawTools(ctx, current, focusKey);
      drawActions(ctx, current, focusKey);
      if (current.showBackButton) drawBoardReturn(ctx, focusKey);
      if (focusKey.startsWith("color-")) {
        const colorIndex = Number(focusKey.slice(6));
        const positions = [[517,111],[548,99],[581,110],[600,139],[599,178],[548,201],[512,182],[501,145]];
        const point = positions[colorIndex];
        if (point) drawPointer(ctx, point[0] - 16, point[1], "right");
      }
      if (focusKey.startsWith("tool-")) {
        const toolIndex = Number(focusKey.slice(5));
        drawPointer(ctx, TOOL_X0 + toolIndex * TOOL_PITCH + 8, 257, "down");
      }
      drawCanvasLighting(ctx);
    }

    function render(view) {
      current = Object.assign({}, DEFAULT_VIEW, current, view || {});
      rebuildHotspots();
      draw();
    }

    return {
      render,
      setArtwork(source) { artwork = source || null; draw(); },
      screen,
      destroy() {
        listeners.forEach((item) => item[0].removeEventListener(item[1], item[2]));
        window.removeEventListener("resize", screen.fit);
        screen.root.remove();
      },
    };
  }

  window.Workbench = Object.freeze({ mount });
})();
