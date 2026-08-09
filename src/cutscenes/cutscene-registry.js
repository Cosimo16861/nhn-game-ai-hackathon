/**
 * 컷신 장면 레지스트리 — 장면 ID → 재생 방법.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 5장
 *
 * 두 종류의 driver 가 있다.
 *   "beats"  공통 player 가 beat 데이터와 renderer 로 직접 재생한다. 새 정본이다.
 *   "legacy" 이미 자기 재생 루프를 가진 모듈(C0 인트로, C0B)을 감싼다.
 *            GAME_INTEGRATION_PLAN 5.3 의 마지막 단계에서 beats 로 흡수한다.
 *
 * 아직 이전하지 않은 묶음은 등록하지 않는다. 등록되지 않은 장면을 재생하려 하면
 * 조용히 넘어가지 않고 오류를 낸다.
 */
(function (global) {
  "use strict";

  const scenes = new Map();
  const rendererFactories = new Map();
  const rendererInstances = new Map();

  function registerRenderer(id, factory) {
    rendererFactories.set(id, factory);
  }

  function renderer(id) {
    if (!rendererInstances.has(id)) {
      const factory = rendererFactories.get(id);
      if (!factory) throw new Error(`등록되지 않은 컷신 렌더러: ${id}`);
      rendererInstances.set(id, factory());
    }
    return rendererInstances.get(id);
  }

  /** beat 데이터 묶음을 통째로 등록한다. scene.renderer 가 렌더러 ID 다. */
  function registerBeatScenes(sceneMap) {
    Object.values(sceneMap).forEach((scene) => {
      scenes.set(scene.id, { kind: "beats", scene });
    });
  }

  /**
   * 자기 재생 루프를 가진 구 모듈을 감싼다.
   * create(context) 는 { start(): Promise, advance(), finish(), dispose?() } 를 돌려준다.
   */
  function registerLegacyScene(sceneId, definition) {
    scenes.set(sceneId, { kind: "legacy", sceneId, ...definition });
  }

  function get(sceneId) {
    return scenes.get(sceneId) || null;
  }

  function require_(sceneId) {
    const entry = scenes.get(sceneId);
    if (!entry) {
      throw new Error(
        `컷신 장면 ${sceneId} 가 아직 제품 런타임에 등록되지 않았습니다. ` +
        "dev/cutscenes 의 제작본을 src/cutscenes 로 이전해야 합니다.",
      );
    }
    return entry;
  }

  global.CutsceneRegistry = Object.freeze({
    registerRenderer,
    registerBeatScenes,
    registerLegacyScene,
    renderer,
    get,
    require: require_,
    has: (sceneId) => scenes.has(sceneId),
    sceneIds: () => Array.from(scenes.keys()),
    disposeRenderers() {
      rendererInstances.forEach((instance) => instance.dispose?.());
      rendererInstances.clear();
    },
  });
})(typeof window !== "undefined" ? window : globalThis);
