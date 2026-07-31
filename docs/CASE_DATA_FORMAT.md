# 사건 데이터 형식

최종 사건 데이터는 `scripts/case-data.js`의 `chapters` 배열에서 관리한다.
플레이어가 직접 입력하는 데이터가 아니라 제작자가 미리 구성하는 콘텐츠다.

```text
대형 사건(chapter)
├─ 전체 현장 이미지
├─ 2×2 조각 배치
├─ 최종 추리 질문
└─ 세부 사건(stage) 1~4개
   ├─ 조각 위치
   ├─ 목격담과 CLIP 문장
   ├─ 가림 정보
   ├─ 힌트
   └─ 단계 추리 질문
```

현재 화면과의 호환을 위해 기존 형태의 `CaseData.cases`도 함께 제공한다. 새 기능은
`CaseData.chapters`를 기준으로 구현하고, 기존 화면을 새 구조에 연결하기 전까지만
`cases`를 사용한다.

## 대형 사건 필드

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | 문자열 | 대형 사건 고유 ID |
| `title` | 문자열 | 대형 사건명 |
| `summary` | 문자열 | 사건 선택 화면용 한 줄 설명 |
| `masterImageSrc` | 문자열 | 2×2 조각의 원본이 되는 전체 이미지 |
| `masterImageAlt` | 문자열 | 전체 이미지 접근성 설명 |
| `masterImageStatus` | 문자열 | `ready` 또는 임시 자산을 뜻하는 `placeholder` |
| `stages` | 배열 | 서로 다른 조각 위치를 사용하는 세부 사건 1~4개 |
| `finalDeduction` | 객체 또는 `null` | 전체 이미지 완성 후 최종 추리 질문 |

대형 사건은 항상 2열×2행 배치를 사용한다. 같은 대형 사건 안에서 세부 사건 ID와
조각 위치는 중복될 수 없다.

## 세부 사건 추가 필드

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `summary` | 문자열 | 세부 사건의 짧은 설명 |
| `crop.column` | 숫자 | 전체 이미지에서 가져올 열. `0` 또는 `1` |
| `crop.row` | 숫자 | 전체 이미지에서 가져올 행. `0` 또는 `1` |
| `hints` | 문자열 배열 | 순서대로 공개할 힌트. 최대 4개 |
| `deductionQuestion` | 객체 또는 `null` | 단계 종료 후 사용할 추리 질문 |

`chapterId`와 `order`는 대형 사건을 검증할 때 자동으로 추가된다.

## 조각 추출

`scripts/chapter-image-slicer.js`가 `layout`과 `crop`을 사용해 전체 이미지에서
세부 사건 조각을 계산한다. `extractStageSource(chapter, stage, outputSize)`는
전체 이미지를 한 번 불러와 선택한 조각을 정사각형 캔버스로 변환하고 PNG 데이터
URL을 반환한다. 별도의 조각 이미지 파일을 저장하지 않아도 같은 원본에서 항상
동일한 2×2 조각을 만들 수 있다.

원본 크기가 정확히 나누어지지 않는 경우에도 각 조각의 경계를 정수 좌표로 계산해
빠지는 픽셀이나 겹치는 픽셀이 없도록 처리한다.

## 세부 사건 기본 필드

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | 문자열 | 사건 고유 ID. 영문 소문자, 숫자, 하이픈만 사용 |
| `title` | 문자열 | 화면에 표시할 사건명 |
| `imageSrc` | 문자열 | 프로젝트 내부 원본 이미지 경로 |
| `imageAlt` | 문자열 | 접근성을 위한 이미지 설명 |
| `witnesses` | 문자열 배열 | A·B·C 가림 구역에 대응하는 목격담 3개 |
| `clipPrompts` | 영문 문자열 배열 | A·B·C 가림 구역에 대응하는 CLIP 분석 문장 3개 |
| `hiddenRegions` | 숫자 배열 | 4×4 구역 중 가릴 세 곳 |
| `difficulty` | 문자열 | `easy`, `normal`, `hard` 중 하나 |
| `passingScore` | 숫자 | 사건 통과에 필요한 0~100점 |

구역 번호는 왼쪽 위부터 행 순서로 배치한다.

```text
 0 |  1 |  2 |  3
---+----+----+---
 4 |  5 |  6 |  7
---+----+----+---
 8 |  9 | 10 | 11
---+----+----+---
12 | 13 | 14 | 15
```

## 대형 사건 등록 예시

```js
createChapterDefinition({
  id: "museum-robbery",
  title: "박물관 절도 사건",
  summary: "전시실에 남은 증거를 차례로 복원합니다.",
  masterImageSrc: "./assets/cases/museum-robbery-master-dark-color.png",
  masterImageAlt: "절도 직후의 박물관 전시실 전체 모습",
  stages: [
    {
      id: "museum-robbery-stage-1",
      title: "깨진 창문 조사",
      summary: "전체 이미지의 왼쪽 위 현장을 조사합니다.",
      crop: { column: 0, row: 0 },
      imageSrc: "./assets/cases/museum-robbery.png",
      imageAlt: "깨진 창문 주변",
      witnesses: ["단서 A", "단서 B", "단서 C"],
      clipPrompts: [
        "English CLIP prompt A.",
        "English CLIP prompt B.",
        "English CLIP prompt C.",
      ],
      hiddenRegions: [0, 4, 15],
      difficulty: "easy",
      passingScore: 60,
      hints: ["창문 아래를 확인하세요."],
    },
  ],
});
```

## 호환 사건 예시

```js
createCaseDefinition({
  id: "museum-robbery",
  title: "박물관 절도 사건",
  imageSrc: "./assets/cases/museum-robbery.png",
  imageAlt: "박물관 전시실의 픽셀 그림",
  witnesses: [
    "왼쪽 위에서 깨진 유리 조각이 번쩍였습니다.",
    "그 아래에는 붉고 각진 물체가 있었습니다.",
    "오른쪽 아래로 긴 검은 그림자가 이어졌습니다.",
  ],
  clipPrompts: [
    "A bright full moon shining through a shattered museum window with sharp glass fragments.",
    "A large faceted red gemstone lying among broken glass on a dark museum floor.",
    "A long dark human-shaped shadow stretching across a blue tiled museum floor.",
  ],
  hiddenRegions: [0, 4, 15],
  difficulty: "normal",
  passingScore: 65,
});
```

목격담은 정답을 그대로 말하기보다 가려진 세 구역의 색상, 모양, 위치를 추론할 수 있는 단서로 작성한다. 각 번호는 정사각형 전체를 삭제하는 뜻이 아니라 해당 구역 안에 불규칙한 손상 영역을 배치할 기준 위치다. `witnesses`의 첫 번째, 두 번째, 세 번째 문장은 `hiddenRegions`의 첫 번째(A), 두 번째(B), 세 번째(C) 구역에 각각 대응해야 한다.

`clipPrompts`도 같은 순서를 사용한다. 화면에는 표시하지 않으며 영어 중심으로 학습된
CLIP 모델의 분석 입력으로만 사용한다. 각 문장은 해당 구역에 실제로 보이는 핵심 물체,
색상, 형태와 주변 배경을 구체적으로 설명하고 서로 다른 문장이어야 한다.

`difficulty`는 실제 퍼즐 규칙에도 적용된다. `easy`는 손상 범위가 작고 영역
표시를 오래 유지하며, `normal`은 표준 설정, `hard`는 손상 범위가 넓고 영역
표시가 빠르게 사라진다. 최종 통과 기준은 각 단계의 `passingScore`로 조정한다.
