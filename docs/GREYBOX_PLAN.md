# 그레이박스 구현 계획서

> ⚠️ **레거시(2026-08-08 기준).** 이 계획이 만든 그레이박스는 대화 선택지와 엔딩 A/B를
> 전제한다. 두 시스템 모두 폐기됐다. 현행 구조는 `QUEST_BRANCH.md`를 볼 것.
> 이 문서는 지금 돌아가는 옛 빌드가 어떻게 만들어졌는지에 대한 기록으로만 유효하다.

> 대상: 이 문서만 읽고 작업을 이어받는 구현자(codex 등)
>
> 목표: 프롤로그부터 **두 엔딩까지 끝까지 플레이되는** 상태를 만든다.
> 월드 그래픽·이동 없이, 현재처럼 버튼으로 장면을 넘긴다.
>
> 선행 커밋: `c510eda` (수직 슬라이스). 이 계획은 그 위에 얹는다.

---

## 0. 3분 요약

이미 **핵심 루프 한 줄기가 브라우저에서 동작한다**(고양이 서브 퀘스트).
대사 러너·플래그 저장소·복원 작업대·숨은 채점·정성 피드백이 모두 구현·검증됐다.

이번 작업은 **새 시스템을 만드는 일이 아니라, 확정된 스크립트를 데이터로 옮기고
장면을 연결하는 일**이다. 새로 만들어야 하는 로직은 사실상 두 개뿐이다.

1. 최종 국면의 **엔딩 판정**(유효 증거 수 계산 → 엔딩 A/B)
2. 엔딩 후 **분기 재시작** 복귀 지점 결정

나머지는 기존 모듈에 데이터를 먹이는 작업이다.

---

## 1. 지금 있는 것

### 1.1 파일 구조

```
index.html                 진입점. 모든 <script> 를 여기서 로드한다
scripts/scoring.js         [기존·수정금지] 시각 유사도 순수 함수 (window.PixelScoring)
scripts/score-manager.js   [사용금지] 점수를 노출하는 폐기된 옛 스펙
scripts/clip-*.js          [미사용] CLIP 제외 결정. 삭제하지 말 것
src/ui.js                  게임 내 확인창 (window.UI)
src/state.js               플래그 저장소 (window.GameState)
src/feedback.js            숨은 점수 → 정성 피드백 (window.RestorationFeedback)
src/dialogue.js            대사 노드 러너 (window.DialogueRunner)
src/restoration.js         복원 작업대 (window.Restoration)
src/data/quest-cat.js      복원 퀘스트 데이터 예시 (window.QuestCat)
src/data/dialogue-cat.js   대사 데이터 예시 (window.DialogueCat)
src/game.js                장면 오케스트레이션
```

모듈은 전부 IIFE + `window.*` 전역이다. 빌드 도구·번들러·프레임워크 없음.
이 방식을 유지할 것 — 정적 파일 그대로 열려야 한다.

### 1.2 실행 방법

```bash
python3 -m http.server 8123
```

`.claude/launch.json`에 `haven-dev`로 등록돼 있다. 브라우저에서 `localhost:8123`.

### 1.3 모듈 API

**window.GameState**
```js
GameState.has(name)              // boolean
GameState.get(name)              // 값 있는 플래그(STAGE, KD1…)
GameState.set(name, value=true)
GameState.clear(name)
GameState.apply({ set:[], clear:[], assign:{} })   // 노드 onEnter/effects
GameState.meets({ requires:[], requiresAny:[] })   // 선택지 조건 판정
GameState.countOf([names])       // 참인 개수
GameState.load() / reset() / save() / subscribe(fn) / snapshot()
```
저장 키는 `haven.save.v1` (localStorage). 모든 변경 시 자동 저장된다.

**window.DialogueRunner**
```js
const runner = DialogueRunner.create(rootElement);
runner.start(table, startNodeId, { onEnd(finishedNode), resetAsked });
```
`rootElement` 안에 다음 `data-role`이 있어야 한다:
`dialogue-box`, `speaker`, `lines`, `choices`, `portrait`.

