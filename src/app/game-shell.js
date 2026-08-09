/**
 * GameShell — 화면 컨테이너와 오버레이 관리.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 6.1
 *
 * 화면은 다섯 종류뿐이다: title, cutscene, board, workbench, finale.
 * 로딩과 오류는 별도 게임 화면이 아니라 위 화면에 겹치는 상태다.
 *
 * 제품 화면마다 history entry 를 만들지 않는다 — 브라우저 뒤로 가기가 게임 상태를
 * 되돌리면 안 된다(6.1).
 */
(function (global) {
  "use strict";

  const SCREENS = Object.freeze(["title", "cutscene", "board", "workbench", "finale"]);

  function create(rootElement) {
    const root = rootElement || global.document.body;
    const panels = new Map(
      SCREENS.map((name) => [name, root.querySelector(`[data-screen="${name}"]`)]),
    );
    const loading = root.querySelector('[data-role="loading-overlay"]');
    const fatal = root.querySelector('[data-role="fatal-error"]');
    const fatalMessage = fatal?.querySelector('[data-role="fatal-message"]');
    const fatalRetry = fatal?.querySelector('[data-role="fatal-retry"]');

    SCREENS.forEach((name) => {
      if (!panels.get(name)) {
        throw new Error(`셸에 ${name} 화면 컨테이너가 없습니다.`);
      }
    });

    let visible = null;
    let retryAction = null;

    fatalRetry?.addEventListener("click", () => {
      const action = retryAction;
      hideFatal();
      if (typeof action === "function") action();
    });

    function show(name) {
      if (!panels.has(name)) throw new Error(`알 수 없는 화면: ${name}`);
      SCREENS.forEach((candidate) => {
        panels.get(candidate).hidden = candidate !== name;
      });
      visible = name;
      global.AssetLoader?.mark?.(`screen_ready:${name}`);
      return panels.get(name);
    }

    function setLoading(active, label) {
      if (!loading) return;
      loading.hidden = !active;
      if (label) loading.textContent = label;
    }

    function showFatal(message, retry) {
      if (!fatal) return;
      retryAction = typeof retry === "function" ? retry : null;
      if (fatalMessage) fatalMessage.textContent = message;
      if (fatalRetry) fatalRetry.hidden = !retryAction;
      fatal.hidden = false;
    }

    function hideFatal() {
      if (!fatal) return;
      fatal.hidden = true;
      retryAction = null;
    }

    return Object.freeze({
      SCREENS,
      root,
      container: (name) => panels.get(name) || null,
      show,
      visible: () => visible,
      setLoading,
      showFatal,
      hideFatal,
    });
  }

  global.GameShell = Object.freeze({ SCREENS, create });
})(typeof window !== "undefined" ? window : globalThis);
