(function () {
  "use strict";

  const runtime = window.C0IntroCutscene.create({
    art: document.querySelector('[data-role="art"]'),
    textCanvas: document.querySelector('[data-role="text"]'),
    progress: document.querySelector('[data-role="progress"]'),
    live: document.querySelector('[data-role="intro-live"]'),
  });

  function start() {
    runtime.start().catch(function (error) {
      console.error("인트로 컷신을 시작하지 못했습니다.", error);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === " ") {
      event.preventDefault();
      runtime.advance();
    }
    if (event.key === "Escape") runtime.finish();
    if (event.key === "r" || event.key === "R") start();
  });

  start();
})();