**window.Restoration**
```js
const bench = Restoration.create(rootElement, { quest, onCleared() });
bench.refresh();
```
`rootElement` 안에 필요한 `data-role`: `canvas`, `palette`, `tools`, `goals`, `clues`, `result`.
`data-action`: `undo`, `redo`, `reset`, `submit`.

**window.RestorationFeedback**
```js
const outcome = RestorationFeedback.evaluate(quest, playerPixels, activeFeatures);
// → { tier:'far'|'partial'|'near'|'pass', cleared:boolean, headline, notes[] }
```
**반환값에 숫자가 없다.** 내부 점수는 `window.HAVEN_DEBUG = true` 일 때 콘솔에만 찍힌다.

**window.UI**
```js
await UI.confirm("메시지\n둘째 줄", { okLabel:"제출한다", cancelLabel:"더 그린다" });
```

---

## 2. 절대 어기면 안 되는 제약

이 넷은 이미 결정됐고, 어기면 되돌리는 비용이 크다.

1. **복원 결과에 숫자를 절대 노출하지 않는다.**
   총점·유사도%·통과선·정답 오버레이 전부 금지. 정성 피드백 4단계만.
   근거: `GAME_DESIGN.md` 8.4, `docs/script/00_SYSTEM.md` 4.2.
   `docs/game_asset_uimaking.txt`에 점수를 공개한다는 서술이 있으나 **폐기된 옛 스펙**이다.

2. **네이티브 `confirm()` / `alert()` 금지.**
   임베드 브라우저에서 차단되어 조용히 `false`가 되고 기능이 죽는다.
   (실제로 이 함정에 한 번 빠졌다.) 반드시 `UI.confirm()`을 쓴다.

3. **CLIP·외부 네트워크 의존 금지.** 현재 외부 요청 0개다. CDN 스크립트,
   폰트, 모델 다운로드를 추가하지 말 것.

4. **LLM·자유 텍스트 입력 없음.** 모든 대사는 사전 작성. 선택지 최대 4개.

---

## 3. 이번에 만들 것

### 3.1 범위

| 구간 | 정본 문서 | 산출물 |
| --- | --- | --- |
| 프롤로그 | `docs/script/01_PROLOGUE.md` | `src/data/dialogue-prologue.js` |
| 1막 | `02_ACT1.md` | `dialogue-act1.js`, `quest-portrait.js` |
| 2막 | `03_ACT2.md` | `dialogue-act2.js`, `quest-seal.js` |
| 3막 | `04_ACT3.md` | `dialogue-act3.js`, `quest-dock.js` |
| 최종·엔딩 | `05_FINALE_ENDINGS.md` | `dialogue-finale.js`, `src/ending.js` |
| 주변 NPC | `06_SIDE_NPCS.md` | `dialogue-side.js` (선택, 후순위) |

**대사는 창작하지 말고 정본 문서에서 그대로 옮긴다.** 노드 ID도 문서와 동일하게
유지할 것(`A1_HOLT_02`, `FIN_CONCLUDE` 등). 문서에 없는 연결 대사가 필요하면
최소한으로 추가하고, 추가한 노드 ID에는 `_X` 접미사를 붙여 구분한다.

### 3.2 범위에서 제외 (하지 말 것)

- 월드 타일맵·플레이어 이동·NPC 배치 — 다음 단계
- 초상·배경 스프라이트 연결 — 다음 단계
- **복원 캔버스 256×256 전환과 디에게틱(게임 세계 안) 연출** — 다음 단계.
  이번엔 임시 저해상도 아트로 둔다. 이 아트는 나중에 버려질 것을 전제로 한다.
- 미니맵·인벤토리·지도 탭·설정 탭
- 사운드

---

## 4. 작업 순서

각 단계 끝에서 **브라우저로 직접 확인**하고 넘어갈 것. 마지막에 몰아서 하지 말 것.

### 1단계 · 장면 라우터 일반화

