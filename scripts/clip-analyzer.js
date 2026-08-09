(function () {
  "use strict";

  const TRANSFORMERS_URL =
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
  const MODEL_ID = "Xenova/clip-vit-base-patch32";
  const TASK = "zero-shot-image-classification";
  const DTYPE = "q8";

  function validatePrompts(prompts) {
    if (!Array.isArray(prompts) || prompts.length < 2) {
      throw new Error("CLIP 비교 문장은 두 개 이상 필요합니다.");
    }

    const normalized = prompts.map((prompt) => String(prompt).trim());
    if (normalized.some((prompt) => prompt.length === 0)) {
      throw new Error("CLIP 비교 문장은 비어 있을 수 없습니다.");
    }
    if (new Set(normalized).size !== normalized.length) {
      throw new Error("CLIP 비교 문장은 서로 달라야 합니다.");
    }
    return normalized;
  }

  function normalizeResults(results, prompts) {
    if (!Array.isArray(results)) {
      throw new Error("CLIP 분석 결과 형식이 올바르지 않습니다.");
    }

    const resultByLabel = new Map(
      results.map((result) => [
        result.label,
        Number(result.score),
      ]),
    );

    return prompts
      .map((prompt) => ({
        label: prompt,
        score: resultByLabel.get(prompt) || 0,
      }))
      .sort((first, second) => second.score - first.score);
  }

  function createAnalyzer(options = {}) {
    const importModule =
      options.importModule || ((url) => import(url));
    const libraryUrl =
      options.libraryUrl || TRANSFORMERS_URL;
    const modelId = options.modelId || MODEL_ID;
    let classifierPromise = null;

    async function load(onProgress) {
      if (!classifierPromise) {
        classifierPromise = (async () => {
          onProgress?.({
            status: "library",
            message: "CLIP 실행 라이브러리를 불러오는 중입니다.",
          });
          const transformers = await importModule(libraryUrl);
          if (typeof transformers.pipeline !== "function") {
            throw new Error("Transformers.js pipeline을 찾을 수 없습니다.");
          }
          if (transformers.env) {
            transformers.env.allowLocalModels = false;
          }

          onProgress?.({
            status: "model",
            message: "CLIP 모델을 준비하는 중입니다.",
          });
          const classifier = await transformers.pipeline(
            TASK,
            modelId,
            {
              dtype: DTYPE,
              progress_callback: (progress) => {
                onProgress?.({
                  status: "download",
                  message: "CLIP 모델 파일을 내려받는 중입니다.",
                  progress,
                });
              },
            },
          );
          onProgress?.({
            status: "ready",
            message: "CLIP 모델 준비가 완료되었습니다.",
          });
          return classifier;
        })().catch((error) => {
          classifierPromise = null;
          throw error;
        });
      }

      return classifierPromise;
    }

    async function compareImageToPrompts(
      image,
      prompts,
      onProgress,
    ) {
      if (!image) {
        throw new Error("CLIP으로 분석할 이미지가 필요합니다.");
      }
      const normalizedPrompts = validatePrompts(prompts);
      const classifier = await load(onProgress);
      onProgress?.({
        status: "inference",
        message: "이미지와 목격담의 의미를 비교하는 중입니다.",
      });
      const input = image && typeof image.toDataURL === "function"
        ? image.toDataURL("image/png")
        : image;
      const results = await classifier(input, normalizedPrompts);

      return Object.freeze({
        model: modelId,
        task: TASK,
        dtype: DTYPE,
        rankings: Object.freeze(
          normalizeResults(results, normalizedPrompts).map(
            Object.freeze,
          ),
        ),
      });
    }

    function reset() {
      classifierPromise = null;
    }

    return Object.freeze({
      compareImageToPrompts,
      load,
      reset,
    });
  }

  window.CLIPAnalyzer = Object.freeze({
    MODEL_ID,
    TASK,
    TRANSFORMERS_URL,
    createAnalyzer,
    validatePrompts,
  });
})();
