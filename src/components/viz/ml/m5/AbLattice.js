import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, styles as s} from '../../Viz';

// 위치 0 -> 1 -> 2, 호가 둘씩. 원본의 a/b 격자입니다.
const START = {a: 1, b: 4};
const NEXT = {b: 2, a: 3};
const NX = [60, 300, 540];
const NY = 100;

function pickMin(costs, base) {
  // 동점이면 먼저 적은 호를 고릅니다.
  const keys = Object.keys(costs);
  let best = keys[0];
  keys.forEach((k) => {
    if (base + costs[k] < base + costs[best] - 1e-12) best = k;
  });
  return best;
}

export default function AbLattice() {
  const [c0, setC0] = useState(START);
  const [c1, setC1] = useState(NEXT);
  const set0 = (k) => (x) => setC0({...c0, [k]: x});
  const set1 = (k) => (x) => setC1({...c1, [k]: x});

  const k1 = pickMin(c0, 0);
  const v1 = c0[k1];
  const k2 = pickMin(c1, v1);
  const v2 = v1 + c1[k2];

  const paths = [];
  Object.keys(c0).forEach((a) => {
    Object.keys(c1).forEach((b) => {
      paths.push({lab: a + b, cost: c0[a] + c1[b]});
    });
  });
  const brute = Math.min.apply(null, paths.map((p) => p.cost));
  const keep = k1 + k2;

  const top = (x1, x2) => `M ${x1 + 16},${NY - 6} C ${x1 + 70},${NY - 50} ${x2 - 70},${NY - 50} ${x2 - 16},${NY - 6}`;
  const bot = (x1, x2) => `M ${x1 + 16},${NY + 6} C ${x1 + 70},${NY + 50} ${x2 - 70},${NY + 50} ${x2 - 16},${NY + 6}`;
  const arcs = [
    {id: 'a0', d: top(NX[0], NX[1]), x: 180, y: 52, text: `a · ${c0.a}`, on: k1 === 'a'},
    {id: 'b0', d: bot(NX[0], NX[1]), x: 180, y: 158, text: `b · ${c0.b}`, on: k1 === 'b'},
    {id: 'b1', d: top(NX[1], NX[2]), x: 420, y: 52, text: `b · ${c1.b}`, on: k2 === 'b'},
    {id: 'a1', d: bot(NX[1], NX[2]), x: 420, y: 158, text: `a · ${c1.a}`, on: k2 === 'a'},
  ];

  return (
    <Viz
      title="격자에서 노드마다 가장 싼 도착 하나만 남기기"
      caption="호의 비용을 바꿔 보세요. 굵은 호가 비터비가 남기는 호입니다. 아래 표의 네 경로를 다 더한 최솟값과 노드 아래 v(그 노드까지의 최소 비용)가 늘 같습니다."
    >
      <Controls>
        <Slider label="위치 0→1, 호 a의 비용" min={0} max={8} step={0.5} value={c0.a} onChange={set0('a')} />
        <Slider label="위치 0→1, 호 b의 비용" min={0} max={8} step={0.5} value={c0.b} onChange={set0('b')} />
        <Slider label="위치 1→2, 호 b의 비용" min={0} max={8} step={0.5} value={c1.b} onChange={set1('b')} />
        <Slider label="위치 1→2, 호 a의 비용" min={0} max={8} step={0.5} value={c1.a} onChange={set1('a')} />
      </Controls>
      <Controls>
        <Btn onClick={() => { setC0(START); setC1(NEXT); }}>원본 값 (1, 4, 2, 3)</Btn>
        <Btn onClick={() => { setC0({a: 1, b: 0.5}); setC1(NEXT); }}>b 비용을 0.5로 (연습 문제 2)</Btn>
      </Controls>
      <svg viewBox="0 0 600 200" className={s.svg} role="img" aria-label="위치 세 개의 격자. 위치마다 호가 둘씩이고 비용이 가장 작은 경로가 굵게 표시됩니다.">
        {arcs.map((a) => (
          <g key={a.id}>
            <path d={a.d} fill="none" stroke={a.on ? 'var(--vb)' : 'var(--ifm-color-emphasis-500)'} strokeWidth={a.on ? 3 : 1.5} />
            <text x={a.x} y={a.y} textAnchor="middle" className={s.t} style={a.on ? {fill: 'var(--vb)', fontWeight: 700} : undefined}>
              {a.text}
            </text>
          </g>
        ))}
        {NX.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={NY} r={16} fill="var(--ifm-background-color)" stroke="var(--ifm-font-color-base)" strokeWidth={1.5} />
            <text x={x} y={NY + 4} textAnchor="middle" className={s.t}>{i}</text>
            <text x={x} y={190} textAnchor="middle" className={s.t}>v = {[0, v1, v2][i]}</text>
          </g>
        ))}
      </svg>
      <table className={s.grid}>
        <thead>
          <tr><th>경로</th><th>비용</th><th>비터비가 남긴 경로</th></tr>
        </thead>
        <tbody>
          {paths.map((p) => (
            <tr key={p.lab}>
              <td className={p.lab === keep ? s.cellOn : undefined}>{p.lab[0]} 다음 {p.lab[1]}</td>
              <td className={p.lab === keep ? s.cellOn : undefined}>{c0[p.lab[0]]} + {c1[p.lab[1]]} = {p.cost}</td>
              <td className={p.lab === keep ? s.cellOn : undefined}>{p.lab === keep ? '예' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="v1 = 노드 1까지의 최소 비용" value={v1} />
        <Stat label="v2 = v1 + 다음 호 중 싼 쪽" value={v2} />
        <Stat label="네 경로를 나열한 최솟값" value={brute} tone={Math.abs(brute - v2) < 1e-9 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        경로는 4개이지만 비터비는 노드 1에서 하나, 노드 2에서 하나, 두 번만 고릅니다. 두 도착의 비용이 같으면 먼저 적은 호를 남깁니다.
      </Note>
    </Viz>
  );
}
