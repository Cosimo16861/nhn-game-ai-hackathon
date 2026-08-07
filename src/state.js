/**
 * 플래그 저장소.
 * 모든 분기·잠금·증거 획득은 여기의 플래그로만 처리한다(00_SYSTEM 2장).
 * 저장소는 브라우저 로컬(GAME_DESIGN 11).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "haven.save.v1";
  const CHECKPOINT_KEY = "haven.checkpoints.v1";
  const listeners = new Set();

  let flags = Object.create(null);

  function notify() {
    listeners.forEach((listener) => listener(snapshot()));
  }

  function snapshot() {
    return Object.freeze({ ...flags });
  }

  function get(name) {
    return flags[name];
  }

  function has(name) {
    return Boolean(flags[name]);
  }

  /** 값 없이 부르면 boolean true. STAGE처럼 값이 있는 플래그는 값을 넘긴다. */
  function set(name, value = true) {
    flags[name] = value;
    save();
    notify();
  }

  function clear(name) {
    delete flags[name];
    save();
    notify();
  }

  /** 대사 노드의 onEnter/effects를 그대로 적용한다. */
  function apply(effects) {
    if (!effects) return;
    let changed = false;

    (effects.set || []).forEach((name) => {
      flags[name] = true;
      changed = true;
    });
    (effects.clear || []).forEach((name) => {
      delete flags[name];
      changed = true;
    });
    Object.entries(effects.assign || {}).forEach(([name, value]) => {
      flags[name] = value;
      changed = true;
    });

    if (changed) {
      save();
      notify();
    }
  }

  /** requires(전부 충족) / requiresAny(하나 이상) 조건 판정 */
  function meets(condition) {
    if (!condition) return true;
    const all = condition.requires || [];
    const any = condition.requiresAny || [];
    if (!all.every((name) => has(name))) return false;
    if (any.length > 0 && !any.some((name) => has(name))) return false;
    return true;
  }

  function countOf(names) {
    return names.filter((name) => has(name)).length;
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    } catch (error) {
      // 로컬 저장소를 못 쓰는 환경에서도 플레이는 계속된다.
      console.warn("자동 저장에 실패했습니다.", error);
    }
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      flags = raw ? Object.assign(Object.create(null), JSON.parse(raw)) : Object.create(null);
    } catch (error) {
      flags = Object.create(null);
    }
    notify();
  }

  function reset() {
    flags = Object.create(null);
    save();
    try {
      window.localStorage.removeItem(CHECKPOINT_KEY);
    } catch (error) {
      console.warn("체크포인트 초기화에 실패했습니다.", error);
    }
    notify();
  }

  /** 핵심 판단 선택 직전의 전체 플래그를 별도 저장한다. */
  function saveCheckpoint(name) {
    try {
      const raw = window.localStorage.getItem(CHECKPOINT_KEY);
      const checkpoints = raw ? JSON.parse(raw) : {};
      checkpoints[name] = { ...flags };
      window.localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpoints));
      return Object.freeze({ ...checkpoints[name] });
    } catch (error) {
      console.warn("체크포인트 저장에 실패했습니다.", error);
      return null;
    }
  }

  function getCheckpoint(name) {
    try {
      const raw = window.localStorage.getItem(CHECKPOINT_KEY);
      const checkpoint = raw ? JSON.parse(raw)[name] : null;
      return checkpoint ? Object.freeze({ ...checkpoint }) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 엔딩 후 분기 재시작용 API. 엔딩 기록은 기본적으로 현재 값이 보존된다.
   * 2단계에서는 저장만 사용하며 실제 복귀 UI는 최종 단계에서 연결한다.
   */
  function restoreCheckpoint(
    name,
    { preserve = ["SEEN_END_A", "SEEN_END_B"] } = {},
  ) {
    const checkpoint = getCheckpoint(name);
    if (!checkpoint) return false;
    const kept = Object.create(null);
    preserve.forEach((key) => {
      if (has(key)) kept[key] = flags[key];
    });
    flags = Object.assign(Object.create(null), checkpoint, kept);
    save();
    notify();
    return true;
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(snapshot());
    return () => listeners.delete(listener);
  }

  window.GameState = Object.freeze({
    get,
    has,
    set,
    clear,
    apply,
    meets,
    countOf,
    load,
    reset,
    saveCheckpoint,
    getCheckpoint,
    restoreCheckpoint,
    save,
    subscribe,
    snapshot,
  });
})();
