/** 최종 판정과 재시작 지점 계산. DOM과 표시 문구에 의존하지 않는 순수 API. */
(function () {
  "use strict";

  const DECISIVE = Object.freeze(["EV_FACE", "EV_LEDGER", "EV_CARRIAGE"]);

  function has(source, name) {
    if (source && typeof source.has === "function") return source.has(name);
    return Boolean(source && source[name]);
  }

  function get(source, name) {
    if (source && typeof source.get === "function") return source.get(name);
    return source ? source[name] : undefined;
  }

  function decisiveCount(source) {
    return DECISIVE.filter((name) => has(source, name)).length;
  }

  function summarize(source) {
    const decisive = decisiveCount(source);
    const logbookBonus = has(source, "SUB_LOGBOOK") && decisive < 3 ? 1 : 0;
    return Object.freeze({
      decisive,
      logbookBonus,
      effective: Math.min(3, decisive + logbookBonus),
    });
  }

  function judge(conclusion, source) {
    if (conclusion === "mastermind") {
      return summarize(source).effective >= 2 ? "A" : "reject";
    }
    if (conclusion === "hold") return "hold";
    return "B";
  }

  function restartTarget(source) {
    if (summarize(source).effective >= 2) return "FINAL";
    if (get(source, "KD3") !== "carriage" && !has(source, "EV_CARRIAGE")) {
      return "KD3";
    }
    if (get(source, "KD2") !== "ledger" && !has(source, "EV_LEDGER")) {
      return "KD2";
    }
    if (get(source, "KD1") !== "face" && !has(source, "EV_FACE")) {
      return "KD1";
    }
    return "FINAL";
  }

  function recordCount(source) {
    return ["SEEN_END_A", "SEEN_END_B"].filter((name) => has(source, name)).length;
  }

  window.Ending = Object.freeze({
    decisiveCount,
    summarize,
    judge,
    restartTarget,
    recordCount,
  });
})();
