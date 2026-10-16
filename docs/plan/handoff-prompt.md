# Claude Code 인계

## 지금 상태 (2026-10-16)

D1~D3는 claude.ai 세션에서 끝냈다. 커밋: D1 `9e491bf`, D2 `031dbc9`, D3 `0bea524`.

| 일 | 내용 | 위치 |
|---|---|---|
| D1 | 프로젝트 골격, 기록 저장소, found/repeatIndex | `package.json`, `src/log/` |
| D2 | 판정 엔진, 자동 검사, P02 정의 | `src/engine/`, `src/puzzles/` |
| D3 | 대사 파서·선택기, 화자 단계, 대사 파일 검사 | `src/lines/`, `src/log/stage.ts`, `src/content.ts`, `src/config.ts` |

### 반드시 알아야 할 제약
그 세션은 npm 저장소 접속이 막혀 있었다. 그래서:
- **`npm install`을 한 번도 돌리지 않았다.** `package-lock.json`이 없다. `package.json`의 버전 범위는 레지스트리 확인 없이 정했다.
- 테스트는 Vitest 문법으로 썼지만, 실제로는 **Node 내장 테스트 러너 위의 Vitest 호환 shim**으로 돌렸다(81개 통과). 타입 검사는 TypeScript 6.0으로 했고, `vite/client`·React 타입 없이 `.ts`만 검사했다(`.tsx` 2개는 미검사).
- `vite dev`/`vite build`는 한 번도 실행되지 않았다.

### 구현하면서 문서에서 해석으로 메운 곳 (검토 대상)
1. **`{name}` 대체**: 이름이 없으면 `{name} 님` → `선생님`, `{name}` → `선생님` (`선생님 님` 방지). `data-format.md` 6-5는 단순히 '선생님으로 대체'라고만 씀.
2. **반복 횟수**: 누적(회차 reset과 무관), 주 결과만 셈(`also`로만 나온 건 세지 않음). 이벤트도 같은 방식.
3. **식는 규칙**: '최근 제출 3개'를 **현재 회차** 기준으로 셈. 정답 변주도 정답으로 침.
4. **단계 전환 대사**: 기록 전체에서 처음 닿은 단계일 때만(식었다가 다시 오르면 반복 안 함).
5. **`PuzzleDef` 필드 추가**: 스키마 문서에 없는 `prefix`, `verb`, `achievements`를 넣음.
6. **`@if` 대상 검사**: 퍼즐 정의가 아니라 '대사가 있는 결과 ID'에 대해 검사(P04 등 미구현 퍼즐의 결과를 참조하므로).
7. **결과 ID 형식**: `pNN.이름`에서 이름은 `[a-z0-9]+(-[a-z0-9]+)*`. 대문자·밑줄 금지.

---

## 첫 세션 프롬프트 (검토 → D4)

```
「정답 말고」 1차 프로토타입을 이어서 만든다. D1~D3는 다른 환경에서 끝났고, 그 환경에는 npm 설치가 막혀 있었다.

1. CLAUDE.md, 그다음 docs/plan/handoff-prompt.md의 '지금 상태'를 읽어라. 그리고 CLAUDE.md의 '먼저 읽을 문서'를 순서대로 읽어라.

2. 검토(코드 수정보다 먼저):
   a. npm install → package-lock.json 생성. 설치 경고나 버전 충돌이 있으면 package.json 버전 범위를 현재 안정판에 맞게 고친다.
   b. npm run typecheck, npm test, npm run build를 돌린다. 실패하면 원인을 고친다(진짜 Vitest와 shim의 차이, vite/client 타입, .tsx 타입 등).
   c. src/ 전체를 docs/spec/data-format.md, docs/puzzles/_conventions.md, docs/puzzles/p02-name.md, docs/puzzle-authoring.md 5장과 대조해 어긋난 곳을 찾는다.
   d. handoff-prompt.md의 '해석으로 메운 곳' 7개에 대해 각각 '그대로 둠 / 바꾸자(이유)' 의견을 낸다. 바꾸지는 말고 의견만.
   e. 검토 결과를 커밋하고(lockfile 포함), 다음 형식으로 보고한 뒤 멈춘다:
      - 설치·빌드·테스트 결과
      - 고친 것
      - 문서와 어긋난 곳
      - 7개 항목 의견

3. 내가 검토 보고에 답하면 D4(비트 출력 컴포넌트, 디버그 패널, P02 화면 연결)부터 docs/plan/prototype-scope.md 4장 일정대로 진행한다.

규칙:
- content/ 아래 파일은 읽기만 한다. 대사를 쓰거나 고치지 않는다.
- docs/ 아래 파일은 고치지 않는다. 어긋남은 보고만 한다.
- 새 런타임 의존성을 넣기 전에 묻는다.
```

---

## 이어서 프롬프트 (두 번째 세션부터)

```
CLAUDE.md와 docs/plan/prototype-scope.md를 다시 읽고, git log로 어디까지 했는지 확인한 뒤 다음 일 단위를 진행하라.
이번 세션 목표: D? ~ D?
각 일 단위마다 테스트·타입 검사·커밋·3줄 보고. 목표 범위가 끝나면 멈추고, 실제 폰에서 확인이 필요한 항목 목록을 달라.
```

권장 묶음:
- 세션 1: 검토 + D4 (비트 출력, 디버그 패널, P02 화면)
- 세션 2: D5 (P04·P07: 퍼즐 정의 → 자동 검사 → 화면)
- 세션 3: D6~D7 (P06 서명, 모바일) — 끝나면 사람이 폰으로 직접 확인
- 세션 4: D8~D9 (P12 도장, 대기석, 수집판, 효과음, 배포 워크플로)

## 사람이 확인할 것 (세션 사이)
- [ ] `npm run dev` → `?debug`에서 단계를 0→5로 바꿔 가며 P02 대사가 바뀌는지
- [ ] 폰에서 P06 서명이 스크롤 없이 그려지는지
- [ ] 대사 비트 정지 길이가 어색하지 않은지 (`src/config.ts`)
- [ ] `content/lines/`에 대사를 고친 뒤 `npm test`가 누락·금지어를 잡는지
