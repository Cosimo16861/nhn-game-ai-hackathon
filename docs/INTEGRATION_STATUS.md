# 통합 구현 현황표

> 기준일: 2026-08-10 · 기준 커밋: 단계 7 등록 완료 시점
> 정본: `docs/GAME_INTEGRATION_PLAN.md`
> 이 문서는 계획서의 단계별 진척만 기록한다. 설계 결정은 계획서에 있다.

## 1. 단계별 현황

| 단계 | 내용 | 상태 | 산출물 |
| --- | --- | --- | --- |
| 0 | 회수본 보존 체크포인트 | 완료(선행) | `7ecd508` |
| 1 | 번들 계약과 검증기 | **완료** | `src/data/completion-bundles.js`, `tests/completion-bundles.test.cjs`, `tests/runtime-asset-paths.test.cjs` |
| 2 | ProgressStore v2 · ArtworkStore | **완료** | `src/core/{progress-store,artwork-store,migration-v1-v2}.js` |
| 3 | 공통 컷신 플레이어 세로 슬라이스 | **완료** | `src/cutscenes/**`, L0→L1 추출, 검토 페이지 역전 |
| 4 | 단일 셸 | **완료** | `index.html`, `src/app/**`, `src/screens/**` |
| 5 | Q1A 고해상도 본편 이식 | **완료** | `src/workbench/**`, Q0·Q1A 이식 |
| 6 | 나머지 컷신 묶음 이전 | 진행 중 | L1→L2 … L5→L6 완료. 엔딩(CE_ENDING) 1묶음 남음 |
| 7 | 14개 복원 퀘스트 등록 | **완료** | `src/data/quest-registry.js`. 퀘스트별 코드 없음 |
| 8 | Q6 · 엔딩 | 미착수 | `finale` 화면은 컨테이너만 존재 |
| 9 | 호환 파일 제거 | 미착수 | 승인 필요 |
| 10 | 최종 QA 매트릭스 | 미착수 | — |

## 2. 계획서 요구와 현재 코드 대조

| 계획서 요구 | 현재 |
| --- | --- |
| 제품 진입점 루트 `index.html` 하나 | 충족. `board.html`·`workbench.html` 은 fallback 으로만 남음 |
| 제품 코드에 `location.href` 화면 이동 없음 | 충족. `src/board-entry.js` 의 이동은 board.html fallback 전용 |
| 화면 다섯 종류 | 충족. `finale` 은 컨테이너만 있고 단계 8에서 채운다 |
| 진행 저장 v2 + pending | 충족 |
| 그림 Blob 은 IndexedDB | 충족. draft 자동 저장, 통과 시 final(1254 PNG)·thumbnail(160) 저장 |
| 완료 컷신 번들 16개 | 16개 중 15개 재생 가능. `B_AFTER_Q6`(엔딩)만 단계 8 |
| 복원 퀘스트는 `assets/questimage` 만 사용 | 충족. 14개 전부 questimage 쌍만 쓴다 |
| 1254 원본 유지, 붓·채우기·되돌리기 | 충족. 14개 전부. 붓·확대·선 임계값은 계약 데이터에서 온다 |
| 색 유사도 + 의미 유사도 결합 판정 | 충족. 색 70/채색 15/CLIP 15, CLIP 불가 시 82/18, 통과선 60 |
| 증거판 썸네일은 실제 복원 결과 | 충족. 통과한 퀘스트 카드가 플레이어가 칠한 그림을 보여 준다 |

## 3. 이전이 끝난 컷신

