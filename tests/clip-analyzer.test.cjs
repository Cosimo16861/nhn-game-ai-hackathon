const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "..", "scripts", "clip-analyzer.js"),
  "utf8",
);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { CLIPAnalyzer } = sandbox.window;

assert.equal(
  CLIPAnalyzer.TRANSFORMERS_URL,
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1",
);
assert.equal(CLIPAnalyzer.MODEL_ID, "Xenova/clip-vit-base-patch32");
assert.throws(
  () => CLIPAnalyzer.validatePrompts(["only one"]),
  /두 개 이상/,
);
assert.throws(
  () => CLIPAnalyzer.validatePrompts(["same", "same"]),
  /서로 달라야/,
);

async function run() {
  let importCount = 0;
  let pipelineCount = 0;
  let classifierCount = 0;
  let pipelineArguments = null;
  const progressStatuses = [];

  const analyzer = CLIPAnalyzer.createAnalyzer({
    importModule: async () => {
      importCount += 1;
      return {
        env: { allowLocalModels: true },
        pipeline: async (...args) => {
          pipelineCount += 1;
          pipelineArguments = args;
          args[2].progress_callback({ status: "progress", progress: 50 });
          return async (image, prompts) => {
            classifierCount += 1;
            assert.equal(image.id, "test-canvas");
            assert.deepEqual(Array.from(prompts), [
              "a red object",
              "a blue object",
            ]);
            return [
              { label: "a blue object", score: 0.2 },
              { label: "a red object", score: 0.8 },
            ];
          };
        },
      };
    },
  });

  const first = await analyzer.compareImageToPrompts(
    { id: "test-canvas" },
    [" a red object ", "a blue object"],
    (progress) => progressStatuses.push(progress.status),
  );
  const second = await analyzer.compareImageToPrompts(
    { id: "test-canvas" },
    ["a red object", "a blue object"],
  );

  assert.equal(importCount, 1);
  assert.equal(pipelineCount, 1);
  assert.equal(classifierCount, 2);
  assert.equal(pipelineArguments[0], "zero-shot-image-classification");
  assert.equal(
    pipelineArguments[1],
    "Xenova/clip-vit-base-patch32",
  );
  assert.equal(pipelineArguments[2].dtype, "q8");
  assert.deepEqual(progressStatuses, [
    "library",
    "model",
    "download",
    "ready",
    "inference",
  ]);
  assert.equal(first.rankings[0].label, "a red object");
  assert.equal(first.rankings[0].score, 0.8);
  assert.equal(first.rankings[1].score, 0.2);
  assert.equal(second.rankings[0].score, 0.8);

  analyzer.reset();
  await analyzer.load();
  assert.equal(importCount, 2);
  assert.equal(pipelineCount, 2);

  const retryAnalyzer = CLIPAnalyzer.createAnalyzer({
    importModule: async () => {
      throw new Error("network error");
    },
  });
  await assert.rejects(() => retryAnalyzer.load(), /network error/);
  await assert.rejects(() => retryAnalyzer.load(), /network error/);

  console.log("CLIP analyzer tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
