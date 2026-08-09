/**
 * heir_game_progress_v1 → v2 마이그레이션.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 단계 2 — "기존 저장을 잃지 않음"
 *
 * v1 은 플래그 문자열 하나로 통과와 컷신 시청을 함께 표현했다.
 *   NODE_CLEARED_<questId>       → clearedQuestIds
 *   CUTSCENE_SEEN_<legacyAlias>  → 해당 번들의 completed + 그 sceneIds 의 seen
 *   CUTSCENE_SEEN_<sceneId>      → seenSceneIds
 *   그 밖의 플래그               → flags (증거 등)
 *
 * v1 키는 지우지 않는다. 되돌릴 수 있어야 한다.
 */
(function (global) {
  "use strict";

  const V1_KEY = "heir_game_progress_v1";

  const Bundles = global.CompletionBundles ||
    (typeof require === "function" ? require("../data/completion-bundles.js") : null);

  /** v1 플래그 배열을 v2 상태 조각으로 변환한다. 저장소를 건드리지 않는 순수 함수다. */
  function convert(v1State, bundles = Bundles) {
    const flags = Array.isArray(v1State?.flags) ? v1State.flags : [];
    const clearedQuestIds = [];
    const completedBundleIds = [];
    const seenSceneIds = [];
    const carried = [];

    const byLegacy = new Map(
      (bundles?.list() || []).map((bundle) => [bundle.legacyCutsceneId, bundle]),
    );
    const bySceneId = new Map();
    (bundles?.list() || []).forEach((bundle) => {
      bundle.sceneIds.forEach((sceneId) => bySceneId.set(sceneId, bundle));
    });

    for (const flag of flags) {
      if (typeof flag !== "string" || !flag) continue;
      if (flag.startsWith("NODE_CLEARED_")) {
        clearedQuestIds.push(flag.slice("NODE_CLEARED_".length));
        continue;
      }
      if (flag.startsWith("CUTSCENE_SEEN_")) {
        const id = flag.slice("CUTSCENE_SEEN_".length);
        const legacyBundle = byLegacy.get(id);
        if (legacyBundle) {
          // 구 저장은 완료 컷신을 통째로 하나로 봤다. 번들 종료로 승격한다.
          completedBundleIds.push(legacyBundle.id);
          seenSceneIds.push(...legacyBundle.sceneIds);
          continue;
        }
        if (bySceneId.has(id)) {
          seenSceneIds.push(id);
          continue;
        }
        // 정본에 없는 컷신 ID 는 원문 플래그로 보존한다.
        carried.push(flag);
        continue;
      }
      carried.push(flag);
    }

    // 오프닝 두 장면을 모두 봤으면 오프닝 번들도 종료된 것이다.
    const opening = bundles?.opening();
    if (opening && opening.sceneIds.every((sceneId) => seenSceneIds.includes(sceneId))) {
      completedBundleIds.push(opening.id);
    }

    // v1 에는 pending 개념이 없다. 통과했는데 번들이 안 끝난 노드를 pending 으로 복원한다.
    let pending = null;
    for (const questId of clearedQuestIds) {
      const bundle = bundles?.forQuest(questId);
      if (bundle && !completedBundleIds.includes(bundle.id)) {
        pending = {
          kind: "completion-cutscene",
          sourceQuestId: questId,
          bundleId: bundle.id,
        };
        break;
      }
    }

    return {
      version: 2,
      clearedQuestIds,
      completedBundleIds,
      seenSceneIds,
      flags: carried,
      selectedQuestId: typeof v1State?.selectedQuestId === "string"
        ? v1State.selectedQuestId : null,
      pending,
      updatedAt: Number.isFinite(v1State?.updatedAt) ? v1State.updatedAt : Date.now(),
    };
  }

  /**
   * v2 저장이 비었고 v1 저장이 있으면 한 번만 옮긴다.
   * 이미 v2 기록이 있으면 아무것도 하지 않는다(덮어쓰기 금지).
   */
  function migrateIfNeeded(store, options = {}) {
    const storage = options.storage !== undefined ? options.storage : global.localStorage;
    const v1Key = options.v1Key || V1_KEY;
    if (!storage) return { migrated: false, reason: "no-storage" };

    const snapshot = store.getSnapshot();
    const alreadyStarted = snapshot.clearedQuestIds.length > 0 ||
      snapshot.completedBundleIds.length > 0 ||
      snapshot.seenSceneIds.length > 0 ||
      snapshot.flags.length > 0;
    if (alreadyStarted) return { migrated: false, reason: "v2-present" };

    let v1State = null;
    try {
      const serialized = storage.getItem(v1Key);
      if (!serialized) return { migrated: false, reason: "no-v1" };
      v1State = JSON.parse(serialized);
    } catch (error) {
      console.warn("[migration-v1-v2] v1 저장을 읽지 못했습니다.", error);
      return { migrated: false, reason: "unreadable" };
    }

    const converted = convert(v1State, options.bundles);
    if (
      !converted.clearedQuestIds.length &&
      !converted.completedBundleIds.length &&
      !converted.seenSceneIds.length &&
      !converted.flags.length
    ) {
      return { migrated: false, reason: "empty-v1" };
    }

    store.replaceState(converted);
    return { migrated: true, state: converted };
  }

  const api = Object.freeze({ V1_KEY, convert, migrateIfNeeded });
  global.ProgressMigration = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
