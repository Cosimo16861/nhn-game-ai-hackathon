/**
 * 복원 원본 아트 파이프라인.
 *
 * PNG 한 장에서 복원에 필요한 모든 데이터를 도출한다.
 *   1) 제한 팔레트로 양자화 → 정답 픽셀(targetPixels)
 *   2) 외곽선 색 픽셀 → 제공되는 선화(lockedPixels)
 *   3) 나머지 칠할 영역을 연결 요소로 묶음 → 채우기 도구가 클릭 한 번에 칠할 단위
 *
 * 16x16 문자맵을 손으로 쓰던 방식은 256x256에서 불가능하므로 이 경로로 대체한다.
 * 절차 생성 아트도 같은 형식(그리기 함수)을 넘기면 동일하게 처리된다.
 */
(function () {
  "use strict";

  function hexToRgb(hex) {
    const v = hex.replace("#", "");
    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16),
    ];
  }

  function toHex(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
  }

  /** 팔레트 중 가장 가까운 색. 65,536픽셀을 돌므로 단순 RGB 거리로 충분히 빠르다. */
  function nearest(paletteRgb, r, g, b) {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < paletteRgb.length; i++) {
      const [pr, pg, pb] = paletteRgb[i];
      const d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return best;
  }

  async function drawSourceToGrid(source, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, size, size);

    if (typeof source === "function") {
      // 절차 생성 또는 혼합: 그리기 함수가 직접 캔버스를 채운다.
      // 자산 이미지를 깔고 그 위에 증언에 해당하는 특징을 덧그릴 수 있도록
      // loadImage 를 넘겨주고 비동기 함수도 허용한다.
      await source(context, size, { loadImage });
    } else {
      // 이미지: 비율을 유지한 채 가운데 맞춤으로 축소한다.
      const scale = Math.min(size / source.width, size / source.height);
      const w = Math.round(source.width * scale);
      const h = Math.round(source.height * scale);
      context.drawImage(source, ((size - w) / 2) | 0, ((size - h) / 2) | 0, w, h);
    }
    return context.getImageData(0, 0, size, size);
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`아트를 불러오지 못했습니다: ${url}`));
      image.src = url;
    });
  }

  /**
   * 칠할 수 있는 픽셀을 4방향 연결 요소로 묶는다.
   * 플레이어가 영역을 한 번 클릭하면 그 덩어리 전체가 칠해진다.
   */
  function labelRegions(paintable, size) {
    const regionOf = new Int32Array(size * size).fill(-1);
    const regions = [];
    const stack = [];

    for (let start = 0; start < paintable.length; start++) {
      if (!paintable[start] || regionOf[start] !== -1) continue;

      const id = regions.length;
      const cells = [];
      stack.push(start);
      regionOf[start] = id;

      while (stack.length > 0) {
        const index = stack.pop();
        cells.push(index);
        const x = index % size;
        const y = (index / size) | 0;

        if (x > 0) push(index - 1);
        if (x < size - 1) push(index + 1);
        if (y > 0) push(index - size);
        if (y < size - 1) push(index + size);
      }

      regions.push(cells);

      function push(neighbor) {
        if (paintable[neighbor] && regionOf[neighbor] === -1) {
          regionOf[neighbor] = id;
          stack.push(neighbor);
        }
      }
    }

    return { regionOf, regions };
  }

  /**
   * @param {string|Function} source PNG 경로 또는 (ctx, size)=>void 그리기 함수
   * @param {{size:number, palette:string[], outline:string, alphaThreshold?:number,
   *          minRegion?:number}} options
   */
  async function prepare(source, options) {
    const size = options.size;
    const palette = options.palette.map((c) => c.toUpperCase());
    const paletteRgb = palette.map(hexToRgb);
    const outline = options.outline.toUpperCase();
    const alphaThreshold = options.alphaThreshold ?? 128;

    const resolved = typeof source === "string" ? await loadImage(source) : source;
    const imageData = await drawSourceToGrid(resolved, size);
    const data = imageData.data;
    const count = size * size;

    const targetPixels = new Array(count);
    const lockedPixels = new Array(count).fill(null);
    const paintable = new Array(count).fill(false);
    const opaque = new Array(count).fill(false);

    for (let i = 0; i < count; i++) {
      const alpha = data[i * 4 + 3];
      if (alpha < alphaThreshold) {
        // 배경: 채점하지도, 칠하지도 않는다.
        targetPixels[i] = outline;
        continue;
      }
      opaque[i] = true;
      const index = nearest(paletteRgb, data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      const hex = palette[index];
      targetPixels[i] = hex;

      if (hex === outline) {
        lockedPixels[i] = outline; // 선화는 제공하고 수정할 수 없다
      } else {
        paintable[i] = true;
      }
    }

    const { regionOf, regions } = labelRegions(paintable, size);

    // 너무 작은 얼룩은 채우기로 다루기 어렵다. 선화에 흡수시킨다.
    const minRegion = options.minRegion ?? 0;
    if (minRegion > 0) {
      regions.forEach((cells) => {
        if (cells.length >= minRegion) return;
        cells.forEach((index) => {
          paintable[index] = false;
          lockedPixels[index] = targetPixels[index];
          regionOf[index] = -1;
        });
      });
    }

    return Object.freeze({
      gridSize: size,
      targetPixels: Object.freeze(targetPixels),
      lockedPixels: Object.freeze(lockedPixels),
      paintable: Object.freeze(paintable),
      hiddenMask: Object.freeze(paintable.slice()), // 칠할 곳이 곧 채점 대상
      opaque: Object.freeze(opaque),
      regionOf,
      regions: Object.freeze(regions.map((cells) => Object.freeze(cells))),
    });
  }

  /** 특정 색으로 칠해야 하는 영역들의 인덱스 (필수 특징 정의에 사용) */
  function indicesOfColor(prepared, hex) {
    const wanted = hex.toUpperCase();
    const out = [];
    prepared.targetPixels.forEach((color, index) => {
      if (prepared.paintable[index] && color === wanted) out.push(index);
    });
    return out;
  }

  window.Artwork = Object.freeze({ prepare, indicesOfColor, toHex });
})();
