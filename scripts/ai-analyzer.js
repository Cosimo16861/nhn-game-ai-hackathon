(function () {
  "use strict";

  const TENSORFLOW_URL =
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
  const MOBILENET_URL =
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";
  let modelPromise = null;

  function loadScript(url, globalName) {
    if (window[globalName]) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-ai-src="${url}"]`);
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("AI 라이브러리를 불러오지 못했습니다.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.dataset.aiSrc = url;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error("AI 라이브러리를 불러오지 못했습니다.")),
        { once: true },
      );
      document.head.append(script);
    });
  }

  async function loadModel(onStatus) {
    if (!modelPromise) {
      modelPromise = (async () => {
        onStatus?.("TensorFlow.js 불러오는 중…");
        await loadScript(TENSORFLOW_URL, "tf");
        onStatus?.("MobileNet 불러오는 중…");
        await loadScript(MOBILENET_URL, "mobilenet");
        await window.tf.ready();
        onStatus?.("AI 모델 준비 중…");
        return window.mobilenet.load({ version: 2, alpha: 0.5 });
      })().catch((error) => {
        modelPromise = null;
        throw error;
      });
    }

    return modelPromise;
  }

  function cosineSimilarity(first, second) {
    if (first.length !== second.length || first.length === 0) {
      throw new Error("AI 특징 벡터의 길이가 일치하지 않습니다.");
    }

    let dotProduct = 0;
    let firstMagnitude = 0;
    let secondMagnitude = 0;

    for (let index = 0; index < first.length; index++) {
      dotProduct += first[index] * second[index];
      firstMagnitude += first[index] ** 2;
      secondMagnitude += second[index] ** 2;
    }

    const denominator = Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  function compareEmbeddings(targetValues, candidateValues) {
    const similarity = cosineSimilarity(targetValues, candidateValues);
    return Math.max(0, Math.min(1, similarity)) * 100;
  }

  function calculateRecovery(
    targetValues,
    baselineValues,
    restoredValues,
  ) {
    const baselineScore = compareEmbeddings(targetValues, baselineValues);
    const restoredScore = compareEmbeddings(targetValues, restoredValues);

    return {
      baselineScore: Math.round(baselineScore * 10) / 10,
      restoredScore: Math.round(restoredScore * 10) / 10,
      improvement: Math.round((restoredScore - baselineScore) * 10) / 10,
    };
  }

  async function analyzeRecovery(
    targetCanvas,
    baselineCanvas,
    restoredCanvas,
    onStatus,
  ) {
    const model = await loadModel(onStatus);
    onStatus?.("이미지 특징 추출 중…");

    const targetEmbedding = model.infer(targetCanvas, true);
    const baselineEmbedding = model.infer(baselineCanvas, true);
    const restoredEmbedding = model.infer(restoredCanvas, true);

    try {
      const [targetValues, baselineValues, restoredValues] = await Promise.all([
        targetEmbedding.data(),
        baselineEmbedding.data(),
        restoredEmbedding.data(),
      ]);
      const recovery = calculateRecovery(
        targetValues,
        baselineValues,
        restoredValues,
      );

      return {
        ...recovery,
        featureCount: targetValues.length,
        model: "MobileNetV2 alpha 0.5",
      };
    } finally {
      targetEmbedding.dispose();
      baselineEmbedding.dispose();
      restoredEmbedding.dispose();
    }
  }

  window.AIImageAnalyzer = Object.freeze({
    analyzeRecovery,
    calculateRecovery,
    cosineSimilarity,
  });
})();
