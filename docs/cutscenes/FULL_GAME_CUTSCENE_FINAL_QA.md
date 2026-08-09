# 전체 컷신 최종 QA

검토 범위: 승인된 L0→L1, L1→L2와 병렬 제작된 L2→L3, L3→L4, L4→L5,
L5→L6, L6→엔딩 검토본. 실제 게임 진행·저장·해금 연결은 범위에서 제외했다.

## 최종 판정

- 3차 최종 감사: 스토리/노드, 최초 플레이어 경로, 시각/애니메이션 모두 승인
- 최종 P0: 0건
- 최종 P1: 0건
- 본선만 진행하는 `0 → 1A → 2A → 3A → 4A → 5A → 6 → 엔딩` 경로 완결 확인
- 같은 부모가 자식 둘을 여는 묶음 컷신의 자동 연속 재생과 가지 독립성 확인
- 가지 완료 여부는 엔딩 진입 조건이 아니며 합법 fixture에서만 후일담에 반영

## 1차 검토와 수정

- Q5A 전 컷신이 마차 네 줄을 완성해 보이던 선공개 제거
- 줄리언·뱅크스의 최초 등장과 이동 인과 보강
- 카버의 사칭 중 3인칭 발언, 봉인 출처, 12년 재산 유출 설명 수정
- 엔딩에 횡령 동기, 가짜 상속인 계획, 인물별 구금 혐의 추가
- 카버 얼굴을 가리던 손목 합성, 저품질 문신, 빈 증거 카드, 세이렌 양손 자세,
  젊은 램 외형, 뱅크스 성별·연령 불일치를 수정
- 밝은 인서트 캡션 대비와 종이·젖음·붓질 질감을 보강

## 2차 검토와 수정

- 문짝에 남은 네 개의 호가 여전히 네 줄로 셀 수 있던 문제를 발견해 여섯 개의
  비평행·교차 얼룩으로 교체
- 증거벽 축소 카드에 봉인 3줄, `T.C. / 4 MO`, 마차 4줄과 두 얼굴 차이를 명시
- 엔딩 후일담의 시간 역행을 `며칠 뒤 저녁`으로 수정
- 카버와 줄리언의 혐의를 각각 `사칭·공모`, `공모·횡령`으로 분리
- 덧칠·일지 원본에 미리 들어 있던 청록 안내 원을 제거하고 런타임 강조 단계로 이동
- 일부 대사의 조사·소유 관계·증언 주체를 자연스럽게 다듬음

## 3차 최종 감사

- 최초 공개 순서 확인:
  `카버 칠판 4줄 → 진품 봉인 3줄 → T.C. 넉 달 → Q5A 결과 마차 4줄 → 등록부의 줄리언 소유 확정`
- Q5A 전 문짝은 정확한 수를 판독할 수 없고, Q5A 뒤 C6에서만 네 줄이 확정됨
- Q6은 가지가 아닌 사건 입증용 본선 여섯 장만 요구함
- `main-only`, 선술집 `q5b-route`, 형제 역순, 막다름 closing, 전체 후일담 fixture의
  인과관계와 조건 노출을 확인함
- L4→L5와 L5→L6의 뱅크스 표정 자산은 표정별 SHA-256이 동일함
- 모든 컷신 JavaScript가 `node --check`를 통과함

## 사용자 검토 화면

- L0→L1: `http://localhost:8124/cutscene-review-l0-l1.html`
- L1→L2: `http://localhost:8124/cutscene-review-l1-l2.html?bundle=q1a`
- L2→L3: `http://localhost:8130/cutscene-review-l2-l3.html?bundle=q2a`
- L3→L4: `http://localhost:8131/cutscene-review-l3-l4.html?bundle=q3a`
- L4→L5: `http://localhost:8132/cutscene-review-l4-l5.html?bundle=q4a`
- L5→L6: `http://localhost:8133/cutscene-review-l5-l6.html?bundle=q5a`
- 엔딩 본선: `http://localhost:8134/cutscene-review-l6-ending.html?fixture=main-only`
- 엔딩 전체 후일담: `http://localhost:8134/cutscene-review-l6-ending.html?fixture=all`

각 레이어의 다른 부모 경로는 URL의 `bundle`을 해당 부모(`q1b`~`q5b`)로 바꿔 검토한다.

## 통합 전 남은 항목

- 제작용 scene/bundle ID와 실제 `quest-graph.js`의 컷신 ID 사이에 명시적 alias/lookup
  매핑을 만든 뒤 퀘스트 클리어 자동재생에 연결해야 한다.
- 최초 완주 전 스킵 제한, 완료 후 R 다시 보기, 묶음 첫 편 재시작 규칙은 실제 통합 단계에서
  저장 플래그와 함께 적용한다.
- `C0_INTRO`는 기존 결정대로 후순위다.