지금 `src/game.js`는 고양이 퀘스트 전용으로 하드코딩돼 있다. 이걸 일반화한다.

- 장면 등록/전환을 데이터로: `{ id, type:'dialogue'|'restoration'|'board'|'ending', ... }`
- `STAGE` 플래그와 목표(objective) 텍스트를 장면 정의에서 끌어오도록
- 임시 이동 UI: 현재 갈 수 있는 장소를 버튼 목록으로 노출
  (사무소 / 경찰서 / 저택 / 학교 / 선술집 / 부두·창고)
  → 장소별 진입 가능 조건은 `STAGE`로 판정

이 단계가 끝나면 고양이 슬라이스가 **여전히 동작해야 한다**. 회귀 확인 필수.

### 2단계 · 프롤로그 + 1막

- `dialogue-prologue.js`, `dialogue-act1.js` 작성
- `ATT`(태도) 3분기 — 엔딩에 영향 없음, 어조만
- **KD1**(홀트) 구현: 선택 후 잠금, 선택 직전 체크포인트 저장
- `quest-portrait.js`: 얼굴 복원. 필수 특징은 `EV_FACE` 보유 여부로 갈린다
  - `EV_FACE` 있음 → 왼눈썹 비대칭·관자놀이 흉터가 필수 특징에 **추가**
  - 없음 → 윤곽·머리색만. 통과는 가능하되 증거로는 약함
  - `quest-cat.js`의 `requiredFeatures[].clue` 패턴을 그대로 쓴다

확인 포인트: KD1을 다르게 골랐을 때 복원 목표 항목 수가 실제로 달라지는가.

### 3단계 · 2막

- 저택 조사 4종(봉인/닻그림/장부/유품상자) → 각각 `CLUE_*` 부여
- 카버에게 인장을 직접 그리게 하는 장면(`A2_CARVER_SEAL_TEST`) → `CLUE_CARVER_SEAL_4`
- `quest-seal.js`: 인장·문신 복원 (파도 3줄이 정답, 카버 기억은 4줄)
- **KD2**는 경찰서에서. `CLUE_LEDGER_SEEN` 없으면 정답 선택지 C가 잠기고
  대신 보류 선택지 D가 뜬다 → 저택으로 돌려보낸 뒤 재진입

확인 포인트: 장부를 안 보고 KD2에 도달했을 때 C가 회색이고 사유가 표시되는가.

### 4단계 · 3막

- **KD3**(뱅크스) → `EV_CARRIAGE`
- 항해일지 서브(`SUB_LOGBOOK`) — `CAT_POSTER` 있으면 고양이가 위치를 알려주는 분기
- 고양이 회수(`CAT_FOUND` → 코라 반환 → `SUB_CAT`) — 슬라이스에서 만든 `CAT_POSTER`가
  여기로 이어진다. 이 연결을 반드시 살릴 것
- `quest-dock.js`: 부두 현장. 빈 캔버스 배치형
  - 마차 문 문양은 `EV_CARRIAGE` **또는** `CLUE_LOGBOOK` 이 있어야 필수 특징에 들어감

### 5단계 · 최종 국면 + 엔딩 ★ 새 로직

`src/ending.js`를 새로 만든다. `docs/script/00_SYSTEM.md` 3장을 그대로 구현한다.

```js
결정적증거수 = count(EV_FACE, EV_LEDGER, EV_CARRIAGE)      // 0~3
항해일지보정 = (SUB_LOGBOOK && 결정적증거수 < 3) ? 1 : 0
유효증거수   = 결정적증거수 + 항해일지보정                  // 상한 3

IF 결론 == 'mastermind' && 유효증거수 >= 2  → 엔딩 A
ELSE                                        → 엔딩 B
```

- `mastermind` 선택지는 결정적 증거 **1개 이상**일 때만 목록에 나타난다
- `mastermind`인데 유효증거수 < 2 → `FIN_REJECT`(반려). 다시 배치 or 밀어붙이면 B
- 엔딩 A의 `END_A_EVIDENCE`는 **보유한 증거에 따라 대사를 조립**한다
  (문서 05의 4가지 조건부 대사 참조)
