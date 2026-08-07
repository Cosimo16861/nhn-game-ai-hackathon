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

    function show() {
      box.hidden = false;
    }

    function hide() {
      box.hidden = true;
      current = null;
    }

    function renderChoices(node) {
      choicesEl.innerHTML = "";
      const choices = (node.choices || []).slice(0, MAX_CHOICES);

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

        button.addEventListener("click", () => {
          asked.add(key);
          window.GameState.apply(choice.effects);
          goTo(choice.next);
        });

        choicesEl.appendChild(button);
      });

      // 선택지가 없으면 계속 진행 버튼
      if (choicesEl.children.length === 0) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.innerHTML = '<span class="choice-mark">▸</span><span>계속</span>';
        button.addEventListener("click", () => goTo(node.next));
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

      nameEl.textContent = node.speaker;
      portraitEl.dataset.face = node.face || "평상";
      portraitEl.textContent = node.speaker.slice(0, 1);
      textEl.innerHTML = "";
      node.lines.forEach((line) => {
        const p = document.createElement("p");
        p.textContent = line;
        textEl.appendChild(p);
      });

      renderChoices(node);
      show();
    }

    function start(dialogueTable, startId, options = {}) {
      table = dialogueTable;
      onEnd = options.onEnd || null;
      if (options.resetAsked) asked = new Set();
      goTo(startId || table.start);
    }

    return { start, hide };
  }

  window.DialogueRunner = Object.freeze({ create: createRunner });
})();
