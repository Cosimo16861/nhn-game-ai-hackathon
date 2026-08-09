const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const cutsceneRoot = path.join(root, "assets", "cutscenes");
const manifests = fs.readdirSync(cutsceneRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(cutsceneRoot, entry.name, "cutscene-assets.json"))
  .filter(fs.existsSync);

function collectPngPaths(value, output = []) {
  if (typeof value === "string" && value.endsWith(".png")) output.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectPngPaths(entry, output));
  else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (key.includes("/") && key.endsWith(".png")) output.push(key);
      collectPngPaths(entry, output);
    });
  }
  return output;
}

assert.equal(manifests.length, 7, "L0→L1부터 엔딩까지 manifest 7개가 필요합니다.");

for (const manifestFile of manifests) {
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  const references = Array.from(new Set(collectPngPaths(manifest)));
  assert.ok(references.length > 0, `${manifestFile}에 PNG 자산이 없습니다.`);

  for (const reference of references) {
    const target = reference.startsWith("assets/")
      ? path.join(root, reference)
      : path.resolve(path.dirname(manifestFile), reference);
    assert.ok(
      fs.existsSync(target),
      `${path.relative(root, manifestFile)}가 없는 자산을 참조합니다: ${reference}`,
    );
  }
}

console.log(`Cutscene asset tests passed (${manifests.length} manifests).`);
