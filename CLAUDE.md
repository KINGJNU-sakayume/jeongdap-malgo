# CLAUDE.md — 「정답 말고」

틀리는 방법을 모두 찾는 한국어 퍼즐 코미디. 쉬운 서식 퍼즐마다 정답은 하나, 틀리는 방법마다 화자(도한결 주무관)의 대사와 숨은 업적이 있다.

이 파일은 이 저장소에서 일하는 코딩 에이전트를 위한 규칙이다. 설계 판단이 필요하면 아래 문서를 먼저 읽는다.

## 먼저 읽을 문서 (순서대로)
1. `docs/plan/prototype-scope.md` — 지금 만들 범위와 일정
2. `docs/decisions.md` — 확정된 결정
3. `docs/spec/data-format.md` — 판정·기록·업적·대사 스키마
4. `docs/puzzles/_conventions.md` 와 `docs/puzzles/pNN-*.md` — 퍼즐별 판정 조건(정본)
5. `docs/puzzle-authoring.md` 5장 — 대사 파일 문법
6. `docs/narrator-bible.md` — 화자 말투(코드에는 직접 필요 없지만 금지어 목록이 7장에 있다)

## 정본 규칙
- **판정 조건, 결과 ID, 업적 이름·설명**: `docs/puzzles/` 가 정본. 코드는 그대로 따른다. 조건이 모호하면 추측해서 메우지 말고 질문하거나, 가장 보수적인 해석으로 구현한 뒤 보고한다.
- **대사 텍스트**: `content/lines/*.md` 가 정본. **대사를 지어내거나 고치지 않는다.** 오탈자로 보여도 고치지 말고 보고만 한다.
- **서식 본문**(약관 등): `content/forms/` 가 정본. 그대로 렌더한다.
- 대사가 필요한데 없으면 해당 결과에 `@todo` 묶음을 추가하지 말고, 화면에는 `[대사 미작성: 결과ID]`를 띄우고 보고한다.
- UI 문구(버튼 이름 등)는 퍼즐 문서의 '화면' 절에 있는 문구를 쓴다. 없으면 가장 평범한 한국어 서식 용어(제출, 지우기 등)를 쓰고 보고한다.

## 스택
- Vite + React + TypeScript(strict) + Tailwind CSS + Vitest. 각 도구의 현재 안정판.
- 서버 없음. 저장은 localStorage. 배포는 GitHub Pages(GitHub Actions).
- 추가 런타임 의존성은 최소로. 상태 관리 라이브러리, UI 키트, 애니메이션 라이브러리를 넣기 전에 먼저 묻는다.

## 명령
- `npm run dev` / `npm run build` / `npm run preview`
- `npm test` (Vitest, 한 번 실행) / `npm run test:watch`
- `npm run typecheck` (`tsc --noEmit`)
- 커밋 전에 `npm test && npm run typecheck`가 통과해야 한다.

## 디렉터리 (목표)
```
content/
  lines/            대사 (정본, 수정 금지)
  forms/            서식 본문 (정본, 수정 금지)
docs/               설계 (정본)
src/
  engine/           판정기, 규칙 타입, 판정 도우미(ink, geometry, text …)
  log/              기록 타입, 저장소, 계산(found, repeatIndex, stage, achievements)
  lines/            대사 파서, 대사 선택기
  puzzles/          pNN.ts (퍼즐 정의), __fixtures__/
  widgets/          입력 위젯 컴포넌트(text, check, stroke, place …)
  ui/               대기석, 서식 화면, 비트 출력, 수집판, 디버그 패널
  audio/            Web Audio 합성 효과음
  storage/          renames.ts 등
  config.ts         단계 임계값, 정지 시간 등 조정값
```

## 아키텍처 규칙 (어기면 안 되는 것)
1. **기록이 유일한 원천.** 화자 단계, 반복 횟수, 업적, 진행도는 저장하지 않고 기록(`jdm:v1:log`)에서 매번 계산한다.
2. **판정은 순수 함수.** `Date.now()`, `Math.random()`, DOM 접근 금지. 시간·날짜는 엔진이 상태에 넣어 준다.
3. **대사 선택은 결정적.** 난수 금지. 동점은 `hash(outcome + repeatIndex) % n`.
4. **원시 입력은 저장하지 않는다.** 이름·비밀번호·자유 입력은 판정 후 버린다. 기록에는 결과 ID만. `{name}`은 세션 메모리에만.
5. **모든 제출은 어떤 결과로 떨어진다.** 규칙 목록의 마지막은 항상 `kind: 'other'`.
6. **좌표는 서식 좌표**(`docs/puzzles/_conventions.md`). 화면 크기와 무관하게 판정이 같아야 한다.
7. localStorage 접근은 전부 try/catch. 실패하면 메모리 기록으로 계속 플레이 가능해야 한다.
8. 설정(음소거 등)은 `jdm:v1:settings`에 따로. 기록과 섞지 않는다.

## 테스트 규칙
- 퍼즐 정의의 `examples`/`notExamples`가 곧 테스트다. 퍼즐을 추가하면 자동 검사(`data-format.md` 7장)가 돌아야 한다. 퍼즐마다 테스트 파일을 손으로 쓰지 않는다.
- 판정 도우미(잉크 길이, 겹침 비율 등)는 단위 테스트를 따로 쓴다.
- 대사 파서는 `content/lines/*.md` 전체를 읽어 검사한다: 기본 변주 정확히 하나, `@if` 대상 존재, 비트 60자 이하, 금지어 없음, 퍼즐 문서의 모든 결과 ID에 대사 존재.
- 화면 테스트(React Testing Library 등)는 프로토타입에서 필수 아님.

## 모바일
- 포인터 이벤트(Pointer Events)로 통일. 그리기·끌기 영역은 `touch-action: none`.
- 호버, 우클릭, 키보드 단축키, 두 손가락 제스처에 기대는 입력 금지.
- 비트 하나가 폭 360px에서 두 줄 이하로 보이게.

## 소리
- Web Audio로 합성. 음원 파일 없음. 사용자 입력 이벤트 안에서 처음 재생.

## 화면·문구
- `<html lang="ko">`. 한국어만.
- 아트는 프로토타입에서 최소: 서식 종이 느낌(흰 종이, 회색 괘선, 명조 계열 제목은 시스템 폰트로), 빨간 인주색 하나, 금색 하나.

## 디버그
- `?debug` 쿼리가 있을 때만 디버그 패널: 단계 강제, 기록 초기화, 기록 JSON 복사, 결과 강제 발생, 현재 퍼즐 상태 보기.

## 배포
- `vite.config.ts`의 `base`는 저장소 이름(`/jeongdap-malgo/`).
- GitHub Actions로 `dist/`를 Pages에 올리는 워크플로를 만든다. 저장소가 비공개면 Pages는 유료 요금제에서만 켜진다. 켜는 건 사람이 결정한다.

## 일하는 방식
- 일정의 하루 단위(`prototype-scope.md` 4장) 하나가 끝날 때마다: 테스트·타입 검사 통과 → 커밋 → 완료 기준과 함께 짧게 보고.
- 퍼즐 문서와 구현이 다르게 된 곳은 문서를 고치지 말고 보고한다. 문서는 사람이 고친다.
- 커밋 메시지는 한국어, 한 줄 요약 + 필요하면 본문.
