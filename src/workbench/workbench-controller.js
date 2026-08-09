/**
 * 고해상도 복원 작업대 controller.
 * 근거: docs/GAME_INTEGRATION_PLAN.md 7장
 *
 * 구성
 *   화면    src/workbench.js  — 640×384 도트 작업대(승인된 디자인 그대로)
 *   그리기  HighResCanvas     — 1254² 원본 좌표, 폐곡선 잠금, 붓·채우기
 *   이력    PaintHistory      — fill-region / patch 명령, 최소 20단계
 *   채점    RestorationScorer — 색 + 채색률 + 선택적 CLIP, 관대한 통과선
 *   저장    ArtworkStore      — draft / final / thumbnail (IndexedDB)
 *
 * 제품 계약
 *   - 이미지는 assets/questimage 의 완성본·윤곽선 쌍만 쓴다.
 *   - 결과 수치는 노출하지 않는다. 정성 피드백만 보여 준다.
 *   - QA 도구는 HAVEN_DEBUG 에서만 만든다.
 *   - 제출 중에는 입력을 잠그고 취소할 수 없다.
 *   - 화면을 나가면 draft 를 자동 저장한다.
 */
(function (global) {
  "use strict";

  const THUMBNAIL_SIZE = 160;
  const DRAFT_DEBOUNCE_MS = 1200;

  const HIGHRES_TOOLS = Object.freeze([
    Object.freeze({ id: "brush16", icon: "pencil", label: "가는 붓 · 16px", tool: "brush", size: 16 }),
    Object.freeze({ id: "brush36", icon: "brush", label: "중간 붓 · 36px", tool: "brush", size: 36 }),
    Object.freeze({ id: "brush72", icon: "broad", label: "넓은 붓 · 72px", tool: "brush", size: 72 }),
    Object.freeze({ id: "fill", icon: "fill", label: "물감 채우기", tool: "fill", size: null }),
    Object.freeze({ id: "eraser", icon: "eraser", label: "지우개", tool: "eraser", size: null }),
  ]);

  function loadImage(source) {
    return global.AssetLoader.loadImage(source);
  }

  function imageDataOf(image, size) {
    const canvas = global.document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    return context.getImageData(0, 0, size, size);
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => {
      if (typeof canvas.toBlob !== "function") { resolve(null); return; }
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  function thumbnailOf(sourceCanvas) {
    const canvas = global.document.createElement("canvas");
    canvas.width = THUMBNAIL_SIZE;
    canvas.height = THUMBNAIL_SIZE;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceCanvas, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    return canvas;
  }

  /**
   * @param {HTMLElement} stage    작업대를 붙일 요소
   * @param {object} options
   *   contract, artworkStore, onPassed, onFailed, onBackToBoard, evaluateClip
   */
  function mount(stage, options) {
    const contract = options.contract;
    const resolution = contract.resolution;
    const artworkStore = options.artworkStore || null;

    const view = {
      title: contract.title,
      quotes: contract.witnessNotes.map((note) => ({
        speaker: note.speaker,
        text: note.text,
      })),
      visibleHintCount: Math.min(3, contract.witnessNotes.length),
      showBackButton: true,
      externalArtwork: true,
      tools: HIGHRES_TOOLS,
      palette: contract.palette.map((entry) => ({ name: entry.name, hex: entry.hex })),
      activeColor: contract.palette[0].hex,
      activeTool: "fill",
      brushSize: 36,
      zoom: 1,
      canUndo: false,
      canRedo: false,
      isSubmitting: false,
      feedback: "1254 원본과 폐곡선을 준비하는 중…",
    };

    const history = global.PaintHistory.create();
    let app = null;
    let surface = null;
    let regions = null;
    let targetImageData = null;
    let disposed = false;
    let submitting = false;
    let draftTimer = 0;
    let draftDirty = false;

    function render() {
      view.canUndo = history.canUndo();
      view.canRedo = history.canRedo();
      view.zoom = surface ? surface.getZoom() : 1;
      app.render(view);
      // Workbench.render 는 핫스팟 층을 통째로 비운다. 그리기 표면을 다시 얹는다.
      if (surface && surface.element.parentElement !== app.screen.hits) {
        app.screen.hits.appendChild(surface.element);
      }
    }

    function say(message) {
      view.feedback = message;
      render();
      app.screen.say(message);
    }

    // ── draft 자동 저장 ──────────────────────────────────────────────

    async function saveDraft() {
      draftDirty = false;
      if (!artworkStore || !surface || disposed) return;
      try {
        const blob = await canvasToBlob(surface.canvas);
        if (!blob) return;
        await artworkStore.saveDraft(contract.id, blob, {
          width: resolution, height: resolution,
        });
      } catch (error) {
        console.warn("[workbench] 작업 중 그림을 저장하지 못했습니다.", error);
      }
    }

    function scheduleDraftSave() {
      draftDirty = true;
      global.clearTimeout(draftTimer);
      draftTimer = global.setTimeout(saveDraft, DRAFT_DEBOUNCE_MS);
    }

    // ── 그리기 ───────────────────────────────────────────────────────

    function onStrokeCommitted(command) {
      history.push(command);
      scheduleDraftSave();
      render();
    }

    function undo() {
      const command = history.undo();
      if (!command) return;
      surface.applyCommand(command, "undo");
      scheduleDraftSave();
      say("한 단계 되돌렸다.");
    }

    function redo() {
      const command = history.redo();
      if (!command) return;
      surface.applyCommand(command, "redo");
      scheduleDraftSave();
      say("되돌린 작업을 다시 적용했다.");
    }

    function reset() {
      surface.reset();
      history.clear();
      scheduleDraftSave();
      say("새 종이를 준비했다.");
    }

    // ── 제출 ────────────────────────────────────────────────────────

    async function submit() {
      if (submitting || !surface || !targetImageData) return;
      submitting = true;
      view.isSubmitting = true;
      surface.setLocked(true);
      say("복원 기록을 봉인하는 중…");

      try {
        const composite = surface.composite();
        const restoredImageData = composite
          .getContext("2d", { willReadFrequently: true })
          .getImageData(0, 0, resolution, resolution);

        const result = await global.RestorationScorer.score({
          contract,
          targetImageData,
          restoredImageData,
          evaluationMask: regions.evaluationMask,
          evaluateClip: options.evaluateClip,
        });
        if (disposed) return;

        global.AssetLoader.mark(`submit_scored:${contract.id}`);
        if (global.HAVEN_DEBUG) console.info("[workbench] 채점", contract.id, result.debug);

        if (!result.cleared) {
          // 실패해도 그림은 그대로 남는다.
          submitting = false;
          view.isSubmitting = false;
          surface.setLocked(false);
          say(result.feedback);
          options.onFailed?.({ questId: contract.id, tier: result.tier });
          return;
        }

        await persistResult(composite);
        if (disposed) return;
        say(result.feedback);
        options.onPassed?.({ questId: contract.id, tier: result.tier });
      } catch (error) {
        console.error("[workbench] 제출에 실패했습니다.", error);
        submitting = false;
        view.isSubmitting = false;
        surface.setLocked(false);
        say("판정에 실패했다. 다시 제출해 보자.");
      }
    }

    /** 통과 시 완성본과 증거판 썸네일을 남긴다. 정답 이미지는 저장하지 않는다. */
    async function persistResult(composite) {
      if (!artworkStore) return;
      try {
        const finalBlob = await canvasToBlob(composite);
        if (finalBlob) {
          await artworkStore.saveFinal(contract.id, finalBlob, {
            width: resolution, height: resolution,
          });
        }
        const thumbBlob = await canvasToBlob(thumbnailOf(composite));
        if (thumbBlob) {
          await artworkStore.saveThumbnail(contract.id, thumbBlob, {
            width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE,
          });
        }
        await artworkStore.removeDraft(contract.id);
      } catch (error) {
        console.warn("[workbench] 완성본을 저장하지 못했습니다.", error);
      }
    }

    // ── 조작 ────────────────────────────────────────────────────────

    function handleAction(action) {
      if (submitting && action.type !== "back-to-board") return;
      if (action.type === "select-color") {
        view.activeColor = action.hex;
        surface?.setColor(action.hex);
        // 색만 골라도 도구는 바뀌지 않는다. 지우개였을 때만 채우기로 돌아온다.
        if (view.activeTool === "eraser") {
          view.activeTool = "fill";
          surface?.setTool("fill");
        }
        render();
        return;
      }
      if (action.type === "select-tool") {
        view.activeTool = action.tool;
        if (action.size != null) view.brushSize = action.size;
        surface?.setTool(action.tool);
        if (action.size != null) surface?.setBrushSize(action.size);
        render();
        return;
      }
      if (action.type === "undo") { undo(); return; }
      if (action.type === "redo") { redo(); return; }
      if (action.type === "reset") { reset(); return; }
      if (action.type === "zoom-in") { surface?.zoomBy(0.2); render(); return; }
      if (action.type === "zoom-out") { surface?.zoomBy(-0.2); render(); return; }
      if (action.type === "submit") { submit(); return; }
      if (action.type === "back-to-board") {
        if (submitting) return;
        options.onBackToBoard?.();
      }
    }

    // ── 시작 ────────────────────────────────────────────────────────

    async function start() {
      app = global.Workbench.mount(stage, {
        reserveHeight: options.reserveHeight ?? 54,
        onAction: handleAction,
      });
      render();

      const [targetImage, outlineImage] = await Promise.all([
        loadImage(contract.targetSource),
        loadImage(contract.outlineSource),
      ]);
      if (disposed) return;

      const outlineImageData = imageDataOf(outlineImage, resolution);
      targetImageData = imageDataOf(targetImage, resolution);

      global.AssetLoader.mark(`quest_assets_ready:${contract.id}`);
      regions = global.ClosedRegions.analyze(outlineImageData);
      global.AssetLoader.mark(`region_map_ready:${contract.id}`);
      if (disposed) return;

      surface = global.HighResCanvas.create(app.screen.hits, {
        resolution,
        regions,
        initialColor: view.activeColor,
        onStrokeCommitted,
        onZoomChanged: () => { view.zoom = surface.getZoom(); },
      });
      surface.initialize(outlineImageData);
      surface.setTool(view.activeTool);
      surface.setColor(view.activeColor);
      surface.setBrushSize(view.brushSize);

      const resumed = await restoreDraft();
      if (disposed) return;

      say(resumed
        ? "지난번에 칠하던 곳부터 이어서 그리자."
        : "검은 선 안을 채우고, 큰 붓으로 정리하자.");
    }

    /** 저장된 draft 가 있으면 되살린다. 되살렸으면 true. */
    async function restoreDraft() {
      if (!artworkStore) return false;
      try {
        const record = await artworkStore.loadDraft(contract.id);
        if (!record?.blob || disposed) return false;
        const bitmap = typeof global.createImageBitmap === "function"
          ? await global.createImageBitmap(record.blob)
          : null;
        if (!bitmap || disposed) return false;
        surface.restoreFrom(bitmap);
        bitmap.close?.();
        return true;
      } catch (error) {
        console.warn("[workbench] 작업 중 그림을 되살리지 못했습니다.", error);
        return false;
      }
    }

    const ready = start().catch((error) => {
      console.error("[workbench] 작업대를 열지 못했습니다.", error);
      if (!disposed) say("자산을 불러오지 못했다.");
      throw error;
    });

    return Object.freeze({
      questId: contract.id,
      ready,
      getRegionCount: () => regions?.regionCount || 0,
      getHistoryDepth: () => history.depth(),
      dispose() {
        disposed = true;
        global.clearTimeout(draftTimer);
        // 화면을 나가면 작업 중인 그림을 잃지 않는다.
        if (draftDirty) saveDraft();
        surface?.dispose();
        surface = null;
        app?.destroy();
        app = null;
        history.clear();
        targetImageData = null;
        regions = null;
      },
    });
  }

  global.HighResWorkbench = Object.freeze({ HIGHRES_TOOLS, THUMBNAIL_SIZE, mount });
})(typeof window !== "undefined" ? window : globalThis);
