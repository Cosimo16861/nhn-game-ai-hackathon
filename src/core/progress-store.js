/**
 * ProgressStore v2 — 사용자 진행 메타데이터 정본.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 3.1
 *
 * localStorage 에는 작은 메타데이터만 넣는다. 1254² 래스터는 ArtworkStore(IndexedDB)다.
 *
 * 핵심 계약
 *   - 퀘스트 통과(cleared)와 완료 컷신 번들 종료(completed)는 서로 다른 사건이다.
 *   - 자식 해금은 번들 종료 시점에만 일어난다.
 *   - 통과 직후 새로고침돼도 완료 컷신이 유실되지 않도록 pending 을 함께 저장한다.
 *     beginQuestCompletion 은 두 기록을 한 번의 쓰기로 수행한다.
 *
 * QuestGraph·BranchMap 은 아직 `state.has(FLAG)` 규약을 쓴다. 통합이 끝날 때까지
 * has() 가 v2 상태에서 구 플래그를 파생시켜 두 세대를 잇는다.
 */
(function (global) {
  "use strict";

  const VERSION = 2;
  const DEFAULT_KEY = "heir_game_progress_v2";

  const Bundles = global.CompletionBundles ||
    (typeof require === "function" ? require("../data/completion-bundles.js") : null);

  function uniqueSorted(values) {
    return Array.from(new Set(
      (Array.isArray(values) ? values : []).filter((v) => typeof v === "string" && v),
    )).sort();
  }

  function normalizePending(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    if (candidate.kind !== "completion-cutscene") return null;
    if (typeof candidate.bundleId !== "string" || !candidate.bundleId) return null;
    return Object.freeze({
      kind: "completion-cutscene",
      sourceQuestId: typeof candidate.sourceQuestId === "string"
        ? candidate.sourceQuestId : null,
      bundleId: candidate.bundleId,
    });
  }

  function emptyState() {
    return {
      version: VERSION,
      clearedQuestIds: [],
      completedBundleIds: [],
      seenSceneIds: [],
      flags: [],
      selectedQuestId: null,
      pending: null,
      updatedAt: Date.now(),
    };
  }

  function normalize(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    return {
      version: VERSION,
      clearedQuestIds: uniqueSorted(source.clearedQuestIds),
      completedBundleIds: uniqueSorted(source.completedBundleIds),
      seenSceneIds: uniqueSorted(source.seenSceneIds),
      flags: uniqueSorted(source.flags),
      selectedQuestId: typeof source.selectedQuestId === "string" && source.selectedQuestId
        ? source.selectedQuestId
        : null,
      pending: normalizePending(source.pending),
      updatedAt: Number.isFinite(source.updatedAt) ? source.updatedAt : Date.now(),
    };
  }

  function create(options = {}) {
    const storageKey = options.storageKey || DEFAULT_KEY;
    const storage = options.storage !== undefined ? options.storage : global.localStorage;
    const bundles = options.bundles || Bundles;
    const listeners = new Set();

    let state = read();
    let cachedSnapshot = null;

    function read() {
      try {
        const serialized = storage?.getItem(storageKey);
        if (!serialized) return emptyState();
        const parsed = JSON.parse(serialized);
        if (parsed && parsed.version !== VERSION) {
          console.warn("[progress-store] 알 수 없는 저장 버전", parsed.version);
        }
        return normalize(parsed);
      } catch (error) {
        console.warn("[progress-store] 진행도를 읽지 못했습니다.", error);
        return emptyState();
      }
    }

    function snapshot() {
      if (cachedSnapshot) return cachedSnapshot;
      cachedSnapshot = Object.freeze({
        version: state.version,
        clearedQuestIds: Object.freeze(state.clearedQuestIds.slice()),
        completedBundleIds: Object.freeze(state.completedBundleIds.slice()),
        seenSceneIds: Object.freeze(state.seenSceneIds.slice()),
        flags: Object.freeze(state.flags.slice()),
        selectedQuestId: state.selectedQuestId,
        pending: state.pending,
        updatedAt: state.updatedAt,
      });
      return cachedSnapshot;
    }

    /**
     * 한 번의 저장으로 여러 변경을 원자적으로 반영한다.
     * 저장에 실패하면 예외를 던진다 — 진행 화면은 실패를 삼키면 안 된다.
     * (GAME_INTEGRATION_PLAN 13장: ProgressStore 쓰기 실패 시 완료 화면으로 넘어가지 않는다)
     */
    function commit(mutate) {
      const next = normalize({ ...state, ...mutate(state), updatedAt: Date.now() });
      const serialized = JSON.stringify(next);
      if (storage) storage.setItem(storageKey, serialized);
      state = next;
      cachedSnapshot = null;
      const current = snapshot();
      listeners.forEach((listener) => {
        try {
          listener(current);
        } catch (error) {
          console.error("[progress-store] 구독자 오류", error);
        }
      });
      return current;
    }

    // ── 조회 ─────────────────────────────────────────────────────────
    const isQuestCleared = (questId) => state.clearedQuestIds.includes(questId);
    const isBundleCompleted = (bundleId) => state.completedBundleIds.includes(bundleId);
    const isSceneSeen = (sceneId) => state.seenSceneIds.includes(sceneId);

    /**
     * 구 플래그 규약 어댑터. QuestGraph.statusOf 와 BranchMap 이 이걸 읽는다.
     * CUTSCENE_SEEN_<id> 는 장면 ID 와 번들의 legacy alias 양쪽을 인정한다.
     */
    function has(flag) {
      if (typeof flag !== "string" || !flag) return false;
      if (state.flags.includes(flag)) return true;
      if (flag.startsWith("NODE_CLEARED_")) {
        return isQuestCleared(flag.slice("NODE_CLEARED_".length));
      }
      if (flag.startsWith("CUTSCENE_SEEN_")) {
        const id = flag.slice("CUTSCENE_SEEN_".length);
        if (isSceneSeen(id)) return true;
        const bundle = bundles?.list().find((entry) => entry.legacyCutsceneId === id);
        return Boolean(bundle && isBundleCompleted(bundle.id));
      }
      return false;
    }

    // ── 변경 ─────────────────────────────────────────────────────────

    /**
     * 그림 통과. 퀘스트 완료 기록과 pending 번들 예약을 한 번에 저장한다.
     * 이 시점에는 자식이 열리지 않는다 — 해금은 completeBundle 이 한다.
     */
    function beginQuestCompletion(questId, bundleId) {
      const bundle = bundles?.get(bundleId);
      if (!bundle) throw new Error(`알 수 없는 완료 번들: ${bundleId}`);
      return commit((current) => ({
        clearedQuestIds: current.clearedQuestIds.concat(questId),
        pending: { kind: "completion-cutscene", sourceQuestId: questId, bundleId },
      }));
    }

    /**
     * 번들 종료. 장면·번들 완료, grants 적용, pending 제거를 한 번에 저장한다.
     * unlocks 는 그래프가 완료 기록에서 파생하므로 따로 보관하지 않는다.
     */
    function completeBundle(bundleId, extraGrants) {
      const bundle = bundles?.get(bundleId);
      if (!bundle) throw new Error(`알 수 없는 완료 번들: ${bundleId}`);
      const grants = (bundle.grants || []).concat(extraGrants || []);
      return commit((current) => ({
        completedBundleIds: current.completedBundleIds.concat(bundleId),
        seenSceneIds: current.seenSceneIds.concat(bundle.sceneIds),
        flags: current.flags.concat(grants),
        pending: current.pending?.bundleId === bundleId ? null : current.pending,
      }));
    }

    /** 번들 중간에 한 장면이 끝났다. 종료가 아니므로 해금은 하지 않는다. */
    function markSceneSeen(sceneId) {
      return commit((current) => ({
        seenSceneIds: current.seenSceneIds.concat(sceneId),
      }));
    }

    return Object.freeze({
      storageKey,
      version: VERSION,
      getSnapshot: snapshot,
      has,
      isQuestCleared,
      isBundleCompleted,
      isSceneSeen,
      beginQuestCompletion,
      completeBundle,
      markSceneSeen,
      setFlag(name, enabled = true) {
        return commit((current) => ({
          flags: enabled
            ? current.flags.concat(name)
            : current.flags.filter((flag) => flag !== name),
        }));
      },
      selectQuest(questId) {
        return commit(() => ({ selectedQuestId: questId || null }));
      },
      getPendingTransition: () => state.pending,
      clearPendingTransition() {
        return commit(() => ({ pending: null }));
      },
      reset() {
        return commit(() => emptyState());
      },
      /** 마이그레이션·테스트 전용. 정상 진행에서는 쓰지 않는다. */
      replaceState(nextState) {
        return commit(() => normalize(nextState));
      },
      subscribe(listener) {
        if (typeof listener !== "function") return () => {};
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    });
  }

  const api = Object.freeze({ VERSION, DEFAULT_KEY, create, normalize });
  global.ProgressStoreFactory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
