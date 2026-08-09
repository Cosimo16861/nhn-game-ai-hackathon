/**
 * ArtworkStore — 작업 중·완성 그림 Blob 저장.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 3.2
 *
 * 1254×1254 RGBA 한 장은 약 6.3MB 다. localStorage 에 넣지 않는다.
 *
 * DB: heir_artworks_v1
 *   drafts      퀘스트별 작업 중 상태
 *   finals      통과 당시 PNG Blob
 *   thumbnails  증거판용 160×160 이하 Blob
 *
 * 정답 이미지, CLIP 결과, 내부 점수는 저장하지 않는다.
 * IndexedDB 실패는 치명적이지 않다. 세션 메모리로 계속 플레이하되 저장 불가를 알린다
 * (GAME_INTEGRATION_PLAN 13장).
 */
(function (global) {
  "use strict";

  const DB_NAME = "heir_artworks_v1";
  const DB_VERSION = 1;
  const STORES = Object.freeze(["drafts", "finals", "thumbnails"]);
  const SCHEMA_VERSION = 1;
  const THUMBNAIL_MAX = 160;

  function create(options = {}) {
    const factory = options.indexedDB !== undefined
      ? options.indexedDB
      : (global.indexedDB || null);
    const dbName = options.dbName || DB_NAME;

    let dbPromise = null;
    let degraded = !factory;
    let degradedReason = factory ? null : "indexeddb-unavailable";
    // IndexedDB 를 못 쓰면 이 세션 동안만 메모리에 들고 있는다.
    const memory = new Map(STORES.map((name) => [name, new Map()]));

    function markDegraded(reason, error) {
      if (!degraded) {
        degraded = true;
        degradedReason = reason;
        console.warn("[artwork-store] 그림 저장을 사용할 수 없습니다.", reason, error);
        if (typeof options.onDegraded === "function") options.onDegraded(reason, error);
      }
    }

    function openDatabase() {
      if (degraded) return Promise.reject(new Error(degradedReason));
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        let request;
        try {
          request = factory.open(dbName, DB_VERSION);
        } catch (error) {
          reject(error);
          return;
        }
        request.onupgradeneeded = () => {
          const db = request.result;
          STORES.forEach((name) => {
            if (!db.objectStoreNames.contains(name)) {
              db.createObjectStore(name, { keyPath: "questId" });
            }
          });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("indexeddb-blocked"));
      }).catch((error) => {
        dbPromise = null;
        markDegraded("open-failed", error);
        throw error;
      });
      return dbPromise;
    }

    function run(storeName, mode, work) {
      return openDatabase().then((db) => new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = work(transaction.objectStore(storeName));
        transaction.onabort = () => reject(transaction.error);
        transaction.onerror = () => reject(transaction.error);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }));
    }

    function assertStore(storeName) {
      if (!STORES.includes(storeName)) {
        throw new Error(`알 수 없는 그림 저장소: ${storeName}`);
      }
    }

    function buildRecord(storeName, questId, blob, meta = {}) {
      return {
        questId,
        schemaVersion: SCHEMA_VERSION,
        imageVersion: Number.isFinite(meta.imageVersion) ? meta.imageVersion : 1,
        width: Number.isFinite(meta.width) ? meta.width : null,
        height: Number.isFinite(meta.height) ? meta.height : null,
        blob,
        updatedAt: Date.now(),
      };
    }

    async function put(storeName, questId, blob, meta) {
      assertStore(storeName);
      if (!questId) throw new Error("퀘스트 ID 가 필요합니다.");
      if (storeName === "thumbnails" && meta) {
        const largest = Math.max(meta.width || 0, meta.height || 0);
        if (largest > THUMBNAIL_MAX) {
          throw new Error(`썸네일은 ${THUMBNAIL_MAX}px 이하여야 합니다: ${largest}px`);
        }
      }
      const record = buildRecord(storeName, questId, blob, meta);
      memory.get(storeName).set(questId, record);
      if (degraded) return record;
      try {
        await run(storeName, "readwrite", (store) => store.put(record));
      } catch (error) {
        markDegraded("write-failed", error);
      }
      return record;
    }

    async function get(storeName, questId) {
      assertStore(storeName);
      if (!degraded) {
        try {
          const record = await run(storeName, "readonly", (store) => store.get(questId));
          if (record) return record;
        } catch (error) {
          markDegraded("read-failed", error);
        }
      }
      return memory.get(storeName).get(questId) || null;
    }

    async function remove(storeName, questId) {
      assertStore(storeName);
      memory.get(storeName).delete(questId);
      if (degraded) return;
      try {
        await run(storeName, "readwrite", (store) => store.delete(questId));
      } catch (error) {
        markDegraded("delete-failed", error);
      }
    }

    async function clearAll() {
      STORES.forEach((name) => memory.get(name).clear());
      if (degraded) return;
      for (const name of STORES) {
        try {
          await run(name, "readwrite", (store) => store.clear());
        } catch (error) {
          markDegraded("clear-failed", error);
          return;
        }
      }
    }

    return Object.freeze({
      DB_NAME: dbName,
      STORES,
      THUMBNAIL_MAX,
      isDegraded: () => degraded,
      degradedReason: () => degradedReason,
      saveDraft: (questId, blob, meta) => put("drafts", questId, blob, meta),
      loadDraft: (questId) => get("drafts", questId),
      removeDraft: (questId) => remove("drafts", questId),
      saveFinal: (questId, blob, meta) => put("finals", questId, blob, meta),
      loadFinal: (questId) => get("finals", questId),
      saveThumbnail: (questId, blob, meta) => put("thumbnails", questId, blob, meta),
      loadThumbnail: (questId) => get("thumbnails", questId),
      clearAll,
    });
  }

  const api = Object.freeze({ DB_NAME, DB_VERSION, STORES, THUMBNAIL_MAX, create });
  global.ArtworkStoreFactory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
