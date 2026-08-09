/**
 * 오프닝 두 장면(C0_INTRO, C0B_THE_JOB)을 공통 player 인터페이스로 감싼다.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 5.3 마지막 단계
 *
 * 두 모듈은 이미 승인·검증된 자기 재생 루프를 갖고 있다. 통합 중에 시각을
 * 다시 만들지 않고 adapter 로만 붙인다. beat 데이터 추출은 나머지 묶음이
 * 전부 이전된 뒤에 한다.
 */
(function (global) {
  "use strict";

  function adapt(moduleName) {
    return function create(context, onComplete) {
      const factory = global[moduleName];
      if (!factory) throw new Error(`${moduleName} 모듈이 로드되지 않았습니다.`);
      const session = factory.create({
        art: context.artCanvas,
        textCanvas: context.textCanvas,
        progress: context.progress,
        live: context.live,
        onComplete,
      });
      return {
        start: () => session.start(),
        advance: () => session.advance(),
        finish: () => session.finish(),
        dispose: () => {},
      };
    };
  }

  function register(registry = global.CutsceneRegistry) {
    if (!registry) return;
    registry.registerLegacyScene("C0_INTRO", { create: adapt("C0IntroCutscene") });
    registry.registerLegacyScene("C0B_THE_JOB", { create: adapt("C0BCutscene") });
  }

  global.LegacyOpeningScenes = Object.freeze({ register });
  register();
})(typeof window !== "undefined" ? window : globalThis);
