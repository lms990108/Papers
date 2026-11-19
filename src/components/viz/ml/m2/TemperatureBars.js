import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, styles as s} from '../../Viz';
import {softmax, num} from './mlCore';

const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)'];
const W = 520;
const H = 190;
const L = 40;
const R = 14;
const T = 14;
const B = 28;
const TMAX = 5;
const px = (t) => L + (t / TMAX) * (W - L - R);
const py = (p) => H - B - p * (H - T - B);

export default function TemperatureBars() {
  const [sc, setSc] = useState([2, 1, 0]);
  const [temp, setTemp] = useState(1);

  const set = (i) => (x) => setSc(sc.map((a, j) => (j === i ? x : a)));
  const divided = sc.map((x) => x / temp);
  const p = softmax(divided);
  const top = sc.indexOf(Math.max.apply(null, sc));
  const curve = [];
  for (let i = 1; i <= 100; i += 1) {
    const t = (i / 100) * TMAX;
    curve.push(px(t) + ',' + py(softmax(sc.map((x) => x / Math.max(t, 0.05)))[top]));
  }
  const orig = Math.abs(sc[0] - 2) + Math.abs(sc[1] - 1) + Math.abs(sc[2]) < 1e-9;
  const tie = sc.filter((x) => x === sc[top]).length > 1;

  return (
    <Viz
      title="온도 T로 나눈 점수의 비율"
      caption="점수를 T로 나눈 뒤 소프트맥스를 합니다. T가 작으면 큰 칸에 몰리고, 크면 평평해집니다. 처음 점수는 (2, 1, 0)이고, 표의 세 줄은 T = 0.5, 1, 2입니다."
    >
      <Controls>
        <Slider label="온도 T" min={0.1} max={TMAX} step={0.05} value={temp} onChange={setTemp} format={(v) => num(v, 2)} />
        {[0.5, 1, 2].map((v) => (
          <Btn key={v} on={Math.abs(temp - v) < 1e-9} onClick={() => setTemp(v)}>
            T = {v}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {sc.map((x, i) => (
          <Slider key={i} label={'칸 ' + (i + 1) + ' 점수'} min={-4} max={4} step={0.5} value={x} onChange={set(i)} format={(a) => num(a, 1)} />
        ))}
        <Btn onClick={() => setSc([2, 1, 0])}>점수 (2, 1, 0)</Btn>
      </Controls>
      {p.map((x, i) => (
        <Bar key={i} label={'칸 ' + (i + 1) + ' (÷T = ' + num(divided[i], 2) + ')'} value={x} max={1} color={COLORS[i]} text={num(x, 3)} />
      ))}
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="온도 T에 대한 가장 큰 점수 칸의 비율 곡선">
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={px(v)} y1={T} x2={px(v)} y2={H - B} stroke="var(--vgrid)" />
            <text x={px(v)} y={H - B + 16} className={s.ts} textAnchor="middle">{v}</text>
          </g>
        ))}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={L} y1={py(v)} x2={W - R} y2={py(v)} stroke="var(--vgrid)" />
            <text x={L - 6} y={py(v) + 4} className={s.ts} textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={W - R} y={H - 4} className={s.ts} textAnchor="end">온도 T</text>
        <text x={L + 4} y={T + 10} className={s.ts}>칸 {top + 1}의 비율</text>
        <polyline points={curve.join(' ')} fill="none" stroke={COLORS[top]} strokeWidth="2.5" />
        <line x1={px(temp)} y1={T} x2={px(temp)} y2={H - B} stroke="var(--ifm-color-emphasis-600)" strokeDasharray="3 3" />
        <circle cx={px(temp)} cy={py(p[top])} r="5" fill={COLORS[top]} />
      </svg>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>T</th>
              <th>나눈 점수</th>
              <th>비율</th>
            </tr>
          </thead>
          <tbody>
            {[0.5, 1, 2].map((t) => {
              const q = softmax(sc.map((x) => x / t));
              return (
                <tr key={t}>
                  <td className={Math.abs(temp - t) < 1e-9 ? s.cellOn : undefined}>{t}</td>
                  <td>({sc.map((x) => num(x / t, 2)).join(', ')})</td>
                  <td>{q.map((x) => num(x, 3)).join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="가장 큰 칸의 비율" value={num(p[top], 3)} />
        <Stat label="비율의 합" value={num(p.reduce((a, c) => a + c, 0), 3)} />
        <Stat label="점수를 곱하는 수 1 ÷ T" value={num(1 / temp, 2)} />
      </Stats>
      <Note>
        {orig
          ? temp < 1
            ? 'T가 1보다 작으면 나눈 점수의 차이가 벌어져 큰 칸에 몰립니다. 점수에 1 ÷ T를 곱한 것과 같습니다.'
            : temp > 1
              ? 'T가 1보다 크면 차이가 줄어 칸 사이가 평평해집니다. 다음 단어를 뽑을 때 T를 높이면 여러 단어가 뽑힙니다.'
              : 'T = 1은 점수를 그대로 소프트맥스에 넣은 것입니다. 0.665, 0.245, 0.090입니다.'
          : tie
            ? '가장 큰 점수가 같은 칸이 둘이면, T를 바꿔도 그 칸들은 같은 비율을 나눠 가집니다.'
            : '점수를 바꿔도 T가 작을수록 큰 칸에 몰리는 모양은 같습니다. 이름의 맥스는 가장 큰 칸 하나만 1로 만드는 함수를 부드럽게 만든 꼴이라는 뜻입니다.'}
      </Note>
    </Viz>
  );
}
