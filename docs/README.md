# 「정답 말고」 설계 문서

- 판정·업적·설계의 정본은 `docs/`, 대사 텍스트의 정본은 `content/lines/`, 서식 본문의 정본은 `content/forms/`.
- 코드와 문서가 다르면 문서를 기준으로 고친다. 코딩 에이전트 규칙은 저장소 루트 `CLAUDE.md`.

## 문서 목록

| 경로 | 내용 | 상태 |
|---|---|---|
| `README.md` | 이 목록 | - |
| `decisions.md` | 결정 기록 D-001~D-005 | 상시 |
| `research/01-research-report.md` | 조사 보고서(출처 포함, 확인/추측 구분) | 완료 |
| `design/narrator-candidates.md` | 화자 후보 5종 비교와 추천 | 완료 |
| `design/puzzle-catalog.md` | 퍼즐 15개 개요 + 완성 대사 샘플 3개 | 초안 |
| `narrator-bible.md` | **핵심** 화자 바이블: 도한결 주무관 | v0.1 |
| `puzzle-authoring.md` | **핵심** 퍼즐 작성 형식·대사 문법·체크리스트 | v0.1 |
| `spec/data-format.md` | 판정·기록·업적·대사 스키마 | v1 |
| `flow.md` | 장 구성, 감정 곡선, 엔딩 | 초안 |
| `puzzles/_conventions.md` | 퍼즐 정본 공통 규약(좌표·각도·ID) | v1 |
| `puzzles/p02-name.md` | P02 성명 정본 | 판정 완료 |
| `puzzles/p04-checkbox.md` | P04 체크박스 정본 | 판정 완료 |
| `puzzles/p06-signature.md` | P06 서명 정본 | 판정 완료(임계값 조정 예정) |
| `puzzles/p07-terms.md` | P07 약관 정본 | 판정 완료 |
| `puzzles/p12-stamp.md` | P12 도장 정본 | 판정 완료 |
| `plan/prototype-scope.md` | 1차 프로토타입(퍼즐 5개, 1~2주) | 확정 v1 |
| `plan/handoff-prompt.md` | Claude Code 시작·이어서 프롬프트 | v1 |

`design/puzzle-catalog.md`의 표와 `puzzles/`가 다르면 `puzzles/`가 이긴다(결과 ID가 정리되면서 일부 틀림이 추가·분리됨: P06 `blank`, P12 `none`·`double`).

## 앞으로 만들 문서

| 경로 | 내용 | 언제 |
|---|---|---|
| `puzzles/p01,03,05,08~11,13~15` | 나머지 퍼즐 정본 | 프로토타입 이후 |
| `spec/widgets.md` | 위젯별 상태 구조, 판정 도우미 목록 | 프로토타입 D6 전 |
| `spec/storage.md` | 기록 버전 변환, 결과 ID 이름 변경 표 | 첫 스키마 변경 때 |
| `design/achievements.md` | 업적 전체 목록 | 퍼즐 10개 이후 |
| `design/ui-screens.md` | 대기석, 서식 화면, 수집판, 디버그 패널 | 프로토타입 D4 전 |
| `design/guest-counselor.md` | 게스트 상담사 | 퍼즐 15개 이후 |
| `playtest/YYYY-MM-DD.md` | 플레이테스트 기록 | 테스트마다 |

## 용어
- **결과(outcome)**: 판정이 내놓는 ID. 정답·정답 변주·틀림·이벤트·기타.
- **틀림 / 반려 사유**: 게임 안에서는 '반려 사유', 문서에서는 '틀림'.
- **기록(log)**: localStorage에 쌓는 유일한 원천 데이터.
- **단계(stage)**: 화자 감정 단계 S0~S5. 기록에서 계산.
- **비트(beat)**: 대사의 한 호흡 단위.
