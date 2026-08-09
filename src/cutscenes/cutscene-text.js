/**
 * 컷신 공통 텍스트 계층 — 대화 상자, 화자 이름표, 타자 효과.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 5.1
 *
 * 검토본 7개가 같은 코드를 복사해 갖고 있던 부분이다. 시각 회귀를 막기 위해
 * 좌표·글꼴·줄바꿈 규칙을 dev/cutscenes/cutscene-review-l0-l1.js 에서 그대로 옮겼다.
 */
(function (global) {
  "use strict";

  const TEXT_SCALE = 3;
  const TYPE_MS = 34;
  const BOX = Object.freeze({ x: 152, y: 278, w: 336, h: 84 });

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
    tealText: "#9BC0B6",
    rust: "#A05C43",
    rustText: "#D28B73",
    paper: "#D9CDB5",
    paperDark: "#9A896C",
    cold: "#81A6AA",
  });

  function px(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  /** 컷신 전용 액자 패널. 검토본과 픽셀 단위로 같아야 한다. */
  function panel(ctx, x, y, width, height) {
    px(ctx, x + 3, y, width - 6, height, PAL.ink);
    px(ctx, x, y + 3, width, height - 6, PAL.ink);
    px(ctx, x + 1, y + 3, 1, height - 6, PAL.panelLight);
    px(ctx, x + 3, y + 1, width - 6, 1, PAL.panelLight);
    px(ctx, x + 2, y + 3, width - 4, height - 6, PAL.panel);
    px(ctx, x + 3, y + 2, width - 6, 1, PAL.goldDim);
  }

  function nameBoxWidth(speaker) {
    if (speaker.length >= 6) return 112;
    return speaker === "플레이어" ? 88 : 96;
  }

  /** 기본 화자 색. renderer 가 speakerStyle 을 주면 그쪽이 이긴다. */
  function defaultSpeakerStyle(speaker) {
    if (speaker === "플레이어") return { accent: PAL.teal, text: PAL.tealText };
    return { accent: PAL.gold, text: PAL.gold };
  }

  function clear(textCtx, textCanvas) {
    textCtx.save();
    textCtx.setTransform(1, 0, 0, 1, 0, 0);
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    textCtx.restore();
    textCtx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0);
  }

  /**
   * 한글 줄바꿈. 마지막 줄에 글자가 너무 적게 남으면 앞줄에서 끌어와 균형을 맞춘다.
   * 최대 세 줄이다.
   */
  function wrapLines(textCtx, text, maxWidth) {
    const lines = [];
    let line = "";
    Array.from(text).forEach((character) => {
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
      } else if (last.every((character) => /[.!?…,]/.test(character))) {
        lines[lines.length - 2] += last.join("");
        lines.pop();
      }
    }
    return lines.slice(0, 3);
  }

  function typedLength(beat, local, forceComplete) {
    if (forceComplete) return beat.text.length;
    const elapsed = Math.max(0, local - (beat.textDelay || 0));
    return Math.min(beat.text.length, Math.floor(elapsed / TYPE_MS));
  }

  /**
   * art 캔버스에 대화 상자와 이름표 액자를 그린다.
   * boxWidth 는 renderer 가 정할 수 있다. 묶음마다 승인된 이름표 폭이 다르다.
   */
  function drawDialogueBox(ctx, beat, style, boxWidth) {
    panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h);
    const width = boxWidth || nameBoxWidth(beat.speaker);
    panel(ctx, BOX.x + 10, BOX.y - 20, width, 23);
    px(ctx, BOX.x + 16, BOX.y - 16, 3, 14, style.accent);
  }

  /** 글씨 캔버스에 화자 이름과 지금까지 타이핑된 대사를 그린다. */
  function drawDialogueText(textCtx, beat, local, forceComplete, style, boxWidth) {
    const width = boxWidth || nameBoxWidth(beat.speaker);
    textCtx.textBaseline = "top";
    textCtx.textAlign = "center";
    textCtx.font = '700 11px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = style.text;
    textCtx.fillText(beat.speaker, BOX.x + 10 + width / 2, BOX.y - 16);

    textCtx.textAlign = "left";
    textCtx.font = '600 14px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
    textCtx.fillStyle = PAL.cream;
    let remaining = typedLength(beat, local, forceComplete);
    wrapLines(textCtx, beat.text, BOX.w - 40).forEach((line, index) => {
      const length = Math.min(line.length, Math.max(0, remaining));
      textCtx.fillText(line.slice(0, length), BOX.x + 20, BOX.y + 17 + index * 21);
      remaining -= line.length;
    });
  }

  global.CutsceneText = Object.freeze({
    TEXT_SCALE,
    TYPE_MS,
    BOX,
    PAL,
    px,
    panel,
    clear,
    wrapLines,
    typedLength,
    nameBoxWidth,
    defaultSpeakerStyle,
    drawDialogueBox,
    drawDialogueText,
  });
})(typeof window !== "undefined" ? window : globalThis);
