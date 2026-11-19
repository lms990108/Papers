import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {trim} from './util';

const T = 30;
const P0 = {x1: 2, x2: 3, t1: 3, t2: 0, w: 0.5, eta: 0.1};

function run(p) {
  const {x1, x2, t1, t2, w, eta} = p;
  const loss = (a, b) => 0.5 * ((a * x1 - t1) ** 2 + (b * x2 - t2) ** 2);
  const sh = [w];
  const sp = [[w, w]];
  for (let k = 0; k < T; k++) {
    const a = sh[k];
    const g = (a * x1 - t1) * x1 + (a * x2 - t2) * x2;
    sh.push(a - eta * g);
    const [u, v] = sp[k];
    sp.push([u - eta * (u * x1 - t1) * x1, v - eta * (v * x2 - t2) * x2]);
  }
  return {loss, sh, sp, Ls: sh.map((a) => loss(a, a)), Lp: sp.map(([u, v]) => loss(u, v))};
}

function Chart({Ls, Lp, n}) {
  const top = Math.max(Ls[0], Lp[0], 1) * 1.1;
  const X = (k) => 40 + (k / T) * 580;
  const Y = (v) => 130 - (Math.min(v, top * 1.2) / top) * 110;
  const pts = (a) => a.map((v, k) => `${X(k)},${Y(v)}`).join(' ');
  return (
    <svg viewBox="0 0 640 160" className={s.svg} role="img" aria-label="갱신 횟수에 따른 오차. 공유와 따로 갱신 두 선">
      <line x1={40} y1={130} x2={620} y2={130} stroke="var(--ifm-color-emphasis-400)" />
      <line x1={40} y1={20} x2={40} y2={130} stroke="var(--ifm-color-emphasis-400)" />
      <text x={36} y={24} textAnchor="end" className={s.ts}>{trim(top / 1.1, 2)}</text>
      <text x={36} y={134} textAnchor="end" className={s.ts}>0</text>
      <text x={330} y={154} textAnchor="middle" className={s.ts}>갱신 횟수 (0 ~ {T})</text>
      <line x1={X(n)} y1={20} x2={X(n)} y2={130} stroke="var(--ifm-color-emphasis-500)" strokeDasharray="4 3" />
      <polyline points={pts(Ls)} fill="none" stroke="var(--va)" strokeWidth={2.4} />
      <polyline points={pts(Lp)} fill="none" stroke="var(--vb)" strokeWidth={2.4} strokeDasharray="7 3" />
      <text x={X(T) - 4} y={Y(Ls[T]) - 6} textAnchor="end" className={s.ts} style={{fill: 'var(--va)'}}>공유 (실선)</text>
      <text x={X(T) - 4} y={Y(Lp[T]) + 14} textAnchor="end" className={s.ts} style={{fill: 'var(--vb)'}}>따로 (점선)</text>
    </svg>
  );
}

