# 프로젝트 구조 정본

> 기준일: 2026-08-10
> 기준 커밋: `259bb6c` 이후 구조 감사 결과
> 목적: 실제 게임 코드, 제작 자산, 검토 도구, 폐기 후보를 물리적으로 구분한다.

## 1. 감사 결론

현재 저장소에는 세 세대의 구현이 함께 있었다.

1. 구형 월드 탐색·대화·16~256px 복원 구현
2. 현재 실행 가능한 시작 화면·오프닝·Q0 작업대·증거판 구현
3. 독립 검토가 끝난 전체 컷신과 1254px `questimage` 복원 실험

이번 구조 감사에서 3번의 후반 컷신 제작물이 별도 Codex 작업 트리 다섯 곳에 흩어져
있음을 확인했다. 이 중 네 작업 트리는 파일이 커밋되지 않은 상태였다. 해당 파일을 현재
프로젝트로 회수했으며 이제 모든 컷신 검토본과 자산은 한 작업 트리에 존재한다.

현재 실제 플레이 경로는 다음까지만 작동한다.

```text
index.html
  → C0_INTRO
  → C0B_THE_JOB
  → Q0_MONTAGE 구형 64px 작업대
  → board.html
  → Q1 이후는 설정 미등록으로 진입 불가
```

따라서 “컷신과 퀘스트가 없다”가 아니라 “제작 결과는 있으나 공통 런타임과 진행
오케스트레이터에 등록되지 않았다”가 정확한 상태다.

## 2. 현재 정리된 최상위 구조

```text
game/
├── index.html                    # 현재 시작 화면·오프닝·Q0 진입점
├── board.html                    # 현재 증거판 화면
├── workbench.html                # Q0 구형 독립 작업대 fallback
├── serve.py                      # 로컬 정적 서버
├── assets/
│   ├── cutscenes/                # C0부터 엔딩까지 승인·검토된 컷신 자산
│   ├── questimage/               # 14개 퀘스트의 1254px 완성본·윤곽선 28개
│   ├── q0-montage/               # 현재 Q0가 아직 사용하는 구형 임시 자산
│   ├── quests/                   # 삭제 승인 대기: 폐기된 64/128 후보 생성물
│   └── 게임_이미지_모음/          # 삭제 승인 대기: 폐기된 월드 탐색용 자산 묶음
├── dev/
│   ├── cutscenes/                # 컷신별 검토 HTML·검토 전용 JS·공용 CSS
│   ├── quests/                   # Q1A 1254px 복원 격리 테스트
│   └── workbench/                # Q0·증거판 개발 테스트 페이지
├── docs/                         # 이야기·계약·QA·통합 계획
├── fonts/                        # C0B가 실제 사용하는 손글씨 폰트
├── scripts/                      # 채점과 제작 자산 준비 도구
├── src/                          # 현재 게임 코드와 통합 후보 런타임
├── tests/                        # Node·Python 자동 테스트
├── image/                        # 삭제 승인 대기: 참조되지 않는 임시 이미지
└── video/                        # 삭제 승인 대기: 분석·녹화 참고 영상
```

`output/questimage`는 더 이상 사용하지 않는다. 런타임 자산을 생성 결과 폴더에 두면 배포
누락 위험이 있으므로 28개 파일을 `assets/questimage`로 이동했다. `output/`은 앞으로 생성
스크립트의 임시 산출물만 허용하며 Git에서 제외한다.

## 3. 디렉터리별 역할 계약

### `assets/`

브라우저가 읽는 최종 런타임 자산만 둔다. 생성 원본을 유지해야 하는 컷신은 각 묶음의
`source/`에 임시로 남아 있지만, 최종 통합 후 배포 대상에서는 제외해야 한다.

- `assets/questimage/`: 복원 퀘스트의 유일한 정답·윤곽선 원천
- `assets/cutscenes/<layer>/`: 컷신 배경·인물·인서트·증거 이미지
- `assets/q0-montage/`: Q0가 고해상도 런타임으로 전환될 때 삭제할 임시 호환 자산

런타임 코드에서 `output/`, `image/`, `video/`, `assets/quests/`,
`assets/게임_이미지_모음/`을 참조해서는 안 된다.

### `src/`

실제 `index.html`에서 실행될 코드만 둔다. `cutscene-review-*`, `*-test.js`처럼 DOM을
직접 점유하는 검토 스크립트는 `dev/`로 이동했다.

현재 `src/`는 아직 평면 구조다. 통합 구현 단계에서 다음 하위 구조로 옮긴다.

```text
src/
├── app/          # 부팅, GameDirector, 화면 전환, 오류 경계
├── core/         # 진행 저장, 결과 저장, 이벤트, 자산 로더
├── data/         # 퀘스트 그래프, 퀘스트 계약, 컷신 번들 레지스트리
├── screens/      # title, cutscene, board, workbench, finale 화면 어댑터
├── cutscenes/    # 공통 플레이어와 레이어별 renderer/data
└── workbench/    # 1254px 그리기·이력·채점·저장
```

이 이동은 파일을 먼저 옮기고 나중에 경로를 고치는 방식으로 하지 않는다. 단계별로 새
모듈을 만들고 테스트를 통과시킨 뒤 기존 파일을 제거한다.

### `dev/`

제품 진입점에서 로드되지 않는 독립 검토 도구만 둔다. 모든 HTML에는
`<base href="../../">`가 있어 루트 기준 자산 경로를 그대로 사용한다.

