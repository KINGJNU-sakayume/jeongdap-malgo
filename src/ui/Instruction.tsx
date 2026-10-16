// 지시문. 동사를 크게. 동사 뒤(예시 괄호 등)는 입력칸 쪽 예시로 따로 보이므로 여기서는 뺀다.
export function Instruction({ text, verb }: { text: string; verb: string }) {
  const at = text.indexOf(verb);
  const lead = at >= 0 ? text.slice(0, at) : text;
  return (
    <p className="mt-5 text-center font-serif">
      <span className="text-[15px]">{lead}</span>
      {at >= 0 && <strong className="text-3xl font-bold tracking-wider">{verb}</strong>}
    </p>
  );
}
