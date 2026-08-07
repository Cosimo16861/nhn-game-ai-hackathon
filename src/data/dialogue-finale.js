/** 최종 국면과 엔딩 대사. 정본: docs/script/05_FINALE_ENDINGS.md */
(function () {
  "use strict";

  function judgeNext(conclusion) {
    const result = window.Ending.judge(conclusion, window.GameState);
    if (result === "A") return "END_A_01";
    if (result === "reject") return "FIN_REJECT";
    if (result === "hold") return "FIN_HOLD";
    return "END_B_01";
  }

  function evidenceLines() {
    const lines = [];
    if (window.GameState.has("EV_FACE")) {
      lines.push("리드: 카버가 외운 습관으로는 눈썹의 비대칭과 오래된 흉터까지 만들 수 없었소.");
    }
    if (window.GameState.has("EV_LEDGER")) {
      lines.push("리드: 당신의 관리 서명 아래 유품 반출 기록과 'T.C.' 지급 내역이 남아 있소.");
    }
    if (window.GameState.has("EV_CARRIAGE")) {
      lines.push("뱅크스: 내 눈으로 봤소. 카버를 태운 건 초승달과 파도 문양의 아셔튼가 마차였소.");
    } else if (window.GameState.has("CLUE_LOGBOOK")) {
      lines.push("리드: 뱅크스의 기록에는 카버를 '아셔튼 씨'에게 데려간 마부의 말이 남아 있소.");
    }
    return lines;
  }

  function endingMenuLines() {
    const count = window.Ending.recordCount(window.GameState);
    const title =
      window.GameState.get("LAST_END") === "A"
        ? "안개 너머의 진실"
        : "반쪽짜리 정의";
    return [`사건 기록 ${count}/2`, `최근 결말 · ${title}`];
  }

  window.DialogueFinale = Object.freeze({
    boardStart: "FIN_BOARD_01",
    menuStart: "END_MENU",
    nodes: Object.freeze({
      FIN_BOARD_01: {
        id: "FIN_BOARD_01",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "자, 자네가 되살린 것들을 붙여 보게.",
          "얼굴, 인장, 그리고 그 부두. 실이 어디로 이어지는지 보자고.",
        ],
        next: "FIN_BOARD_02",
      },
      FIN_BOARD_02: {
        id: "FIN_BOARD_02",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "붉은 실이 얼굴에서 인장으로, 인장에서 부두로 이어진다.",
          "실이 닿지 못한 압정도 있다. 놓친 만큼, 그림은 벌어져 있다.",
        ],
        next: "FIN_CONCLUDE",
      },
      FIN_CONCLUDE: {
        id: "FIN_CONCLUDE",
        speaker: "리드 경위",
        face: "평상",
        lines: ["결론을 말해 보게. 이 사건, 자네는 어떻게 읽나?"],
        choices: [
          {
            text: "카버는 혼자 신분을 속인 사기꾼입니다.",
            confirm: "이 결론으로 사건을 마무리하시겠습니까?",
            checkpoint: "FINAL",
            effects: { assign: { CONCLUSION: "carver_alone" } },
            next: () => judgeNext("carver_alone"),
          },
          {
            text: "카버는 사칭범이고, 줄리언이 그를 준비시킨 배후입니다.",
            visibleWhen: {
              requiresAny: ["EV_FACE", "EV_LEDGER", "EV_CARRIAGE"],
            },
            confirm: "이 결론으로 사건을 마무리하시겠습니까?",
            checkpoint: "FINAL",
            effects: { assign: { CONCLUSION: "mastermind" } },
            next: () => judgeNext("mastermind"),
          },
          {
            text: "배후 판단은 보류하고, 카버의 사칭만 처리하겠습니다.",
            confirm: "이 결론으로 사건을 마무리하시겠습니까?",
            checkpoint: "FINAL",
            effects: { assign: { CONCLUSION: "hold" } },
            next: () => judgeNext("hold"),
          },
        ],
      },
      FIN_REJECT: {
        id: "FIN_REJECT",
        speaker: "리드 경위",
        face: "긴장",
        lines: [
          "심증은 나도 같아. 하지만 이걸로 줄리언을 세우면 법정에서 무너져.",
          "다시 배치하겠나, 아니면 이대로 갈 텐가?",
        ],
        choices: [
          {
            text: "다시 증거를 살펴보겠습니다.",
            effects: { clear: ["CONCLUSION"] },
            next: "FIN_BOARD_01",
          },
          {
            text: "이대로 카버만 세우겠습니다.",
            effects: { assign: { CONCLUSION: "carver_alone" } },
            next: "END_B_01",
          },
        ],
      },
      FIN_HOLD: {
        id: "FIN_HOLD",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "배후는 보류하고 카버의 사칭만 처리하자는 거군.",
          "한 번 더 실을 살펴보겠나, 이대로 카버만 세우겠나?",
        ],
        choices: [
          {
            text: "다시 살펴보겠습니다.",
            effects: { clear: ["CONCLUSION"] },
            next: "FIN_BOARD_01",
          },
          {
            text: "카버의 사칭만 처리하겠습니다.",
            effects: { assign: { CONCLUSION: "carver_alone" } },
            next: "END_B_01",
          },
        ],
      },
      END_A_01: {
        id: "END_A_01",
        speaker: "리드 경위",
        face: "고조",
        lines: [
          "얼굴, 인장, 부두. 서로 다른 그림이 같은 거짓말을 가리키는군.",
          "줄리언 아셔튼, 당신에게 물을 게 많소.",
        ],
        next: "END_A_EVIDENCE",
      },
      END_A_EVIDENCE: {
        id: "END_A_EVIDENCE",
        speaker: "보유 증거 제시",
        face: "고조",
        lines: evidenceLines,
        next: "END_A_02",
      },
      END_A_02: {
        id: "END_A_02",
        speaker: "줄리언",
        face: "긴장",
        lines: [
          "그림은 주관적이오. 화가의 상상일 뿐—",
          "기록과 목격담도 우연이오. 그것만으로 나를 엮을 순 없소.",
        ],
        next: "END_A_03",
      },
      END_A_03: {
        id: "END_A_03",
        speaker: "카버",
        face: "고조",
        lines: [
          "……그만. 그만합시다.",
          "줄리언 씨가 다 가르쳐 줬소. 얼굴도, 인장도, 그 밤의 길도.",
        ],
        next: "END_A_04",
      },
      END_A_04: {
        id: "END_A_04",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "줄리언은 밀린 장부가 감사되기 전, 가짜 아들로 재산을 처분하려 했다.",
          "승인만 받으면 카버를 다시 안개 속으로 지울 셈이었다.",
        ],
        next: "END_A_05",
      },
      END_A_05: {
        id: "END_A_05",
        speaker: "엘리너",
        face: "고조",
        lines: [
          "당신은…… 내가 보고 싶던 얼굴이 아니라,",
          "정말 그 아이가 남긴 얼굴을 돌려주셨군요.",
        ],
        next: "END_A_06",
      },
      END_A_06: {
        id: "END_A_06",
        speaker: "나레이션",
        face: "평상",
        lines: () => {
          const lines = [
            "홀트는 복원된 초상을 학교 책상 옆에 건다.",
            "뱅크스는 흐트러진 항구 기록을 다시 정리한다.",
          ];
          if (window.GameState.has("SUB_CAT")) {
            lines.push("선술집 창가엔 회색 고양이 '안개'가 볕을 쬐고 있다.");
          }
          return lines;
        },
        next: "END_A_07",
      },
      END_A_07: {
        id: "END_A_07",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "사무소의 세 그림이 붉은 실로 하나의 문양에 이어진다.",
          "창밖의 안개가, 마침내 걷힌다.",
        ],
        onEnter: {
          set: ["SEEN_END_A"],
          assign: { STAGE: "ending", LAST_END: "A" },
        },
        next: "END_MENU",
      },
      END_B_01: {
        id: "END_B_01",
        speaker: "리드 경위",
        face: "평상",
        lines: [
          "카버, 당신의 사칭은 증명됐소. 그건 분명해.",
          "……하지만 누가 당신을 만들었는지는, 여기서 끊기는군.",
        ],
        next: "END_B_02",
      },
      END_B_02: {
        id: "END_B_02",
        speaker: "카버",
        face: "긴장",
        lines: [
          "정보를 준 건…… 낯선 중개인이었소. 이름도 모르오.",
          "나도 이용당한 거요.",
        ],
        next: "END_B_03",
      },
      END_B_03: {
        id: "END_B_03",
        speaker: "줄리언",
        face: "평상",
        lines: [
          "제가 처음부터 사기꾼이라 하지 않았습니까.",
          "사건 해결에 도움이 되어 다행입니다, 경위님.",
        ],
        next: "END_B_04",
      },
      END_B_04: {
        id: "END_B_04",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "며칠 뒤, 줄리언은 가문의 사업을 정리한다며 헤이번을 떠난다.",
          "엘리너는 카버가 어떻게 아들의 기억을 알았는지, 끝내 답을 얻지 못한다.",
        ],
        next: "END_B_05",
      },
      END_B_05: {
        id: "END_B_05",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "사무소 벽. 초상과 인장은 실로 이어져 있지만,",
          "부두 그림에서 뻗어 나온 붉은 실은 빈 압정 앞에서 끊겨 있다.",
        ],
        next: "END_B_06",
      },
      END_B_06: {
        id: "END_B_06",
        speaker: "나레이션",
        face: "평상",
        lines: ["창밖으로 검은 마차 한 대가, 안개 속으로 사라진다."],
        onEnter: {
          set: ["SEEN_END_B"],
          assign: { STAGE: "ending", LAST_END: "B" },
        },
        next: "END_MENU",
      },
      END_MENU: {
        id: "END_MENU",
        speaker: "사건 기록",
        face: "평상",
        lines: endingMenuLines,
        choices: [
          {
            text: "이 결말의 후일담 보기",
            next: () =>
              window.GameState.get("LAST_END") === "A"
                ? "END_A_EPILOGUE_X"
                : "END_B_EPILOGUE_X",
          },
          {
            text: "놓친 분기부터 다시 수사",
            action: () => {
              if (!window.GameFlow.restartMissedBranch()) {
                throw new Error("복귀할 수 있는 체크포인트가 없습니다.");
              }
              return { handled: true };
            },
          },
          {
            text: "처음부터 새 게임",
            action: () => {
              if (!window.GameFlow.newGamePreservingEndings()) {
                throw new Error("새 게임을 시작하지 못했습니다.");
              }
              return { handled: true };
            },
          },
        ],
      },
      END_A_EPILOGUE_X: {
        id: "END_A_EPILOGUE_X",
        speaker: "나레이션",
        face: "평상",
        lines: () => {
          const lines = [
            "홀트는 복원된 초상을 학교 책상 옆에 건다.",
            "뱅크스는 흐트러진 항구 기록을 다시 정리한다.",
          ];
          if (window.GameState.has("SUB_CAT")) {
            lines.push("선술집 창가엔 회색 고양이 '안개'가 볕을 쬐고 있다.");
          }
          return lines;
        },
        next: "END_MENU",
      },
      END_B_EPILOGUE_X: {
        id: "END_B_EPILOGUE_X",
        speaker: "나레이션",
        face: "평상",
        lines: [
          "며칠 뒤, 줄리언은 가문의 사업을 정리한다며 헤이번을 떠난다.",
          "부두 그림의 붉은 실은 빈 압정 앞에서 끊겨 있다.",
          "검은 마차 한 대가 안개 속으로 사라진다.",
        ],
        next: "END_MENU",
      },
    }),
  });
})();
