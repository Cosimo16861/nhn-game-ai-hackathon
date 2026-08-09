# L6 → 종결 컷신 검토 기록

> 상태: 동일 피드백 에이전트 3회 승인, 브라우저 QA 통과
> 게임 연결: 하지 않음
> 기준: `271ffba`, 병렬 계획 `0ee2b32`
> 검토 서버: `http://127.0.0.1:8134/`

## 검토 URL·재생 시간

| fixture | URL | beat | 예상 자동 재생 |
| --- | --- | ---: | ---: |
| `main-only` | `dev/cutscenes/cutscene-review-l6-ending.html?fixture=main-only` | 25 | 107.0초 |
| `q3b` | `dev/cutscenes/cutscene-review-l6-ending.html?fixture=q3b` | 26 | 110.4초 |
| `q2c-q3c-q4c` | `dev/cutscenes/cutscene-review-l6-ending.html?fixture=q2c-q3c-q4c` | 31 | 132.6초 |
| `q5b-route` | `dev/cutscenes/cutscene-review-l6-ending.html?fixture=q5b-route` | 31 | 133.7초 |
| `all` | `dev/cutscenes/cutscene-review-l6-ending.html?fixture=all` | 36 | 154.0초 |

컷신은 모든 fixture에서 `CE_ENDING` 1편이다. 재생 순서는 등록부 소유자 확정 →
대질 → 저택 → 해당 fixture의 후일담 → 마지막 사무소로 고정했다. 알 수 없는
fixture는 `main-only`로 폴백한다.

## 제작 자산

- 내장 이미지 생성 도구로 만든 환경 플레이트 5종:
  등록부 경찰서, 아셔튼 응접실, 선술집 창가, 아침 광장, 안개가 걷히는 사무소.
- 생성 원본은 `assets/cutscenes/l6-ending/source/*-generated.png`, 정확한 프롬프트와
  선정 기록은 `assets/cutscenes/l6-ending/source/PROMPTS.md`에 보존했다.
- 후처리: 5:3 크롭 → 320×192 BOX 축소 → 80색 양자화 → 640×384 NEAREST 확대.
- 정본 초상 19종. 플레이어·리드는 C0B 승인본, 엘리너·코라는 L1→L2
  승인 PNG를 L6 안으로 복사했고, 줄리언·카버·램은 `portrait-crop-v1`과 소스 SHA를 검사했다.
- L6 안의 실체 fallback 12종:
  `EV_WANTED`, `EV_IDEALIZED`, `EV_TRUE_FACE`, `EV_SEAL_3`, `EV_LEDGER_TC`,
  `EV_CARRIAGE_4`, `EV_CARVER_CHALK_4`, `EV_CHILD_DRAWING`, `EV_TATTOO`,
  `EV_CAT`, `EV_RAM`, `EV_SIREN`.
- 세 줄·`T.C./4 MO`·네 줄·`JULIAN ASHERTON`·`12 YEARS`·`FOUR-WAVE DOOR`는
  생성 PNG에 의존하지 않고 런타임 오버레이로 표시한다.
- 안개 고양이는 Q2B 정본에서 종이 배경을 연속 영역 flood-fill로 제거한
  `sprites/mist-cat.png` RGBA를 사용한다.

## 증언·출처·최초 공개 검사

- 등록부를 열기 전에는 줄리언을 마차 소유자로 결부하는 텍스트·이미지가 없다.
- 등록부 행에서 “등록 소유자=줄리언 아셔튼”을 처음 확정하고, 12년 사용과
  문짝 문양 유지를 이어 확인한다.
- 독립 출처 세 개: 에드먼드의 아버지가 남기고 엘리너가 보관한 편지와 밀랍
  조각에서 복원한 세 줄, 뱅크스 기억에서 복원한
  마차 문 네 줄, 카버가 직접 그린 칠판 네 줄.
- 카버의 백 번 연습 폭로와 장부 `T.C.` 넉 달을 결합했다.
- Q3B는 문신 자백 한 줄에만 반영한다.
- 엘리너는 각진 턱·올라간 왼눈썹·관자놀이 흉터를 직접 확인하고, 보고 싶은
  얼굴이 아닌 실제 아이의 얼굴을 돌려받았다고 결론 낸다.
