# 복원 퀘스트 구 제작 원본

> 2026-08-10 이후 이 폴더는 제작 이력 보관용이다. 실제 복원 정본은
> `output/questimage`의 1254×1254 완성본·윤곽선 쌍이다.

각 퀘스트의 `source/generated-original.png`는 ImageGen으로 만든 고해상도 제작 원본이다.
게임은 이 파일을 직접 사용하지 않는다. 현재 64×64·128×128의 비교 후보로
재구성했으며, 육안 비교 뒤 퀘스트별 최종 해상도를 선택한다.

```text
source/generated-original.png
  → candidates/64/  # 64×64 비교 후보 세트
  → candidates/128/ # 128×128 비교 후보 세트
```

각 후보 폴더에는 다음 파일이 있다.

- `target.png`: 제한 팔레트 목표 정본 후보
- `line.png`: 폐쇄된 전체 윤곽선
- `initial.png`: 플레이 시작 시 보이는 완성 조각과 단편 선
- `mask-overlay.png`: 잠금·복원·제외 영역 육안 확인본
- `fill-regions.png`: 채우기 구획 확인본
- `masks/*.png`: 초기 표시·잠금·복원·제외·폐쇄 선 이진 마스크
- `manifest.json`: 영역 계약과 자동 QA 결과

현재 `masks/restore.png`는 플레이어가 수정하고 전체 유사도 채점에 사용할 픽셀의
합집합까지 확정한다. 모자·점·목도리 같은 필수 단서별 `masks/required/<feature>.png`와
실제 런타임 채점 연결은 아직 제작하지 않았다.

정확한 `우리`, `T.C.`, 항해일지 문구와 3줄/4줄 문장, 닻은 생성 원본을 그대로
사용하지 않고 정본 픽셀 레이어로 교체했다. Q3A·Q5A의 전체 폐쇄 선은 채우기 충돌에만
사용하고, `initial.png`에서는 일부 획을 숨겨 파도 수가 복원 전에 노출되지 않게 했다.

전체 후보는 다음 명령으로 재생성한다.

```bash
python3 scripts/prepare-restoration-assets.py
```

퀘스트별 논리·영역 계약은 `docs/RESTORATION_QUEST_SPEC.md`, 생성·누출 검수 결과는
`docs/RESTORATION_PIXEL_QA.md`가 정본이다.
