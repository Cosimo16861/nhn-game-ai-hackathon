/**
 * 게임 내 확인창.
 *
 * 네이티브 window.confirm 은 쓰지 않는다.
 *  - 임베드 브라우저·일부 환경에서 차단되면 조용히 false 가 되어 기능이 죽는다
 *  - 픽셀 아트 UI 기준(GAME_DESIGN 10장)과도 맞지 않는다
 */
(function () {
  "use strict";

  let modal = null;
  let messageEl = null;
  let okButton = null;
  let cancelButton = null;
  let resolveCurrent = null;

  function ensureRefs() {
    if (modal) return;
    modal = document.querySelector("[data-role=modal]");
    messageEl = modal.querySelector("[data-role=modal-message]");
    okButton = modal.querySelector("[data-action=modal-ok]");
    cancelButton = modal.querySelector("[data-action=modal-cancel]");

    okButton.addEventListener("click", () => settle(true));
    cancelButton.addEventListener("click", () => settle(false));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) settle(false);
    });
    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") settle(false);
      if (event.key === "Enter") settle(true);
    });
  }

  function settle(value) {
    if (!resolveCurrent) return;
    const resolve = resolveCurrent;
    resolveCurrent = null;
    modal.hidden = true;
    resolve(value);
  }

  /**
   * @param {string} message 줄바꿈은 \n 으로 구분한다.
   * @param {{okLabel?:string, cancelLabel?:string}} [options]
   * @returns {Promise<boolean>}
   */
  function confirm(message, options = {}) {
    ensureRefs();
    // 이미 열려 있으면 이전 요청은 취소로 정리한다.
    settle(false);

    messageEl.innerHTML = "";
    String(message)
      .split("\n")
      .forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        messageEl.appendChild(p);
      });

    okButton.textContent = options.okLabel || "확인";
    cancelButton.textContent = options.cancelLabel || "취소";
    modal.hidden = false;
    okButton.focus();

    return new Promise((resolve) => {
      resolveCurrent = resolve;
    });
  }

  window.UI = Object.freeze({ confirm });
})();