- 엔딩 도달 시 `SEEN_END_A` / `SEEN_END_B` 기록, 타이틀에 `사건 기록 n/2`

**엔딩 후 재시작 복귀 지점** (`00_SYSTEM.md` 3.5 / `05` 하단 의사코드):
```
IF 유효증거수 >= 2:  복귀 = 최종 증거판 직전
ELSE: KD3 → KD2 → KD1 순으로 확인해, 오답이었던 가장 나중 판단 직전
```
체크포인트는 KD1/KD2/KD3 선택 **직전** + 최종 증거 제시 **직전**에 저장한다.
`SEEN_END_*`는 복귀 후에도 유지된다.

### 6단계 · 통합 플레이테스트

- 엔딩 A 경로 1회, 엔딩 B 경로 1회를 **처음부터 끝까지** 플레이
- **소요 시간 측정** — 목표 15~20분
- 항해일지로 유효증거수가 1→2가 되는 경로를 반드시 한 번 밟아 볼 것
- 결과를 이 문서 맨 아래 «플레이테스트 기록»에 남긴다

---

## 5. 데이터 작성 규약

### 5.1 대사 노드

`src/data/dialogue-cat.js`를 템플릿으로 삼는다.

```js
window.DialogueAct1 = Object.freeze({
  start: "A1_ELEANOR_01",
  nodes: Object.freeze({
    A1_HOLT_02: {
      id: "A1_HOLT_02",
      speaker: "홀트",
      face: "긴장",                    // 평상 | 긴장 | 고조
      lines: ["...", "..."],          // 최대 3줄, 한 줄 한글 24~28자
      onEnter: { set: ["..."] },      // 진입효과 (선택)
      next: "A1_HOLT_AFTER",          // 선택지 없을 때
      choices: [                       // 있으면 next 대신 사용, 최대 4개
        {
          text: "웃거나 긴장할 때만 드러나는 특징이 있었습니까?",
          requires: ["..."],           // 전부 충족 (선택)
          requiresAny: ["..."],        // 하나 이상 충족 (선택)
          requiresHint: "먼저 장부를 봐야 한다",  // 잠김 사유 표시
          effects: { set: ["KD1_face", "EV_FACE"], assign: { KD1: "face" } },
          once: true,                  // 핵심 판단(★)은 true — 선택 후 제거
          next: "A1_HOLT_KD_face",
        },
      ],
    },
  }),
});
```

- **핵심 판단(★)에는 반드시 `once: true`**. 일반 질문은 붙이지 않는다(재질문 가능).
- 값이 있는 플래그(`KD1`, `STAGE`, `ATT`)는 `effects.assign`을 쓴다.

### 5.2 복원 퀘스트

`src/data/quest-cat.js`를 템플릿으로 삼는다. 아트는 **문자맵**으로 관리한다.

```
'.' 배경(채점 제외)   '#' 선화(제공·수정 불가)   그 외 문자 = 채점 대상 영역
```

필수 필드: `gridSize`, `targetPixels`, `hiddenMask`, `lockedPixels`, `paintable`,
`palette`, `requiredFeatures`, `weights`(합 1), `passingScore`.

**`requiredFeatures[].clue`가 근거 시스템의 핵심이다.** 해당 플래그가 없으면
그 특징은 복원 목표에 표시되지 않고 채점 필수에서도 빠진다. 이 연결을 빠뜨리면
게임의 중심 장치가 죽는다.

팔레트에는 **정답 색 + 그럴듯한 오답 색**을 섞는다(증언을 읽어야 고를 수 있도록).

---

## 6. 완료 조건