- Q5B는 에드먼드가 두 손으로 난간을 잡고 어머니를 부른 두려운 열여덟 살이었음과
  엘리너의 사망 신고서 서명으로만 이어진다.
- 가지는 모두 후일담이며 본문 결론·증거·엔딩 진입 조건을 바꾸지 않는다.

## 동일 피드백 에이전트 3회

### 1차 — 미승인 후 수정

1. Q6 증거벽에서 Q0·Q1A가 빠지고 진짜 얼굴이 중복되며 마지막
   `봉인↔마차` 실이 잘못 연결된 문제를 수정했다.
2. 등록부 “사용자” 문구를 “등록 소유자”로 교정했다.
3. `넬 달`, `왼눈썩`, `uae30억`, `방크스`, 안개 표기 손상을 교정했다.
4. 마차 네 줄의 출처를 뱅크스 기억 복원으로 명확히 분리했다.
5. 엘리너·코라 승인 초상 불일치와 정답 문양의 PNG/런타임 중복을 수정했다.
6. 등록부를 인물을 가리지 않는 별도 증거 확대 모드로 바꾸고, 창 닦기·서명·군중·추격·
   안개 해제 애니메이션을 보강했다.

### 2차 — 미승인 후 수정

1. 중립 봉인·장부·마차 card의 Q6 증거벽에 세 줄·`T.C./4 MO`·네 줄 런타임 표시를
   추가했다.
2. 마지막 실을 `seal(287,180) → (287,225) → (483,225) → carriage(483,180)`로
   우회시켜 장부를 관통하지 않게 했다.
3. Q3C의 창 닦은 상태와 피날레의 안개 해제 상태가 다음 beat에서 초기화되지 않게 했다.
4. 고양이 증거 카드를 창가에 띄우던 표시를 고양이 개체 표시로 변경했다.

### 3차 — 승인

- 치명·중요 문제 없음.
- 증거 6장, 정확 런타임 표시, 독립 우회 마지막 실, 소유자 최초 확정,
  독립 출처·자백·조건부·후일담·fixture 조립을 승인했다.
- 완료·ESC 후 화면이 검게 변하던 브라우저 회귀는 held frame 재렌더로 수정했고,
  `R`에서 기존 held rAF를 취소하고 처음부터 재생함을 확인했다.
- 승인 후 브라우저 실화면에서 종이 배경을 완전히 제거한 고양이 RGBA로 교체하고
  `잤듭니다`를 `잠듭니다`로 교정했다. 추가 브라우저 delta QA에서 회귀 없음을 확인했다.

## 자동·브라우저 QA

- `node --check dev/cutscenes/cutscene-review-l6-ending.js`: 통과.
- Python AST 검사와 준비 스크립 실행: 통과.
- 자산 검사: 배경 5종 640×384 RGB, 증거 12종 336×216, RGBA sprite 1종,
  초상 19종, 에러 0.
- manifest의 모든 `EV_*`는 L6 안의 실체 파일이며 symlink·`../l*-*/` 참조가 없다.
- fixture VM 검사: 5종 beat/플래그·Q3B/Q5B 조건부·unknown 폴백 통과.
- 기존 회귀: `game-progress`, `workbench-flow`, `montage-scoring`, `workbench-quests` 4개 테스트 통과.
- 브라우저: 모든 fixture 로드, 640×384 art, 1920×1152 text, 오류 로그 0.
- `SPACE` 1회 문장 완성·2회 다음, `ESC` 스킵·현재 프레임 유지, `R` 처음부터 재생 통과.
- 최초 승인본의 `all` 32 beat를 실제 `SPACE`로 연속 재생해 Q5B, 사무소, 제목 화면, 완료 held frame,
  고양이 개체, 안개 해제 연속성과 한글 누락 없음을 실화면에서 확인했다.
- 게임 진행·저장·해금 코드와 `localStorage`는 읽거나 쓰지 않았다.

## 전체 최종 QA 1차 반영

