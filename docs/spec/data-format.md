# 판정·대사·업적 데이터 형식

- 상태: 초안 (스키마 설계. 구현 코드 아님)
- 관련: `puzzle-authoring.md`(작가용 작성법), `design/puzzle-catalog.md`
- 전제: 서버 없음, 저장은 localStorage, 업적은 저장하지 않고 기록에서 매번 다시 계산
- 표기: 전부 **[추측]**(설계안). 수치는 조정 대상.

---

## 1. 전체 흐름

```
입력 위젯 ──(상태 S)──▶ 판정기 ──(결과 ID)──▶ 기록(로그)에 추가
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
               화자 단계 계산            반복 횟수 계산             업적 계산
                     └────────────┬────────────┘                         │
                                  ▼                                      ▼
                            대사 선택기 ──▶ 비트 출력              새 업적 알림(차집합)
```

원칙
1. **기록이 유일한 원천이다.** 화자 단계, 반복 횟수, 업적, 엔딩 조건, 진행도는 전부 기록에서 계산한다. 따로 저장하지 않는다.
2. **판정은 순수 함수다.** 같은 상태면 같은 결과. 시간·난수는 상태 안에 넣어서 들어온다.
3. **원시 입력은 저장하지 않는다.** 이름, 비밀번호, 의견란 내용은 판정 후 버린다. 기록에는 결과 ID만.
4. **모든 입력은 반드시 어떤 결과로 떨어진다.** 마지막 규칙은 항상 '기타 틀림'.

---

## 2. 입력 위젯 (고정 목록)

퍼즐은 아래 위젯을 조합만 한다. 새 위젯 추가는 설계 변경으로 취급한다.

| 위젯 | 상태 요약 | 쓰는 퍼즐 |
|---|---|---|
| `button` | 누른 횟수, 누른 순서 | P01, P07, P15 |
| `text` | 문자열(판정 후 폐기) | P02, P09 |
| `check` | 체크된 항목 집합, 토글 횟수 | P04, P07 |
| `link` | 연결된 점 쌍 목록, 선 길이 합 | P03 |
| `stroke` | 획 목록(점열), 지우기 횟수 | P06 |
| `calendar` | 선택 날짜, 기기 오늘 날짜 | P05 |
| `grid` | 선택된 칸 집합 | P08 |
| `order` | 항목 순서 배열, 휴지통 항목 | P10 |
| `fill` | 영역→색 맵, 칸 밖 칠 면적 | P11 |
| `place` | 위치, 회전, 크기, 찍은 횟수 | P12, P13 |
| `rating` | 별점(0.5 단위), 변경 횟수 | P14 |
| `drag` | 무엇을 어디에 놓았나 | P01, P10, P15 |
| `scroll` | 최대 스크롤 비율 | P07 |

공통으로 모든 퍼즐 상태에 붙는 값:
- `elapsedMs`: 퍼즐 진입 후 경과 시간
- `idleMs`: 마지막 입력 후 경과 시간
- `extra`: 화면 밖 요소(화자 아이콘, 지시문 단어 등)에 대한 조작 기록

---

## 3. 퍼즐 정의

### 3-1. 스키마

```ts
// 스키마 초안
type PuzzleId  = string;   // 'p02-name'
type OutcomeId = string;   // 'p02.hong'  (퍼즐ID 접두 + 점 + 짧은 이름)

interface PuzzleDef<S> {
  id: PuzzleId;
  chapter: 1 | 2 | 3 | 4 | 5;
  title: string;              // '성명'
  instruction: string;        // '성명을 적으시오 (예: 홍길동)'
  widgets: WidgetSpec[];      // 2장의 위젯 조합
  initial: S;

  rules: Rule<S>[];           // 제출 시 위에서부터 평가
  events?: EventRule<S>[];    // 제출 없이 상태 변화마다 평가
}

interface Rule<S> {
  outcome: OutcomeId;
  kind: 'correct' | 'variant' | 'wrong' | 'other';
  type?: '실' | '문' | '과' | '탈' | '방' | '복합';  // 틀림 유형 (작성 점검용)
  when: (s: S) => boolean;    // 순수 함수
  examples: S[];              // 이 결과가 나와야 하는 상태 (테스트에 쓰임)
  notExamples?: S[];          // 이 결과가 나오면 안 되는 상태
}

interface EventRule<S> {
  outcome: OutcomeId;
  when: (s: S) => boolean;
  once: true;                 // 퍼즐 한 번 진입에 한 번만
  examples: S[];
}
```

