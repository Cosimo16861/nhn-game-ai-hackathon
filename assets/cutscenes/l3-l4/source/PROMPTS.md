# L3 → L4 이미지 생성 프롬프트 기록

생성은 내장 이미지 생성 도구를 사용한다. 원본은 이 폴더에 보존하고 실제 검토 화면은
`scripts/prepare-l3-l4-cutscene-assets.py`로 640×384 도트 후처리한 배경만 사용한다.

## 공통 기준

- Use case: `historical-scene`
- Asset type: 1890년대 고딕 미스터리 픽셀 어드벤처 컷신 환경 플레이트
- Style/medium: 고의적인 저해상도 픽셀 아트, 단단한 도트 군집, 제한된 갈색·청록·회청 팔레트
- Composition: 5:3 가로 화면, 중앙 상단에 인물과 증거 삽입컷을 놓을 여백
- Constraints: 인물 없음, 읽을 수 있는 글자 없음, UI 없음, 워터마크 없음
- Constraints: 하단 106px는 대사창 영역이므로 핵심 사물이나 출입구를 두지 않음
- Avoid: 마차, 문장·봉인·초승달·파도 문양, 사람 얼굴, 사건 정답, 현대 물건

## harbor-square-generated.png

Use case: historical-scene
Asset type: L3→L4 컷신 광장 배경
Primary request: 1890년대 안개 낀 항구 도시의 해질녘 돌바닥 광장, 공개 그림 내기가 열릴 작은 공간
Scene/backdrop: 중앙에 낡은 빈 나무 이젤과 두꺼운 물감이 묻은 캔버스의 뒷면, 낮은 가스등,
젖은 포석, 멀리 시장 천막과 닫히는 상점, 가장자리의 빈 관람 공간
Style/medium: 고딕 미스터리 픽셀 어드벤처 배경, 제한 팔레트와 굵은 픽셀 외곽선
Composition/framing: 5:3 와이드, 이젤은 상단 중앙에서 약간 왼쪽, 오른쪽은 램 초상용 여백,
하단 106px에는 핵심 사물 없음
Lighting/mood: 청회색 안개와 호박색 가스등이 대비되는 늦은 저녁, 공개 도전 직전의 긴장
Constraints: 사람 없음, 캔버스 앞면이나 얼굴 없음, 읽을 수 있는 글자 없음, UI·워터마크 없음
Avoid: 마차, 초승달과 파도 문양, 사건 증거, 현대 간판

## windowless-warehouse-generated.png

Use case: historical-scene
Asset type: L3→L4 컷신 창고 내부 배경
Primary request: 창문이 전혀 없는 1890년대 부두 창고 내부, 고양이의 이동 경로를 따라 들어온 순간
Scene/backdrop: 왼쪽은 낮고 오른쪽은 높은 나무 상자 더미, 중앙 뒤쪽에 고양이가 숨을 좁은 틈,
천장 갈고리에서 흔들리는 등불 하나, 젖은 나무 바닥과 길게 끊기는 반사, 밧줄과 빈 마대
Style/medium: 고딕 미스터리 픽셀 어드벤처 배경, 제한 팔레트와 굵은 도트 군집
Composition/framing: 5:3 와이드, 상자 틈과 반사는 상단 중앙에 명확히, 왼쪽에 플레이어,
오른쪽에 코라 초상용 여백, 하단 106px에는 핵심 단서 없음
Lighting/mood: 등불 하나의 따뜻한 원과 짙은 청록 그림자, 축축하지만 생활 흔적이 있는 긴장감
Constraints: 인물·고양이·종이·일지 없음, 읽을 수 있는 글자 없음, UI·워터마크 없음
Avoid: 창문, 마차, 초승달과 파도 문양, 내용이 적힌 종이, 현대 물건

## 생성·선정 기록

- 프롬프트 기록 뒤 내장 이미지 생성 도구로 각 장소를 한 번씩 생성했다.
- 광장은 인물·문자·문양 없이 캔버스 뒷면과 이젤, 우측 인물 여백이 분명한 첫 결과를
  `harbor-square-generated.png`로 선정했다.
- 창고는 창문·인물·고양이·종이 없이 좌우 높이가 다른 상자, 중앙 틈, 등불과 젖은 바닥
  반사가 분명한 첫 결과를 `windowless-warehouse-generated.png`로 선정했다.
- 두 원본 모두 하단 대사창 영역에 핵심 단서가 없어서 추가 편집 생성은 하지 않았다.
- 실제 배경은 준비 스크립트에서 5:3 중앙 크롭, 640×384 NEAREST 리사이즈, 제한 색상
  양자화를 적용한다.
