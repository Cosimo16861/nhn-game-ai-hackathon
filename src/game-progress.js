(function (global) {
  "use strict";

  const STORAGE_KEY = global.__GAME_PROGRESS_STORAGE_KEY__ || "heir_game_progress_v1";
  const VERSION = 1;
  const listeners = new Set();

  function emptyState() {
    return {
      version: VERSION,
      flags: [],
      selectedQuestId: null,
      updatedAt: Date.now(),
    };
  }

  function normalize(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    return {
      version: VERSION,
      flags: Array.from(new Set(
        Array.isArray(source.flags)
          ? source.flags.filter((flag) => typeof flag === "string" && flag)
          : [],
      )).sort(),
      selectedQuestId:
        typeof source.selectedQuestId === "string" && source.selectedQuestId
          ? source.selectedQuestId
          : null,
      updatedAt: Number.isFinite(source.updatedAt) ? source.updatedAt : Date.now(),
    };
  }

  function readStoredState() {
    try {
      const serialized = global.localStorage?.getItem(STORAGE_KEY);
      return serialized ? normalize(JSON.parse(serialized)) : emptyState();
    } catch (error) {
      console.warn("[game-progress] 저장된 진행도를 읽지 못했습니다.", error);
      return emptyState();
    }
  }

  let state = readStoredState();

  function snapshot() {
    return Object.freeze({
      version: state.version,
      flags: Object.freeze(state.flags.slice()),
      selectedQuestId: state.selectedQuestId,
      updatedAt: state.updatedAt,
    });
  }

  function persist(nextState) {
    state = normalize({ ...nextState, updatedAt: Date.now() });
    try {
      global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("[game-progress] 진행도를 저장하지 못했습니다.", error);
    }
    const current = snapshot();
    listeners.forEach((listener) => listener(current));
    return current;
  }

  function setFlags(flags) {
    return persist({ ...state, flags: Array.from(flags) });
  }

  function setFlag(name, enabled = true) {
    if (typeof name !== "string" || !name) return snapshot();
    const flags = new Set(state.flags);
    if (enabled) flags.add(name);
    else flags.delete(name);
    return setFlags(flags);
  }

  function ensureOpeningComplete() {
    const flags = new Set(state.flags);
    flags.add("CUTSCENE_SEEN_C0_INTRO");
    flags.add("CUTSCENE_SEEN_C0B_THE_JOB");
    return setFlags(flags);
  }

  const api = Object.freeze({
    storageKey: STORAGE_KEY,
    has: (name) => state.flags.includes(name),
    get: snapshot,
    setFlag,
    markQuestCleared: (questId) => setFlag(`NODE_CLEARED_${questId}`),
    markCutsceneSeen: (cutsceneId) => setFlag(`CUTSCENE_SEEN_${cutsceneId}`),
    ensureOpeningComplete,
    selectQuest(questId) {
      return persist({ ...state, selectedQuestId: questId || null });
    },
    replaceFlags(flags, selectedQuestId = null) {
      return persist({ ...state, flags: Array.from(flags || []), selectedQuestId });
    },
    reset(options = {}) {
      const next = emptyState();
      if (options.openingComplete) {
        next.flags = ["CUTSCENE_SEEN_C0_INTRO", "CUTSCENE_SEEN_C0B_THE_JOB"];
      }
      return persist(next);
    },
    subscribe(listener) {
      if (typeof listener !== "function") return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });

  // 구형 저장 키를 컷신별로 이전한다. 인트로만 본 저장에서 새 C0B까지 본 것으로
  // 처리하면 첫 번째 의뢰의 발단이 통째로 건너뛰어지므로 두 기록을 분리한다.
  if (state.flags.length === 0) {
    const migrated = [];
    if (global.localStorage?.getItem("heir_intro_seen") === "1") {
      migrated.push("CUTSCENE_SEEN_C0_INTRO");
    }
    if (global.localStorage?.getItem("heir_c0b_seen") === "1") {
      migrated.push("CUTSCENE_SEEN_C0B_THE_JOB");
    }
    if (migrated.length) api.replaceFlags(migrated);
  }

  global.GameProgress = api;
})(window);
