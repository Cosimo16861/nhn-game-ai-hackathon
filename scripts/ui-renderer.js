(function () {
  "use strict";

  const DIFFICULTY_LABELS = Object.freeze({
    easy: "쉬움",
    normal: "보통",
    hard: "어려움",
  });

  function renderCaseCards(container, cases, onSelect) {
    container.replaceChildren(
      ...cases.map((caseDefinition, index) => {
        const card = document.createElement("button");
        const imageWrap = document.createElement("span");
        const image = document.createElement("img");
        const body = document.createElement("span");
        const caseIndex = document.createElement("span");
        const title = document.createElement("h3");
        const metadata = document.createElement("span");
        const difficulty = document.createElement("span");
        const passingScore = document.createElement("span");
        const selectLabel = document.createElement("span");

        card.type = "button";
        card.className = "case-card";
        card.dataset.caseId = caseDefinition.id;
        card.setAttribute("aria-pressed", "false");
        imageWrap.className = "case-card-image";
        image.src = caseDefinition.imageSrc;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        body.className = "case-card-body";
        caseIndex.className = "case-card-index";
        caseIndex.textContent =
          `CASE ${String(index + 1).padStart(2, "0")}`;
        title.textContent = caseDefinition.title;
        metadata.className = "case-card-meta";
        difficulty.textContent =
          `난이도 ${DIFFICULTY_LABELS[caseDefinition.difficulty]}`;
        passingScore.textContent =
          `통과 ${caseDefinition.passingScore}점`;
        selectLabel.className = "case-card-select";
        selectLabel.textContent = "사건 선택";

        metadata.append(difficulty, passingScore);
        body.append(caseIndex, title, metadata, selectLabel);
        imageWrap.append(image);
        card.append(imageWrap, body);

        card.addEventListener("click", () => {
          clearCaseSelection(container);
          card.classList.add("is-selected");
          card.setAttribute("aria-pressed", "true");
          selectLabel.textContent = "선택됨";
          onSelect(caseDefinition);
        });

        return card;
      }),
    );
  }

  function clearCaseSelection(container) {
    container.querySelectorAll(".case-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-pressed", "false");
      card.querySelector(".case-card-select").textContent = "사건 선택";
    });
  }

  function renderRules(config, elements) {
    elements.grid.textContent =
      `${config.analysisGridSize} × ${config.analysisGridSize} 분석 · ` +
      `${config.paintGridSize} × ${config.paintGridSize} 색칠`;
    elements.palette.textContent = `${config.paletteSize}색`;
    elements.hidden.textContent =
      `${config.regionsPerSide ** 2}개 중 ` +
      `${config.hiddenRegionCount}개 · 18.75%`;

    const labels = {
      color: "색상",
      edge: "윤곽선",
      structure: "주변 구조",
      palette: "팔레트",
    };
    elements.weights.replaceChildren(
      ...Object.entries(config.scoreWeights).map(([key, weight]) => {
        const item = document.createElement("li");
        const label = document.createTextNode(`${labels[key]} `);
        const value = document.createElement("strong");
        value.textContent = `${Math.round(weight * 100)}%`;
        item.append(label, value);
        return item;
      }),
    );
  }

  function renderPalette(container, palette) {
    container.replaceChildren(
      ...palette.map((color) => {
        const chip = document.createElement("span");
        const swatch = document.createElement("span");
        const label = document.createElement("span");

        chip.className = "palette-chip";
        swatch.className = "palette-swatch";
        swatch.style.backgroundColor = color;
        label.textContent = color.toUpperCase();
        chip.append(swatch, label);
        return chip;
      }),
    );
  }

  function renderEditorPalette(container, palette, onSelect) {
    container.replaceChildren(
      ...palette.map((color, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "editor-color";
        button.style.backgroundColor = color;
        button.setAttribute("aria-label", `${color.toUpperCase()} 색상`);
        button.dataset.color = color;
        if (index === 0) button.classList.add("is-selected");

        button.addEventListener("click", () => {
          container
            .querySelectorAll(".editor-color")
            .forEach((item) => item.classList.remove("is-selected"));
          button.classList.add("is-selected");
          onSelect(color);
        });

        return button;
      }),
    );
  }

  function renderCaseBriefing(titleElement, listElement, caseInfo) {
    titleElement.textContent = caseInfo.title;
    listElement.replaceChildren(
      ...caseInfo.witnesses.map((witness, index) => {
        const item = document.createElement("li");
        const label = document.createElement("strong");
        const statement = document.createElement("span");
        label.className = "witness-label";
        label.textContent =
          `목격담 ${String.fromCharCode(65 + index)}`;
        statement.textContent = witness;
        item.append(label, statement);
        return item;
      }),
    );
  }

  window.UIRenderer = Object.freeze({
    clearCaseSelection,
    renderCaseBriefing,
    renderCaseCards,
    renderEditorPalette,
    renderPalette,
    renderRules,
  });
})();
