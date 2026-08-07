/**
 * 플래그 저장소.
 * 모든 분기·잠금·증거 획득은 여기의 플래그로만 처리한다(00_SYSTEM 2장).
 * 저장소는 브라우저 로컬(GAME_DESIGN 11).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "haven.save.v1";
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
    notify();
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
    save,
    subscribe,
    snapshot,
  });
})();