| 번들 | 장면 | 정본 위치 | 검토 페이지 |
| --- | --- | --- | --- |
| `B_OPENING` | `C0_INTRO`, `C0B_THE_JOB` | `src/cutscene-c0-*.js` (legacy adapter) | `dev/cutscenes/cutscene-review-intro.html` |
| `B_AFTER_Q0` | `C1A_RETURNED_HEIR`, `C1B_TWELVE_YEARS_UNDER` | `data/beats-l0-l1.js` | `cutscene-review-l0-l1.html` |
| `B_AFTER_Q1A` | `C2C_RAIN_BEHIND_THE_DOOR`, `C2A_HOLTS_MEMORY` | `data/beats-l1-l2.js` | `cutscene-review-l1-l2.html` |
| `B_AFTER_Q1B` | `C2B_MIST_IS_MISSING` | `data/beats-l1-l2.js` | 같은 페이지 `?bundle=q1b` |
| `B_AFTER_Q2A` | `C3A_CARVERS_CREST`, `C3B_FRESH_ANCHOR` | `data/beats-l2-l3.js` | `cutscene-review-l2-l3.html` |
| `B_AFTER_Q2B` | `C3C_FOLLOW_THE_FLYER` | `data/beats-l2-l3.js` | 같은 페이지 `?bundle=q2b` |
| `B_AFTER_Q2C` | `C2C_OPEN_DOOR_CLOSING` | `data/beats-l2-l3.js` | 같은 페이지 `?bundle=q2c` |
| `B_AFTER_Q3A` | `C4A_LEDGER_TRAIL`, `C4C_SQUARE_CHALLENGE` | `data/beats-l3-l4.js` | `cutscene-review-l3-l4.html` |
| `B_AFTER_Q3B` | `C3B_TOO_NEW_CLOSING` | `data/beats-l3-l4.js` | 같은 페이지 `?bundle=q3b` |
| `B_AFTER_Q3C` | `C4B_CAT_FOUND_PAPERS` | `data/beats-l3-l4.js` | 같은 페이지 `?bundle=q3c` |
| `B_AFTER_Q4A` | `C5A_CARRIAGE_WITNESS` | `data/beats-l4-l5.js` | `cutscene-review-l4-l5.html` |
| `B_AFTER_Q4B` | `C5B_SIREN_WITNESS` | `data/beats-l4-l5.js` | 같은 페이지 `?bundle=q4b` |
| `B_AFTER_Q4C` | `C4C_PAINTER_CLOSING` | `data/beats-l4-l5.js` | 같은 페이지 `?bundle=q4c` |
| `B_AFTER_Q5A` | `C6_EVIDENCE_WALL` | `data/beats-l5-l6.js` | `cutscene-review-l5-l6.html` |
| `B_AFTER_Q5B` | `C5B_THAT_NIGHT_CLOSING` | `data/beats-l5-l6.js` | 같은 페이지 `?bundle=q5b` |

남은 것은 `B_AFTER_Q6`(`CE_ENDING`) 하나이며 단계 8에서 Q6 증거의 방과 함께 이전한다.
`CutsceneRegistry` 에 없는 장면을 재생하려 하면 조용히 넘어가지 않고 오류를 낸다.

### 조건부 beat

검토본이 URL fixture 로 흉내 내던 형제 노드 의존 대사를 `when` 조건으로 바꿨다.
제품은 `ProgressStore` 의 실제 통과 기록으로 판정한다(GAME_INTEGRATION_PLAN 9.2).

| 장면 | 조건 | 검토본 fixture |
| --- | --- | --- |
| `C2C_OPEN_DOOR_CLOSING` | `Q2A_TRUE_FACE` 통과 여부 | `?q2a=complete` |
| `C3B_TOO_NEW_CLOSING` | `Q3A_SEAL` 통과 여부 | `?main=q3a-complete` |
| `C4C_PAINTER_CLOSING` | `Q5A_DOCK` 통과 여부 | `?q5a=1` |
| `C5B_THAT_NIGHT_CLOSING` | `Q5A_DOCK` 통과 여부 | `?q5a=complete` |

## 4. 문서 간 충돌 기록

임의로 정리하지 않고 그대로 남긴다. 정본은 `GAME_INTEGRATION_PLAN.md` 다.

1. `docs/SESSION_HANDOFF.md`(2026-08-08) 7장은 **CLIP 제외**와 **64·128·256 격자**를
   확정 사항으로 적고 있으나, `GAME_INTEGRATION_PLAN`(2026-08-10) 7.4 와
   `RESTORATION_QUEST_SPEC` 는 **CLIP 15% 보조 점수**와 **1254 원본**이다.
   후자를 따랐다. SESSION_HANDOFF 는 갱신이 필요하다.
2. `quest-graph.js` 의 `cutscene` ID 16개와 제작본 장면 ID 16개는 이름이 전부 다르다.
   `completion-bundles.js` 가 둘을 잇고, 옛 ID 는 `legacyCutsceneId` 로만 남겼다.
   해금 위상은 두 표가 완전히 일치했다(테스트가 검사한다).
3. 번들별 `grants`(증거 플래그)는 어느 정본 문서에도 없다. 임의로 만들지 않고
   전부 빈 배열이다. 대본에서 확정되면 `completion-bundles.js` 한 곳만 고치면 된다.