### 3-2. 판정 순서

1. 제출 시 `rules`를 **전부** 평가한다.
2. 일치한 것 중 **첫 번째**가 주 결과(`outcome`). 나머지는 `also`에 담는다.
3. 마지막 규칙은 반드시 `kind: 'other'`, `when: () => true`.

**규칙 순서 원칙**
- 복합 틀림(예: P12 삼관왕) → 구체적인 틀림 → 정답 변주 → 정답 → 넓은 틀림 → 기타.
- 정답을 위로 올리지 않는다. "거의 맞는데 함정이 섞인" 상태가 정답에 먼저 걸리면 틀림을 못 찾는다.
- `also`가 있으므로 복합 업적은 순서와 무관하게 계산할 수 있다. 그래도 *대사*는 주 결과 하나만 나간다.

### 3-3. 예시 (P02 성명)

```ts
const P02: PuzzleDef<{ text: string }> = {
  id: 'p02-name', chapter: 1, title: '성명',
  instruction: '성명을 적으시오 (예: 홍길동)',
  widgets: [{ kind: 'text', max: 40 }],
  initial: { text: '' },
  rules: [
    { outcome: 'p02.empty',  kind: 'wrong', type: '실',
      when: s => s.text.trim() === '',
      examples: [{ text: '' }, { text: '   ' }] },
    { outcome: 'p02.hong',   kind: 'wrong', type: '문',
      when: s => norm(s.text) === '홍길동',
      examples: [{ text: '홍길동' }, { text: ' 홍 길 동 ' }] },
    { outcome: 'p02.literal', kind: 'wrong', type: '문',
      when: s => ['이름', '성명', '성함'].includes(norm(s.text)),
      examples: [{ text: '이름' }] },
    { outcome: 'p02.clerk',  kind: 'wrong', type: '탈',
      when: s => norm(s.text) === '도한결',
      examples: [{ text: '도한결' }] },
    { outcome: 'p02.long',   kind: 'wrong', type: '과',
      when: s => s.text.length >= 30,
      examples: [{ text: '김수한무거북이와두루미삼천갑자동방삭치치카포사리사리센타' }] },
    { outcome: 'p02.robot',  kind: 'wrong', type: '탈',
      when: s => !/[가-힣a-zA-Z]/.test(s.text),
      examples: [{ text: '1234' }, { text: '★★' }] },
    { outcome: 'p02.ok',     kind: 'correct',
      when: s => /^[가-힣a-zA-Z ]{2,10}$/.test(s.text.trim()),
      examples: [{ text: '김민지' }, { text: 'Alex' }] },
    { outcome: 'p02.other',  kind: 'other', when: () => true,
      examples: [{ text: '김1' }] },
  ],
};
```
(`norm`은 공백 제거 같은 정규화 함수. 공용 판정 도우미로 둔다.)

### 3-4. 판정 도우미(공용 술어) 후보
- 문자열: `norm`, `hasHangulOrLatin`, `inList`
- 기하: `inside(rect)`, `overlapRatio(a, b)`, `rotationIn(min, max)`, `inkLength(strokes)`, `inkArea(strokes, rect)`, `isNearlyStraight(stroke)`
- 집합: `exactly(set)`, `subsetOf`, `count`
- 순서: `isSorted(asc)`, `swappedPairs`, `sortedBy(key)`
- 날짜: `dayDiff(selected, today)`, `isWeekend`

