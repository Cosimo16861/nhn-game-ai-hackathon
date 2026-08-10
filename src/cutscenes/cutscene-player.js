/**
 * 공통 컷신 플레이어.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 5.1
 *
 * 책임
 *   - 자산 preload 와 실패 보고
 *   - bundle playlist 순서와 장면 사이 전환
 *   - beat 시간과 진행 표시
 *   - 타자 효과, SPACE(문장 완성/다음), ESC(이미 본 장면만 skip), R(처음부터)
 *   - 입력 잠금, pause/resume, 탭 비활성 처리
 *   - onSceneComplete / onBundleComplete / onError
 *
 * 시각 렌더링은 renderer 가 맡는다. 여기서 그림을 그리지 않는다.
 * 오류가 난 장면은 완료로 기록하지 않는다 — onError 만 부르고 멈춘다.
 */
(function (global) {
  "use strict";

  const T = global.CutsceneText;
  const INPUT_LOCK_MS = 120;
  const SCENE_GAP_MS = 720;

  /**
   * 조건부 beat — 형제 노드를 어떤 순서로 깼는지에 따라 대사가 달라진다.
   * 검토본은 URL fixture(`?q5a=1`)로 흉내 냈지만 제품은 실제 진행 상태를 쓴다
   * (GAME_INTEGRATION_PLAN 9.2 "fixture 제거").
   *
   *   when: { cleared: ["Q3A_SEAL"] }     그 퀘스트를 통과했을 때만 재생
   *   when: { notCleared: ["Q3A_SEAL"] }  아직 통과하지 않았을 때만 재생
   */
  function beatApplies(beat, isQuestCleared) {
    const when = beat.when;
    if (!when) return true;
    if (when.cleared && !when.cleared.every((id) => isQuestCleared(id))) return false;
    if (when.notCleared && when.notCleared.some((id) => isQuestCleared(id))) return false;
    return true;
  }

  /** 조건을 적용해 이번 재생에 실제로 나올 beat 목록을 확정한다. */
  function resolveBeats(scene, isQuestCleared) {
    if (!scene.beats.some((beat) => beat.when)) return scene.beats;
    return scene.beats.filter((beat) => beatApplies(beat, isQuestCleared));
  }

  function totalDuration(scene) {
    return scene.beats.reduce((sum, beat) => sum + beat.duration, 0);
  }

  function beatAt(scene, elapsed) {
    let cursor = 0;
    for (let index = 0; index < scene.beats.length; index += 1) {
      if (elapsed < cursor + scene.beats[index].duration) {
        return { index, local: elapsed - cursor, cursor };
      }
      cursor += scene.beats[index].duration;
    }
    const lastIndex = scene.beats.length - 1;
    return {
      index: lastIndex,
      local: scene.beats[lastIndex].duration,
      cursor: totalDuration(scene) - scene.beats[lastIndex].duration,
    };
  }

  /**
   * @param {object} options
   *   artCanvas, textCanvas — 640×384 / 1920×1152
   *   registry              — CutsceneRegistry
   *   assetLoader           — AssetLoader
   *   live                  — aria-live 요소(선택)
   *   progress              — 진행 막대 요소(선택)
   *   isSceneSeen(sceneId)  — ESC 스킵 허용 여부
   *   onSceneComplete, onBundleComplete, onError, onBeat
   */
  function create(options) {
    const artCanvas = options.artCanvas;
    const textCanvas = options.textCanvas;
    const ctx = artCanvas.getContext("2d");
    const textCtx = textCanvas.getContext("2d");
    const registry = options.registry || global.CutsceneRegistry;
    const assetLoader = options.assetLoader || global.AssetLoader;
    const isSceneSeen = options.isSceneSeen || (() => false);
    // 조건부 beat 판정에 쓰는 진행 상태. 검토 페이지는 항상 false 를 준다.
    const isQuestCleared = options.isQuestCleared || (() => false);

    ctx.imageSmoothingEnabled = false;
    textCtx.imageSmoothingEnabled = false;

    let bundle = null;
    let playlist = [];
    let playlistIndex = 0;
    let entry = null;
    let scene = null;
    let activeRenderer = null;
    let legacySession = null;

    let running = false;
    let paused = false;
    let disposed = false;
    let frame = 0;
    let transitionTimer = 0;
    let startedAt = 0;
    let pausedAt = 0;
    let beatIndex = -1;
    let forceCompleteText = false;
    let inputLockedUntil = 0;
    let resolveBundle = null;
    let rejectBundle = null;

    const renderContext = { ctx, textCtx, artCanvas, textCanvas };

    function say(text) {
      if (options.live) options.live.textContent = text;
    }

    function setProgress(ratio) {
      if (options.progress) {
        options.progress.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      }
    }

    function stopLoop() {
      if (frame) global.cancelAnimationFrame(frame);
      frame = 0;
      global.clearTimeout(transitionTimer);
      transitionTimer = 0;
    }

    function fail(error) {
      stopLoop();
      running = false;
      options.onError?.(error, { bundleId: bundle?.id, sceneId: scene?.id });
      if (rejectBundle) {
        const reject = rejectBundle;
        resolveBundle = null;
        rejectBundle = null;
        reject(error);
      }
    }

    function drawFrame(local, now) {
      const beat = scene.beats[beatIndex];
      const style = activeRenderer.speakerStyle
        ? activeRenderer.speakerStyle(beat.speaker)
        : T.defaultSpeakerStyle(beat.speaker);
      // 비·불·먼지처럼 절대 시각에 매인 효과를 위해 now 도 함께 넘긴다.
      renderContext.now = now;
      renderContext.local = local;
      const width = activeRenderer.nameBoxWidth
        ? activeRenderer.nameBoxWidth(beat.speaker)
        : T.nameBoxWidth(beat.speaker);
      activeRenderer.renderBeat(scene, beat, local, renderContext);
      T.drawDialogueBox(ctx, beat, style, width);
      T.clear(textCtx, textCanvas);
      textCtx.textBaseline = "top";
      activeRenderer.renderTextOverlay?.(scene, beat, renderContext);
      T.drawDialogueText(textCtx, beat, local, forceCompleteText, style, width);
    }

    function tick(now) {
      if (!running || paused || disposed) return;
      const elapsed = now - startedAt;
      const duration = totalDuration(scene);
      if (elapsed >= duration) {
        completeScene(false);
        return;
      }
      const current = beatAt(scene, elapsed);
      if (current.index !== beatIndex) {
        beatIndex = current.index;
        forceCompleteText = false;
        say(`${scene.beats[beatIndex].speaker}: ${scene.beats[beatIndex].text}`);
        options.onBeat?.(scene, scene.beats[beatIndex], beatIndex);
      }
      try {
        drawFrame(current.local, now);
      } catch (error) {
        fail(error);
        return;
      }
      setProgress((playlistIndex + elapsed / duration) / playlist.length);
      frame = global.requestAnimationFrame(tick);
    }

    function completeScene(skipped) {
      if (!running) return;
      stopLoop();
      running = false;
      const finished = scene;
      activeRenderer?.leaveScene?.(finished, renderContext);
      legacySession?.dispose?.();
      legacySession = null;
      options.onSceneComplete?.(finished.id, { skipped, bundleId: bundle?.id });
      if (playlistIndex < playlist.length - 1) {
        playlistIndex += 1;
        transitionTimer = global.setTimeout(() => {
          startScene(playlist[playlistIndex]).catch(fail);
        }, SCENE_GAP_MS);
        return;
      }
      setProgress(1);
      const resolve = resolveBundle;
      resolveBundle = null;
      rejectBundle = null;
      options.onBundleComplete?.(bundle, { skipped });
      resolve?.({ bundleId: bundle?.id, skipped });
    }

    async function startScene(sceneId) {
      stopLoop();
      entry = registry.require(sceneId);

      if (entry.kind === "legacy") {
        // 구 모듈은 자기 재생 루프를 돌리고 끝날 때 onComplete 를 부른다.
        let settled = false;
        const finishOnce = (info) => {
          if (settled) return;
          settled = true;
          completeScene(Boolean(info && info.skipped));
        };
        scene = { id: sceneId, beats: [] };
        activeRenderer = null;
        legacySession = entry.create({
          artCanvas,
          textCanvas,
          live: options.live,
          progress: options.progress,
        }, finishOnce);
        running = true;
        await legacySession.start();
        return;
      }

      // 조건부 beat 를 이번 재생 기준으로 확정한다.
      const source = entry.scene;
      scene = Object.freeze({
        ...source,
        beats: resolveBeats(source, isQuestCleared),
      });
      activeRenderer = registry.renderer(scene.renderer);
      await activeRenderer.preload(assetLoader);
      assetLoader.mark?.(`cutscene_assets_ready:${scene.id}`);
      if (disposed) return;

      activeRenderer.enterScene(scene, renderContext);
      running = true;
      paused = false;
      beatIndex = 0;
      forceCompleteText = false;
      inputLockedUntil = 0;
      startedAt = global.performance.now();
      say(`${scene.beats[0].speaker}: ${scene.beats[0].text}`);
      options.onBeat?.(scene, scene.beats[0], 0);
      frame = global.requestAnimationFrame(tick);
    }

    /** 번들 하나를 처음부터 재생한다. 모든 장면이 끝나야 resolve 한다. */
    function playBundle(target) {
      const resolved = typeof target === "string"
        ? global.CompletionBundles.get(target)
        : target;
      if (!resolved) throw new Error(`알 수 없는 완료 번들: ${target}`);
      stopLoop();
      bundle = resolved;
      playlist = resolved.sceneIds.slice();
      playlistIndex = 0;
      setProgress(0);
      return new Promise((resolve, reject) => {
        resolveBundle = resolve;
        rejectBundle = reject;
        startScene(playlist[0]).catch(fail);
      });
    }

    // ── 입력 ───────────────────────────────────────────────────────
    function advance() {
      if (legacySession) { legacySession.advance?.(); return; }
      if (!running || paused || !scene) return;
      const now = global.performance.now();
      if (now < inputLockedUntil) return;
      const current = beatAt(scene, now - startedAt);
      const beat = scene.beats[current.index];
      if (current.local < (beat.visualLock || 0)) return;
      const typed = T.typedLength(beat, current.local, false);
      if (!forceCompleteText && typed < beat.text.length) {
        forceCompleteText = true;
        inputLockedUntil = now + INPUT_LOCK_MS;
        return;
      }
      if (current.index >= scene.beats.length - 1) {
        completeScene(false);
        return;
      }
      startedAt = now - (current.cursor + beat.duration + 1);
      beatIndex = current.index + 1;
      forceCompleteText = false;
      inputLockedUntil = now + INPUT_LOCK_MS;
      say(`${scene.beats[beatIndex].speaker}: ${scene.beats[beatIndex].text}`);
    }

    /** ESC. 이미 끝까지 본 장면만 건너뛸 수 있다. */
    function skip() {
      if (!scene) return false;
      if (!isSceneSeen(scene.id)) return false;
      if (legacySession) { legacySession.finish?.(); return true; }
      completeScene(true);
      return true;
    }

    /** R. 현재 번들을 처음부터. 진행 중인 playBundle 약속은 그대로 유지한다. */
    function restart() {
      if (!bundle) return;
      stopLoop();
      running = false;
      legacySession?.dispose?.();
      legacySession = null;
      playlistIndex = 0;
      setProgress(0);
      startScene(playlist[0]).catch(fail);
    }

    function pause() {
      if (!running || paused) return;
      paused = true;
      pausedAt = global.performance.now();
      stopLoop();
    }

    function resume() {
      if (!running || !paused) return;
      paused = false;
      startedAt += global.performance.now() - pausedAt;
      frame = global.requestAnimationFrame(tick);
    }

    function dispose() {
      disposed = true;
      stopLoop();
      running = false;
      activeRenderer?.leaveScene?.(scene, renderContext);
      legacySession?.dispose?.();
      legacySession = null;
      activeRenderer = null;
      scene = null;
      bundle = null;
      resolveBundle = null;
      rejectBundle = null;
    }

    return Object.freeze({
      playBundle,
      advance,
      skip,
      restart,
      pause,
      resume,
      dispose,
      isRunning: () => running,
      currentSceneId: () => scene?.id || null,
      currentBundleId: () => bundle?.id || null,
      /** 읽기 전용 진단. E2E 와 콘솔용이며 제품 UI 는 쓰지 않는다. */
      debugState: () => ({
        running,
        paused,
        disposed,
        legacy: Boolean(legacySession),
        bundleId: bundle?.id || null,
        sceneId: scene?.id || null,
        playlistIndex,
        beatIndex,
        beatCount: scene?.beats?.length ?? null,
        elapsed: running ? global.performance.now() - startedAt : null,
        duration: scene?.beats?.length ? totalDuration(scene) : null,
      }),
    });
  }

  global.CutscenePlayer = Object.freeze({
    create, totalDuration, beatAt, resolveBeats, beatApplies, SCENE_GAP_MS,
  });
})(typeof window !== "undefined" ? window : globalThis);
