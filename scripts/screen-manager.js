(function () {
  "use strict";

  function create({ screens, companions = {} }) {
    const entries = Object.entries(screens || {});
    if (
      entries.length === 0 ||
      entries.some(([, element]) => !element)
    ) {
      throw new Error("게임 화면 요소가 올바르게 설정되지 않았습니다.");
    }

    const companionElements = [
      ...new Set(Object.values(companions).flat()),
    ];

    function show(screenName, { scroll = true } = {}) {
      const activeScreen = screens[screenName];
      if (!activeScreen) {
        throw new Error(`알 수 없는 게임 화면입니다: ${screenName}`);
      }

      entries.forEach(([name, section]) => {
        section.hidden = name !== screenName;
      });
      companionElements.forEach((element) => {
        element.hidden = true;
      });
      (companions[screenName] || []).forEach((element) => {
        element.hidden = false;
      });

      if (scroll) {
        activeScreen.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }

    return Object.freeze({ show });
  }

  window.ScreenManager = Object.freeze({ create });
})();