도우미는 Vitest로 따로 테스트한다. 퍼즐 규칙은 도우미 조합으로만 쓰도록 권장한다.

---

## 4. 기록(로그)

### 4-1. 항목

```ts
type LogEntry =
  | { t: 'enter';  at: number; puzzle: PuzzleId }
  | { t: 'submit'; at: number; puzzle: PuzzleId; outcome: OutcomeId; also: OutcomeId[]; ms: number }
  | { t: 'event';  at: number; puzzle: PuzzleId; outcome: OutcomeId }
  | { t: 'ending'; at: number; ending: 'A' | 'B' | 'C' | 'D' }
  | { t: 'reset';  at: number };   // 사용자가 '처음부터' 선택. 이전 항목은 지우지 않고 경계만 남긴다
```

- `at`은 `Date.now()`. 테스트에서는 주입.
- `ms`는 진입~제출 시간(빠른 정답/오래 고민 같은 메타 업적용).
- 원시 입력은 없다.

### 4-2. 저장

- 키: `jdm:v1:log` (게임 약칭 + 스키마 버전)
- 값: `LogEntry[]`를 JSON으로. 추가할 때마다 전체 덮어쓰기(항목이 수천 개 수준이라 충분).
- 용량 감: 항목당 100바이트 안팎 → 1만 항목이어도 1MB 미만. localStorage 한도(브라우저마다 다르지만 대략 수 MB)에 여유. **[추측: 한도는 브라우저별로 확인 필요]**
- 버전 올림: `v1` → `v2` 변환 함수를 하나 두고, 실패하면 원본을 `jdm:v1:log.bak`으로 남긴 뒤 새로 시작.
- 접근은 전부 try/catch. 저장이 안 되는 환경(시크릿 창 등)에서도 메모리 기록으로 끝까지 플레이 가능해야 한다.
- 결과 ID 이름 바꾸기: `renames: Record<OldId, NewId>` 표를 두고 읽을 때 변환. 작가가 ID를 바꿔도 기존 기록이 살아남는다.

---

## 5. 기록에서 계산하는 것들

모두 `(log) => 값` 형태의 순수 함수. 마지막 `reset` 이후 구간을 '현재 회차', 전체를 '누적'으로 본다.

### 5-1. 찾은 결과
- `found(log)`: 누적으로 한 번이라도 나온 결과 ID 집합(제출 + 이벤트 + `also`)
- `foundWrong(log)`: 그중 `kind`가 `wrong`이거나 이벤트인 것. `other`는 제외.

### 5-2. 반복 횟수
- `repeatIndex(log, outcome)`: 이번 제출 *직전까지* 같은 결과가 나온 횟수 + 1. 대사 선택에 쓴다.

### 5-3. 진행도
- `furthestChapter(log)`: 현재 회차에서 열린 가장 먼 장.
- 장 해금 조건: 해당 장의 퍼즐 3개가 모두 '처리됨'(정답이든 틀림이든 제출 1회 이상).
- 예외(Dude, Stop의 진행 차단 차용): 4장→5장은 **4장에서 정답이 하나 이상** 있어야 열린다. 화자가 "정답 하나만 주시면 열어 드릴게요" 하는 협상 비트.

### 5-4. 화자 단계

```
D = |foundWrong(log)|              // 누적으로 찾은 서로 다른 틀림 수
raw = D<3 ? 0 : D<10 ? 1 : D<20 ? 2 : D<35 ? 3 : D<55 ? 4 : 5
cap = furthestChapter(log)         // 1장이면 1, 2장이면 2 … 5장이면 5
cool = 최근 제출 3개가 모두 정답이면 1, 아니면 0
stage = max(0, min(raw, cap) - cool)
```