1. 사무소에서 시작해 리드의 의뢰를 받는다
2. 세 복원 퀘스트를 모두 수행할 수 있고, 통과 못 해도 진행이 막히지 않는다
3. 복원 결과에 숫자가 **한 번도** 표시되지 않는다
4. 핵심 판단 3회가 각각 결정적 증거와 연결되고, 오답이어도 진행된다
5. 확보한 증거 수와 결론 선택에 따라 엔딩 A 또는 B가 재생된다
6. 엔딩 후 «놓친 분기부터 다시 수사»로 다른 결말을 볼 수 있다
7. 한 번의 결말까지 15~20분 안에 도달한다
8. 새로고침해도 진행이 유지된다(localStorage)
9. 콘솔 에러 0

---

## 7. 함정 모음 (실제로 겪은 것)

- **네이티브 `confirm()`은 차단되어 조용히 실패한다.** 테스트할 때
  `window.confirm`을 덮어쓰면 이 결함이 가려진다. 실제 버튼 클릭으로 검증할 것.
- **결과 패널이 화면 밖에 렌더링되면 "아무 일도 안 일어난 것"처럼 보인다.**
  `scrollIntoView`로 끌어올 것.
- **한국어 조사**: `귀이(가)` 같은 출력이 나온다. `src/feedback.js`의
  `withParticle(word, ["이","가"])`를 쓸 것(받침 판정 구현돼 있음).
- **필수 특징 영역이 너무 작으면** 판정이 거칠어진다(4칸이면 3칸만 맞아도 75%).
  특징당 최소 6~8칸은 확보할 것.
- **퀘스트 수락 후 대사가 막다른 길이 되면** 놓친 증언을 영영 못 듣는다.
  일반 질문 노드는 질문 목록으로 되돌아가게 할 것(`00_SYSTEM.md` 1.4).

---

## 8. 참고 문서 우선순위

충돌 시 위쪽이 이긴다.

1. `docs/GAME_DESIGN.md` — 통합 정본
2. `docs/script/*.md` — 대사·분기 구현 정본
3. `docs/STORY_OUTLINE.md` — 이야기 초안
4. `docs/game_asset_uimaking.txt` — 그래픽·UI 명세. **점수 공개 서술은 폐기됨**

---

## 9. 플레이테스트 기록

> 6단계에서 채운다. 측정한 소요 시간, 막혔던 지점, 분기가 납득되지 않은 순간을
> 구체적으로 남길 것. 이 기록이 다음 단계(월드·아트) 우선순위를 정한다.

| 회차 | 경로 | 소요 시간 | 관찰 |
| --- | --- | ---: | --- |
| A | KD1 `face` → KD2 `julian` → KD3 `weather` → `SUB_LOGBOOK` 보정 → `mastermind` | 6분 07초 | 브라우저 실제 입력 자동화. 엔딩 A, 사건 기록 1/2, 오류 0. 항해일지가 결정적 증거 1개를 보완해 유효 증거가 입증선에 도달하는 경로를 확인했다. |
| B | 새 게임 → KD1 `face` → KD2 `ledger` → KD3 `carriage` → `carver_alone` | 3분 18초 | 빠른 브라우저 입력 자동화. 엔딩 B, 사건 기록 2/2, 오류 0. 충분한 증거가 있어도 카버 단독 결론은 B로 이어짐을 확인했다. |

- 새로고침 뒤에도 사건 기록 2/2와 진행 상태가 유지됐고, 엔딩 메뉴의
  «놓친 분기부터 다시 수사»가 `FINAL` 체크포인트로 복귀하는 것을 확인했다.
- 위 시간은 도구가 대사와 캔버스를 빠르게 입력한 **자동화 소요 시간**이며 사람의
  실제 플레이 시간과 동등하지 않다. 목표인 15~20분 사람 플레이 시간은 아직
  측정하지 않았으므로 자동화 수치와 그대로 비교하면 안 된다.
- 16×16 캔버스에서 넓은 단색 영역을 반복해서 드래그하는 조작은 피로감이 있었다.
  다음 단계 개선 후보는 브러시 크기 조절, 영역 채우기, 또는 일부 요소의 기본 배치다.
  이번 그레이박스 범위에서는 새 도구를 구현하지 않는다.
