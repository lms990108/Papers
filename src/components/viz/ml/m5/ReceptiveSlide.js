import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import {c5Layers} from './util';

const SC = 6; // 입력 1칸 = 6 단위
const X0 = 20;

export default function ReceptiveSlide() {
  const [width, setWidth] = useState(100);
  const [pos, setPos] = useState(0);
  const k = (width - 32) / 4;
  const n = k + 1;
  const p = Math.min(pos, k);
  const lay = c5Layers(width);
  const a = 4 * p;
  const b = Math.min(k, p + 1) === p ? null : 4 * (p + 1);
  const cw = Math.min(30, 560 / n);

  return (
    <Viz
      title="글자 하나 크기의 망을 문자열 위로 밀기"
      caption="입력 폭을 늘리면 마지막 합성곱층(C5)의 출력 위치가 늘어납니다. 위치를 하나 옮기면 입력에서는 4칸 이동하고, 이웃한 두 위치는 32칸 중 28칸을 같이 봅니다. 위치를 눌러 어느 칸을 보는지 확인하세요."
    >
      <Controls>
        <Slider label="입력 폭" min={32} max={100} step={4} value={width} onChange={(w) => { setWidth(w); setPos(0); }} />
        <Btn onClick={() => { setWidth(32); setPos(0); }}>폭 32 (고립된 글자)</Btn>
        <Btn onClick={() => { setWidth(68); setPos(0); }}>폭 68 (연습 문제 1)</Btn>
        <Btn onClick={() => { setWidth(100); setPos(0); }}>폭 100</Btn>
      </Controls>
      <svg viewBox="0 0 640 146" className={s.svg} role="img" aria-label={`폭 ${width}인 입력 위에서 위치 ${p}의 수용장이 입력 ${a}칸부터 ${a + 31}칸까지를 봅니다.`}>
        <rect x={X0} y={44} width={width * SC} height={22} fill="var(--ifm-color-emphasis-100)" stroke="var(--ifm-color-emphasis-500)" />
        <text x={X0} y={36} className={s.ts}>입력 0</text>
        <text x={X0 + width * SC} y={36} textAnchor="end" className={s.ts}>{width}</text>
        {b !== null ? (
          <rect x={X0 + b * SC} y={70} width={32 * SC} height={18} fill="none" stroke="var(--va)" strokeWidth={2} strokeDasharray="5 3" />
        ) : null}
        <rect x={X0 + a * SC} y={44} width={32 * SC} height={22} fill="color-mix(in srgb, var(--vb) 28%, transparent)" stroke="var(--vb)" strokeWidth={2.5} />
        {b !== null ? (
          <rect x={X0 + b * SC} y={44} width={(32 - 4) * SC} height={22} fill="color-mix(in srgb, var(--va) 28%, transparent)" stroke="none" />
        ) : null}
        <text x={X0 + a * SC + 4} y={104} className={s.ts} style={{fill: 'var(--vb)'}}>위치 {p}: {a}~{a + 31}칸</text>
        {b !== null ? (
          <text x={X0 + b * SC + 4} y={120} className={s.ts} style={{fill: 'var(--va)'}}>위치 {p + 1}: {b}~{b + 31}칸 (점선)</text>
        ) : null}
        <text x={X0} y={138} className={s.ts}>주황과 파랑이 겹치는 곳이 두 위치가 같이 보는 칸입니다.</text>
      </svg>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, margin: '6px 0'}}>
        {Array.from({length: n}, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPos(i)}
            aria-label={`C5 위치 ${i} 선택`}
            className={s.btn}
            style={{
              minWidth: cw, padding: '2px 4px',
              borderColor: i === p ? 'var(--vb)' : undefined,
              background: i === p ? 'var(--vb)' : undefined,
              color: i === p ? '#fff' : undefined,
            }}
          >
            {i}
          </button>
        ))}
      </div>
      <table className={s.grid}>
        <thead>
          <tr><th>입력</th><th>C1 (5×5)</th><th>S2 (2×2)</th><th>C3 (5×5)</th><th>S4 (2×2)</th><th>C5 (5×5)</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>{width}</td><td>{lay.c1}</td><td>{lay.s2}</td><td>{lay.c3}</td><td>{lay.s4}</td>
            <td className={s.cellOn}>{lay.c5}</td>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="C5 위치 수" value={n} />
        <Stat label="폭 = 32 + 4k 에서 k" value={k} />
        <Stat label="위치가 보는 입력 칸" value={`${a}~${a + 31}`} />
        <Stat label="이웃과 같이 보는 칸" value={n > 1 ? '28 / 32' : '없음'} />
      </Stats>
      <Note>
        {n === 1
          ? '폭 32에서는 위치가 1곳이라 고립된 글자 하나를 읽는 LeNet-5와 같습니다.'
          : `서브샘플링이 두 번 들어 있어서 입력을 한 칸씩 밀 수 없고 4칸씩 움직입니다. 위치마다 뒤의 F6과 출력층이 그대로 따라붙어 클래스 열 개의 벌점이 나옵니다.`}
      </Note>
    </Viz>
  );
}
