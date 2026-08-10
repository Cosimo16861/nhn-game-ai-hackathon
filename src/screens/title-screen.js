/**
 * 시작 화면.
 *
 * src/intro.js 의 항구 배경 애니메이션과 메뉴 동작을 옮겨 왔다. 인트로 재생과
 * 화면 전환은 더 이상 여기서 하지 않는다 — GameDirector 가 한다.
 */
(function (global) {
  "use strict";

  const W = 640;
  const H = 384;
  const PAL = Object.freeze({
    fog: "#61706d",
    fogLight: "#89918a",
    gold: "#d8a94b",
    rain: "#40565a",
  });

  function mount(container, options) {
    const art = container.querySelector('[data-role="art"]');
    const ctx = art.getContext("2d");
    const startButton = container.querySelector('[data-action="start"]');
    const replayButton = container.querySelector('[data-action="replay"]');
    const startLabel = container.querySelector('[data-role="start-label"]');
    const newGameButton = container.querySelector('[data-action="new-game"]');
    const confirmPanel = container.querySelector('[data-role="new-game-confirm"]');

    ctx.imageSmoothingEnabled = false;

    let frame = 0;
    let startedAt = global.performance.now();
    let disposed = false;

    function px(x, y, width, height, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    }

    function dither(x, y, width, height, color, density, offset) {
      ctx.fillStyle = color;
      for (let yy = y; yy < y + height; yy += 2) {
        for (let xx = x; xx < x + width; xx += 2) {
          if ((xx * 17 + yy * 29 + offset * 11) % 100 < density * 100) {
            ctx.fillRect(xx, yy, 1, 1);
          }
        }
      }
    }

    function line(x1, y1, x2, y2, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
      ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
      ctx.stroke();
    }

    function vignette() {
      const gradient = ctx.createRadialGradient(320, 170, 80, 320, 190, 370);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.72, "rgba(0,0,0,.18)");
      gradient.addColorStop(1, "rgba(0,0,0,.76)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }

    function drawRain(t, amount) {
      const step = Math.floor(t / 70);
      for (let i = 0; i < amount; i += 1) {
        const x = (i * 79 + step * 7) % 680 - 20;
        const y = (i * 47 + step * 13) % 310 - 24;
        line(x, y, x - 3, y + 11, i % 3 === 0 ? "#5b7375" : PAL.rain, 1);
      }
    }

    /** 안개항의 지붕선과 부두. 제목 뒤에서 계속 비가 내린다. */
    function drawHarbor(t) {
      ctx.fillStyle = "#10191b";
      ctx.fillRect(0, 0, W, H);
      px(0, 0, W, 220, "#1a292b");
      dither(0, 0, W, 210, "#304043", 0.18, Math.floor(t / 160));

      const roofs = [
        [-12, 179, 108, 36], [70, 158, 112, 58], [158, 181, 104, 35],
        [246, 148, 132, 69], [356, 174, 105, 43], [442, 153, 116, 63],
        [540, 180, 112, 36],
      ];
      roofs.forEach((roof, index) => {
        px(roof[0], roof[1], roof[2], 220 - roof[1], index % 2 ? "#1b2525" : "#162122");
        ctx.fillStyle = index % 2 ? "#293333" : "#222d2e";
        ctx.beginPath();
        ctx.moveTo(roof[0] - 7, roof[1]);
        ctx.lineTo(roof[0] + roof[2] / 2, roof[1] - 27 - (index % 3) * 8);
        ctx.lineTo(roof[0] + roof[2] + 8, roof[1]);
        ctx.fill();
        if (index % 2) px(roof[0] + roof[2] * 0.55, roof[1] + 16, 7, 9, "#8f7139");
      });
      px(303, 74, 22, 78, "#172020");
      px(298, 70, 32, 7, "#23302f");
      px(310, 42, 8, 31, "#192324");

      px(0, 216, W, 96, "#101b1c");
      for (let y = 226; y < 307; y += 8) {
        for (let x = (y % 16) - 18; x < W; x += 42) {
          line(x, y, x + 25, y, y % 24 ? "#294042" : "#3b5453");
        }
      }
      px(0, 283, W, 20, "#312a24");
      px(0, 303, W, 11, "#1c1917");
      for (let x = 21; x < W; x += 66) {
        px(x, 268, 8, 50, "#332a22");
        px(x - 2, 266, 12, 5, "#4d3d2f");
      }

      drawRain(t, 48);
      const drift = Math.sin(t / 900) * 24;
      ctx.globalAlpha = 0.16;
      px(-80 + drift, 120, 390, 65, PAL.fogLight);
      px(290 - drift * 0.6, 190, 420, 48, PAL.fog);
      ctx.globalAlpha = 1;
      vignette();
    }

    function render(now) {
      if (disposed) return;
      const t = now - startedAt;
      drawHarbor(t * 0.55);
      // 제목 가독성을 위한 상부 암막과 먼 등불
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(4,7,8,.92)");
      gradient.addColorStop(0.7, "rgba(4,7,8,.34)");
      gradient.addColorStop(1, "rgba(4,7,8,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, 300);
      const blink = 0.48 + Math.sin(t / 850) * 0.08;
      ctx.globalAlpha = blink;
      px(93, 173, 8, 9, PAL.gold);
      px(474, 188, 7, 8, PAL.gold);
      ctx.globalAlpha = 1;
      frame = global.requestAnimationFrame(render);
    }

    function setConfirmVisible(visible) {
      if (!confirmPanel) return;
      const wasOpen = !confirmPanel.hidden;
      confirmPanel.hidden = !visible;
      if (visible) {
        confirmPanel.querySelector('[data-action="new-game-cancel"]')?.focus();
      } else if (wasOpen && !disposed) {
        // 닫을 때만 포커스를 되돌린다. 화면 정리 중에는 건드리지 않는다.
        newGameButton?.focus();
      }
    }

    function onClick(event) {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action === "start") options.onStart?.();
      if (action === "replay") options.onReplayPrologue?.();
      // 새 게임은 그림까지 지운다. 확인을 한 번 받는다.
      if (action === "new-game") setConfirmVisible(true);
      if (action === "new-game-cancel") setConfirmVisible(false);
      if (action === "new-game-confirm") {
        setConfirmVisible(false);
        options.onNewGame?.();
      }
    }

    function onKeydown(event) {
      if (event.key === "Escape" && confirmPanel && !confirmPanel.hidden) {
        event.preventDefault();
        setConfirmVisible(false);
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.matches("button")) return;
      // 확인창이 떠 있으면 ENTER 가 게임을 시작하지 않는다.
      if (confirmPanel && !confirmPanel.hidden) return;
      event.preventDefault();
      options.onStart?.();
    }

    container.addEventListener("click", onClick);
    global.document.addEventListener("keydown", onKeydown);
    frame = global.requestAnimationFrame(render);

    return Object.freeze({
      /** 이어하기 가능 여부에 따라 메뉴 문구를 바꾼다. */
      setResumable(resumable) {
        if (startLabel) startLabel.textContent = resumable ? "이어하기" : "새 이야기";
        if (replayButton) replayButton.hidden = !resumable;
      },
      /**
       * 엔딩을 본 저장에서만 "새 이야기 시작"을 노출한다.
       * 그전에는 실수로 진행을 지울 방법이 없다.
       */
      setEndingCompleted(completed) {
        if (newGameButton) newGameButton.hidden = !completed;
        if (!completed) setConfirmVisible(false);
      },
      focus() {
        startButton?.focus();
      },
      dispose() {
        disposed = true;
        setConfirmVisible(false);
        if (frame) global.cancelAnimationFrame(frame);
        frame = 0;
        container.removeEventListener("click", onClick);
        global.document.removeEventListener("keydown", onKeydown);
      },
    });
  }

  global.TitleScreen = Object.freeze({ mount });
})(typeof window !== "undefined" ? window : globalThis);
