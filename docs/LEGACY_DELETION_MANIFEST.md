# 레거시 삭제 승인 대기 목록

> 기준일: 2026-08-10
> 상태: **검토 완료, 삭제 미실행**
> 이유: 약 569MB의 일괄 삭제가 안전 검토에서 거부되었다. 범주별 체크포인트와 명시적
> 재승인 후 실행한다.

## 1. 판단 방법

다음 네 검사를 모두 사용했다.

1. 루트 HTML과 `dev/` HTML의 `<script>`, `<link>`, `src`, `href` 조사
2. JS·CSS·문서·JSON·Python의 경로 문자열 조사
3. `window.*` 전역 심볼의 정의·소비자 교차 검사
4. 현재 게임 흐름과 `quest-graph.js`의 “월드 이동·대화 분기 폐기” 계약 확인

“검색 결과가 없다”만으로 삭제하지 않았다. 동적 경로 접두사, 제작 스크립트 입력,
문서 재현 자산과 별도 작업 트리도 함께 확인했다.

## 2. A등급 — 구조 체크포인트 후 삭제 권고

### 2.1 `assets/게임_이미지_모음/` — 약 440MB

- 내용: 마을 외부, 건물 내부, 플레이어·NPC 스프라이트, 맵 타일, 장애물, 상호작용 물체
- 유입: 단일 과거 커밋 `d1a4c97`
- 현재 제품 참조: 없음
- 남은 참조: 삭제 후보인 구 `src/data/quest-portrait.js` 하나가 교사 초상 시트를 사용
- 제작 의존성 격리: L4→L5가 쓰는 뱅크스·램 원본 시트 두 장과 L0→L1 경찰서
  참고 이미지는 각 `assets/cutscenes/*/source/reference`로 복사하고 준비 스크립트 경로를
  변경했다.
- 삭제 근거: 현재 게임 구조는 월드 이동·NPC 자유대화를 폐기하고 시작 화면, 컷신,
  증거판, 작업대로 한정되어 있다. 승인된 컷신은 별도 `assets/cutscenes` 자산을 사용한다.
- 위험: 미래에 월드 탐색 기능을 되살리면 다시 필요하다.
- 복구: `git restore --source=d1a4c97 -- assets/게임_이미지_모음`

구 `quest-portrait.js`와 반드시 같은 삭제 커밋에서 처리해야 남은 경로가 깨지지 않는다.
삭제 직전 `rg "assets/게임_이미지_모음"` 결과가 삭제 manifest와 구 코드 외 0건인지 다시
확인한다.

### 2.2 `assets/quests/` — 약 31MB

- 내용: 14개 퀘스트의 64/128 후보, 마스크, 비교 시트, 생성 원본
- 현재 제품 참조: 없음
- 대체 정본: `assets/questimage/`의 1254×1254 완성본·윤곽선 28개
- 관련 폐기 대상:
  - `scripts/prepare-restoration-assets.py`
  - `tests/test_restoration_assets.py`
  - `docs/RESTORATION_PIXEL_QA.md`
  - `docs/RESTORATION_SOURCE_IMAGE_QA.md`
- 현재 환경 상태: `tests/test_restoration_assets.py`는 구 후보 파이프라인용 `numpy`가 설치돼
  있지 않아 실행되지 않는다. 신규 1254 계약 테스트는 외부 Python 패키지 없이 통과한다.
- 위험: 옛 후보 생성 과정을 재현할 수 없게 된다.
- 복구: `git restore --source=259bb6c -- assets/quests scripts/prepare-restoration-assets.py tests/test_restoration_assets.py docs/RESTORATION_PIXEL_QA.md docs/RESTORATION_SOURCE_IMAGE_QA.md`

고해상도 계약 테스트가 14쌍과 1254 해상도를 모두 통과한 뒤 범주 전체를 한 커밋으로
삭제한다.

### 2.3 구 월드·대화·복원 코드 — 약 18개 파일

삭제 권고 파일:

```text
src/artwork.js
src/dialogue.js
src/ending.js
src/feedback.js
src/game.js
src/restoration.js
src/state.js
src/ui.js
src/data/dialogue-prologue.js
src/data/dialogue-act1.js
src/data/dialogue-act2.js
src/data/dialogue-act3.js
src/data/dialogue-cat.js
src/data/dialogue-finale.js
src/data/quest-cat.js
src/data/quest-dock.js
src/data/quest-portrait.js
src/data/quest-seal.js
```

- 현재 HTML 참조: 없음
- 현재 제품 전역 소비자: 없음
- 대체 구현: `GameProgress`, `QuestGraph`, `WorkbenchRuntime`, 고해상도 복원 런타임,
  컷신 검토본
