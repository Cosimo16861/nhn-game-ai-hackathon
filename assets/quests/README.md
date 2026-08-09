# 복원 퀘스트 이미지 원본

각 퀘스트의 `source/generated-original.png`는 ImageGen으로 만든 고해상도 제작 원본이다.
게임은 이 파일을 직접 사용하지 않는다. 후속 단계에서 정본 규격으로 재구성한다.

```text
source/generated-original.png
  → target.png      # 64/128/256 제한 팔레트 정본
  → line.png        # 초기 밑그림·잠금선
  → masks/*.png     # 복원·필수·제외 영역
```

정확한 한글·영문 약자와 3줄/4줄 문양은 생성 원본을 그대로 사용하지 않고 수동 픽셀
레이어로 교체한다. 퀘스트별 논리·영역 계약은 `docs/RESTORATION_QUEST_SPEC.md`가 정본이다.
