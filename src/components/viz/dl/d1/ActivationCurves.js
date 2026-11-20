import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';
import {ACTS} from './dlmath';

const W = 560;
const H = 260;
const PAD = 34;
const XMIN = -4;
const XMAX = 4;
const YMIN = -1.5;
const YMAX = 3.5;
const px = (x) => PAD + ((x - XMIN) / (XMAX - XMIN)) * (W - 2 * PAD);
const py = (y) => H - PAD - ((Math.max(YMIN, Math.min(YMAX, y)) - YMIN) / (YMAX - YMIN)) * (H - 2 * PAD);

const CURVES = [
  {key: 'tanh', label: 'tanh', color: 'var(--va)', dash: undefined},
  {key: 'relu', label: 'ReLU', color: 'var(--vb)', dash: '7 4'},
  {key: 'sigmoid', label: '시그모이드', color: 'var(--vc)', dash: '2 4'},
];
const ROWS = [-2, 0, 0.5, 3];

const path = (f) => {
  const pts = [];
  for (let i = 0; i <= 160; i += 1) {
    const x = XMIN + ((XMAX - XMIN) * i) / 160;
    pts.push(`${i === 0 ? 'M' : 'L'}${px(x).toFixed(1)},${py(f(x)).toFixed(1)}`);
  }
  return pts.join(' ');
};

export default function ActivationCurves() {
  const [a, setA] = useState(0.5);
  const [on, setOn] = useState({tanh: true, relu: true, sigmoid: true});

  return (
    <Viz
      title="구부러지는 함수 셋을 겹쳐 보기"
      caption="a는 구부러지는 함수에 들어가는 값, 곧 가중치를 곱해 더한 합입니다. a를 움직이면 세 함수의 값이 함께 바뀝니다. 표의 -2, 0, 0.5, 3은 본문의 표와 같은 값입니다. 곡선은 위쪽 3.5와 아래쪽 -1.5에서 잘라 그렸습니다."
    >
      <Controls>
        <Slider label="a" min={-4} max={4} step={0.1} value={a} onChange={setA} format={(v) => fmt(v, 1)} />
        {ROWS.map((r) => (
          <Btn key={r} on={Math.abs(a - r) < 1e-9} onClick={() => setA(r)}>
            a = {r}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {CURVES.map((c) => (
          <Btn key={c.key} on={on[c.key]} onClick={() => setOn({...on, [c.key]: !on[c.key]})}>
            {c.label} {on[c.key] ? '보임' : '숨김'}
          </Btn>
        ))}
      </Controls>
      <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="tanh, ReLU, 시그모이드 곡선과 현재 a에서의 값">
        <line x1={px(XMIN)} x2={px(XMAX)} y1={py(0)} y2={py(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={px(0)} x2={px(0)} y1={py(YMIN)} y2={py(YMAX)} stroke="var(--ifm-color-emphasis-400)" />
        {[-1, 1, 2, 3].map((v) => (
          <g key={v}>
            <line x1={px(XMIN)} x2={px(XMAX)} y1={py(v)} y2={py(v)} stroke="var(--ifm-color-emphasis-200)" />
            <text x={px(XMIN) - 6} y={py(v) + 4} textAnchor="end" className={s.ts}>
              {v}
            </text>
          </g>
        ))}
        {[-4, -2, 2, 4].map((v) => (
          <text key={v} x={px(v)} y={py(0) + 16} textAnchor="middle" className={s.ts}>
            {v}
          </text>
        ))}
        <line x1={px(a)} x2={px(a)} y1={py(YMIN)} y2={py(YMAX)} stroke="var(--ifm-color-emphasis-600)" strokeDasharray="3 3" />
        {CURVES.filter((c) => on[c.key]).map((c) => (
          <g key={c.key}>
            <path d={path(ACTS[c.key].f)} fill="none" stroke={c.color} strokeWidth={2.4} strokeDasharray={c.dash} />
            <circle cx={px(a)} cy={py(ACTS[c.key].f(a))} r={5} fill={c.color} />
          </g>
        ))}
        {CURVES.map((c, i) => (
          <g key={c.key}>
            <line x1={px(-3.9)} x2={px(-3.3)} y1={py(3.25) + i * 18} y2={py(3.25) + i * 18} stroke={c.color} strokeWidth={2.4} strokeDasharray={c.dash} />
            <text x={px(-3.2)} y={py(3.25) + i * 18 + 4} className={s.t}>
              {c.label}
            </text>
          </g>
        ))}
        <text x={px(a) + 4} y={py(YMAX) + 12} className={s.ts}>
          a = {fmt(a, 1)}
        </text>
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>a</th>
            <th>tanh(a)</th>
            <th>ReLU(a) = max(0, a)</th>
            <th>시그모이드</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={s.cellOn}>{fmt(a, 1)} (지금)</td>
            {CURVES.map((c) => (
              <td key={c.key} className={s.cellOn}>
                {fmt(ACTS[c.key].f(a), 3)}
              </td>
            ))}
          </tr>
          {ROWS.map((r) => (
            <tr key={r}>
              <td>{r}</td>
              {CURVES.map((c) => (
                <td key={c.key}>{fmt(ACTS[c.key].f(r), 3)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Note>tanh는 -1과 1 사이, 시그모이드는 0과 1 사이에 눌립니다. ReLU는 음수를 0으로 자르고 양수는 그대로 둡니다. 셋 다 직선이 아닙니다.</Note>
    </Viz>
  );
}
