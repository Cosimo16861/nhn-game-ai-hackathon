/**
 * 복원 퀘스트 등록부 — 세 정본을 하나의 descriptor 로 join 한다.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7.5 "14개 퀘스트 등록"
 *
 *   진행 구조      src/data/quest-graph.js        순서·부모·해금 위상
 *   이미지·증언    src/data/questimage-quests.js  자산 쌍·팔레트·메모·도구·채점
 *   완료 컷신      src/data/completion-bundles.js 번들 ID·장면 순서·해금 대상
 *
 * 퀘스트를 하나 더 열 때 새로 쓰는 코드는 없다. 위 세 정본에 데이터를 넣으면
 * 여기서 자동으로 descriptor 가 만들어지고 작업대가 그대로 동작한다.
 * 같은 사실을 두 곳에 적지 않는다 — 어긋나면 validate() 가 잡는다.
 */
(function (global) {
  "use strict";

  // quest-graph.js 는 window 에만 공개한다. Node 테스트에서는 window 대역을 쓴다.
  if (typeof require === "function" && !global.QuestGraph && !global.window?.QuestGraph) {
    require("./quest-graph.js");
  }
  const graph = global.QuestGraph || global.window?.QuestGraph;

  const Contracts = global.QuestImageContracts ||
    (typeof require === "function" ? require("./questimage-quests.js") : null);
  const Bundles = global.CompletionBundles ||
    (typeof require === "function" ? require("./completion-bundles.js") : null);

  if (!graph) throw new Error("QuestGraph 가 로드되지 않았습니다.");

  function build(node) {
    const contract = Contracts.get(node.id);
    if (!contract) return null;
    const bundle = Bundles.forQuest(node.id);
    const tools = Contracts.toolsFor(node.id);
    const scoring = Contracts.scoringFor(node.id);

    return Object.freeze({
      id: node.id,
      title: contract.title,
      subject: node.subject,
      why: node.why,
      witness: node.witness,
      place: node.place,
      layer: node.layer,
      route: node.route,
      parents: node.parents,

      // ── questimage 원본·미완성 이미지 ────────────────────────────
      images: Object.freeze({
        resolution: contract.resolution,
        target: contract.targetSource,
        outline: contract.outlineSource,
      }),

      // ── 증언 메모 ────────────────────────────────────────────────
      notes: contract.witnessNotes,
      palette: contract.palette,
      clipPrompts: contract.clipPrompts,

      // ── 붓과 채우기 설정 ─────────────────────────────────────────
      tools,

      // ── 판정 가중치와 통과 기준 ──────────────────────────────────
      scoring,

      // ── 성공 후 재생할 컷신 번들 ─────────────────────────────────
      completion: Object.freeze({
        bundleId: bundle.id,
        sceneIds: bundle.sceneIds,
        legacyCutsceneId: bundle.legacyCutsceneId,
      }),

      // ── 다음 퀘스트 해금 조건 ────────────────────────────────────
      // 해금은 통과가 아니라 완료 번들 종료로 일어난다(3.1·4장).
      unlocks: Object.freeze({
        trigger: "completion-bundle",
        bundleId: bundle.id,
        questIds: bundle.unlocks,
      }),
    });
  }

  /** 계획서 7.5의 등록 순서: 레이어 → 본선 먼저 → 가지. */
  const ROUTE_ORDER = Object.freeze({ start: 0, main: 1, branch: 2, end: 3 });

  const DESCRIPTORS = Object.freeze(
    graph.NODES
      .filter((node) => node.kind === "restoration")
      .map(build)
      .filter(Boolean)
      .sort((a, b) =>
        a.layer - b.layer ||
        ROUTE_ORDER[a.route] - ROUTE_ORDER[b.route] ||
        a.id.localeCompare(b.id))
      .map((descriptor, index) => Object.freeze({ ...descriptor, order: index })),
  );

  const byId = new Map(DESCRIPTORS.map((descriptor) => [descriptor.id, descriptor]));

  /**
   * 부팅 검증 — GAME_INTEGRATION_PLAN 7.5.
   * 문제 목록을 돌려준다. 빈 배열이면 통과다.
   */
  function validate() {
    const problems = [];
    const restorationNodes = graph.NODES.filter((node) => node.kind === "restoration");

    if (DESCRIPTORS.length !== restorationNodes.length) {
      problems.push(
        `복원 노드 ${restorationNodes.length}개 중 ${DESCRIPTORS.length}개만 등록됐다.`,
      );
    }

    DESCRIPTORS.forEach((quest) => {
      const where = quest.id;
      if (!quest.images.target || !quest.images.outline) {
        problems.push(`${where}: questimage 이미지 쌍이 없다.`);
      }
      if (quest.images.resolution !== Contracts.resolution) {
        problems.push(`${where}: 원본 해상도가 ${Contracts.resolution} 이 아니다.`);
      }
      if (!quest.notes.length) problems.push(`${where}: 증언 메모가 없다.`);
      if (quest.palette.length < 1 || quest.palette.length > 8) {
        problems.push(`${where}: 팔레트는 1~8색이어야 한다.`);
      }
      if (!quest.tools.brushSizes.length) problems.push(`${where}: 붓 크기가 없다.`);
      if (quest.tools.brushSizes.some((size) => size < 2)) {
        problems.push(`${where}: 1px 붓은 쓰지 않는다.`);
      }

      const total = Object.values(quest.scoring.weights)
        .reduce((sum, value) => sum + value, 0);
      if (Math.abs(total - 1) > 1e-9) {
        problems.push(`${where}: 채점 가중치 합이 1이 아니다 (${total}).`);
      }
      const fallbackTotal = Object.values(quest.scoring.fallbackWeights)
        .reduce((sum, value) => sum + value, 0);
      if (Math.abs(fallbackTotal - 1) > 1e-9) {
        problems.push(`${where}: CLIP 미사용 가중치 합이 1이 아니다 (${fallbackTotal}).`);
      }
      if (!(quest.scoring.passingScore >= 0 && quest.scoring.passingScore <= 100)) {
        problems.push(`${where}: 통과선이 0~100 밖이다.`);
      }

      const bundle = Bundles.get(quest.completion.bundleId);
      if (!bundle) {
        problems.push(`${where}: 완료 번들 ${quest.completion.bundleId} 이 없다.`);
        return;
      }
      if (!bundle.sceneIds.length) {
        problems.push(`${where}: 완료 번들에 장면이 없다.`);
      }
      const declared = graph.UNLOCKS[bundle.legacyCutsceneId] || [];
      const sortedUnlocks = quest.unlocks.questIds.slice().sort().join(",");
      if (sortedUnlocks !== declared.slice().sort().join(",")) {
        problems.push(`${where}: 해금 대상이 그래프와 다르다.`);
      }
      quest.unlocks.questIds.forEach((questId) => {
        const child = graph.get(questId);
        if (!child) {
          problems.push(`${where}: 없는 노드 ${questId} 를 연다.`);
          return;
        }
        if (!child.parents.includes(quest.id)) {
          problems.push(`${where}: ${questId} 의 부모가 아니다.`);
        }
      });
    });

    return problems;
  }

  const api = Object.freeze({
    list: () => DESCRIPTORS,
    ids: () => DESCRIPTORS.map((quest) => quest.id),
    get: (id) => byId.get(id) || null,
    has: (id) => byId.has(id),
    /** 복원 퀘스트로 등록됐는가. Q6 처럼 복원이 아닌 노드는 false. */
    isRegistered: (id) => byId.has(id),
    inLayer: (layer) => DESCRIPTORS.filter((quest) => quest.layer === layer),
    validate,
  });

  global.QuestRegistry = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
