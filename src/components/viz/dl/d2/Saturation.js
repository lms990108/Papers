import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, ACTS} from './lib';

const W = 560;
const H = 250;
const px = lin(-6, 6, 44, W - 16);
const py = lin(0, 1.1, H - 34, 14);

const curve = (id) => {
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const z = -6 + (12 * i) / 120;
    pts.push(`${px(z)},${py(ACTS[id].df(z))}`);
  }
  return pts.join(' ');
};
const CURVES = {sig: curve('sig'), tanh: curve('tanh'), relu: curve('relu')};

export default function Saturation() {
  const [z, setZ] = useState(0.5);

  const ds = ACTS.sig.df(z);
  const dt = ACTS.tanh.df(z);
  const dr = ACTS.relu.df(z);
  const ref = ACTS.tanh.df(0.5);

  return (
    <Viz
      title="입력이 커지면 기울기가 죽는다 (포화)"
      caption="활성화 함수 입력 z에서의 기울기입니다. tanh는 0에서 1로 가장 크고, 시그모이드는 0에서 0.25로 가장 큽니다. z를 옮기며 값을 읽어 보세요. 0.5와 2는 본문의 예입니다."
    >
      <Controls>
        <Btn on={z === 0} onClick={() => setZ(0)}>z = 0</Btn>
        <Btn on={z === 0.5} onClick={() => setZ(0.5)}>z = 0.5</Btn>
        <Btn on={z === 2} onClick={() => setZ(2)}>z = 2</Btn>
        <Slider label="입력 z" min={-6} max={6} step={0.1} value={z} onChange={(v) => setZ(Math.round(v * 10) / 10)} format={(v) => fmt(v, 1)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="시그모이드, tanh, ReLU의 기울기 곡선">
        <line x1={44} y1={py(0)} x2={W - 16} y2={py(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={px(0)} y1={14} x2={px(0)} y2={py(0)} stroke="var(--ifm-color-emphasis-200)" />
        <line x1={44} y1={py(0.25)} x2={W - 16} y2={py(0.25)} stroke="var(--ifm-color-emphasis-300)" strokeDasharray="3 3" />
        <text x={46} y={py(0.25) - 4} className={s.ts}>0.25</text>
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={38} y={py(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
        ))}
        {[-6, -4, -2, 0, 2, 4, 6].map((v) => (
          <text key={v} x={px(v)} y={H - 18} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        <text x={W - 16} y={H - 3} textAnchor="end" className={s.ts}>입력 z</text>
        <text x={4} y={12} className={s.ts}>기울기</text>
        <polyline points={CURVES.relu} fill="none" stroke="var(--vok)" strokeWidth="2" strokeDasharray="6 3" />
        <polyline points={CURVES.tanh} fill="none" stroke="var(--va)" strokeWidth="2" />
        <polyline points={CURVES.sig} fill="none" stroke="var(--vb)" strokeWidth="2" strokeDasharray="2 3" />
        <text x={px(-2.2)} y={py(0.55)} textAnchor="end" className={s.ts} style={{fill: 'var(--va)'}}>tanh (실선)</text>
        <text x={px(-1.2)} y={py(0.3) - 4} textAnchor="end" className={s.ts} style={{fill: 'var(--vb)'}}>시그모이드 (점선)</text>
        <text x={px(3.2)} y={py(1) - 6} className={s.ts} style={{fill: 'var(--vok)'}}>ReLU (파선)</text>
        <line x1={px(z)} y1={14} x2={px(z)} y2={py(0)} stroke="var(--ifm-font-color-base)" strokeWidth="1.5" />
        <circle cx={px(z)} cy={py(dt)} r={5} fill="var(--va)" />
        <circle cx={px(z)} cy={py(ds)} r={5} fill="var(--vb)" />
        <circle cx={px(z)} cy={py(dr)} r={5} fill="var(--vok)" />
      </svg>
      <Stats>
        <Stat label="tanh 기울기 1 − tanh²" value={fmt(dt, 4)} />
        <Stat label="시그모이드 기울기" value={fmt(ds, 4)} />
        <Stat label="ReLU 기울기" value={fmt(dr, 0)} />
        <Stat label="tanh(z)" value={fmt(Math.tanh(z), 3)} />
        <Stat label="z = 0.5의 tanh 기울기와 비율" value={`${fmt(ref / Math.max(dt, 1e-12), 1)}배`} />
      </Stats>
      <Note>
        z = 0.5에서 tanh 기울기는 약 0.786이고, z = 2에서는 tanh(2) ≈ 0.964이고 기울기가 약 0.071로 0.786의 약 11분의 1입니다. 칸이 이 구간에 들어가면 뒤에 0.25를 곱하지 않아도 앞 층으로 가는 신호가 이미 작습니다. ReLU는 z가 양수이면 기울기가 1이라 포화가 없고, 음수이면 0입니다.
      </Note>
    </Viz>
  );
}
