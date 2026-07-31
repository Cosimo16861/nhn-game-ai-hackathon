(function () {
  "use strict";

  const DIFFICULTY_LABELS = Object.freeze({
    easy: "쉬움",
    normal: "보통",
    hard: "어려움",
  });

  function createMissionCard({
    id,
    titleText,
    descriptionText,
    imageSrc,
    imageAlt,
    metadataItems,
    actionText,
  }) {
    const card = document.createElement("button");
    const imageWrap = document.createElement("span");
    const image = document.createElement("img");
    const body = document.createElement("span");
    const title = document.createElement("h3");
    const description = document.createElement("span");
    const metadata = document.createElement("span");
    const action = document.createElement("span");

    card.type = "button";
    card.className = "case-card";
    card.dataset.caseId = id;
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", `${titleText} 선택`);
    imageWrap.className = "case-card-image";
    image.src = imageSrc;
    image.alt = imageAlt;
    body.className = "case-card-body";
    title.textContent = titleText;
    description.className = "case-card-description";
    description.textContent = descriptionText;
    metadata.className = "mission-card-meta";
    metadataItems.forEach((item) => {
      const badge = document.createElement("span");
      badge.textContent = item;
      metadata.append(badge);
    });
    action.className = "mission-card-action";
    action.textContent = actionText;
    action.dataset.defaultText = actionText;
    body.append(title, description, metadata, action);
    imageWrap.append(image);
    card.append(imageWrap, body);
    return card;
  }

  function selectMissionCard(container, card) {
    clearCaseSelection(container);
    card.classList.add("is-selected");
    card.setAttribute("aria-pressed", "true");
    card.querySelector(".mission-card-action").textContent =
      "선택 완료";
  }

  function renderChapterCards(container, chapters, onSelect) {
    container.replaceChildren(
      ...chapters.map((chapter) => {
        const card = createMissionCard({
          id: chapter.id,
          titleText: chapter.title,
          descriptionText: chapter.summary,
          imageSrc: chapter.masterImageSrc,
          imageAlt: chapter.masterImageAlt,
          metadataItems: [
            `세부 사건 ${chapter.stages.length}개`,
            chapter.masterImageStatus === "ready"
              ? "수사 가능"
              : "준비 중",
          ],
          actionText: "사건 선택",
        });
        card.disabled = chapter.masterImageStatus !== "ready";
        if (card.disabled) {
          card.classList.add("is-unavailable");
          card.querySelector(".mission-card-action").textContent =
            "준비 중";
        } else {
          card.addEventListener("click", () => {
            selectMissionCard(container, card);
            onSelect(chapter);
          });
        }
        return card;
      }),
    );
  }

  function renderCaseCards(container, cases, onSelect) {
    container.replaceChildren(
      ...cases.map((caseDefinition) => {
        const card = createMissionCard({
          id: caseDefinition.id,
          titleText: caseDefinition.title,
          descriptionText: caseDefinition.imageAlt,
          imageSrc: caseDefinition.imageSrc,
          imageAlt: caseDefinition.imageAlt,
          metadataItems: [
            `단서 ${caseDefinition.witnesses.length}개`,
            `난이도 ${DIFFICULTY_LABELS[caseDefinition.difficulty]}`,
          ],
          actionText: "미션 선택",
        });

        card.addEventListener("click", () => {
          selectMissionCard(container, card);
          onSelect(caseDefinition);
        });

        return card;
      }),
    );
  }

  function renderStageCards(
    container,
    stages,
    unlockedStageCount,
    onSelect,
    clearedStageIds = new Set(),
    stageStars = new Map(),
  ) {
    container.replaceChildren(
      ...stages.map((stage, index) => {
        const isUnlocked = index < unlockedStageCount;
        const isCleared = clearedStageIds.has(stage.id);
        const card = document.createElement("button");
        const number = document.createElement("span");
        const copy = document.createElement("span");
        const title = document.createElement("strong");
        const summary = document.createElement("span");
        const metadata = document.createElement("span");
        const difficulty = document.createElement("span");
        const difficultyRule = document.createElement("span");
        const stars = document.createElement("span");
        const status = document.createElement("span");
        const rules = window.DifficultyRules?.get(stage.difficulty);

        card.type = "button";
        card.className = "stage-card";
        card.dataset.stageId = stage.id;
        card.disabled = !isUnlocked;
        card.setAttribute("aria-pressed", "false");
        card.setAttribute(
          "aria-label",
          isUnlocked
            ? `${stage.order}단계 ${stage.title} 선택`
            : `${stage.order}단계 ${stage.title} 잠김`,
        );
        number.className = "stage-card-number";
        number.textContent = String(stage.order).padStart(2, "0");
        copy.className = "stage-card-copy";
        title.textContent = stage.title;
        summary.className = "stage-card-summary";
        summary.textContent = stage.summary;
        metadata.className = "stage-card-meta";
        difficulty.textContent =
          `난이도 ${DIFFICULTY_LABELS[stage.difficulty]}`;
        difficultyRule.textContent =
          rules?.shortDescription || "표준 복원 규칙";
        const starCount = stageStars.get(stage.id) || 0;
        stars.className = "stage-card-stars";
        stars.textContent =
          "★".repeat(starCount) + "☆".repeat(3 - starCount);
        stars.setAttribute(
          "aria-label",
          `별점 3개 중 ${starCount}개`,
        );
        status.className = "stage-card-status";
        status.textContent = isCleared
          ? "클리어"
          : isUnlocked
            ? "수사 가능"
            : "잠김";
        status.dataset.defaultText = status.textContent;
        metadata.append(
          difficulty,
          difficultyRule,
          stars,
          status,
        );
        copy.append(title, summary, metadata);
        card.append(number, copy);

        if (isUnlocked) {
          if (isCleared) card.classList.add("is-cleared");
          card.addEventListener("click", () => {
            clearStageSelection(container);
            card.classList.add("is-selected");
            card.setAttribute("aria-pressed", "true");
            status.textContent = "선택 완료";
            onSelect(stage);
          });
        } else {
          card.classList.add("is-locked");
        }
        return card;
      }),
    );
  }

  function clearStageSelection(container) {
    container.querySelectorAll(".stage-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-pressed", "false");
      const status = card.querySelector(".stage-card-status");
      status.textContent =
        status.dataset.defaultText ||
        (card.disabled ? "잠김" : "수사 가능");
    });
  }

  function renderAssemblyBoard(container, plan) {
    container.style.gridTemplateColumns =
      `repeat(${plan.columns}, minmax(0, 1fr))`;
    container.classList.toggle("is-complete", plan.isComplete);
    container.replaceChildren(
      ...plan.tiles.map((tile) => {
        const piece = document.createElement("span");
        const label = document.createElement("span");
        piece.className = "assembly-piece";
        label.className = "assembly-piece-label";

        if (!tile.stage) {
          piece.classList.add("is-empty");
          piece.setAttribute("aria-hidden", "true");
          return piece;
        }

        label.textContent = tile.cleared
          ? `${tile.stage.order}단계 완료`
          : `${tile.stage.order}단계 잠김`;
        piece.setAttribute("role", "img");
        piece.setAttribute(
          "aria-label",
          `${tile.stage.title} 조각 ${tile.cleared ? "복원 완료" : "미복원"}`,
        );
        if (tile.cleared) {
          piece.classList.add("is-cleared");
          piece.style.backgroundImage =
            `url("${tile.backgroundImage}")`;
          piece.style.backgroundSize = tile.backgroundSize;
          piece.style.backgroundPosition =
            tile.backgroundPosition;
        } else {
          piece.classList.add("is-locked");
        }
        piece.append(label);
        return piece;
      }),
    );
  }

  function renderDeductionOptions(
    container,
    question,
    onSelect,
    disabled = false,
  ) {
    container.replaceChildren(
      ...question.options.map((option, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const text = document.createElement("span");
        label.className = "deduction-option";
        input.type = "radio";
        input.name = "final-deduction";
        input.value = String(index);
        input.disabled = disabled;
        text.textContent = option;
        input.addEventListener("change", () => {
          container
            .querySelectorAll(".deduction-option")
            .forEach((item) =>
              item.classList.remove("is-selected"),
            );
          label.classList.add("is-selected");
          onSelect(index);
        });
        label.append(input, text);
        return label;
      }),
    );
  }

  function clearCaseSelection(container) {
    container.querySelectorAll(".case-card").forEach((card) => {
      card.classList.remove("is-selected");
      card.setAttribute("aria-pressed", "false");
      const action = card.querySelector(".mission-card-action");
      action.textContent = card.disabled
        ? "준비 중"
        : action.dataset.defaultText;
    });
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
        const regionNumber =
          Number(caseInfo.hiddenRegions?.[index]) + 1;
        item.className =
          `witness-note witness-note-${String.fromCharCode(97 + index)}`;
        item.dataset.clueGroup =
          String.fromCharCode(65 + index);
        item.dataset.regionIndex = String(regionNumber);
        label.className = "witness-label";
        label.textContent =
          `단서 ${String.fromCharCode(65 + index)} · ` +
          `손상 구역 ${regionNumber}`;
        statement.textContent = witness;
        item.append(label, statement);
        return item;
      }),
    );
  }

  window.UIRenderer = Object.freeze({
    clearCaseSelection,
    clearStageSelection,
    renderCaseBriefing,
    renderCaseCards,
    renderChapterCards,
    renderAssemblyBoard,
    renderDeductionOptions,
    renderEditorPalette,
    renderPalette,
    renderStageCards,
  });
})();
