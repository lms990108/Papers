import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {ratios, ppl, showPpl} from './lmCore';

const SENTS = [
  {n: '오늘 날씨 좋다', w: ['오늘', '날씨', '좋다'], c: 'var(--va)'},
  {n: '오늘 날씨 나쁘다', w: ['오늘', '날씨', '나쁘다'], c: 'var(--vc)'},
  {n: '오늘 날씨 오늘', w: ['오늘', '날씨', '오늘'], c: 'var(--vb)'},
];
const KS = Array.from({length: 40}, (_, i) => (i + 1) * 0.05);
const X0 = 50;
const X1 = 530;
const Y0 = 20;
const Y1 = 190;
const sx = (k) => X0 + (k / 2) * (X1 - X0);
const sy = (p) => Y1 - ((Math.min(p, 4) - 1) / 3) * (Y1 - Y0);

export default function SmoothPpl() {
  const [si, setSi] = useState(0);
  const [k, setK] = useState(1);
  const cur = SENTS[si];
  const ps = ratios('bigram', cur.w, k);
  const value = ppl(ps);
  const prod = ps.some((p) => !(p > 0)) ? 0 : ps.reduce((a, b) => a * b, 1);

  return (
    <Viz
      title="스무딩 k를 바꾸면 퍼플렉서티가 어떻게 달라지나"
      caption="바이그램, 첫 단어 비율은 1로 둡니다. 곡선은 k에 따른 퍼플렉서티이고 세로 선이 지금의 k입니다. 4 위로 넘는 값은 위쪽 끝에 붙습니다."
    >
      <Controls>
        {SENTS.map((x, i) => (
          <Btn key={x.n} on={si === i} onClick={() => setSi(i)}>
            {x.n}
          </Btn>
        ))}
        <Slider label="k" min={0} max={2} step={0.05} value={k} onChange={setK} format={(v) => fmt(v, 2)} />
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>자리</th>
            <th>단어</th>
            <th>앞 단어</th>
            <th>비율 p</th>
          </tr>
        </thead>
        <tbody>
          {cur.w.map((w, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{w}</td>
              <td>{i === 0 ? '(시작)' : cur.w[i - 1]}</td>
              <td className={ps[i] === 0 ? s.cellOn : undefined}>{i === 0 ? '1 (약속)' : fmt(ps[i], 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="문장 비율 (곱)" value={fmt(prod, 4)} />
        <Stat label="퍼플렉서티" value={showPpl(value)} tone={value === Infinity ? 'bad' : undefined} />
      </Stats>

      <svg viewBox="0 0 560 230" className={s.svg} role="img" aria-label="k에 따른 세 문장의 퍼플렉서티 곡선">
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--ifm-color-emphasis-300)" />
        {[1, 2, 3, 4].map((t) => (
          <text key={t} x={X0 - 6} y={sy(t) + 4} textAnchor="end" className={s.ts}>{t}</text>
        ))}
        {[0, 0.5, 1, 1.5, 2].map((t) => (
          <text key={t} x={sx(t)} y={Y1 + 16} textAnchor="middle" className={s.ts}>{t}</text>
        ))}
        <text x={(X0 + X1) / 2} y={Y1 + 34} textAnchor="middle" className={s.ts}>k</text>
        {SENTS.map((x) => {
          const pts = KS.map((kk) => [sx(kk), sy(ppl(ratios('bigram', x.w, kk)))].join(',')).join(' ');
          return <polyline key={x.n} points={pts} fill="none" stroke={x.c} strokeWidth={x.n === cur.n ? 3 : 1.5} />;
        })}
        {SENTS.map((x, i) => (
          <text key={x.n} x={X1 - 4} y={Y0 + 14 + i * 14} textAnchor="end" className={s.ts} fill={x.c} style={{fill: x.c}}>
            {x.n}
          </text>
        ))}
        <line x1={sx(k)} y1={Y0} x2={sx(k)} y2={Y1} stroke="var(--ifm-color-emphasis-700)" strokeDasharray="4 3" />
      </svg>
      {k === 0 && value === Infinity ? (
        <Note>k=0이면 못 본 쌍의 비율이 0이라 문장 비율이 0이고, 퍼플렉서티는 한없이 큽니다.</Note>
      ) : null}
      {si < 2 && k > 0 ? <Note>학습 문장은 k가 클수록 퍼플렉서티가 오릅니다. 비율 일부를 못 본 쌍에 내주기 때문입니다.</Note> : null}
    </Viz>
  );
}
