(function () {
  "use strict";

  function create({
    screens,
    companions = {},
    progressSteps = {},
    progressAliases = {},
  }) {
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
    const progressEntries = Object.entries(progressSteps);

    function show(
      screenName,
      { scroll = true, focus = true } = {},
    ) {
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
      const progressScreenName =
        progressAliases[screenName] || screenName;
      const activeProgressIndex = progressEntries.findIndex(
        ([name]) => name === progressScreenName,
      );
      progressEntries.forEach(([, element], index) => {
        const isCurrent = index === activeProgressIndex;
        element.classList.toggle("is-current", isCurrent);
        element.classList.toggle(
          "is-complete",
          activeProgressIndex >= 0 && index < activeProgressIndex,
        );
        if (isCurrent) {
          element.setAttribute("aria-current", "step");
        } else {
          element.removeAttribute("aria-current");
        }
      });

      if (scroll) {
        activeScreen.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
      if (focus) {
        activeScreen.focus?.({ preventScroll: true });
      }
    }

    return Object.freeze({ show });
  }

  window.ScreenManager = Object.freeze({ create });
})();
