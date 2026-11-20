import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const NAMES = ['A', 'B', 'C', 'D'];
const ORIGIN = {
  cost: [1, 2, 1.5, 3],
  on: [true, true, true, true],
  ok: [true, true, false, false],
};
const PRESETS = [
  {name: '본문 값', ...ORIGIN},
  {name: '연습 1: A(1, 정답)와 C(1)뿐', cost: [1, 2, 1, 3], on: [true, false, true, false], ok: [true, true, false, false]},
  {name: '연습 3: C의 비용 3', cost: [1, 2, 3, 3], on: [true, false, true, false], ok: [true, true, false, false]},
];

// 경로를 전부 합친 비용 -log(sum exp(-c)). 가장 작은 비용을 빼서 계산한다.
function logadd(xs) {
  if (!xs.length) return null;
  const m = Math.min(...xs);
  return m - Math.log(xs.reduce((a, x) => a + Math.exp(-(x - m)), 0));
}

export function analyze(cost, on, ok) {
  const idx = [0, 1, 2, 3].filter((i) => on[i]);
  const cor = idx.filter((i) => ok[i]);
  if (!idx.length || !cor.length) return {valid: false, idx, cor};
  const Ca = logadd(cor.map((i) => cost[i]));
  const Cb = logadd(idx.map((i) => cost[i]));
  const ea = idx.reduce((a, i) => a + Math.exp(-(cost[i] - Math.min(...idx.map((j) => cost[j])))), 0);
  const ec = cor.reduce((a, i) => a + Math.exp(-(cost[i] - Math.min(...cor.map((j) => cost[j])))), 0);
  const rows = [0, 1, 2, 3].map((i) => {
    if (!on[i]) return {i, off: true};
    const p = Math.exp(-(cost[i] - Math.min(...idx.map((j) => cost[j])))) / ea;
    const q = ok[i] ? Math.exp(-(cost[i] - Math.min(...cor.map((j) => cost[j])))) / ec : 0;
    return {i, p, q, g: q - p, e: Math.exp(-cost[i])};
  });
  return {valid: true, idx, cor, Ca, Cb, E: Ca - Cb, rows};
}

export default function PathErrorExplorer() {
  const [st, setSt] = useState(ORIGIN);
  const [eta, setEta] = useState(1);
  const {cost, on, ok} = st;
  const r = analyze(cost, on, ok);
  const set = (key, i, v) => setSt({...st, [key]: st[key].map((x, j) => (j === i ? v : x))});
  const stepOnce = (cur) => {
    const a = analyze(cur.cost, cur.on, cur.ok);
    if (!a.valid) return cur;
    return {...cur, cost: cur.cost.map((c, i) => (cur.on[i] ? c - eta * a.rows[i].g : c))};
  };
  const run = (n) => {
    let cur = st;
    for (let k = 0; k < n; k += 1) cur = stepOnce(cur);
    setSt(cur);
  };

  return (
    <Viz
      title="경로 비용을 바꿔 판별 오차 E 계산하기"
      caption="경로마다 비용 c, 사용 여부, 정답 해석에 속하는지를 정합니다. E는 정답 경로를 합친 비용에서 전체 경로를 합친 비용을 뺀 값입니다. 기울기 = (정답 안에서의 몫) - (전체에서의 몫)입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.name} on={false} onClick={() => setSt({cost: p.cost, on: p.on, ok: p.ok})}>{p.name}</Btn>
        ))}
      </Controls>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>경로</th>
            <th>사용</th>
            <th>정답</th>
            <th>비용 c</th>
            <th>e^(-c)</th>
            <th>전체 몫 (e^(-c)가 전체 합에서 차지하는 비율)</th>
            <th>정답 안 몫 (정답 경로의 합에서 차지하는 비율)</th>
            <th>기울기 (c를 올릴 때 E가 변하는 정도)</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3].map((i) => {
            const row = r.valid ? r.rows[i] : null;
            return (
              <tr key={i} style={on[i] ? undefined : {opacity: 0.5}}>
                <td><b>{NAMES[i]}</b></td>
                <td><input type="checkbox" checked={on[i]} aria-label={`${NAMES[i]} 사용`} onChange={(e) => set('on', i, e.target.checked)} /></td>
                <td><input type="checkbox" checked={ok[i]} aria-label={`${NAMES[i]}는 정답 해석`} onChange={(e) => set('ok', i, e.target.checked)} /></td>
                <td>
                  <input type="range" min={0} max={6} step={0.1} value={Math.max(0, Math.min(6, cost[i]))} aria-label={`${NAMES[i]}의 비용`} onChange={(e) => set('cost', i, Number(e.target.value))} style={{width: 90}} />
                  {' '}<b>{fmt(cost[i], 2)}</b>
                </td>
                <td>{on[i] ? fmt(Math.exp(-cost[i]), 4) : '-'}</td>
                <td>{row && !row.off ? fmt(row.p, 4) : '-'}</td>
                <td>{row && !row.off ? (ok[i] ? fmt(row.q, 4) : '0') : '-'}</td>
                <td className={row && !row.off ? (row.g > 1e-9 ? s.cellOn : undefined) : undefined} style={row && !row.off ? {color: row.g < -1e-9 ? 'var(--vbad)' : undefined} : undefined}>
                  {row && !row.off ? (row.g >= 0 ? '+' : '') + fmt(row.g, 4) : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {r.valid ? (
        <Stats>
          <Stat label="C_정답 = -log(정답 합)" value={fmt(r.Ca, 4)} />
          <Stat label="C_전체 = -log(전체 합)" value={fmt(r.Cb, 4)} />
          <Stat label="E = C_정답 - C_전체" value={fmt(r.E, 4)} tone={r.E < 1e-9 ? 'good' : undefined} />
        </Stats>
      ) : (
        <Note>정답 해석에 속한 경로가 하나도 없어 E를 계산할 수 없습니다. 사용하는 경로 중 하나 이상을 정답으로 골라 주세요.</Note>
      )}
      {r.valid && r.idx.length === r.cor.length ? (
        <Note>오답 경로가 없습니다. E = 0이고 기울기도 0이라서 학습할 것이 없습니다.</Note>
      ) : null}
      <Controls>
        <label className={s.ctl}>
          <span>걸음 크기</span>
          <input type="range" min={0.1} max={3} step={0.1} value={eta} onChange={(e) => setEta(Number(e.target.value))} />
          <b>{fmt(eta, 1)}</b>
        </label>
        <Btn on={false} onClick={() => run(1)}>경사하강 1걸음</Btn>
        <Btn on={false} onClick={() => run(10)}>10걸음</Btn>
      </Controls>
      <Note>
        한 걸음은 c ← c - 걸음 크기 × 기울기입니다. 기울기가 양수인 정답 경로의 비용은 내려가고, 음수인 오답 경로의 비용은 올라갑니다. 걸음을 누를수록 E가 줄어드는지 확인해 보세요.
      </Note>
    </Viz>
  );
}
