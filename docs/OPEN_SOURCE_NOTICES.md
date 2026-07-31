# 오픈소스 및 AI 모델 사용 기록

## Transformers.js 및 CLIP

- 프로젝트: Transformers.js
- 버전: 3.8.1
- 용도: 브라우저 내 CLIP 추론
- 라이선스: Apache License 2.0
- 출처: https://github.com/huggingface/transformers.js
- 배포: https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1

- 모델: Xenova/clip-vit-base-patch32
- 기반 모델: openai/clip-vit-base-patch32
- 정밀도: q8
- 용도: 이미지와 사건 설명 후보 문장의 상대적 의미 유사도 비교
- 기반 구현 라이선스: MIT License
- 출처: https://huggingface.co/Xenova/clip-vit-base-patch32
- 기반 모델 카드: https://huggingface.co/openai/clip-vit-base-patch32
- 라이선스 원문: https://github.com/openai/CLIP/blob/main/LICENSE

CLIP 점수는 가려진 세 구역의 원본·복원 이미지와 사건별 영문 분석 문장을
비교한 의미 회복 점수이며 최종 종합 점수에 반영된다. 모델은 복원 시작 후
백그라운드에서 내려받으며 이후 브라우저 캐시를 활용한다.

CLIP은 영어 중심으로 학습된 연구 모델이므로 화면용 한국어 목격담과 별도로
고정된 영문 분석 문장을 사용한다. 사건별 문장과 이미지 구역은 실제 배포 전에
반드시 같은 브라우저 환경에서 검수하며, 얼굴 식별이나 실제 수사 판단에는
사용하지 않는다.

## 사건 이미지

- `assets/cases/museum-robbery.png`: 프로젝트용 AI 생성 이미지
- `assets/cases/convenience-store-theft.png`: 프로젝트용 AI 생성 이미지
- 용도: 게임 사건 배경 및 픽셀 복원 퍼즐 원본
- 외부 스톡 이미지 또는 제3자 게임 에셋을 사용하지 않음