- 위험: 일부 이야기 문장이 구 대화 데이터에만 있을 수 있다.
- 완화: 이야기 정본은 `docs/script/07_CUTSCENES.md`와 회수한 컷신 beat 데이터다. 삭제
  전 대사 차이 보고서를 한 번 생성한다.
- 복구: `git restore --source=259bb6c -- <파일 경로>`

### 2.4 `video/` — 약 98MB

- `example_1.mov`, `example_2.mov`, `expample_3.mov`: 컷신 방향 참고 영상
- `c0b-the-job.webm`: 브라우저 녹화 결과이며 런타임이 불러오지 않음
- 현재 제품 참조: 없음. `src/cutscene-c0b.js`는 같은 이름으로 녹화 파일을 만들 수만 있다.
- 문서 참조: `docs/CUTSCENE_DIRECTION_GUIDE.md`, `docs/C0B_PRODUCTION_PLAN.md`
- 위험: 시각 방향의 원본 참고를 잃는다.
- 권고: 최종 컷신이 모두 회수·커밋된 뒤 삭제하고 문서에는 커밋 해시만 남긴다.
- 복구: `git restore --source=259bb6c -- video`

### 2.5 임시 이미지

```text
image/legs.png
image/스크린샷 2026-08-09 오후 3.00.34.png
게임배경이미지.png
```

- 현재 제품 참조: 없음
- 남은 참조: 없음. 코드 주석과 디자인 문서는 640×384 논리 해상도를 직접 적도록 수정했다.
- 권고: 문서 표현을 “640×384 기준”으로 바꾼 뒤 삭제
- 복구: `git restore --source=259bb6c -- image 게임배경이미지.png`

## 3. B등급 — 통합 후 삭제

### `assets/q0-montage/`

현재 Q0 구형 작업대가 실제로 사용하므로 지금 삭제하면 게임 시작 흐름이 깨진다.

삭제 조건:

1. Q0 계약이 `assets/questimage/Q0_*`를 사용한다.
2. Q0가 고해상도 작업대에서 통과한다.
3. `src/data/workbench/q0-montage.js`가 새 계약으로 대체된다.
4. `dev/workbench/workbench-montage.html`이 새 Q0 검증 페이지로 교체된다.

### 구 Q0 작업대 런타임

다음 파일은 현재 실행 중이므로 전체 고해상도 전환 뒤 삭제한다.

```text
scripts/montage-scoring.js
src/data/workbench/q0-montage.js
src/data/workbench-quests.js
src/workbench-runtime.js
src/workbench-entry.js
```

`src/workbench.js`는 기존 작업대 화면 디자인 렌더러이므로 삭제하지 않고 새 런타임의 뷰로
재사용할 가능성이 높다.

### 다중 제품 HTML

`board.html`, `workbench.html`은 단일 `index.html` 셸 전환이 끝난 뒤 `dev/`로 옮기거나
삭제한다. 현재는 실제 이동 fallback이므로 유지한다.

## 4. C등급 — 유지

- 모든 `assets/cutscenes/**`
- 모든 `assets/questimage/**`
- `fonts/**`
- `scripts/prepare-*-cutscene-assets.py`
- `dev/cutscenes/**`
- `src/cutscene-c0-intro.js`, `src/cutscene-c0b.js`
- `src/screen.js`, `src/office.js`, `src/branchmap.js`
- `src/highres-restoration-runtime.js`
- `scripts/highres-restoration-scoring.js`, `scripts/clip-*.js`

컷신 `source/` 폴더는 런타임 미사용이지만 준비 스크립트의 입력이므로 통합 완료 전에는
삭제하지 않는다.

## 5. 권장 삭제 순서

한 번에 삭제하지 않는다.

1. `assets/quests`와 관련 생성기·테스트·옛 QA 문서
2. 구 월드·대화·복원 코드
3. `assets/게임_이미지_모음`
4. 참고 영상과 임시 이미지
5. Q0 전환 후 `assets/q0-montage`와 구 Q0 런타임
6. 단일 셸 전환 후 `board.html`, `workbench.html`

각 단계는 별도 커밋이며, 다음 검증을 통과해야 다음 단계로 간다.

```text
node 문법 검사
전체 Node 테스트
14개 questimage 경로·해상도 검사
index.html 시작 화면 수동 검사
C0→C0B→Q0 수동 검사
모든 dev/cutscenes 페이지 자산 오류 검사
dev/quests Q1A 실패·통과 검사
board 화면 검사
```

## 6. 재승인 요청에 포함할 정보

삭제를 다시 요청할 때는 “모두 삭제”가 아니라 각 범주별로 다음을 사용자에게 제시한다.

- 정확한 경로
- 용량과 파일 수
- 남은 참조 0건 증거
- 대체 파일 경로
- 직전 체크포인트 커밋
- 삭제 후 실행할 테스트
- 복구 명령

이 문서의 A등급은 삭제 권고이지 자동 삭제 허가는 아니다.
