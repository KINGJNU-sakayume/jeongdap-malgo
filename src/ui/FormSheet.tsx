// 서식 종이. 흰 종이, 회색 괘선, 명조 계열 제목(시스템 폰트).
import type { ReactNode } from 'react';

export function FormSheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-sm border border-rule bg-white px-5 pt-5 pb-6 shadow-sm">
      <h1 className="border-b-2 border-ink pb-2 text-center font-serif text-lg font-semibold tracking-wide">{title}</h1>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** 서식 안의 번호 항목 한 줄. */
export function FormItem({ no, label, htmlFor, children }: { no: number; label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-end gap-3 border-b border-rule pb-3">
      <label htmlFor={htmlFor} className="font-serif text-[15px]">
        {no}. {label}
      </label>
      {children}
    </div>
  );
}
