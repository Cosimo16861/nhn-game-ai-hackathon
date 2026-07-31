const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.join(__dirname, "..");
const html = fs.readFileSync(
  path.join(projectRoot, "index.html"),
  "utf8",
);
const stylesheet = fs.readFileSync(
  path.join(projectRoot, "styles", "game.css"),
  "utf8",
);

assert.match(html, /<html lang="ko">/);
assert.match(
  html,
  /class="skip-link" href="#gameContent"/,
);
assert.match(html, /<main class="app-shell" id="gameContent">/);

const gameScreens = Array.from(
  html.matchAll(/<section[^>]*class="[^"]*game-screen[^"]*"[^>]*>/g),
  (match) => match[0],
);
assert.equal(gameScreens.length, 5);
gameScreens.forEach((screen) => {
  assert.match(screen, /aria-labelledby="[^"]+"/);
  assert.match(screen, /tabindex="-1"/);
});

assert.match(
  html,
  /id="editorCanvas"[\s\S]*aria-describedby="editorKeyboardHelp"[\s\S]*tabindex="0"/,
);
assert.match(html, /id="editorKeyboardHelp"/);
assert.match(html, /class="beginner-guide"/);
assert.match(
  html,
  /id="deductionForm"[\s\S]*<fieldset>[\s\S]*<legend/,
);

const buttons = Array.from(
  html.matchAll(/<button\b[^>]*>/g),
  (match) => match[0],
);
assert.ok(buttons.length > 0);
buttons.forEach((button) => {
  assert.match(button, /\btype="(?:button|submit)"/);
});

assert.match(stylesheet, /\.skip-link:focus/);
assert.match(stylesheet, /#editorCanvas:focus-visible/);
assert.match(stylesheet, /prefers-reduced-motion:\s*reduce/);
assert.match(stylesheet, /prefers-contrast:\s*more/);
assert.match(stylesheet, /@media\s+\(pointer:\s*coarse\)/);
assert.match(
  stylesheet,
  /\.canvas-zoom-controls button[\s\S]*width:\s*44px/,
);

console.log("Accessibility tests passed.");
