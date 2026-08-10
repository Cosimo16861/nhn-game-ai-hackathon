# 세션 인계 — 통합 완료 후 최종 정리 단계

> 갱신: 2026-08-10 · 기준 커밋: `860b35d` · 브랜치 `game` · 작업 트리 clean
> 대상: **이 문서만 읽고 작업을 이어받는 구현자**
>
> 이전 판(2026-08-08, 퀘스트 가지 재구성 + 픽셀 프레임 구축)의 내용 중
> 살아 있는 설계 결정은 6·7장에 옮겨 담았다. 그때의 진행 상황 기술은 폐기됐다.

## 0. 문서 지도 — 무엇이 정본인가

| 주제 | 정본 |
| --- | --- |
| 통합 구현 계획·계약 | `docs/GAME_INTEGRATION_PLAN.md` ← **최상위 정본** |
| 지금 어디까지 됐는가 | `docs/INTEGRATION_STATUS.md` |
| 진행 구조(노드·레이어·해금) | `docs/QUEST_BRANCH.md` + `src/data/quest-graph.js` |
| 복원 퀘스트 계약 | `docs/RESTORATION_QUEST_SPEC.md` + `src/data/questimage-quests.js` |
| 이야기 | `docs/STORY_OUTLINE.md` |
| 대사 | `docs/script/07_CUTSCENES.md` + `src/cutscenes/data/beats-*.js` |
| 파일 배치 규칙 | `docs/PROJECT_STRUCTURE.md` |
| 삭제 승인 대기 목록 | `docs/LEGACY_DELETION_MANIFEST.md` |
| 지금 무엇을 할 차례인가 | **이 문서 3장** |

`docs/script/00~06`, `docs/GREYBOX_PLAN.md`, `docs/HIGH_RES_RESTORATION_REWRITE_PLAN.md`는
레거시다. 대사 원본이거나 이미 끝난 단계의 계획이라 남겨 뒀을 뿐, 그대로 구현하면 안 된다.

---

## 1. 지금 상태 한 줄

**루트 `index.html` 하나로 시작 화면부터 엔딩까지 완주된다.** 계획서 단계 0~8이 끝났고,
남은 것은 단계 9(호환 파일 제거, 사용자 승인 필요)와 단계 10(최종 QA 매트릭스)다.

```
시작 화면 → C0 인트로 → C0B 의뢰 → Q0 작업대 → B_AFTER_Q0
  → 증거판 → (14개 복원 퀘스트 / 15개 완료 컷신 묶음)
  → Q6 증거의 방 → B_AFTER_Q6(CE_ENDING) → 시작 화면
```

- 복원 퀘스트 14개 전부 `assets/questimage`의 1254² 쌍만 쓴다.
- 컷신 번들 16개 전부 제품 런타임에 있다. `dev/cutscenes`는 검토 하네스만 남았다.
- 저장은 `heir_game_progress_v2`(localStorage) + `heir_artworks_v1`(IndexedDB).
- 테스트 21개(단위·계약 20 + 본선 완주 E2E 1) 통과.

---

## 2. 저장소 구조 (실제 실행되는 것만)

```text
index.html                      제품 진입점. 이것 하나다
src/
├── app/                        bootstrap · game-director · game-shell
├── core/                       progress-store(v2) · artwork-store · migration-v1-v2 · asset-loader
├── data/                       quest-graph · questimage-quests · completion-bundles · quest-registry
├── screens/                    title · cutscene · board · workbench · finale
├── cutscenes/
│   ├── cutscene-player.js      재생·입력·타자·조건부 beat
│   ├── cutscene-text.js        대화 상자·이름표·줄바꿈
│   ├── cutscene-registry.js    장면 ID → beats/legacy driver
│   ├── legacy-opening.js       C0·C0B adapter
│   ├── data/beats-*.js         6묶음 승인본 (l0-l1 … l6-ending)
│   └── renderers/*.js          6묶음 시각 코드
├── workbench/                  closed-regions · paint-history · highres-canvas
│                               restoration-scorer · workbench-controller
├── screen.js office.js         640×384 픽셀 프레임 (공용)
├── branchmap.js workbench.js   증거판·작업대 표현 계층
└── cutscene-c0-intro.js c0b.js 오프닝 두 장면(아직 자체 재생 루프)
```

