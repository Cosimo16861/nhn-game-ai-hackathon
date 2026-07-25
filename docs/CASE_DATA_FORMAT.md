# 사건 데이터 형식

스테이지형 사건은 `scripts/case-data.js`의 `cases` 배열에 등록한다. 플레이어는 이 데이터를 수정하거나 입력하지 않는다.

## 필수 필드

| 필드 | 형식 | 설명 |
| --- | --- | --- |
| `id` | 문자열 | 사건 고유 ID. 영문 소문자, 숫자, 하이픈만 사용 |
| `title` | 문자열 | 화면에 표시할 사건명 |
| `imageSrc` | 문자열 | 프로젝트 내부 원본 이미지 경로 |
| `imageAlt` | 문자열 | 접근성을 위한 이미지 설명 |
| `witnesses` | 문자열 배열 | A·B·C 가림 구역에 대응하는 목격담 3개 |
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

## 등록 예시

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
  hiddenRegions: [0, 4, 15],
  difficulty: "normal",
  passingScore: 65,
});
```

목격담은 정답을 그대로 말하기보다 가려진 세 구역의 색상, 모양, 위치를 추론할 수 있는 단서로 작성한다. `witnesses`의 첫 번째, 두 번째, 세 번째 문장은 `hiddenRegions`의 첫 번째(A), 두 번째(B), 세 번째(C) 구역에 각각 대응해야 한다.
