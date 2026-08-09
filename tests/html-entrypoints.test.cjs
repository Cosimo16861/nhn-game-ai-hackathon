const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

const htmlFiles = [
  ...fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => path.join(root, entry.name)),
  ...walk(path.join(root, "dev")),
];

assert.ok(htmlFiles.length >= 12, "제품·개발 HTML 진입점이 누락되었습니다.");

for (const htmlFile of htmlFiles) {
  const source = fs.readFileSync(htmlFile, "utf8");
  const baseMatch = source.match(/<base\s+href="([^"]+)"/i);
  const baseDirectory = baseMatch
    ? path.resolve(path.dirname(htmlFile), baseMatch[1])
    : path.dirname(htmlFile);

  const references = Array.from(
    source.matchAll(/\b(?:src|href)="([^"]+)"/gi),
    (match) => match[1],
  ).filter((reference) =>
    !reference.startsWith("http") &&
    !reference.startsWith("data:") &&
    !reference.startsWith("#"),
  );

  for (const reference of references) {
    const cleanReference = reference.split(/[?#]/, 1)[0];
    if (!cleanReference) continue;
    const resolved = path.resolve(baseDirectory, cleanReference);
    assert.ok(
      fs.existsSync(resolved),
      `${path.relative(root, htmlFile)}가 없는 파일을 참조합니다: ${reference}`,
    );
  }
}

console.log(`HTML entrypoint tests passed (${htmlFiles.length} pages).`);