export default function GradientSum() {
  const [p, setP] = useState(P0);
  const [n, setN] = useState(0);
  const set = (k) => (v) => setP({...p, [k]: v});
  const {x1, x2, t1, t2, eta} = p;
  const r = run(p);
  const w = r.sh[n];
  const [u, v] = r.sp[n];
  const e1 = w * x1 - t1;
  const e2 = w * x2 - t2;
  const g1 = e1 * x1;
  const g2 = e2 * x2;
  const eu = u * x1 - t1;
  const ev = v * x2 - t2;
  const nw = w - eta * (g1 + g2);
  const nu = u - eta * eu * x1;
  const nv = v - eta * ev * x2;
  const h = 1e-6;
  const num = (r.loss(w + h, w + h) - r.loss(w - h, w - h)) / (2 * h);

  return (
    <Viz
      title="공유한 가중치의 기울기는 자리별 기울기의 합"
      caption="같은 검출기 w가 두 자리를 봅니다. 자리 1은 w를 키우라고, 자리 2는 줄이라고 당깁니다. 공유하면 한 값이 타협하고, 따로 갱신하면 두 값이 갈라집니다. 기본값은 본문의 예(x=2, 3 / 목표 3, 0 / w=0.5 / 보폭 0.1)입니다."
    >
      <Controls>
        <Slider label="x₁" min={1} max={4} value={x1} onChange={set('x1')} />
        <Slider label="x₂" min={1} max={4} value={x2} onChange={set('x2')} />
        <Slider label="목표 t₁" min={-3} max={5} value={t1} onChange={set('t1')} />
        <Slider label="목표 t₂" min={-3} max={5} value={t2} onChange={set('t2')} />
      </Controls>
      <Controls>
        <Slider label="시작 w" min={-1} max={2} step={0.1} value={p.w} onChange={(x) => {set('w')(x); setN(0);}} format={(x) => trim(x, 1)} />
        <Slider label="보폭 η" min={0.01} max={0.3} step={0.01} value={eta} onChange={set('eta')} format={(x) => trim(x, 2)} />
        <Slider label="갱신 횟수" min={0} max={T} value={n} onChange={setN} />
        <Btn onClick={() => setN(Math.min(T, n + 1))}>한 걸음</Btn>
        <Btn onClick={() => { setP(P0); setN(0); }}>처음 값으로</Btn>
      </Controls>

      <div className={s.two}>
        <div>
          <div className={s.title}>공유: w 하나 (현재 w = {trim(w, 5)})</div>
          <table className={s.grid}>
            <thead><tr><th>자리</th><th>입력 x</th><th>출력 wx</th><th>오차 y−t</th><th>기울기 (y−t)x</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>{x1}</td><td>{trim(w * x1)}</td><td>{trim(e1)}</td><td>{trim(g1)}</td></tr>
              <tr><td>2</td><td>{x2}</td><td>{trim(w * x2)}</td><td>{trim(e2)}</td><td>{trim(g2)}</td></tr>
              <tr><td colSpan={4}>합 (w가 받는 기울기)</td><td className={s.cellOn}>{trim(g1 + g2)}</td></tr>
            </tbody>
          </table>
          <Note>다음 w = {trim(w, 5)} − {trim(eta, 2)} × {trim(g1 + g2)} = {trim(nw, 5)}, 그때 오차 {trim(r.loss(nw, nw), 5)}. 수치 미분으로 검산한 기울기: {trim(num, 4)}.</Note>
        </div>
        <div>
          <div className={s.title}>따로: w₁, w₂ (현재 {trim(u, 5)}, {trim(v, 5)})</div>
          <table className={s.grid}>
            <thead><tr><th>자리</th><th>가중치</th><th>오차 y−t</th><th>기울기</th><th>다음 가중치</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>{trim(u, 5)}</td><td>{trim(eu)}</td><td>{trim(eu * x1)}</td><td>{trim(nu, 5)}</td></tr>
              <tr><td>2</td><td>{trim(v, 5)}</td><td>{trim(ev)}</td><td>{trim(ev * x2)}</td><td>{trim(nv, 5)}</td></tr>
            </tbody>
          </table>
          <Note>두 값이 같지 않게 되면 같은 검출기라는 전제가 깨집니다. 다음 갱신 뒤 오차는 {trim(r.loss(nu, nv), 5)}입니다.</Note>
        </div>
      </div>

      <Stats>
        <Stat label="지금 오차: 공유" value={trim(r.Ls[n], 5)} />
        <Stat label="지금 오차: 따로" value={trim(r.Lp[n], 5)} />
        <Stat label="w₁ − w₂ (따로)" value={trim(u - v, 4)} tone={Math.abs(u - v) < 1e-9 ? 'good' : 'bad'} />
      </Stats>
      <Chart Ls={r.Ls} Lp={r.Lp} n={n} />
      <Note>따로 갱신한 쪽의 훈련 오차가 더 빨리 내려가는 것은 자유도가 두 배이기 때문입니다. 공유가 이기는 곳은 훈련 오차가 아니라, 한 자리에서 배운 것이 다른 자리에서도 통하는 일반화입니다.</Note>
    </Viz>
  );
}
