# 통합 구현 현황표

> 기준일: 2026-08-10 · 기준 커밋: `1c588c1`
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
| 5 | Q1A 고해상도 본편 이식 | 미착수 | — |
| 6 | 나머지 컷신 묶음 이전 | 미착수 | L1→L2 … 엔딩 6묶음 |
| 7 | 나머지 13개 복원 퀘스트 등록 | 미착수 | — |
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
| 그림 Blob 은 IndexedDB | 저장소 완성. 쓰는 쪽(작업대)은 단계 5 |
| 완료 컷신 번들 16개 | 데이터·검증 완료. 재생 가능한 것은 `B_OPENING`, `B_AFTER_Q0` |
| 복원 퀘스트는 `assets/questimage` 만 사용 | 계약·검증 완료. 런타임 연결은 단계 5·7 |
| 1254 원본 유지, 붓·채우기·되돌리기 | 미착수(단계 5). 현재 Q0 는 구형 64px 작업대 |
| 색 유사도 + 의미 유사도 결합 판정 | 미착수(단계 5). 현재 Q0 는 구형 몽타주 채점 |
| 증거판 썸네일은 실제 복원 결과 | 배선 완료(`BoardScreen.refreshThumbnails`). 저장하는 쪽은 단계 5 |

## 3. 이전이 끝난 컷신

| 번들 | 장면 | 정본 위치 | 검토 페이지 |
| --- | --- | --- | --- |
| `B_OPENING` | `C0_INTRO`, `C0B_THE_JOB` | `src/cutscene-c0-*.js` (legacy adapter) | `dev/cutscenes/cutscene-review-intro.html` |
| `B_AFTER_Q0` | `C1A_RETURNED_HEIR`, `C1B_TWELVE_YEARS_UNDER` | `src/cutscenes/data/beats-l0-l1.js` | `dev/cutscenes/cutscene-review-l0-l1.html` (제품 모듈 호출) |

나머지 여섯 묶음은 아직 `dev/cutscenes/*.js` 안에 데이터와 렌더링이 함께 있다.
`CutsceneRegistry` 에 없는 장면을 재생하려 하면 조용히 넘어가지 않고 오류를 낸다.

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
