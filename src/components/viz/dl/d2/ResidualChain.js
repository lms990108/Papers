import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, sci, sup, log10} from './lib';

const W = 560;
const H = 250;

export default function ResidualChain() {
  const [fp, setFp] = useState(0.25);
  const [n, setN] = useState(10);

  const plain = Math.pow(fp, n);
  const resid = Math.pow(1 + fp, n);
  const skip = 1 + plain;
  const lp = Array.from({length: n + 1}, (_, k) => k * log10(fp));
  const lr = Array.from({length: n + 1}, (_, k) => k * log10(1 + fp));
  const lo = Math.min(0, ...lp, ...lr) - 0.5;
  const hi = Math.max(0, ...lp, ...lr) + 0.5;
  const px = lin(0, n, 56, W - 20);
  const py = lin(lo, hi, H - 34, 14);
  const step = Math.max(1, Math.ceil((hi - lo) / 6));
  const ticks = [];
  for (let v = Math.ceil(lo); v <= hi; v++) if (v % step === 0) ticks.push(v);
  const line = (a) => a.map((v, k) => `${px(k)},${py(v)}`).join(' ');

  return (
    <Viz
      title="일반 사슬과 블록마다 입력을 더하는 사슬"
      caption="블록 하나의 국소 기울기를 f′로 두고, n개 블록을 지난 기울기를 비교합니다. 일반 사슬은 블록마다 f′가 곱해지고, 잔차 연결은 출력이 x + f(x)라서 블록마다 1 + f′가 곱해집니다. 세로축은 10의 거듭제곱 눈금입니다."
    >
      <Controls>
        <Btn on={Math.abs(fp - 0.25) < 1e-9} onClick={() => setFp(0.25)}>f′ = 0.25</Btn>
        <Slider label="국소 기울기 f′" min={0.05} max={1.5} step={0.05} value={fp} onChange={setFp} format={(v) => fmt(v, 2)} />
        <Slider label="블록 수 n" min={1} max={30} step={1} value={n} onChange={setN} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="블록 수에 따른 일반 사슬과 잔차 사슬의 기울기">
        <line x1={56} y1={14} x2={56} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        {ticks.map((v) => (
          <g key={v}>
            <line x1={56} y1={py(v)} x2={W - 20} y2={py(v)} stroke="var(--ifm-color-emphasis-200)" />
            <text x={50} y={py(v) + 4} textAnchor="end" className={s.ts}>{`10${sup(v)}`}</text>
          </g>
        ))}
        <line x1={56} y1={py(0)} x2={W - 20} y2={py(0)} stroke="var(--ifm-color-emphasis-500)" />
        {Array.from({length: n + 1}, (_, i) => i)
          .filter((i) => n <= 12 || i % Math.ceil(n / 6) === 0)
          .map((v) => (
            <text key={v} x={px(v)} y={H - 18} textAnchor="middle" className={s.ts}>{v}</text>
          ))}
        <text x={W - 20} y={H - 3} textAnchor="end" className={s.ts}>지난 블록 수</text>
        <text x={4} y={12} className={s.ts}>기울기</text>
        <polyline points={line(lp)} fill="none" stroke="var(--vb)" strokeWidth="2" strokeDasharray="6 3" />
        <polyline points={line(lr)} fill="none" stroke="var(--va)" strokeWidth="2" />
        <circle cx={px(n)} cy={py(lp[n])} r={5} fill="var(--vb)" />
        <circle cx={px(n)} cy={py(lr[n])} r={5} fill="var(--va)" />
        <text x={62} y={26} className={s.ts} style={{fill: 'var(--vb)'}}>주황 파선: 일반 사슬 f′ⁿ</text>
        <text x={62} y={42} className={s.ts} style={{fill: 'var(--va)'}}>파랑 실선: 잔차 (1 + f′)ⁿ</text>
      </svg>
      <Stats>
        <Stat label="일반 f′ⁿ" value={sci(plain)} tone={plain < 0.01 ? 'bad' : undefined} />
        <Stat label="잔차 (1 + f′)ⁿ (블록마다)" value={sci(resid)} />
        <Stat label="전체를 건너뛰는 길 하나: 1 + f′ⁿ" value={skip.toFixed(7)} />
      </Stats>
      <Note>
        {fp < 1
          ? '더하는 길 덕분에 곱이 f′가 아니라 1 + f′가 되어 죽지 않습니다. 다만 f′가 크면 1보다 큰 곱이 쌓여 오히려 커집니다. 그래서 트랜스포머는 잔차와 함께 정규화 층을 둡니다.'
          : 'f′가 1 이상이면 일반 사슬도 커지고, 잔차 사슬은 더 빠르게 커집니다. 잔차 연결이 폭주까지 막아 주지는 않습니다.'}
      </Note>
    </Viz>
  );
}
