// text 위젯. 한 줄 입력칸 + 오른쪽 아래 작은 회색 예시.
// 값은 판정 후 부모가 비운다(원시 입력 폐기).
export interface TextWidgetProps {
  id: string;
  value: string;
  onChange(v: string): void;
  max: number;
  hint?: string;
}

export function TextWidget({ id, value, onChange, max, hint }: TextWidgetProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        value={value}
        maxLength={max}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 border-b border-ink/70 bg-transparent px-1 pt-1 pb-5 text-lg outline-none focus:border-seal"
      />
      {hint && <span className="pointer-events-none absolute right-1 bottom-0.5 text-xs text-ink/45">{hint}</span>}
    </div>
  );
}
