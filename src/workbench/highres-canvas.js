/**
 * 고해상도 복원 표면.
 * 근거: docs/RESTORATION_QUEST_SPEC.md 3장, GAME_INTEGRATION_PLAN 7.1·7.3
 *
 * 계약
 *   - 내부 캔버스는 항상 1254×1254 원본이다. 축소 저장하지 않는다.
 *   - 화면 표시 크기와 캔버스 좌표계를 분리한다. 포인터는 원본 좌표로 환산한다.
 *   - 붓·지우개·채우기는 누르기 시작한 폐곡선 밖으로 넘어가지 않는다.
 *   - 1px 붓은 없다. 지름은 16·36·72px 다.
 *   - 확대는 60~160%. 확대해도 내부 픽셀을 재표본화하지 않는다.
 *
 * 이력 메모리
 *   stroke 하나는 이력 하나다. 1254² 전체 스냅샷 대신 실제로 지나간 64×64 타일만
 *   before/after 로 뜬다. 큰 배경 영역을 칠해도 이력이 캔버스 전체 크기로 커지지 않는다.
 *
 * 이 모듈은 그리기만 한다. 채점·저장·화면 전환은 controller 가 맡는다.
 */
(function (global) {
  "use strict";

  const WHITE = Object.freeze([255, 255, 255, 255]);
  // 아래 값은 계약이 없을 때의 최후 기본값이다. 정상 경로에서는 퀘스트 계약
  // (questimage-quests.js 의 DEFAULT_TOOLS / 퀘스트별 override)이 넘어온다.
  const BRUSH_SIZES = Object.freeze([16, 36, 72]);
  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 1.6;
  const ZOOM_STEP = 0.2;
  const TILE = 64;

  function hexToRgb(hex) {
    const normalized = String(hex).replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
      255,
    ];
  }

  function create(host, options) {
    const resolution = options.resolution;
    const regions = options.regions;
    const onStrokeCommitted = options.onStrokeCommitted || (() => {});
    const onZoomChanged = options.onZoomChanged || (() => {});
    const tilesPerRow = Math.ceil(resolution / TILE);
    // 확대 범위와 붓 크기는 퀘스트 계약에서 온다.
    const zoomBounds = options.zoom || { min: ZOOM_MIN, max: ZOOM_MAX, step: ZOOM_STEP };
    const brushSizes = options.brushSizes || BRUSH_SIZES;

    const viewport = global.document.createElement("div");
    viewport.className = "highres-viewport";
    const stack = global.document.createElement("div");
    stack.className = "highres-stack";

    const paintCanvas = global.document.createElement("canvas");
    paintCanvas.className = "highres-paint";
    paintCanvas.width = resolution;
    paintCanvas.height = resolution;
    paintCanvas.setAttribute("role", "application");
    paintCanvas.setAttribute("tabindex", "0");
    paintCanvas.setAttribute(
      "aria-label",
      `${resolution} 곱하기 ${resolution} 복원 그림. 색과 도구를 고른 뒤 폐곡선 안을 채우세요.`,
    );

    const outlineCanvas = global.document.createElement("canvas");
    outlineCanvas.className = "highres-outline";
    outlineCanvas.width = resolution;
    outlineCanvas.height = resolution;
    outlineCanvas.setAttribute("aria-hidden", "true");

    stack.append(paintCanvas, outlineCanvas);
    viewport.appendChild(stack);
    host.appendChild(viewport);

    const paintContext = paintCanvas.getContext("2d", { willReadFrequently: true });
    let imageData = paintContext.createImageData(resolution, resolution);
    let tool = options.defaultTool || "fill";
    let color = options.initialColor;
    let brushSize = options.defaultBrushSize || brushSizes[Math.floor(brushSizes.length / 2)];
    let zoom = 1;
    let panX = 0.5;
    let panY = 0.5;
    let locked = false;

    let painting = false;
    let panning = false;
    let panOrigin = null;
    let strokeRegionId = -1;
    let strokeTiles = null;
    let strokeDirty = null;
    let lastPoint = null;

    // ── 픽셀 ─────────────────────────────────────────────────────────

    function clearToPaper() {
      const data = imageData.data;
      for (let offset = 0; offset < data.length; offset += 4) {
        data[offset] = WHITE[0];
        data[offset + 1] = WHITE[1];
        data[offset + 2] = WHITE[2];
        data[offset + 3] = WHITE[3];
      }
      paintContext.putImageData(imageData, 0, 0);
    }

    function drawOutline(outlineImageData) {
      const context = outlineCanvas.getContext("2d", { willReadFrequently: true });
      const transparent = context.createImageData(resolution, resolution);
      const mask = regions.evaluationMask;
      for (let index = 0; index < mask.length; index += 1) {
        if (mask[index]) continue;
        const offset = index * 4;
        transparent.data[offset] = outlineImageData.data[offset];
        transparent.data[offset + 1] = outlineImageData.data[offset + 1];
        transparent.data[offset + 2] = outlineImageData.data[offset + 2];
        transparent.data[offset + 3] = 255;
      }
      context.putImageData(transparent, 0, 0);
    }

    function writePixel(index, rgba) {
      const offset = index * 4;
      imageData.data[offset] = rgba[0];
      imageData.data[offset + 1] = rgba[1];
      imageData.data[offset + 2] = rgba[2];
      imageData.data[offset + 3] = rgba[3];
    }

    function boxOfTile(tileIndex) {
      const tx = tileIndex % tilesPerRow;
      const ty = (tileIndex - tx) / tilesPerRow;
      return {
        x0: tx * TILE,
        y0: ty * TILE,
        x1: Math.min(resolution - 1, tx * TILE + TILE - 1),
        y1: Math.min(resolution - 1, ty * TILE + TILE - 1),
      };
    }

    function copyRect(box) {
      const width = box.x1 - box.x0 + 1;
      const buffer = new Uint8ClampedArray(width * (box.y1 - box.y0 + 1) * 4);
      const data = imageData.data;
      let cursor = 0;
      for (let y = box.y0; y <= box.y1; y += 1) {
        const rowStart = (y * resolution + box.x0) * 4;
        buffer.set(data.subarray(rowStart, rowStart + width * 4), cursor);
        cursor += width * 4;
      }
      return buffer;
    }

    function pasteRect(box, buffer) {
      const width = box.x1 - box.x0 + 1;
      const data = imageData.data;
      let cursor = 0;
      for (let y = box.y0; y <= box.y1; y += 1) {
        const rowStart = (y * resolution + box.x0) * 4;
        data.set(buffer.subarray(cursor, cursor + width * 4), rowStart);
        cursor += width * 4;
      }
    }

    function flush(box) {
      if (!box) return;
      paintContext.putImageData(
        imageData, 0, 0,
        box.x0, box.y0, box.x1 - box.x0 + 1, box.y1 - box.y0 + 1,
      );
    }

    function mergeBox(a, b) {
      if (!a) return b;
      if (!b) return a;
      return {
        x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0),
        x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
      };
    }

    /** 손대기 전 타일 상태를 한 번만 뜬다. 같은 타일을 두 번 뜨지 않는다. */
    function snapshotTiles(box, store) {
      const firstTx = Math.floor(box.x0 / TILE);
      const lastTx = Math.floor(box.x1 / TILE);
      const firstTy = Math.floor(box.y0 / TILE);
      const lastTy = Math.floor(box.y1 / TILE);
      for (let ty = firstTy; ty <= lastTy; ty += 1) {
        for (let tx = firstTx; tx <= lastTx; tx += 1) {
          const tileIndex = ty * tilesPerRow + tx;
          if (store.has(tileIndex)) continue;
          const tileBox = boxOfTile(tileIndex);
          store.set(tileIndex, { box: tileBox, before: copyRect(tileBox) });
        }
      }
    }

    function sealTiles(store) {
      const tiles = [];
      store.forEach((tile) => {
        tiles.push({ box: tile.box, before: tile.before, after: copyRect(tile.box) });
      });
      return tiles;
    }

    // ── 확대·이동 ────────────────────────────────────────────────────

    function applyZoom() {
      // 확대해도 내부 픽셀은 그대로다. 표시 배율만 바꾼다.
      stack.style.transform = `scale(${zoom})`;
      stack.style.transformOrigin = `${panX * 100}% ${panY * 100}%`;
      onZoomChanged(zoom);
    }

    /** 화면 좌표 → 1254 원본 좌표. 표시 크기와 좌표계를 분리하는 지점이다. */
    function pointFromEvent(event) {
      const rect = paintCanvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(resolution - 1,
          Math.floor(((event.clientX - rect.left) / rect.width) * resolution))),
        y: Math.max(0, Math.min(resolution - 1,
          Math.floor(((event.clientY - rect.top) / rect.height) * resolution))),
      };
    }

    function currentRgba() {
      return tool === "eraser" ? WHITE : hexToRgb(color);
    }

    // ── 채우기 ───────────────────────────────────────────────────────

    function fillRegion(point, rgba) {
      const startIndex = point.y * resolution + point.x;
      const regionId = regions.regionOf[startIndex];
      if (regionId < 0) return null;

      const regionOf = regions.regionOf;
      const data = imageData.data;
      const bounds = regions.regionBounds[regionId];
      const box = { x0: bounds.x0, y0: bounds.y0, x1: bounds.x1, y1: bounds.y1 };
      const firstOffset = startIndex * 4;
      const first = [
        data[firstOffset], data[firstOffset + 1],
        data[firstOffset + 2], data[firstOffset + 3],
      ];

      let uniform = true;
      for (let y = box.y0; y <= box.y1 && uniform; y += 1) {
        for (let x = box.x0; x <= box.x1; x += 1) {
          const index = y * resolution + x;
          if (regionOf[index] !== regionId) continue;
          const offset = index * 4;
          if (
            data[offset] !== first[0] || data[offset + 1] !== first[1] ||
            data[offset + 2] !== first[2] || data[offset + 3] !== first[3]
          ) { uniform = false; break; }
        }
      }

      // 얼룩진 영역만 타일을 뜬다. 단색이면 색 하나로 되돌릴 수 있다.
      const store = new Map();
      if (!uniform) snapshotTiles(box, store);

      for (let y = box.y0; y <= box.y1; y += 1) {
        for (let x = box.x0; x <= box.x1; x += 1) {
          const index = y * resolution + x;
          if (regionOf[index] === regionId) writePixel(index, rgba);
        }
      }
      flush(box);

      if (uniform) {
        return { type: "fill-region", regionId, box, before: first, after: rgba.slice() };
      }
      return {
        type: "patch",
        x: box.x0, y: box.y0,
        width: box.x1 - box.x0 + 1, height: box.y1 - box.y0 + 1,
        tiles: sealTiles(store),
      };
    }

    // ── 붓·지우개 ────────────────────────────────────────────────────

    function brushAt(point, rgba, regionId, store) {
      const radius = brushSize / 2;
      const x0 = Math.max(0, Math.floor(point.x - radius));
      const y0 = Math.max(0, Math.floor(point.y - radius));
      const x1 = Math.min(resolution - 1, Math.ceil(point.x + radius));
      const y1 = Math.min(resolution - 1, Math.ceil(point.y + radius));
      snapshotTiles({ x0, y0, x1, y1 }, store);

      const squared = radius * radius;
      let touched = false;
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = x - point.x;
          const dy = y - point.y;
          if (dx * dx + dy * dy > squared) continue;
          const index = y * resolution + x;
          // 누르기 시작한 폐곡선 밖으로 넘어가지 않는다.
          if (regions.regionOf[index] !== regionId) continue;
          writePixel(index, rgba);
          touched = true;
        }
      }
      return touched ? { x0, y0, x1, y1 } : null;
    }

    function brushSegment(from, to, rgba, regionId, store) {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(2, brushSize * 0.3)));
      let dirty = null;
      for (let step = 0; step <= steps; step += 1) {
        const ratio = step / steps;
        dirty = mergeBox(dirty, brushAt({
          x: Math.round(from.x + (to.x - from.x) * ratio),
          y: Math.round(from.y + (to.y - from.y) * ratio),
        }, rgba, regionId, store));
      }
      return dirty;
    }

    function beginStroke(point) {
      const regionId = regions.regionOf[point.y * resolution + point.x];
      if (regionId < 0) return false;
      strokeRegionId = regionId;
      strokeTiles = new Map();
      strokeDirty = null;
      lastPoint = point;
      const dirty = brushSegment(point, point, currentRgba(), regionId, strokeTiles);
      strokeDirty = mergeBox(strokeDirty, dirty);
      flush(dirty);
      return true;
    }

    function continueStroke(point) {
      if (!painting || strokeRegionId < 0) return;
      const dirty = brushSegment(lastPoint, point, currentRgba(), strokeRegionId, strokeTiles);
      strokeDirty = mergeBox(strokeDirty, dirty);
      lastPoint = point;
      flush(dirty);
    }

    function endStroke() {
      const dirty = strokeDirty;
      const store = strokeTiles;
      painting = false;
      strokeRegionId = -1;
      strokeTiles = null;
      strokeDirty = null;
      lastPoint = null;
      if (!dirty || !store) return null;
      return {
        type: "patch",
        x: dirty.x0, y: dirty.y0,
        width: dirty.x1 - dirty.x0 + 1, height: dirty.y1 - dirty.y0 + 1,
        tiles: sealTiles(store),
      };
    }

    // ── 이력 적용 ────────────────────────────────────────────────────

    function applyCommand(command, direction) {
      if (command.type === "fill-region") {
        const value = direction === "undo" ? command.before : command.after;
        const regionOf = regions.regionOf;
        for (let y = command.box.y0; y <= command.box.y1; y += 1) {
          for (let x = command.box.x0; x <= command.box.x1; x += 1) {
            const index = y * resolution + x;
            if (regionOf[index] === command.regionId) writePixel(index, value);
          }
        }
        flush(command.box);
        return;
      }
      command.tiles.forEach((tile) => {
        pasteRect(tile.box, direction === "undo" ? tile.before : tile.after);
      });
      flush({
        x0: command.x, y0: command.y,
        x1: command.x + command.width - 1, y1: command.y + command.height - 1,
      });
    }

    // ── 입력 ─────────────────────────────────────────────────────────

    function onPointerDown(event) {
      if (locked) return;
      if (event.button !== 0 && event.button !== 1) return;
      paintCanvas.focus({ preventScroll: true });

      // Shift 또는 가운데 버튼은 확대 상태에서 화면을 옮긴다. 그리지 않는다.
      if (event.shiftKey || event.button === 1) {
        panning = true;
        panOrigin = { x: event.clientX, y: event.clientY, panX, panY };
        paintCanvas.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const point = pointFromEvent(event);

      if (tool === "fill") {
        const command = fillRegion(point, currentRgba());
        if (command) onStrokeCommitted(command);
        return;
      }

      painting = beginStroke(point);
      if (painting) paintCanvas.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      if (panning && panOrigin) {
        const rect = viewport.getBoundingClientRect();
        panX = Math.max(0, Math.min(1,
          panOrigin.panX - (event.clientX - panOrigin.x) / Math.max(1, rect.width)));
        panY = Math.max(0, Math.min(1,
          panOrigin.panY - (event.clientY - panOrigin.y) / Math.max(1, rect.height)));
        applyZoom();
        return;
      }
      if (!painting) return;
      continueStroke(pointFromEvent(event));
    }

    function onPointerUp() {
      if (panning) {
        panning = false;
        panOrigin = null;
        return;
      }
      if (!painting) return;
      const command = endStroke();
      if (command) onStrokeCommitted(command);
    }

    paintCanvas.addEventListener("pointerdown", onPointerDown);
    paintCanvas.addEventListener("pointermove", onPointerMove);
    paintCanvas.addEventListener("pointerup", onPointerUp);
    paintCanvas.addEventListener("pointercancel", onPointerUp);
    paintCanvas.addEventListener("pointerleave", onPointerUp);

    return Object.freeze({
      element: viewport,
      canvas: paintCanvas,
      brushSizes,

      initialize(outlineImageData) {
        drawOutline(outlineImageData);
        clearToPaper();
        applyZoom();
      },

      /** 저장된 draft 를 작업면에 되살린다. 원본 해상도로만 받는다. */
      restoreFrom(source) {
        paintContext.clearRect(0, 0, resolution, resolution);
        paintContext.drawImage(source, 0, 0, resolution, resolution);
        imageData = paintContext.getImageData(0, 0, resolution, resolution);
      },

      reset() { clearToPaper(); },

      setTool(nextTool) { tool = nextTool; },
      setColor(nextColor) { color = nextColor; },
      setBrushSize(size) { brushSize = size; },
      setLocked(next) {
        locked = Boolean(next);
        paintCanvas.style.cursor = locked ? "progress" : "crosshair";
      },

      zoomBy(delta) {
        const step = delta || zoomBounds.step;
        const next = Math.max(zoomBounds.min, Math.min(zoomBounds.max,
          Math.round((zoom + step) * 100) / 100));
        if (next === zoom) return zoom;
        zoom = next;
        applyZoom();
        return zoom;
      },
      getZoom: () => zoom,

      applyCommand,
      getImageData: () => imageData,

      /** 채점·저장용 합성본. 플레이어의 색 위에 잠긴 선을 다시 얹는다. */
      composite() {
        const canvas = global.document.createElement("canvas");
        canvas.width = resolution;
        canvas.height = resolution;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(paintCanvas, 0, 0);
        context.drawImage(outlineCanvas, 0, 0);
        return canvas;
      },

      dispose() {
        paintCanvas.removeEventListener("pointerdown", onPointerDown);
        paintCanvas.removeEventListener("pointermove", onPointerMove);
        paintCanvas.removeEventListener("pointerup", onPointerUp);
        paintCanvas.removeEventListener("pointercancel", onPointerUp);
        paintCanvas.removeEventListener("pointerleave", onPointerUp);
        viewport.remove();
        imageData = null;
      },
    });
  }

  global.HighResCanvas = Object.freeze({
    BRUSH_SIZES, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, TILE, hexToRgb, create,
  });
})(typeof window !== "undefined" ? window : globalThis);
