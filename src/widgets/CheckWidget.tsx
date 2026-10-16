// check 위젯 한 칸. □ 와 ✓. 라벨까지 눌러도 토글된다.
import type { ReactNode } from 'react';

export interface CheckWidgetProps {
  checked: boolean;
  onToggle(): void;
  children: ReactNode;
}

export function CheckWidget({ checked, onToggle, children }: CheckWidgetProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      data-no-margin
      className="inline-flex min-h-11 items-center gap-2 text-left text-[15px]"
    >
      <span className="relative inline-block size-5 shrink-0 border border-ink bg-white" aria-hidden>
        {checked && <span className="absolute -top-2 left-0.5 text-xl leading-none text-ink">✓</span>}
      </span>
      <span>{children}</span>
    </button>
  );
}
