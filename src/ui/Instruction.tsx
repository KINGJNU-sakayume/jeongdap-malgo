// 지시문. 동사(퍼즐 문서 '큰 동사')를 크게.
export function Instruction({ text, verb }: { text: string; verb: string }) {
  const at = text.indexOf(verb);
  if (at < 0) return <p className="mt-5 text-center font-serif text-[15px]">{text}</p>;
  return (
    <p className="mt-5 text-center font-serif">
      <span className="text-[15px]">{text.slice(0, at)}</span>
      <strong className="text-3xl font-bold tracking-wider">{verb}</strong>
      <span className="text-[15px]">{text.slice(at + verb.length)}</span>
    </p>
  );
}
