# L3 → L4 컷신 검토 기록

> 상태: 내부 제작·QA 완료, 사용자 승인 대기
> 기준: `271ffba`, 병렬 계획 `0ee2b32`
> 게임 연결: 하지 않음
> 검토 서버: `http://127.0.0.1:8131`

## 1. 사용자 검토 URL과 재생 순서

- Q3A 완료 묶음: `http://127.0.0.1:8131/dev/cutscenes/cutscene-review-l3-l4.html?bundle=q3a`
  - 1/2 `C4A_LEDGER_TRAIL` 《세 줄이 남긴 장부》 → Q4A
  - 2/2 `C4C_SQUARE_CHALLENGE` 《광장의 덧칠》 → Q4C
  - 약 61초, 560ms 경찰서 fade-out과 140ms 이동 hold 뒤 광장 fade-in
- Q3B 완료 closing, Q3A 미완료:
  `http://127.0.0.1:8131/dev/cutscenes/cutscene-review-l3-l4.html?bundle=q3b&main=q3a-pending`
  - 1/1 `C3B_TOO_NEW_CLOSING` 《아물지 않은 것》, 약 24초
- Q3B 완료 closing, Q3A 완료:
  `http://127.0.0.1:8131/dev/cutscenes/cutscene-review-l3-l4.html?bundle=q3b&main=q3a-complete`
  - 1/1 같은 closing, 마지막 문구만 중립 복귀로 교체, 약 24초
- Q3C 완료 묶음: `http://127.0.0.1:8131/dev/cutscenes/cutscene-review-l3-l4.html?bundle=q3c`
  - 1/1 `C4B_CAT_FOUND_PAPERS` 《상자 틈의 종이》 → Q4B, 약 33초

모든 URL은 `SPACE` 문장 완성/다음, `ESC` 현재 편만 스킵, `R` 현재 부모 묶음의 첫
편부터 다시 보기를 제공한다. Q3A에서 C4A를 `ESC`로 넘기면 이동 페이드 뒤 C4C가 이어진다.

## 2. 제작 결과

- 컷신 4편, 실제 부모 묶음 3개, Q3B 조건부 fixture 2개
- 신규 생성 환경 원본 2종: 항구 광장 해질녘, 창문 없는 부두 창고
- 후처리 배경 3종: 경찰서 저녁, 항구 광장, 창문 없는 창고
- 삽입컷 6종: 세/네 줄 동일 배율 비교, 판독 전 침수 장부, 닻 손목 조서, 세 잔획만 남은
  덧칠 초상, 젖고 찢어진 일지, 전단과 일치하는 안개
- 초상 15종: 승인된 플레이어·리드·홀트·코라 복사본과 `portrait-crop-v1` 램 3표정
- 효과: 경찰서 비·램프, 증거 확대와 세/네 줄 강조, 장부 물방울·열 강조, 이동 fade,
  광장 군중 실루엣, 세 붓질 펄스, 창고 등불·젖은 반사·종이 모서리 연결

내장 이미지 생성 도구로 환경 원본만 생성했다. 정확한 증거와 인물 정체성은 이미지 생성에
맡기지 않고 기존 정본·준비 스크립트·런타임 픽셀 오버레이로 고정했다. 최종 프롬프트와 선정
기록은 `assets/cutscenes/l3-l4/source/PROMPTS.md`에 있다.

## 3. 증언·스포일러 게이트

- C4A: 밀랍+편지 세 줄 결과와 홀트의 매주 본 진품 출처 → 다른 네 줄을 보고 배웠을 가능성
  → 계속된 지출 → 침수된 12년 관리 장부의 관리 서명/지출/반복 행 복원으로 이어진다.
- C4A 런타임과 이미지에는 장부 복원 뒤에만 읽을 수 있는 이니셜, 서명자, 기간, 차량,
  방계, 범인 결론이 없다.
- C4C: 굽은 코·유독 두꺼운 오른눈썹·네모난 턱의 잔획만 남고 그림의 정체는 말하지 않는다.
- Q3B: 최근 시술의 강한 심증과 법정에서 정확한 날짜를 확정할 수 없다는 한계를 구분한다.
- C4B: 고양이 틈 발견, 기름 먹인 표지, 뱅크스의 매일 기록 습관, 작은 일지 식별, 세이렌
  호 인양 출처와 반환 당위를 모두 포함한다. 내용은 읽지 않고 결·모서리·남은 획만 맞춘다.
- C4B에는 자정, 검은 차량, 위치 기둥, 인명, 소유자, 파도 수 정보가 없다.

## 4. 동일 피드백 에이전트 3회 검토

### 1차 — 미승인, 치명 0 / 중요 2 / 중간 1

1. `[F1-01]` 고표정 초상의 인접 프레임 알파 조각이 램의 흰 소매와 코라의 붉은 반원으로
   보였다. 실제 사용 표정을 오염 없는 `ram-tense`와 `cora-tense`로 교체했다.
2. `[F1-02]` 덧칠 초상에서 완성 얼굴·머리·수염·옷이 너무 많이 보여 복원 당위가 약했다.
   굽은 코·두꺼운 오른눈썹·네모난 턱의 세 잔획만 남기는 코드 고정 카드로 다시 만들었다.
3. `[F1-03]` C4A 정지 프레임 뒤 C4C fade-in만 있어 경찰서를 나오는 이동감이 부족했다.
   560ms fade-out과 140ms 검정 hold를 추가한 뒤 C4C fade-in으로 연결했다.

이야기·증언·스포일러·조건부 closing·SPACE/ESC/R 계약은 1차부터 통과했다.

### 2차 — 승인, 신규 지적 0