4. 인수인계 지시가 지목한 `QUESTIMAGE_RESTORATION_REWRITE_PLAN.md` 와
   `WORKBENCH_PRODUCTION_SPEC.md` 는 저장소에 없다. 각각
   `HIGH_RES_RESTORATION_REWRITE_PLAN.md` 와 `RESTORATION_QUEST_SPEC.md` 를 읽었다.

## 5. 통합 중 바뀐 기존 동작

| 대상 | 변경 | 이유 |
| --- | --- | --- |
| `index.html` 의 "당신의 역할" 카드 | 제품 셸에서 제거 | `?stay=1` 로만 도달하던 개발 경로이며 계획서 흐름에 없다. `src/intro.js` 에는 남아 있다 |
| `src/intro.js`, `src/index-workbench.js` | 더 이상 로드하지 않음 | 역할을 `TitleScreen`·`GameDirector`·`WorkbenchScreen` 이 가져갔다. 파일은 검증이 끝날 때까지 남긴다 |
| `board.html` 의 선택 이동 | `index.html?workbench=` → `workbench.html?tutorial=` | 새 셸이 URL 파라미터를 받지 않는다. board.html 은 확인용 fallback 이다 |
| `BranchMap` 핫스팟 | 노드 구성이 바뀔 때만 재생성 | 1초 시계 갱신이 버튼을 지워 선택이 씹혔다 |
| Q0 복원 자산 | `assets/q0-montage` → `assets/questimage/Q0_MONTAGE__*` | 모든 복원 퀘스트가 questimage 만 쓴다는 계약. `assets/q0-montage` 는 L0→L1 컷신 수배 전단이 아직 참조하므로 삭제하지 않았다 |
| `src/workbench.js` 도구 슬롯 | `view.tools` 로 대체 가능 | 1px 붓을 쓰지 않기 위해 16·36·72px 붓으로 교체 |
| `src/workbench.js` 표찰 | `view.zoom` 이 있으면 확대 −/＋ 로 표시 | 60~160% 확대를 도트 화면 안에서 조작하기 위해 |
| 구 Q0 런타임 | index.html 에서 제거 | `workbench-runtime.js`·`montage-scoring.js`·`workbench-quests.js`·`q0-montage.js` 는 `workbench.html` fallback 에만 남는다 |
| 도구·채점 계약 | `questimage-quests.js` 의 `DEFAULT_TOOLS`/`DEFAULT_SCORING` 한 곳 | 14곳에 복사하지 않는다. 퀘스트별로 다르게 가려면 그 퀘스트에만 override 를 둔다 |
| 작업대 진입 판정 | 하드코딩 목록 → `QuestRegistry` | 퀘스트를 여는 데 필요한 것은 데이터뿐이다 |

## 6. 퀘스트 등록부

`src/data/quest-registry.js` 가 세 정본을 join 해 퀘스트 하나의 descriptor 를 만든다.
퀘스트를 더 여는 데 필요한 코드는 없다 — 아래 세 곳에 데이터를 넣으면 된다.

| 항목 | 어디서 오는가 |
| --- | --- |
| questimage 원본/미완성 이미지 | `questimage-quests.js` `targetSource`/`outlineSource` |
| 증언 메모·팔레트 | `questimage-quests.js` `witnessNotes`/`palette` |
| 붓과 채우기 설정 | `questimage-quests.js` `DEFAULT_TOOLS` (+ 퀘스트별 `tools` override) |
| 판정 가중치·통과 기준 | `questimage-quests.js` `DEFAULT_SCORING` (+ 퀘스트별 `scoring` override) |
| 성공 후 재생할 컷신 번들 | `completion-bundles.js` |
| 다음 퀘스트 해금 조건 | `completion-bundles.js` `unlocks` (트리거는 항상 번들 종료) |
| 등록 순서·레이어·부모 | `quest-graph.js` |

`QuestRegistry.validate()` 가 부팅 시 이 계약을 검사하고, 다음 테스트가 CI 에서 같은 것을 본다.

- `tests/quest-registry.test.cjs` — 필수 여섯 항목, 등록 순서, 중복 없는 join
- `tests/quest-image-paths.test.cjs` — 이미지 실존·해상도·이름 정규화·index.html 로드 목록
- `tests/quest-completion-contract.test.cjs` — 계획서 4장 연결표, 장면 실존, 해금 사슬