- `dev/cutscenes/*.html`: 컷신 묶음·fixture 재생
- `dev/cutscenes/*.js`: 승인된 장면 데이터와 시각 렌더링의 현재 원본
- `dev/quests/questimage-q1a-test.html`: 고해상도 복원 런타임 기준 샘플
- `dev/workbench/`: 구형 Q0와 증거판 진행 상태 비교용

검토 전용 파일을 제품 `index.html`에 직접 추가하지 않는다. 통합할 때 데이터와 렌더러를
제품 모듈로 추출하고 검토 페이지는 그 제품 모듈을 호출하도록 역전시킨다.

### `scripts/`

두 종류가 섞여 있다.

- 브라우저 런타임: `scoring.js`, `montage-scoring.js`, `clip-*.js`,
  `highres-restoration-scoring.js`
- 오프라인 제작 도구: `prepare-*-assets.py`

통합 시 브라우저 런타임은 `src/workbench/scoring/`으로 이동하고 `scripts/`에는 오프라인
도구만 남긴다.

## 4. 회수한 컷신 제작물

| 묶음 | 회수 원천 | 상태 | 현재 위치 |
| --- | --- | --- | --- |
| L2→L3 | 분리 작업 트리 `282f` | 미커밋 제작물 | `assets/cutscenes/l2-l3`, `dev/cutscenes` |
| L3→L4 | 분리 작업 트리 `5220` | 미커밋 제작물 | `assets/cutscenes/l3-l4`, `dev/cutscenes` |
| L4→L5 | 분리 작업 트리 `959b` | 미커밋 제작물 | `assets/cutscenes/l4-l5`, `dev/cutscenes` |
| L5→L6 | 분리 작업 트리 `13e2`, `eccea4f` | 커밋된 분기 결과 | `assets/cutscenes/l5-l6`, `dev/cutscenes` |
| L6→엔딩 | 분리 작업 트리 `2914` | 미커밋 제작물 | `assets/cutscenes/l6-ending`, `dev/cutscenes` |

회수본은 현재 브랜치에 아직 커밋하지 않은 상태이므로 통합 구현 전에 먼저 체크포인트
커밋으로 보존해야 한다.

## 5. 제품에 유지할 정본

다음은 삭제하거나 재생성하지 않는다.

- `assets/questimage/**` 28개 PNG
- `assets/cutscenes/**`의 최종 배경·초상·인서트·증거 자산
- `fonts/나눔손글씨 강부장님체.ttf`
- `src/data/quest-graph.js`
- `src/data/questimage-quests.js`
- `scripts/highres-restoration-scoring.js`
- `src/highres-restoration-runtime.js`
- `src/cutscene-c0-intro.js`, `src/cutscene-c0b.js`
- `src/screen.js`, `src/office.js`, `src/branchmap.js`
- `docs/script/07_CUTSCENES.md`, `docs/RESTORATION_QUEST_SPEC.md`

## 6. 삭제 승인 대기 항목

대규모 삭제는 안전 검토에서 거부되어 실행하지 않았다. 정확한 대상, 근거, 위험도와
복구 방법은 `docs/LEGACY_DELETION_MANIFEST.md`에 기록한다.

삭제 전에는 최소한 다음을 만족해야 한다.

1. 회수한 컷신 제작물을 체크포인트 커밋한다.
2. `rg` 정적 참조 검사와 HTML 자산 요청 검사를 다시 통과한다.
3. Q0를 `assets/questimage` 기반으로 전환하기 전에는 `assets/q0-montage`를 삭제하지 않는다.
4. 삭제는 범주별 별도 커밋으로 수행한다.
5. 각 삭제 커밋 후 시작 화면, 컷신 검토 페이지, Q1A 테스트, 증거판을 다시 연다.

## 7. 경로 규칙

- 제품 및 개발 HTML의 기준 URL은 저장소 루트다.
- 자산 경로는 `assets/...`로 시작한다.
- 코드 경로는 `src/...` 또는 `dev/...`로 시작한다.
- 데이터 계약 안의 경로는 파일 위치가 아니라 문서 루트를 기준으로 한다.
- 문자열 이어 붙이기는 각 기능의 `ASSET_ROOT` 한 곳에서만 한다.
- 한 퀘스트의 완성본·윤곽선은 반드시 동일한 `assets/questimage` 접두사를 쓴다.
- 대소문자와 한글 정규화 차이를 허용하지 않는다. 계약 테스트가 실제 파일명을 검사한다.
- 제품 화면 사이를 `location.href`로 이동하는 코드는 최종 통합 후 남기지 않는다.

## 8. 구조 완료 판단 기준

- 루트 제품 HTML은 `index.html` 하나다.
- `board.html`, `workbench.html`은 제품 동작이 단일 셸로 이전된 후 삭제하거나 `dev/`로 옮긴다.
- `src/`에는 제품 코드만, `dev/`에는 검토 코드만 존재한다.
- `output/`은 Git에 올라가지 않는다.
- 모든 런타임 이미지 요청이 `assets/cutscenes`, `assets/questimage`, `fonts` 중 하나로 끝난다.
- 모든 퀘스트 ID가 그래프·이미지 계약·컷신 번들·진행 저장에서 동일하다.
- 저장소를 새로 clone한 뒤 `python3 serve.py`와 `index.html`만으로 전체 완주할 수 있다.