- F1-01~03 해소와 이야기·스포일러·키보드·규격 회귀 없음을 확인했다.
- 에이전트의 2차 브라우저 재연결이 불가해 원본 자산과 코드를 직접 검사하고, 루트 세션의
  수정 후 640×384 브라우저 QA를 보조 근거로 판정했다.

### 3차 — 최종 승인, 치명 0 / 중요 0 / 중간 0

- 이야기/출처/복원 당위, 선공개 금지, Q3A 순서·ESC·R, Q3B 두 fixture, Q3C 종이 출처,
  화면·텍스트, 자산·정체성, 실제 게임 비연결의 8개 출시 게이트를 모두 통과했다.
- 신규 `F3-xx` 지적이 없고 F1-01~03 해소 상태가 유지됐다.
- 비차단 잔여 위험: 사용하지 않는 `ram-high.png`, `cora-high.png`에는 원본 시트 가장자리
  조각이 남지만 어떤 beat도 참조하지 않는다. 3차 에이전트 브라우저 재연결은 불가해 루트의
  실화면 QA와 자신의 정적·자산 검사를 함께 근거로 삼았다.

## 5. QA 결과

- JS 문법: PASS (`node --check`)
- Python 준비 스크립트 AST: PASS
- 소유 경계: PASS, L3→L4 소유 영역 밖 diff 없음
- 화면 계약: PASS, art 640×384 / text 1920×1152 / dialogue 336×84
- 자산: PASS, 배경 640×384 / 삽입 336×216 / 초상 높이 320px / symlink 없음
- 필수 대사 앵커와 종이 출처: PASS
- 런타임 금지 스포일러·`localStorage`: PASS
- 브라우저 콘솔 error/warn: 0
- 브라우저 Q3A: 기본 시작, C4A `ESC`→fade→C4C, C4C에서 `R`→C4A 모두 PASS
- 브라우저 Q3B: pending/complete 마지막 문구 각각 PASS
- 브라우저 Q3C: 안개 일치, 일지 발견, 마지막 세이렌 호 출처 문장 끝 글자까지 PASS

## 6. 변경 파일

- `dev/cutscenes/cutscene-review-l3-l4.html`
- `dev/cutscenes/cutscene-review-l3-l4.js`
- `scripts/prepare-l3-l4-cutscene-assets.py`
- `docs/cutscenes/L3_L4_CUTSCENE_PLAN.md`
- `docs/cutscenes/L3_L4_CUTSCENE_REVIEW.md`
- `assets/cutscenes/l3-l4/cutscene-assets.json`
- `assets/cutscenes/l3-l4/source/PROMPTS.md`와 생성 원본 PNG 2개
- `assets/cutscenes/l3-l4/backgrounds/` PNG 3개
- `assets/cutscenes/l3-l4/inserts/` PNG 6개
- `assets/cutscenes/l3-l4/portraits/` PNG 15개

공용 변경 요청은 필요하지 않았고 `shared-change-requests/L3_L4.md`는 만들지 않았다.

## 7. 전체 최종 QA 1차 반영

> 반영일: 2026-08-10
> 범위: L3→L4 소유 런타임·준비 스크립트·인서트만 수정

1. Q3B 완료 closing의 UI식 표현 “남은 열린 원”을 세계관 안의 중립 표현
   “증거판에 남은 일”로 교체했다. Q3A 미완료 fixture의 편지·밀랍 실물 확인 문구와
   closing의 가지 독립성은 유지했다.
2. 모든 상단 증거 캡션 뒤에 88% 암색 바, 1px 짙은 잉크 외곽선, 하단 금색 1px 구분선을
   추가했다. 밝은 `catFound` 인서트에서도 흰 캡션이 배경과 분리되어 읽힌다.
3. `overpaint`/`feature*` 카드에 결정적 종이 섬유, 마른 붓 결, 젖은 테두리를 추가했다.
   굽은 코·두꺼운 오른눈썹·네모난 턱의 세 잔획은 텍스처 뒤에 다시 그려 판독성을 유지했다.
4. `logbook`/`logbookEdges` 카드의 네 조각을 불규칙 찢김 실루엣으로 바꾸고 종이 섬유,
   이중 잉크 번짐, 끊긴 물자국, 흐린 젖은 얼룩을 추가했다. 조각 외곽은 마지막에 다시
   그려 결·모서리 연결 판단이 흐려지지 않게 했다.
5. L2→L3가 참조할 `fresh-anchor-record.png`는 준비 함수와 원본을 수정하지 않았다.
   재생성 전후 SHA256은 모두
   `e748d2a1d006d79d49894929958897c7204b932955683c8b54f549eda411d0bd`로 동일해 닻 도안,
   선명한 먹과 붉은 피부의 시각 정본이 보존됐다.

검증:

- `node --check dev/cutscenes/cutscene-review-l3-l4.js`: PASS
- 준비 스크립트 실행 및 Python AST: PASS
- 640×384 핵심 프레임: 밝은 고양이 캡션, 덧칠 카드, 세 특징, 젖은 일지 모두 PASS
- Q3A `ESC`로 C4A→C4C 자동 진입, C4C `R`로 C4A 복귀: PASS
- Q3B 완료 fixture의 최종 대사 “증거판에 남은 일”: PASS
- 브라우저 콘솔 error/warn: 0
- Q3A 세 줄 공개 시점, Q3B/Q3C 가지 독립성, 336×84 대사창과 게임 비연결: 유지

## 8. 전체 최종 QA 2차 반영 — 덧칠·일지 원본의 큰 청록 원을 제거하고 특징·조각 연결 마커를 `feature*`·`paperEdges` 런타임 단계에서만 순차 표시하도록 수정했다.
