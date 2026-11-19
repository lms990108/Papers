import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const PRESETS = [
  {name: '[1, 0]', k: 2, s: [1, 0, 0], c: 0},
  {name: '[11, 10]', k: 2, s: [1, 0, 0], c: 10},
  {name: '[-9, -10]', k: 2, s: [1, 0, 0], c: -10},
  {name: '연습 2: [2, 0, 0]', k: 3, s: [2, 0, 0], c: 0},
];

export function softmax(v) {
  const m = Math.max(...v);
  const e = v.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / z);
}

export default function SoftmaxShift() {
  const [k, setK] = useState(2);
  const [base, setBase] = useState([1, 0, 0]);
  const [c, setC] = useState(0);
  const scores = base.slice(0, k).map((v) => v + c);
  const p = softmax(scores);
  const m = Math.max(...scores);
  const lse = m + Math.log(scores.reduce((a, x) => a + Math.exp(x - m), 0));
  const err = -Math.log(p[0]);
  const colors = ['var(--vok)', 'var(--vb)', 'var(--vc)'];
  const names = ['정답 (첫 칸)', '오답 1', '오답 2'];

  return (
    <Viz
      title="모든 점수에 같은 수를 더해도 확률과 오차는 그대로"
      caption="정답은 첫 칸입니다. 점수 세 개를 움직이거나 모두에 같은 수 c를 더해 보세요. 오차 = -정답 점수 + log(모든 점수의 지수의 합)입니다."
    >
      <Controls>
        {PRESETS.map((x) => (
          <Btn key={x.name} on={false} onClick={() => { setK(x.k); setBase(x.s); setC(x.c); }}>{x.name}</Btn>
        ))}
        <Btn on={k === 2} onClick={() => setK(2)}>칸 2개</Btn>
        <Btn on={k === 3} onClick={() => setK(3)}>칸 3개</Btn>
      </Controls>
      <Controls>
        {[0, 1, 2].slice(0, k).map((i) => (
          <Slider key={i} label={`점수 ${i + 1}`} min={-5} max={5} step={0.5} value={base[i]} onChange={(v) => setBase(base.map((x, j) => (j === i ? v : x)))} format={(v) => fmt(v, 1)} />
        ))}
        <Slider label="모두에 더하기 c" min={-10} max={10} step={1} value={c} onChange={setC} />
      </Controls>
      <div>
        {scores.map((sc, i) => (
          <Bar key={i} label={`${names[i]}: ${fmt(sc, 1)}`} value={p[i]} max={1} color={colors[i]} text={fmt(p[i], 4)} />
        ))}
      </div>
      <Stats>
        <Stat label="실제 점수" value={`[${scores.map((v) => fmt(v, 1).replace(/\.0$/, '')).join(', ')}]`} />
        <Stat label="정답 확률 p1" value={fmt(p[0], 4)} />
        <Stat label="오차 -log p1" value={fmt(err, 4)} />
        <Stat label="-정답 점수" value={fmt(-scores[0], 2)} />
        <Stat label="log(지수의 합)" value={fmt(lse, 2)} />
      </Stats>
      <Note>
        c를 바꿔도 확률 막대와 오차는 그대로이고, 위 두 칸의 값만 같은 만큼 같이 움직입니다. 정답 점수를 올리려면 오답 점수와의 차이를 벌려야 합니다.
      </Note>
    </Viz>
  );
}
