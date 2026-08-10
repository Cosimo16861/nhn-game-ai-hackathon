# 안개항의 상속자

말로 남은 기억을 그림으로 되돌리는 복원 탐정 게임입니다.

## 바로 플레이

**[브라우저에서 게임 시작](https://cosimo16861.github.io/nhn-game-ai-hackathon/)**

- 별도 설치나 유료 라이선스가 필요하지 않습니다.
- 데스크톱 브라우저와 소리를 켠 환경을 권장합니다.
- 최초 화면에서 `새 이야기`를 선택하면 처음부터 시작합니다.
- 컷신은 `Space`, 복원 작업대는 화면의 붓·채우기 도구로 진행합니다.
- 진행 상황과 복원 그림은 현재 브라우저에 저장됩니다.

## 로컬 실행

```bash
python3 -m http.server 8125 --bind 127.0.0.1
```

실행 후 <http://127.0.0.1:8125/index.html>을 엽니다. `file://`로 직접 열지
말고 반드시 정적 서버를 사용해 주세요.

## 검증

```bash
node --test tests/*.test.cjs
node --test tests/full-game-main-route.e2e.cjs
```

최종 통합 QA 결과는 [`docs/FINAL_INTEGRATION_QA.md`](docs/FINAL_INTEGRATION_QA.md)에
정리되어 있습니다. 전체 게임 소스와 커밋 기록은 이 저장소에 포함되어 있습니다.

