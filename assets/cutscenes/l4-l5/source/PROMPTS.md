# L4 → L5 컷신 이미지 프롬프트

내장 이미지 생성 도구의 원본 프롬프트 기록이다. 세 자산 모두 프로젝트용 배경 원화이며,
인물·텍스트·UI·증거의 결정적 세부는 넣지 않는다. 생성 후 5:3 중앙 크롭, 640×384 NEAREST
축소, 제한 팔레트 양자화를 적용한다.

## 1. `police-station-ledger-generated.png`

```text
Use case: stylized-concept
Asset type: 2D narrative game environment background plate
Primary request: an early-1900s coastal town police station records desk at night, prepared for a close examination of a damaged ledger
Scene/backdrop: modest wooden police station interior, desk near center, shelves of bound records, rain-dark window, practical gas lamp
Subject: empty environment only; clear desk surface where a ledger insert can later be composited
Style/medium: restrained hand-painted pixel-art concept, chunky deliberate shapes, limited muted palette, grounded historical mystery game
Composition/framing: wide 16:9 establishing view, eye level, central desk unobstructed, enough dark negative space near the lower center for a dialogue overlay
Lighting/mood: warm gas lamp against cool rainy blue shadows, quiet investigative tension
Color palette: charcoal, weathered brown, muted teal, old brass, parchment cream
Materials/textures: salt-worn timber, damp glass, scuffed desk, cloth-bound records
Constraints: no people; no readable writing; no ledger; no carriage; no crest; no UI; no dialogue box; no text; no watermark
Avoid: modern objects, photorealism, ornate aristocratic decor, bright saturated colors
```

## 2. `foggy-dock-generated.png`

```text
Use case: stylized-concept
Asset type: 2D narrative game environment background plate
Primary request: a foggy coastal dock at midnight where a witness remembers a recurring visitor
Scene/backdrop: wet stone quay, two practical gas-lamp posts receding into fog, mooring edge, a few indistinct docked boat masts and hulls
Subject: empty environment only; open space beneath the nearer gas lamp for a carriage silhouette to be composited later
Style/medium: restrained hand-painted pixel-art concept, chunky deliberate shapes, limited muted palette, grounded historical mystery game
Composition/framing: wide 16:9 view, eye level, readable quay depth, gas lamps and docked boats clearly separated, lower center kept clear for dialogue overlay
Lighting/mood: dense sea fog, cold blue-gray night, small amber lamp pools, wet reflections, uneasy but not supernatural
Color palette: charcoal navy, desaturated teal, wet gray stone, dim amber
Materials/textures: slick cobbles, salt-stained timber, iron mooring rings, soft fog banks
Constraints: no people; no carriage; no symbols or crests; no readable writing; no UI; no dialogue box; no text; no watermark
Avoid: shipwreck, storm, lightning, heroic figure, modern harbor equipment, bright saturated colors
```

## 3. `square-painter-generated.png`

```text
Use case: stylized-concept
Asset type: 2D narrative game environment background plate
Primary request: a coastal town square painter's work area at late afternoon after a public portrait challenge
Scene/backdrop: weathered stone square, simple market awning folded back, easel platform and paint table, modest shop fronts fading into the background
Subject: empty environment only; central easel with a blank dark canvas that can receive a portrait insert later
Style/medium: restrained hand-painted pixel-art concept, chunky deliberate shapes, limited muted palette, grounded historical mystery game
Composition/framing: wide 16:9 establishing view, eye level, easel slightly off center, uncluttered lower center for dialogue overlay
Lighting/mood: tired amber light after rain, reflective stones, intimate and bittersweet rather than celebratory
Color palette: muted ochre, weathered umber, slate blue, dull burgundy, parchment cream
Materials/textures: worn canvas, chipped stone, stained wood, damp paving
Constraints: no people; no face on the canvas; no readable signs; no UI; no dialogue box; no text; no watermark
Avoid: crowds, festival decorations, aristocratic luxury, modern objects, bright saturated colors
```

## 4. 세이렌 기억 참조 재사용

`siren-night-memory-reference.png`는 새로 생성하지 않고, 전체 후반 연속성을 위해
`/Users/yujunseo/.codex/worktrees/13e2/game/assets/cutscenes/l5-l6/inserts/siren-night-memory.png`의
구도 고정본을 복사했다.

- SHA256: `f452b170ebe54282c9e809282e0a3480a75d977c3cf8610d884969f910a62747`
- 역할: 참고/후처리 입력. Q5B 복원 완료본으로 직접 노출하지 않음.
- 후처리: 336×216 와이드 기억 중간본, 약 1.8× 손·난간 크롭, 저채도·저명도, 안개 얼룩,
  가장자리 미완성 마스크.
- 런타임: 첫 손을 먼저, 이어 두 번째 손을 강조해 양손 자세를 읽게 함.
