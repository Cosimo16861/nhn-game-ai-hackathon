# L2 → L3 전용 자산 영역

`cutscene-l2-l3` Worktree만 수정한다. `source/`, `backgrounds/`, `portraits/`, `inserts/`와
`cutscene-assets.json`은 해당 세션이 생성한다.

- `source/`: 내장 이미지 생성 원본 2종, 손목 닻 시각 정본 참조 1종과 정확한 프롬프트
- `backgrounds/`: 640×384 RGB 환경 3종
- `portraits/`: `portrait-crop-v1` 높이 320px RGBA 초상 7종
- `inserts/`: 336×216 RGB 증거 삽입컷 5종
- `cutscene-assets.json`: 크기·모드·SHA256 및 금지 스포일러 감사 결과

재생성:

```sh
/opt/homebrew/Caskroom/miniforge/base/bin/python3 scripts/prepare-l2-l3-cutscene-assets.py
```
