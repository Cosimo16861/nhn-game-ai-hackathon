/**
 * ArtworkStore — GAME_INTEGRATION_PLAN 단계 2.
 *
 * Node 에는 IndexedDB 가 없다. 외부 패키지를 쓰지 않기 위해 계약에 필요한 만큼만
 * 흉내 낸 최소 구현을 주입해 저장소 로직을 검증한다. 실제 IndexedDB 동작은
 * 브라우저 스모크 테스트에서 확인한다.
 */
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const ArtworkStoreFactory = require(path.join(root, "src/core/artwork-store.js"));

// ── 최소 IndexedDB 흉내 ─────────────────────────────────────────────
function makeRequest(execute) {
  const request = { onsuccess: null, onerror: null, result: undefined, error: null };
  queueMicrotask(() => {
    try {
      request.result = execute();
      request.onsuccess?.();
    } catch (error) {
      request.error = error;
      request.onerror?.();
    }
  });
  return request;
}

function fakeIndexedDB(options = {}) {
  const data = new Map();
  return {
    _data: data,
    open(name, version) {
      const request = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null };
      queueMicrotask(() => {
        if (options.failOpen) {
          request.error = new Error("open denied");
          request.onerror?.();
          return;
        }
        const names = new Set();
        request.result = {
          name,
          version,
          objectStoreNames: { contains: (storeName) => names.has(storeName) },
          createObjectStore(storeName) {
            names.add(storeName);
            data.set(storeName, new Map());
            return {};
          },
          transaction(storeName) {
            const bucket = data.get(storeName);
            const transaction = { onabort: null, onerror: null, error: null };
            transaction.objectStore = () => ({
              put: (record) => makeRequest(() => {
                if (options.failWrite) throw new Error("write denied");
                bucket.set(record.questId, record);
                return record.questId;
              }),
              get: (key) => makeRequest(() => bucket.get(key)),
              delete: (key) => makeRequest(() => { bucket.delete(key); }),
              clear: () => makeRequest(() => { bucket.clear(); }),
            });
            return transaction;
          },
        };
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}

/** Blob 이 없는 환경에서도 라운드 트립을 확인할 수 있는 대역. */
function fakeBlob(byteLength) {
  return { size: byteLength, type: "image/png" };
}

(async function run() {
  // ── 1. final·thumbnail 라운드 트립 ────────────────────────────────
  {
    const indexedDB = fakeIndexedDB();
    const store = ArtworkStoreFactory.create({ indexedDB });

    const final = fakeBlob(1254 * 1254 * 4);
    await store.saveFinal("Q0_MONTAGE", final, { width: 1254, height: 1254 });
    const loaded = await store.loadFinal("Q0_MONTAGE");
    assert.equal(loaded.questId, "Q0_MONTAGE");
    assert.equal(loaded.width, 1254);
    assert.equal(loaded.height, 1254);
    assert.equal(loaded.schemaVersion, 1);
    assert.equal(loaded.blob, final);
    assert.ok(Number.isFinite(loaded.updatedAt));

    const thumbnail = fakeBlob(160 * 160 * 4);
    await store.saveThumbnail("Q0_MONTAGE", thumbnail, { width: 160, height: 160 });
    assert.equal((await store.loadThumbnail("Q0_MONTAGE")).blob, thumbnail);

    assert.equal(await store.loadFinal("Q1A_IDEALIZED"), null);
    assert.equal(store.isDegraded(), false);
  }

  // ── 2. draft 저장·삭제 ───────────────────────────────────────────
  {
    const store = ArtworkStoreFactory.create({ indexedDB: fakeIndexedDB() });
    await store.saveDraft("Q1A_IDEALIZED", fakeBlob(1024), { width: 1254, height: 1254 });
    assert.ok(await store.loadDraft("Q1A_IDEALIZED"));
    await store.removeDraft("Q1A_IDEALIZED");
    assert.equal(await store.loadDraft("Q1A_IDEALIZED"), null);
  }

  // ── 3. 썸네일 상한 ───────────────────────────────────────────────
  {
    const store = ArtworkStoreFactory.create({ indexedDB: fakeIndexedDB() });
    await assert.rejects(
      () => store.saveThumbnail("Q0_MONTAGE", fakeBlob(4), { width: 512, height: 512 }),
      /160px 이하/,
    );
  }

  // ── 4. IndexedDB 가 없으면 세션 메모리로 계속 플레이한다 ──────────
  {
    const reasons = [];
    const store = ArtworkStoreFactory.create({
      indexedDB: null,
      onDegraded: (reason) => reasons.push(reason),
    });
    assert.equal(store.isDegraded(), true);
    assert.equal(store.degradedReason(), "indexeddb-unavailable");
    await store.saveFinal("Q0_MONTAGE", fakeBlob(8), { width: 1254, height: 1254 });
    assert.ok(await store.loadFinal("Q0_MONTAGE"), "메모리 대체 저장이 동작해야 합니다.");
  }

  // ── 5. 열기 실패는 예외를 던지지 않고 강등된다 ────────────────────
  {
    const reasons = [];
    const store = ArtworkStoreFactory.create({
      indexedDB: fakeIndexedDB({ failOpen: true }),
      onDegraded: (reason) => reasons.push(reason),
    });
    await store.saveFinal("Q0_MONTAGE", fakeBlob(8), { width: 1254, height: 1254 });
    assert.equal(store.isDegraded(), true);
    assert.deepEqual(reasons, ["open-failed"]);
    assert.ok(await store.loadFinal("Q0_MONTAGE"), "강등 뒤에도 그림을 잃지 않아야 합니다.");
  }

  // ── 6. 쓰기 실패도 강등으로 처리한다 ─────────────────────────────
  {
    const store = ArtworkStoreFactory.create({
      indexedDB: fakeIndexedDB({ failWrite: true }),
    });
    await store.saveFinal("Q0_MONTAGE", fakeBlob(8), { width: 1254, height: 1254 });
    assert.equal(store.isDegraded(), true);
    assert.equal(store.degradedReason(), "write-failed");
    assert.ok(await store.loadFinal("Q0_MONTAGE"));
  }

  // ── 7. 알 수 없는 저장소는 거부한다 ──────────────────────────────
  {
    const store = ArtworkStoreFactory.create({ indexedDB: fakeIndexedDB() });
    await assert.rejects(() => store.saveFinal("", fakeBlob(1)), /퀘스트 ID/);
  }

  console.log("Artwork store tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