- 봉인의 출처는 모든 현재 대사·라벨·검토 기록에서 “에드먼드의 아버지가 남기고
  엘리너가 보관한 편지와 밀랍 조각”으로 고정했다. 엘리너가 작성한 편지로
  소유가 바뀌는 표현은 제거했다.
- 대질에 기존 Q4A 장부의 같은 관리 서명 아래 12년 비정상 재산 유출과 감사 위험,
  가짜 상속인에게 장부 승인·재산 처분을 맡겨 횡령을 덮으려 한 계획, 카버·줄리언의
  사칭·공모·횡령 혐의 구금 명령 4비트를 추가했다. 계획 설명은 대사창 3줄 제한을 지키도록
  근거 정리와 처분 위임 계획의 두 비트로 나눴다. 근거는 기존 장부·카버의 사칭 자백·
  등록부뿐이며 새 증거는 만들지 않았다.
- `T.C. 넉 달`은 단독으로 훈련 기간을 확정하지 않고, 카버의 백 번 연습 자백과 넉 달
  지급이 같은 준비 기간을 가리킨다는 결합 추론으로 낮췄다.
- 불가능한 단독 `q5b` fixture를 제거했다. `q5b-route`는 `q3c+q5b` 플래그를 갖는
  tavern-chain 합법 경로이며, 격리 검토 fixture는 만들지 않았다.
- 저택 → 서쪽 복도 → 선술집 → 광장 → Q5B 저택 → 사무소의 각 첫 비트에 검은 화면과
  시간·장소 표기를 넣었다. 가지가 없는 `main-only`도 저택과 사무소 전환을 거쳐 완결된다.
- 재계산 결과는 `main-only` 25비트/107.0초/가지 없음, `q3b` 26비트/110.4초/Q3B만,
  `q2c-q3c-q4c` 31비트/132.6초/Q2C·Q3C·Q4C, `q5b-route`
  31비트/133.7초/Q3C·Q5B, `all` 36비트/154.0초/전체 가지다.
- 등록부 공개 전 줄리언과 마차 소유 관계를 결부하는 비트는 없고, 최초 확정은 기존
  등록부 비트로 유지했다. 증거벽·등록부 런타임 오버레이·마지막 실·타이틀과 가지 독립성도
  그대로 유지했다.
- 브라우저에서 다섯 합법 URL의 최신 fixture 이름과 640×384/1920×1152 canvas를 확인했다.
  `q5b-route`의 선술집·Q5B 저택 몽타주를 실화면으로 확인했고, 단독 `q5b` 요청은
  `main-only`로 폴백했다. `SPACE` 문장 완성/다음, `ESC`, `R`, 콘솔 오류 0도 재검증했다.

## 전체 최종 QA 2차 반영

- 봉인 출처 대사를 “에드먼드의 아버지가 남기고 엘리너가 보관한 편지와 밀랍 조각”으로
  다듬어 괄호형 혈연 설명을 제거했다.
- 비교 화면 캡션도 “에드먼드 아버지가 남기고” / “엘리너가 보관한 편지·밀랍”의
  두 줄 자연문으로 교체했다.
- Q3C/Q4C의 “며칠 뒤” 다음에 오는 Q5B 저택 전환을 “며칠 뒤 저녁”으로 고쳐
  몽타주 시간의 역행을 제거했다.
- 구금 명령은 “카버는 사칭·공모 혐의, 줄리언은 공모·횡령 혐의”로 각 인물의 혐의를
  분리해 명시했다.
- `node --check dev/cutscenes/cutscene-review-l6-ending.js`를 다시 통과했다.

## 변경 파일 범위

- `assets/cutscenes/l6-ending/**`
- `dev/cutscenes/cutscene-review-l6-ending.html`
- `dev/cutscenes/cutscene-review-l6-ending.js`
- `scripts/prepare-l6-ending-cutscene-assets.py`
- `docs/cutscenes/L6_ENDING_CUTSCENE_PLAN.md`
- `docs/cutscenes/L6_ENDING_CUTSCENE_REVIEW.md`

공유 레이어 변경이 필요하지 않아 `shared-change-requests/L6_ENDING.md`는 만들지 않았다.
