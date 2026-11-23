import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {ACTS} from './dlmath';

const W = 560;
const H = 240;
const PAD = 34;
const XS = [-4, -2, -1, 0, 1, 2, 4];

export default function StackCollapse() {
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(1);
  const [x, setX] = useState(1);
  const [mode, setMode] = useState('tanh');
  const f = ACTS[mode].f;
  const run = (v) => {
    const a = w1 * v;
    const h = f(a);
    return {a, h, y: w2 * h, lin: w2 * w1 * v};
  };
  const r = run(x);

  // 곡선 범위
  const samples = [];
  for (let i = 0; i <= 80; i += 1) {
    const v = -4 + (8 * i) / 80;
    const q = run(v);
    samples.push([v, q.y, q.lin]);
  }
  const ymax = Math.max(1, ...samples.map((p) => Math.max(Math.abs(p[1]), Math.abs(p[2])))) * 1.1;
  const px = (v) => PAD + ((v + 4) / 8) * (W - 2 * PAD);
  const py = (v) => H / 2 - (v / ymax) * (H / 2 - 18);
  const d = (k) => samples.map((p, i) => `${i ? 'L' : 'M'}${px(p[0]).toFixed(1)},${py(p[k]).toFixed(1)}`).join(' ');

  return (
    <Viz
      title="층 둘을 쌓았을 때: 직선과 활성화 함수를 거친 결과"
      caption="y = w₂ · f(w₁ · x)입니다. f는 두 층 사이에 끼우는 활성화 함수입니다. 점선은 가운데 함수가 없을 때의 직선 w₂ · w₁ · x입니다. 기본값(0.5, 1, tanh)은 본문의 표와 같습니다."
    >
      <Controls>
        <Slider label="w₁ (첫 층 가중치)" min={-3} max={3} step={0.1} value={w1} onChange={setW1} format={(v) => fmt(v, 1)} />
        <Slider label="w₂ (둘째 층 가중치)" min={-3} max={3} step={0.1} value={w2} onChange={setW2} format={(v) => fmt(v, 1)} />
        <Slider label="x (입력)" min={-4} max={4} step={0.5} value={x} onChange={setX} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        {['none', 'tanh', 'relu', 'sigmoid'].map((m) => (
          <Btn key={m} on={mode === m} onClick={() => setMode(m)}>
            {m === 'none' ? '가운데 함수 없음' : ACTS[m].label}
          </Btn>
        ))}
        <Btn
          onClick={() => {
            setW1(0.5);
            setW2(1);
            setMode('tanh');
          }}
        >
          본문 예 (0.5, 1, tanh)
        </Btn>
        <Btn
          onClick={() => {
            setW1(2);
            setW2(3);
            setMode('relu');
            setX(-1);
          }}
        >
          ReLU 예 (2, 3)
        </Btn>
      </Controls>
      <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="입력 x에 대한 출력 y의 곡선과 직선 비교">
        <line x1={px(-4)} x2={px(4)} y1={py(0)} y2={py(0)} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={px(0)} x2={px(0)} y1={8} y2={H - 8} stroke="var(--ifm-color-emphasis-400)" />
        {[-4, -2, 2, 4].map((v) => (
          <text key={v} x={px(v)} y={py(0) + 15} textAnchor="middle" className={s.ts}>
            {v}
          </text>
        ))}
        <text x={px(0) + 5} y={16} className={s.ts}>
          y 최대 {fmt(ymax, 1)}
        </text>
        <path d={d(2)} fill="none" stroke="var(--ifm-color-emphasis-600)" strokeWidth={2} strokeDasharray="5 4" />
        <path d={d(1)} fill="none" stroke="var(--va)" strokeWidth={2.6} />
        <line x1={px(x)} x2={px(x)} y1={py(r.lin)} y2={py(r.y)} stroke="var(--vbad)" strokeWidth={2} />
        <circle cx={px(x)} cy={py(r.y)} r={5} fill="var(--va)" />
        <circle cx={px(x)} cy={py(r.lin)} r={4} fill="var(--ifm-color-emphasis-600)" />
        <g>
          <line x1={W - 190} x2={W - 160} y1={18} y2={18} stroke="var(--va)" strokeWidth={2.6} />
          <text x={W - 154} y={22} className={s.ts}>
            활성화 함수를 거친 결과 (실선)
          </text>
          <line x1={W - 190} x2={W - 160} y1={36} y2={36} stroke="var(--ifm-color-emphasis-600)" strokeWidth={2} strokeDasharray="5 4" />
          <text x={W - 154} y={40} className={s.ts}>
            직선 (점선)
          </text>
        </g>
      </svg>
      <Stats>
        <Stat label="a = w₁x (첫 층의 합)" value={fmt(r.a, 3)} />
        <Stat label="h = f(a) (활성화 함수를 거친 값)" value={fmt(r.h, 3)} />
        <Stat label="y = w₂h (출력)" value={fmt(r.y, 3)} />
        <Stat label="직선일 때 y" value={fmt(r.lin, 3)} />
        <Stat label="두 값의 차이" value={fmt(Math.abs(r.y - r.lin), 3)} tone={Math.abs(r.y - r.lin) < 1e-9 ? 'good' : 'bad'} />
      </Stats>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>x</th>
              {XS.map((v) => (
                <th key={v}>{v}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>직선 w₂·w₁·x</td>
              {XS.map((v) => (
                <td key={v}>{fmt(run(v).lin, 3)}</td>
              ))}
            </tr>
            <tr>
              <td>지금 설정</td>
              {XS.map((v) => (
                <td key={v} className={v === x ? s.cellOn : undefined}>
                  {fmt(run(v).y, 3)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <Note>
        {mode === 'none'
          ? '가운데 함수가 없으면 w₂ · w₁ 하나를 곱한 것과 같아서 곡선이 직선 위에 겹칩니다.'
          : mode === 'relu'
            ? 'ReLU는 a가 음수이면 0으로 자릅니다. a가 양수인 쪽은 직선과 같고, 음수인 쪽은 평평해집니다.'
            : mode === 'tanh'
              ? '입력이 커질수록 곡선이 평평해집니다. tanh는 -1과 1 사이로 눌려서 y의 크기가 w₂의 크기를 넘지 않습니다.'
              : '시그모이드는 0과 1 사이로 눌려서 입력이 커질수록 평평해집니다.'}
      </Note>
    </Viz>
  );
}