- **같은 틀림 반복은 단계를 올리지 않는다.** 반복은 반복 개그 담당이고, 분노는 '새로운 틀림'에만 반응한다. → '너무 일찍 화낸다' 방지의 핵심.
- 상한을 '현재 퍼즐의 장'이 아니라 '가장 먼 장'으로 둔다. 5장까지 간 뒤 1장에 돌아가면 화자는 이미 지친 상태로 1장을 다시 본다. 재방문 대사 변주가 여기서 나온다.
- 숫자는 퍼즐 81개 틀림 기준의 첫 안. 플레이테스트로 조정.

### 5-5. 업적

```ts
interface AchievementDef {
  id: string;                 // 'a.p02.hong'
  name: string;               // '예시와 같음'
  desc: string;               // 발견 후에만 공개. 공문서체 한 줄
  hidden: true;
  cond: Cond;
}

type Cond =
  | { found: OutcomeId }                              // 그 결과를 한 번이라도
  | { foundAll: OutcomeId[] | Selector }              // 전부
  | { foundCount: Selector; n: number }               // n개 이상
  | { repeat: OutcomeId; n: number }                  // 같은 결과 n회
  | { seq: [OutcomeId, OutcomeId]; samePuzzle?: true } // 연속으로
  | { ending: 'A' | 'B' | 'C' | 'D' }
  | { fn: string };                                   // 예외용 이름 붙은 함수

type Selector = { chapter?: number; puzzle?: PuzzleId; kind?: 'wrong' | 'event' | 'variant' };
```

- 틀림·이벤트·정답 변주마다 `{ found }` 업적을 **자동 생성**한다. 작가는 이름과 설명만 쓴다.
- `computeAchievements(log): Map<id, unlockedAt>`: 로그를 앞에서부터 한 번 훑으며 각 조건이 처음 참이 되는 시점을 기록. 항목이 수천 개, 업적이 100개 수준이면 매 제출마다 다시 돌려도 충분히 빠르다. **[추측: 실제 측정 필요]**
- 새 업적 알림: 추가 전/후 결과의 차집합.

**메타 업적 후보**
| 이름 | 조건 | 설명(공문서체) |
|---|---|---|
| 모범 민원인 | 엔딩 A | 반려 없이 전 서식 처리 완료 |
| 반려 사유 수집가 | 틀림 20개 | 반려 사유 20건 이상 접수 |
| 서식 감사관 | 틀림 전부 | 전 서식의 반려 사유를 모두 확인함 |
| 한결같음 | 같은 틀림 5회 | 동일 사유로 5회 반려됨 |
| 알고 그랬죠 | 같은 퍼즐 정답 직후 틀림 | 정답 처리 직후 같은 서식을 고의로 반려시킴 |
| 성실 신고 | 한 장의 틀림 전부 | ○장 서식의 반려 사유를 모두 확인함 (장별 5개) |
| 발급 불가 | 다른 업적 전부 | "이 업적은 발급되지 않습니다." → 조건 충족 시 설명이 "발급되었습니다(착오)."로 바뀜 |

---

## 6. 대사

### 6-1. 스키마

```ts
interface LineSet {
  outcome: OutcomeId;                 // 'p02.hong'  또는 진입용 'p02.@enter'
  variants: Variant[];
}

interface Variant {
  stage?: [number, number];           // 화자 단계 범위 (포함)
  repeat?: 1 | 2 | 3;                 // 3은 '3회 이상'
  ifFound?: OutcomeId;                // 콜백: 이 결과를 찾은 적이 있을 때만
  beats: Beat[];
}

interface Beat {
  text: string;
  pause?: 'short' | 'long';           // 이 비트 뒤의 정지. 기본 short
}
```

