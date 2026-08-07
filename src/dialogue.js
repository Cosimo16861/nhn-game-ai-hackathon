/**
 * 대사 노드 러너.
 * 규약: docs/script/00_SYSTEM.md 1장
 *  - 선택지는 대화창 안에 최대 4개
 *  - 이미 물어본 일반 질문에는 체크 표시, 핵심 판단(once)은 선택 후 잠금
 *  - 조건 미충족 선택지는 회색 처리하고 필요 조건을 함께 보여준다
 */
(function () {
  "use strict";

  const MAX_CHOICES = 4;

  function createRunner(root) {
    const box = root.querySelector("[data-role=dialogue-box]");
    const nameEl = root.querySelector("[data-role=speaker]");
    const textEl = root.querySelector("[data-role=lines]");
    const choicesEl = root.querySelector("[data-role=choices]");
    const portraitEl = root.querySelector("[data-role=portrait]");

    let table = null;
    let asked = new Set();
    let onEnd = null;
    let current = null;
    let choicePending = false;

    function show() {
      box.hidden = false;
    }

    function hide() {
      box.hidden = true;
      current = null;
    }

    function renderChoices(node) {
      choicePending = false;
      choicesEl.innerHTML = "";
      const choices = (node.choices || [])
        .filter((choice) => {
          if (choice.visibleWhen && !window.GameState.meets(choice.visibleWhen)) {
            return false;
          }
          if (choice.hiddenWhen && window.GameState.meets(choice.hiddenWhen)) {
            return false;
          }
          return true;
        })
        .slice(0, MAX_CHOICES);

      choices.forEach((choice, index) => {
        const key = `${node.id}:${index}`;
        // 1회성 선택지는 고른 뒤 목록에서 제거한다.
        if (choice.once && asked.has(key)) return;

        const enabled = window.GameState.meets(choice);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.disabled = !enabled;

        const mark = document.createElement("span");
        mark.className = "choice-mark";
        mark.textContent = asked.has(key) ? "✔" : "▸";
        button.appendChild(mark);

        const label = document.createElement("span");
        label.textContent = choice.text;
        button.appendChild(label);

        if (!enabled && choice.requiresHint) {
          const hint = document.createElement("em");
          hint.className = "choice-hint";
          hint.textContent = `— ${choice.requiresHint}`;
          button.appendChild(hint);
        }

        button.addEventListener("click", async () => {
          if (choicePending || button.disabled) return;
          choicePending = true;
          choicesEl.querySelectorAll("button").forEach((entry) => {
            entry.disabled = true;
          });

          try {
            if (choice.confirm) {
              const confirmed = await window.UI.confirm(choice.confirm, {
                okLabel: "마무리한다",
                cancelLabel: "다시 생각한다",
              });
              if (!confirmed) {
                renderChoices(node);
                return;
              }
            }

            const actionResult = choice.action ? await choice.action() : null;
            if (actionResult && actionResult.handled) {
              choicePending = false;
              return;
            }

            asked.add(key);
            const checkpoint =
              (actionResult && actionResult.checkpoint) || choice.checkpoint;
            if (checkpoint) window.GameState.saveCheckpoint(checkpoint);

            const effects =
              actionResult && actionResult.effects
                ? actionResult.effects
                : typeof choice.effects === "function"
                  ? choice.effects()
                  : choice.effects;
            window.GameState.apply(effects);

            const next =
              actionResult && Object.hasOwn(actionResult, "next")
                ? actionResult.next
                : typeof choice.next === "function"
                  ? choice.next()
                  : choice.next;
            choicePending = false;
            goTo(next);
          } catch (error) {
            console.error("선택지를 처리하지 못했습니다.", error);
            renderChoices(node);
          }
        });

        choicesEl.appendChild(button);
      });

      // 선택지가 없으면 계속 진행 버튼
      if (choicesEl.children.length === 0) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.innerHTML = '<span class="choice-mark">▸</span><span>계속</span>';
        button.addEventListener("click", () => {
          const next = typeof node.next === "function" ? node.next() : node.next;
          goTo(next);
        });
        choicesEl.appendChild(button);
      }
    }

    function goTo(nodeId) {
      if (!nodeId) {
        const finished = current;
        hide();
        if (onEnd) onEnd(finished);
        return;
      }

      const node = table.nodes[nodeId];
      if (!node) throw new Error(`정의되지 않은 대사 노드: ${nodeId}`);

      current = node;
      window.GameState.apply(node.onEnter);

      const variant = (node.variants || []).find((candidate) =>
        window.GameState.meets(candidate),
      );
      const rendered = variant ? { ...node, ...variant } : node;

      nameEl.textContent = rendered.speaker;
      portraitEl.dataset.face = rendered.face || "평상";
      portraitEl.textContent = rendered.speaker.slice(0, 1);
      textEl.innerHTML = "";
      const lines =
        typeof rendered.lines === "function" ? rendered.lines() : rendered.lines;
      lines.forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        textEl.appendChild(p);
      });

      renderChoices(rendered);
      show();
    }

    function start(dialogueTable, startId, options = {}) {
      table = dialogueTable;
      onEnd = options.onEnd || null;
      if (options.resetAsked) resetHistory();
      goTo(startId || table.start);
    }

    /** 체크포인트 복귀·새 게임 시 다음 start를 위한 선택 이력만 초기화한다. */
    function resetHistory() {
      asked = new Set();
      choicePending = false;
    }

    return { start, hide, resetHistory, resetAsked: resetHistory };
  }

  window.DialogueRunner = Object.freeze({ create: createRunner });
})();
