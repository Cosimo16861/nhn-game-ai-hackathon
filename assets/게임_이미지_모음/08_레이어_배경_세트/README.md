# 사람 없는 게임 배경 레이어 묶음

## 기본 합성 순서

1. `01-floor.png` — 바닥
2. `02-walls-fixed.png` — 벽과 고정 가구
3. `03-player-npc-empty.png` — 플레이어와 NPC가 들어갈 빈 투명 레이어
4. `04-foreground.png` — 캐릭터 앞을 가리는 가구·벽
5. `05-lighting-evening.png` — 저녁 조명

## 실내 20종

각 건물 폴더의 `states`에는 다음 완성 이미지가 있습니다.

- `door-closed.png` — 문 닫힘
- `door-open.png` — 문 열림
- `case-before.png` — 사건 전
- `case-during.png` — 사건 진행 중, 비폭력 단서와 어질러진 물건 포함
- `case-resolved.png` — 사건 해결 후, 물건이 돌아오거나 정리된 상태
- `evening-lights-on.png` — 불이 켜진 저녁 실내

각 건물 폴더의 `layers`에는 합성용 투명 PNG 5장이 있습니다. `placement-guide.json`에는 권장 이동 범위, 입장 위치, 캐릭터를 가리는 전경 가구 영역이 픽셀 좌표로 들어 있습니다.

## 마을 외부

`exteriors/states`에는 사람 없는 낮·저녁 마을 완성 이미지가 있습니다. `exteriors/layers`에는 외부 합성용 바탕, 빈 캐릭터 레이어, 가장자리 전경, 저녁 조명·날씨 레이어가 있습니다.

## 참고

기존 실내 원화가 한 장으로 합쳐진 이미지였기 때문에 `layers`의 바닥·가구 구분은 게임 적용을 위한 재구성본입니다. 원화의 세부 묘사를 그대로 써야 하는 장면은 `states`의 완성 이미지를 사용하고, 캐릭터 가림 효과에는 `04-foreground.png`를 위에 겹치는 방식을 권장합니다.
