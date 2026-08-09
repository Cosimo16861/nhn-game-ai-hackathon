# L2 → L3 이미지 생성 프롬프트 기록

환경 플레이트만 내장 이미지 생성 도구로 만든다. 등장인물, 읽을 수 있는 문자, 증거 정답,
초승달·파도 문양, 닻 문신은 생성 이미지에 넣지 않는다. 인물은 정본 초상 시트를 쓰고,
증거는 기존 퀘스트 자산 또는 결정적인 런타임 픽셀 오버레이로 그린다.

## 공통 기준

- Use case: historical-scene
- Asset type: 1890년대 안개항 고딕 미스터리 픽셀 어드벤처 컷신 환경 플레이트
- Style/medium: 고의적인 저해상도 픽셀 아트, 단단한 도트 군집, 제한된 갈색·청록·회청 팔레트
- Composition: 5:3 와이드, 하단 106px에는 핵심 단서 없이 대사창 여백, 중앙 상단에 인물·증거 오버레이 여백
- Constraints: 환경만, 640×384 후처리에 견디는 큰 형태, L0→L1 경찰서와 같은 픽셀 밀도
- Avoid: 사람, 얼굴, 고양이, 읽을 수 있는 문자, UI, 말풍선, 워터마크, 초승달·파도 문양, 봉인, 닻 문신

## dock-warehouse-exterior-generated.png

Use case: historical-scene
Asset type: `C3C_FOLLOW_THE_FLYER` 환경 플레이트
Primary request: 생활감 있는 1890년대 부두와 창문 없는 목조 창고 외부를 해질녘 픽셀 아트로 그린다.
Scene/backdrop: 화면 오른쪽에 크고 창문 없는 어두운 창고, 열린 출입구 안쪽에는 발밑만 비추는 작은 등불 하나;
왼쪽에는 젖은 돌바닥, 계류 기둥, 밧줄, 빈 수레와 높이가 다른 상자 더미. 먼 항구 안개와 잔잔한 물결.
Composition/framing: 와이드 고정 카메라, 왼쪽 벽/기둥에 전단 오버레이를 붙일 빈 면, 중앙은 인물 초상 여백.
Lighting/mood: 차가운 회청색 해질녘과 작은 호박색 등불, 젖은 바닥 반사가 명확함.
Constraints: 창고에는 창문이 하나도 없어야 함; 상자는 좌우 높이가 달라야 함; 환경만.
Avoid: 사람, 고양이, 종이 내용, 읽을 수 있는 글자, 마차, 문장/문양, UI, 워터마크.

## open-child-room-generated.png

Use case: historical-scene
Asset type: `C2C_OPEN_DOOR_CLOSING` 환경 플레이트
Primary request: 12년 만에 열린 빅토리아풍 저택 아이 방의 문간을 애도의 절제된 픽셀 아트로 그린다.
Scene/backdrop: 화면 왼쪽은 젖은 서쪽 복도, 오른쪽 문은 완전히 열려 있고 안쪽에는 비어 있는 작은 침대,
먼지 덮인 장난감 배, 낮은 서랍장, 빛바랜 벽지. 아이나 유령의 흔적은 없음.
Composition/framing: 열린 문이 끝까지 보이는 와이드 고정 카메라, 중앙 상단에 종이 그림 삽입컷과 두 인물 오버레이 여백.
Lighting/mood: 창밖 비의 차가운 청록빛과 복도 촛불의 약한 황갈색, 조용하고 현실적인 상실감.
Constraints: 문은 명백히 열린 상태, 방은 비어 있음, 환경만.
Avoid: 사람, 유령, 완성된 크레용 그림, 글자, 봉인, 문양, UI, 워터마크.

## 생성·선정 기록

- 위 두 환경은 내장 이미지 생성 도구로 각각 한 번씩 생성하고 필요한 경우 단일 변경으로 보정한다.
- 선택 원본은 이 폴더에 저장하고, `scripts/prepare-l2-l3-cutscene-assets.py`가 640×384 RGB 도트 플레이트로 후처리한다.
- 경찰서는 승인된 `assets/cutscenes/l0-l1/backgrounds/police-station-rain.png`를 입력으로 복사·재양자화해 로컬 자산으로 만든다.
- 손목 닻은 전체 최종 QA의 시각 정본으로 지정된
  `/Users/yujunseo/.codex/worktrees/5220/game/assets/cutscenes/l3-l4/inserts/fresh-anchor-record.png`
  (`SHA256 e748d2a1d006d79d49894929958897c7204b932955683c8b54f549eda411d0bd`)를
  `fresh-anchor-record-reference.png`로 복사해 보존한다. 생성 이미지가 아니며 팔·소매·닻 형태를 변경하지 않는다.