`dev/`는 검토 도구 전용이다. 모든 검토 페이지가 이제 **제품 모듈을 호출한다** —
데이터 사본이 없으므로 여기서 시각 회귀를 잡을 수 있다.

### 실행

```bash
python3 serve.py 8124
```

`http://localhost:8124/` — 게임. `python3 -m http.server`는 캐시 때문에 쓰지 말 것.

### 테스트

```bash
for t in tests/*.test.cjs; do node "$t" || echo "FAIL $t"; done
node tests/full-game-main-route.e2e.cjs
```

---

## 3. 다음 작업 — 최종 정리

### 3-1. 단계 10 · 최종 QA 매트릭스 (먼저 할 것)

계획서 10장의 매트릭스 중 **본선 완주만** 자동화돼 있다. 남은 것:

| 경로 | 현재 | 할 일 |
| --- | --- | --- |
| 본선 완주 | ✅ `tests/full-game-main-route.e2e.cjs` | — |
| 선술집 가지 | ❌ | Q1B→Q2B→Q3C→Q4B→Q5B E2E 추가 |
| 단발 가지 | ❌ | Q2C·Q3B·Q4C 독립 완료 E2E |
| 후일담 5종 조합 | 데이터만 | 완료 가지에 따라 엔딩 beat가 갈리는 E2E |
| 재개 | 부분 ✅ | 작업대 draft·통과 직후·컷신 도중·Q6 도중 — 앞 셋은 수동 확인만 |
| 실패 | ❌ | 이미지 404 · IndexedDB 실패 · 저장 quota |
| 접근성 | ❌ | 키보드 완주 · reduced motion · live region · 포커스 복귀 |
| 화면 | ❌ | 1280×720 / 1440×900 / 좁은 화면 / 고DPI |

E2E 작성법은 `tests/full-game-main-route.e2e.cjs`를 그대로 본떠라. 진짜
`GameDirector`·`ProgressStore`·번들을 쓰고 화면 어댑터만 대역으로 갈아 끼운다.

### 3-2. 통과선 실측

실제 붓질로 통과까지 해 본 것은 **Q0(82.4)·Q1A(62.6)뿐**이다. 나머지 12개는
통과선 60이 적절한지 확인되지 않았다. 계획서 7.4가 예고한 조정 대상이다.

- 조정할 때는 `src/data/questimage-quests.js`의 `DEFAULT_SCORING`이나 퀘스트별
  `scoring` override만 고친다. **scorer 코드는 건드리지 않는다.**
- `window.HAVEN_DEBUG = true`로 켜면 제출 시 콘솔에 점수가 찍힌다.

### 3-3. 단계 9 · 호환 파일 제거 (사용자 승인 필요)

`docs/LEGACY_DELETION_MANIFEST.md`의 A등급은 **삭제 권고이지 허가가 아니다.**
범주별로 사용자에게 경로·용량·남은 참조 0건 증거·복구 명령을 제시하고 승인을 받아라.

지금은 제품이 로드하지 않지만 아직 저장소에 있는 것:

```text
board.html, workbench.html          단일 셸 전환 완료. dev/ 이동 또는 삭제 대상
src/intro.js                        TitleScreen·GameDirector가 대체
src/index-workbench.js              WorkbenchScreen이 대체
src/workbench-flow.js               Director가 대체
src/workbench-runtime.js            고해상도 controller가 대체
src/workbench-entry.js, board-entry.js
src/data/workbench-quests.js, src/data/workbench/q0-montage.js
scripts/montage-scoring.js, scripts/scoring.js
assets/q0-montage/                  ⚠ L0→L1 컷신의 수배 전단이 아직 참조한다
구 월드·대화 코드 18개               LEGACY_DELETION_MANIFEST 2.3
```

`assets/q0-montage/montage-target.png`는 `src/cutscenes/renderers/l0-l1.js`가
쓰고 있으므로 **지금 지우면 컷신이 깨진다.** 다른 자산으로 바꾸거나 남겨야 한다.

### 3-4. 남은 계약 구멍

- **`grants`가 전부 빈 배열이다.** `src/data/completion-bundles.js`의 16개 번들이
  증거 플래그를 하나도 주지 않는다. 어느 정본 문서에도 번들별 명세가 없어서
  임의로 만들지 않았다. 대본에서 확정되면 그 파일 한 곳만 고치면 된다.
