# L6 → 종결 배경 생성 프롬프트

모든 원본은 내장 이미지 생성 도구로 만들고 `source/` 안에 보존한다.
`scripts/prepare-l6-ending-cutscene-assets.py`가 5:3 중심 크롭, 640×384 NEAREST 리사이즈,
제한 팔레트 양자화를 수행한다. 생성 이미지에 단서의 정답·인물·읽을 수 있는 문자를
넣지 않고, 세 줄·네 줄·`T.C.`·등록부 소유자는 런타임 픽셀 오버레이로만 그린다.

## 공통 사양

```text
Use case: historical-scene
Asset type: 1890s gothic mystery pixel-adventure cutscene environment plate
Style/medium: deliberate low-resolution pixel art, chunky 2–4 pixel clusters, hard edges,
limited umber, oxidized teal, fog blue and muted amber palette, no smooth digital painting
Composition/framing: 5:3 landscape; useful open staging space in the upper and middle frame;
the bottom 106 pixels will be covered by dialogue UI, so place no critical object there
Lighting/mood: restrained noir lighting, damp port-town air, mournful but resolving ending tone
Constraints: environment only; no people; no character silhouettes in the foreground;
no UI; no frame; no subtitle box; no readable letters or numbers; no emblem with countable waves;
no watermark; no logo
```

## police-registry-generated.png

```text
Primary request: an 1890s coastal police station records room after rain, viewed straight-on.
Scene/backdrop: a long evidence wall with blank pinned paper shapes and loose red threads on the left;
a heavy wooden interrogation table in the center holding a large open carriage registry whose marks are
fully illegible; iron-barred rain window on the right; two empty chairs facing one another.
Composition/framing: the open registry must have a clean blank page area near center-right for a runtime
pixel overlay; leave clear portrait staging zones at both far sides.
Avoid: names, initials, readable registry entries, seals, carriage crest, people, police badges with text.
```

## asherton-parlor-dawn-generated.png

```text
Primary request: the Asherton manor parlor at cold dawn, grief preserved for twelve years but finally opening.
Scene/backdrop: tall rain-cleared window at left, an empty portrait hook and a small easel at center,
dark green velvet sofa, covered furniture, a half-open door leading toward the west corridor,
faint warm fireplace embers.
Composition/framing: leave the center wall and easel unobstructed for a restored portrait insert;
leave the right side open for Eleanor's canonical portrait sprite.
Avoid: visible family crest, child portrait, readable labels, people, supernatural imagery.
```

## tavern-window-generated.png

```text
Primary request: a quiet dockside tavern in pale morning after the mystery is solved.
Scene/backdrop: broad misted window at left with wiped arcs in condensation, small cat cushion on the sill,
wooden counter and stacked mugs, folded cleaning cloth, calm harbor light beginning to enter.
Composition/framing: make the sill large and empty enough for a small gray-cat evidence insert and leave
the right side open for Cora's canonical portrait sprite.
Avoid: cat already present, people, readable bottle labels, red ribbon drawn as evidence, UI.
```

## market-square-morning-generated.png

```text
Primary request: an 1890s port-town market square in clear morning, slightly comic epilogue energy.
Scene/backdrop: damp cobbles, empty vendor stall with several blank portrait sheets clipped up,
stone fountain, police-station direction in the distance but no readable sign, a few abstract tiny
background crowd shapes far away.
Composition/framing: central empty easel and papers for a runtime portrait insert; leave left and right
foreground clear for Ram and Reed canonical portrait sprites.
Avoid: recognisable faces in crowd, readable prices, words, evidence emblems, modern objects.
```

## office-clearing-fog-generated.png

```text
Primary request: the player's attic-like artist-detective office from the opening, now at first light.
Scene/backdrop: large window with harbor fog thinning outside, broad evidence wall with blank pinned cards
and loose unconnected red threads, scarred drawing desk, cold lamp, pencils and charcoal, empty chair.
Composition/framing: evidence wall fills the upper central area with six clean blank card spaces;
window occupies the upper-left quarter so a runtime fog-clearing animation can reveal dawn.
Avoid: readable notes, final evidence images, names, seals, carriage crest, people, UI, title text.
```

## 선정·후처리 기록

- 생성 모드: 내장 `image_gen`, `historical-scene`.
- 선정 기준: 공통 도트 밀도, 하단 대사창 가림 안전성, 오버레이 여백,
  글자·정답 단서·인물의 부재.
- 선정 원본: `police-registry-generated.png`, `asherton-parlor-dawn-generated.png`,
  `tavern-window-generated.png`, `market-square-morning-generated.png`,
  `office-clearing-fog-generated.png`.
- 다섯 원본은 추가 생성 편집 없이 선정했다. 인물·UI·읽을 수 있는 문자·정답 문양이
  없음을 확인했다.
- 준비 스크립으로 320×192 BOX 축소·80색 양자화·640×384 NEAREST 확대를 적용했다.
