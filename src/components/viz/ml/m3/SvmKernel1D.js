import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const XS = [-3, -2, -1, 0, 1, 2, 3];
const LAB = {'-3': 1, '-2': 1, '-1': -1, '0': -1, '1': -1, '2': 1, '3': 1};
const f = (x) => (2 / 3) * x * x - 5 / 3;
const W = 460;
const H = 230;
const px = (x) => 30 + ((x + 4) / 8) * (W - 60);
const col = (t) => (t > 0 ? 'var(--vb)' : 'var(--va)');

// 수직선 위의 문턱 하나로 만들 수 있는 가장 적은 오류 수
function bestSingle() {
  let best = 99;
  for (let t = -3.5; t <= 3.5; t += 1) {
    [1, -1].forEach((sg) => {
      const err = XS.filter((x) => (x > t ? sg : -sg) !== LAB[x]).length;
      if (err < best) best = err;
    });
  }
  return best;
}
const SINGLE = bestSingle();

export default function SvmKernel1D() {
  const [lift, setLift] = useState(false);
  const [h, setH] = useState(2.5);
  const r = Math.sqrt(h);
  const pred = (x) => (x * x > h ? 1 : -1);
  const wrong = XS.filter((x) => pred(x) !== LAB[x]).length;
  const py = (v) => H - 36 - (v / 10) * (H - 60);
  const curve = Array.from({length: 81}, (_, i) => -4 + i / 10);

  return (
    <Viz
      title="1차원에서 (x, x²)으로 올리면 직선으로 갈립니다"
      caption="라벨 −1은 x = −1, 0, 1이고 +1은 x = −3, −2, 2, 3입니다. 수직선 위에서는 문턱 하나로 나뉘지 않고(최소 2개 틀림), 점을 (x, x²)으로 올리면 수평선 x² = h 하나로 갈립니다. h를 움직여 틀린 점 수를 보세요. 최대 여백은 h = 2.5입니다."
    >
      <Controls>
        <Btn on={!lift} onClick={() => setLift(false)}>수직선(원래 공간)</Btn>
        <Btn on={lift} onClick={() => setLift(true)}>(x, x²)로 올린 평면</Btn>
        <Slider label="수평선 x² = h" min={0} max={9} step={0.25} value={h} onChange={setH} format={(v) => fmt(v, 2)} />
        <Btn on={h === 2.5} onClick={() => setH(2.5)}>최대 여백 h = 2.5</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={lift ? '점을 x와 x제곱으로 올린 평면과 수평선' : '수직선 위의 점과 두 경계점'}>
        {!lift ? (
          <g>
            <rect x={px(-r)} y={70} width={px(r) - px(-r)} height={60} fill="var(--va)" fillOpacity="0.13" />
            <line x1={20} y1={100} x2={W - 20} y2={100} stroke="var(--ifm-color-emphasis-500)" />
            {[-r, r].map((b, i) => <line key={i} x1={px(b)} y1={52} x2={px(b)} y2={148} stroke="var(--ifm-font-color-base)" strokeWidth="2.5" />)}
            {XS.map((x) => (
              <g key={x}>
                {pred(x) !== LAB[x] ? <circle cx={px(x)} cy={100} r={19} fill="none" stroke="var(--vbad)" strokeWidth="2.2" strokeDasharray="4 3" /> : null}
                <circle cx={px(x)} cy={100} r={12} fill={col(LAB[x])} />
                <text x={px(x)} y={105} textAnchor="middle" style={{fill: '#fff', fontWeight: 700}}>{LAB[x] > 0 ? '+' : '−'}</text>
                <text x={px(x)} y={170} textAnchor="middle" className={s.ts}>{x}</text>
              </g>
            ))}
            <text x={px(0)} y={46} textAnchor="middle" className={s.ts}>경계 x = ±{fmt(r, 3)} (파란 띠 안쪽이 −1 예측)</text>
          </g>
        ) : (
          <g>
            <line x1={20} y1={py(0)} x2={W - 20} y2={py(0)} stroke="var(--ifm-color-emphasis-500)" />
            <polyline points={curve.map((x) => `${px(x)},${py(x * x)}`).join(' ')} fill="none" stroke="var(--vgrid)" strokeWidth="1.5" />
            {[1, 4].map((v) => <line key={v} x1={20} y1={py(v)} x2={W - 20} y2={py(v)} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />)}
            <line x1={20} y1={py(h)} x2={W - 20} y2={py(h)} stroke="var(--ifm-font-color-base)" strokeWidth="2.5" />
            <text x={W - 22} y={py(1) + 13} textAnchor="end" className={s.ts}>f = −1 (x² = 1)</text>
            <text x={W - 22} y={py(4) - 5} textAnchor="end" className={s.ts}>f = +1 (x² = 4)</text>
            <text x={24} y={py(h) - 6} className={s.ts}>x² = {fmt(h, 2)}</text>
            {XS.map((x) => (
              <g key={x}>
                {pred(x) !== LAB[x] ? <circle cx={px(x)} cy={py(x * x)} r={18} fill="none" stroke="var(--vbad)" strokeWidth="2.2" strokeDasharray="4 3" /> : null}
                <circle cx={px(x)} cy={py(x * x)} r={11} fill={col(LAB[x])} />
                <text x={px(x)} y={py(x * x) + 5} textAnchor="middle" style={{fill: '#fff', fontWeight: 700}}>{LAB[x] > 0 ? '+' : '−'}</text>
                <text x={px(x)} y={H - 10} textAnchor="middle" className={s.ts}>{x}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
      <Stats>
        <Stat label="이 h에서 틀린 점" value={`${wrong} / 7`} tone={wrong === 0 ? 'good' : 'bad'} />
        <Stat label="수직선 문턱 하나의 최소 오류" value={`${SINGLE} / 7`} tone="bad" />
        <Stat label="원래 공간의 경계" value={`x = ±${fmt(r, 3)}`} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr><th>x</th>{XS.map((x) => <th key={x}>{x}</th>)}</tr>
        </thead>
        <tbody>
          <tr><td>라벨</td>{XS.map((x) => <td key={x}>{LAB[x] > 0 ? '+1' : '−1'}</td>)}</tr>
          <tr><td>f = (2/3)x² − 5/3</td>{XS.map((x) => <td key={x} className={Math.abs(Math.abs(f(x)) - 1) < 1e-9 ? s.cellOn : undefined}>{fmt(f(x), 3)}</td>)}</tr>
        </tbody>
      </table>
      <Note>강조한 칸 x = ±1, ±2에서 f가 정확히 ±1이라 이 네 점이 서포트 벡터입니다. 올린 공간에서는 직선이고 원래 수직선에서는 두 점 x = ±√2.5로 휘어진 경계입니다.</Note>
    </Viz>
  );
}