- 오프닝 두 장면(C0_INTRO·C0B_THE_JOB)은 아직 자체 재생 루프를 쓰는 legacy
  adapter다. 계획서 5.3의 마지막 단계로, 나머지가 안정되면 beats로 흡수한다.

---

## 4. 이 통합에서 새로 생긴 계약 (되돌리면 깨진다)

### 4-1. 통과와 해금은 다른 사건

```
그림 통과  → progressStore.beginQuestCompletion(questId, bundleId)
             = clearedQuestIds 추가 + pending 예약, 한 번의 저장
             ⚠ 이 시점에 자식은 열리지 않는다
번들 종료  → progressStore.completeBundle(bundleId)
             = completedBundleIds·seenSceneIds·grants 적용 + pending 제거
             ⚠ 자식 해금은 여기서만 일어난다
```

통과 직후 창을 닫아도 다음 실행이 완료 컷신부터 재개된다. 이걸 깨면 진행이 영구히 막힌다.

### 4-2. 퀘스트 등록은 데이터뿐

`src/data/quest-registry.js`가 세 정본을 join해 descriptor를 만든다.
**퀘스트별 분기 코드는 어디에도 없다.** 새 퀘스트를 열려면:

| 넣을 것 | 어디에 |
| --- | --- |
| 이미지 쌍·증언·팔레트 | `questimage-quests.js` |
| 붓·확대·선 임계값 | `DEFAULT_TOOLS` (필요할 때만 퀘스트별 override) |
| 가중치·통과선 | `DEFAULT_SCORING` (필요할 때만 override) |
| 완료 번들·장면·해금 | `completion-bundles.js` |
| 레이어·부모·순서 | `quest-graph.js` |

`QuestRegistry.validate()`가 부팅 시, `tests/quest-registry.test.cjs`가 CI에서 검사한다.

### 4-3. 조건부 beat

형제 노드를 어떤 순서로 깼는지에 따라 대사가 갈리는 곳이 5개 있다.
검토본은 URL fixture로 흉내 냈지만 **제품은 실제 통과 기록으로 판정한다.**

```js
{ ...beat, when: { cleared: ["Q3A_SEAL"] } }      // 통과했을 때만
{ ...beat, when: { notCleared: ["Q3A_SEAL"] } }   // 아직일 때만
```

`CE_ENDING`의 후일담 5종도 같은 방식이다(`QuestGraph.EPILOGUE_CUTS`와 일치해야 한다).

### 4-4. Q6는 복원 퀘스트가 아니다

증거의 방은 그림을 그리지 않는다. 본선 여섯 장을 여섯 주장에 잇는다.
**여섯 연결이 모두 맞아야** 엔딩이 예약된다. `FinaleScreen.isSolved()`가 단일 기준이다.

### 4-5. 엔딩 후 저장 상태

`GameDirector.getCompletionState()`가 네 가지를 한곳에서 말한다.
`allRequiredCleared` / `endingCompleted` / `continueBehaviour` / `canStartNewGame`.

- 가지는 엔딩 필수가 아니다. 엔딩 뒤 계속하기는 증거판으로 간다.
- "새 이야기 시작"은 엔딩을 본 저장에서만 나타나고, 확인창을 거쳐 진행과 그림을 함께 지운다.

---

## 5. 문서 간 충돌 — 해소된 것과 남은 것

| 충돌 | 해소 |
| --- | --- |
| CLIP 제외(구 handoff) vs CLIP 15%(계획서 7.4) | **계획서 채택.** CLIP은 선택적 보조 신호이고 실패해도 제출을 막지 않는다 |
| 64·128·256 격자(구 handoff) vs 1254 원본(계획서·SPEC) | **계획서 채택.** 전 퀘스트 1254² 원본, 1px 붓 없음 |
| `quest-graph.cutscene` ID 16개 vs 제작본 장면 ID 16개 | `completion-bundles.js`가 잇고, 옛 ID는 `legacyCutsceneId`로만 남는다 |
| 인수인계가 지목한 `QUESTIMAGE_RESTORATION_REWRITE_PLAN.md`·`WORKBENCH_PRODUCTION_SPEC.md` | 저장소에 없다. 각각 `HIGH_RES_RESTORATION_REWRITE_PLAN.md`·`RESTORATION_QUEST_SPEC.md`가 대응한다 |
| 번들별 `grants` | **미해소.** 3-4 참조 |

---

## 6. 되돌리면 안 되는 이야기·시스템 결정