### 6-2. 선택 규칙
변주에 붙은 조건이 **모두** 맞는 것만 후보다. 후보 중 점수가 가장 높은 것 하나를 고른다.
- 점수 = (`ifFound` 있으면 4) + (`repeat` 있으면 2) + (`stage` 있으면 1). 조건 없는 기본 변주는 0점.
- `repeat: 3`은 '3회 이상'과 맞는다. `repeat: 1`, `2`는 정확히 그 회차.
- 예: 같은 결과 1회차, 단계 4에서 `@stage 3-5 @repeat 1`(3점) > `@repeat 1`(2점) > `@stage 3-5`(1점) > 기본(0점).
- 같은 순위가 여럿이면 **결정적으로** 하나: `hash(outcome + repeatIndex) % 개수`. 난수 금지(테스트 재현성).
- 맞는 변주가 하나도 없으면 테스트 실패(작성 누락). 런타임에서는 기본 변주로 대체하고 콘솔 경고.

### 6-3. 비트와 타이밍
- 판정 후 첫 비트까지 300ms 이하.
- `short` 정지 ≈ 500ms, `long` ≈ 1200ms. 글자 단위 타이핑 효과는 쓰지 않거나 아주 빠르게. **[추측: 플레이테스트로 결정]**
- 클릭·탭 한 번에 현재 비트 즉시 완성, 두 번째에 다음 비트. 건너뛰기 보장.
- 플레이어가 대사 도중 다시 제출하면 현재 대사는 끊고 새 대사. 끊긴 대사에 대한 반응도 나중에 가능(`extra.interrupted` 이벤트).

### 6-4. 대사 파일 위치 (D-003 확정)
- 퍼즐마다 `content/lines/pNN.md`, 화자 공용 대사는 `content/lines/_narrator.md`.
- 형식은 `puzzle-authoring.md` 5장. Vite `?raw`로 읽어 파서가 `LineSet[]`로 바꾼다.
- 파서 오류(모르는 지시어, 빈 묶음, 결과 ID 형식 위반)는 빌드·테스트 실패로 처리한다. 런타임까지 넘기지 않는다.
- `@todo` 묶음은 개발 중 허용, 대사 대신 `[대사 미작성: pNN.xxx]`를 보여 준다. 배포 빌드에서는 `@todo`가 남아 있으면 테스트 실패.

### 6-5. 자리표시자
- `{name}`: P02 정답 때 입력한 이름. 세션 메모리에만 둔다. 없으면(새로고침 후 등) "선생님"으로 대체.
- 그 밖의 자리표시자는 쓰지 않는다. 숫자 같은 값이 필요하면 결과를 쪼갠다.

---

## 7. 자동 검사 (Vitest)

퍼즐을 추가하면 아래가 자동으로 돈다. 작가가 테스트를 따로 쓰지 않는다.

| 검사 | 내용 |
|---|---|
| 예시 판정 | 모든 `examples`가 그 결과로 판정된다 |
| 반례 | 모든 `notExamples`가 그 결과로 판정되지 않는다 |
| 도달 가능 | 모든 규칙이 최소 하나의 예시를 가진다(=도달 가능 증명). 단 `kind: 'other'`는 논리상 도달 불가일 수 있어 예외 |
| 기타 존재 | 마지막 규칙이 `other`다 |
| 틀림 수 | `wrong` + 이벤트가 4개 이상 |
| 대사 누락 | 모든 결과에 기본 변주가 있다. `repeat: 1` 변주가 있는 틀림은 2·3회 변주도 있다(없으면 경고) |
| 업적 연결 | 모든 업적 조건이 존재하는 결과 ID만 가리킨다 |
| 콜백 연결 | `ifFound`가 존재하는 결과를 가리킨다 |
| 금지어 | 대사에 금지어 목록 단어가 없다(`narrator-bible.md` 7장) |
| 길이 | 비트 하나가 60자 이하(모바일 두 줄 기준) **[추측: 화면 확정 후 조정]** |

로그 계산 함수(`found`, `stage`, `computeAchievements`)는 손으로 만든 로그 픽스처로 테스트한다.