### 🔴 인장 설정 — 이 이야기의 심장

- 아셔튼 **본가** 인장 = 초승달 아래 파도 **세 줄**. 엘리너가 12년째 보관
- 줄리언은 **방계**. 그의 마차·문구류 문장은 파도 **네 줄**
- 줄리언은 본가 인장 실물을 본 적이 없어, 카버에게 자기 마차 문양을 가르쳤다

배후를 지목하는 것은 증언이 아니라 **플레이어가 직접 칠한 두 복원물의 대조**다
(`Q3A_SEAL` 세 줄 ↔ `Q5A_DOCK` 네 줄). 되돌리면 추리가 무너진다.

### 시스템

- **복원 결과에 숫자를 노출하지 않는다.** 정성 피드백 4단계만
- **네이티브 `confirm()`/`alert()` 금지.** 차단 환경에서 조용히 실패한다
- **복원 목표는 설계 용어가 아니라 목격담으로 표시한다**
- **진행 화면은 디에게틱하다.** 증거판 = 사무소 벽의 코르크판
- **단일 엔딩.** 가지는 결정적 증거를 주지 않고 후일담 컷으로 보상한다
- **컷신에 선택지 없음.** 증거는 번들 종료 시 일괄 적용
- **파도 세 줄과 마차 문양은 예외 없이 본선 복원으로만 드러난다**

### 화면 프레임 규칙 (`QUEST_BRANCH.md` 3.3이 정본)

- HTML 패널을 섞지 말 것. 640×384 캔버스 한 장 안에서 끝낸다
  - 예외: 고해상도 작업면은 DOM 캔버스를 작업대 사각형 위에 정확히 겹친다
- 글자는 `PixelScreen.text()` (3배 해상도 레이어). 저해상도 `fillText`는 한글 획을 뭉갠다
- 음영은 `fade`/`glow`. 한 색을 넓게 디더로 깔면 체커보드가 된다
- 확대는 정수배만. 색은 `PixelScreen.PAL`에만 추가
- 난수는 씨앗 고정. 누르는 것은 `screen.hotspot()`의 투명 DOM 버튼

---

## 7. 함정 (실제로 겪은 것들)

- **`python3 -m http.server`는 캐시 때문에 수정이 반영되지 않는다.** `serve.py`를 쓸 것
- **`Workbench.render()`는 핫스팟 층을 통째로 비운다.** 그 위에 얹은 그리기 표면을
  render마다 다시 붙여야 한다(`workbench-controller.js`의 `render()`)
- **1초마다 핫스팟을 새로 만들면 클릭이 씹힌다.** mousedown과 mouseup 사이에 버튼이
  사라지면 click 이벤트가 발생하지 않는다. `branchmap.js`는 노드 구성이 바뀔 때만 다시 만든다
- **1254² ImageData 전체를 이력에 쌓지 말 것.** 한 장이 6.3MB다.
  `paint-history.js`는 실제로 지나간 64px 타일만 뜬다
- **미리보기 창(`document.hidden`)에서는 rAF가 멈춘다.** 캔버스 백킹 스토어는 갱신되는데
  화면 래스터가 안 바뀐다. 실제 사용자에게는 해당 없음. 확인할 때 transform을 살짝 흔들면 반영된다
- **검증할 때 상태를 주입해 UI를 우회하면 실제 결함을 스스로 가린다.** 실제 클릭으로 확인할 것
- 외곽선 색은 양자화 팔레트에 자동 추가된다(빠뜨리면 선화가 안 생긴다)

---

## 8. 커밋 기록 (이번 통합)

| 커밋 | 내용 |
| --- | --- |
| `173558a` | 단계 1 — 완료 컷신 번들 계약과 부팅 검증기 |
| `ef0d2b4` | 단계 2 — ProgressStore v2 · ArtworkStore · v1 마이그레이션 |
| `1c588c1` | 단계 3·4 — 공통 컷신 플레이어와 단일 `index.html` 셸 |
| `7842a33` | 현황표와 문서 충돌 기록 |
| `edae4d0` | 단계 5 — Q0·Q1A를 questimage 고해상도 작업대에 연결 |
| `b25af43` | 단계 7 — 데이터 기반 등록부, Q1B~Q5B 등록 |
| `860b35d` | 단계 8 — Q6 증거의 방과 `B_AFTER_Q6` → `CE_ENDING` |
