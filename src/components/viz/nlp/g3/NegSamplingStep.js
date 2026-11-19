import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const sig = (x) => 1 / (1 + Math.exp(-x));
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1]];
const mul = (a, k) => [a[0] * k, a[1] * k];
const list = (a, d = 3) => `[${fmt(a[0], d)}, ${fmt(a[1], d)}]`;
const lossOf = (v, up, uk) => -Math.log(sig(dot(up, v))) - Math.log(sig(-dot(uk, v)));

const START = {v: [1, 0], up: [0.8, 0.6], uk: [0, 1]};
const MAX = 30;

function stepOnce(st, lr) {
  const sp = dot(st.up, st.v);
  const sn = dot(st.uk, st.v);
  const gp = sig(sp) - 1;
  const gn = sig(sn);
  const gUp = mul(st.v, gp);
  const gUk = mul(st.v, gn);
  const gV = add(mul(st.up, gp), st.uk, gn);
  return {
    sp, sn, gp, gn, gUp, gUk, gV, loss: lossOf(st.v, st.up, st.uk),
    next: {up: add(st.up, gUp, -lr), uk: add(st.uk, gUk, -lr), v: add(st.v, gV, -lr)},
  };
}

const W = 420;
const H = 300;
const OX = 150;
const OY = 150;

export default function NegSamplingStep() {
  const [n, setN] = useState(0);
  const [lr, setLr] = useState(0.5);

  const trail = useMemo(() => {
    const out = [START];
    for (let i = 0; i < n; i++) out.push(stepOnce(out[i], lr).next);
    return out;
  }, [n, lr]);
  const cur = trail[n];
  const info = stepOnce(cur, lr);

  let ext = 1.3;
  trail.forEach((t) => [t.v, t.up, t.uk].forEach((p) => (ext = Math.max(ext, Math.abs(p[0]), Math.abs(p[1])))));
  const SC = 125 / ext;
  const px = (p) => [OX + p[0] * SC, OY - p[1] * SC];

  const items = [
    {k: 'v', name: '날씨 v', color: 'var(--vb)'},
    {k: 'up', name: '좋다 u_o', color: 'var(--va)'},
    {k: 'uk', name: '자동차 u_k', color: 'var(--vc)'},
  ];
  const sNow = [dot(cur.up, cur.v), dot(cur.uk, cur.v)];

  return (
    <Viz
      title="네거티브 샘플링 한 스텝"
      caption="날씨(가운데), 좋다(옆에 있던 단어), 자동차(무작위로 뽑은 단어)의 목록을 움직입니다. 설명용으로 가운데 단어용 표와 옆 단어용 표를 한 벌로 쓴 값이고, 기본값은 본문의 값과 같습니다."
    >
      <Controls>
        <Btn onClick={() => setN(Math.min(MAX, n + 1))}>한 스텝 진행</Btn>
        <Btn onClick={() => setN(Math.max(0, n - 1))}>한 스텝 되돌리기</Btn>
        <Btn onClick={() => setN(0)}>처음으로</Btn>
        <Slider label="학습률" min={0.1} max={1} step={0.1} value={lr} onChange={setLr} format={(x) => fmt(x, 1)} />
      </Controls>

      <div className={s.two}>
        <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="날씨, 좋다, 자동차 목록의 평면 위 위치와 이동 경로">
          <line x1={10} y1={OY} x2={W - 10} y2={OY} stroke="var(--vgrid)" />
          <line x1={OX} y1={10} x2={OX} y2={H - 10} stroke="var(--vgrid)" />
          {items.map((it) => {
            const pts = trail.map((t) => px(t[it.k]));
            const [x, y] = pts[pts.length - 1];
            return (
              <g key={it.k}>
                <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={it.color} strokeWidth="1.5" strokeDasharray="4 3" />
                {pts.slice(0, -1).map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={it.color} opacity="0.45" />
                ))}
                <circle cx={x} cy={y} r="7" fill={it.color} />
                <text x={x + 11} y={y - 8} className={s.t} style={{fill: it.color}}>{it.name}</text>
              </g>
            );
          })}
          <text x={W - 10} y={H - 8} className={s.ts} textAnchor="end">작은 점 = 지나온 위치</text>
        </svg>

        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>{n}번 갱신한 뒤</th>
                <th>값</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>좋다·날씨 (키우기)</td><td className={s.cellOn}>{fmt(sNow[0], 3)}</td></tr>
              <tr><td>자동차·날씨 (줄이기)</td><td className={s.cellOn}>{fmt(sNow[1], 3)}</td></tr>
              <tr><td>오차</td><td>{fmt(info.loss, 3)}</td></tr>
            </tbody>
          </table>
          <Stats>
            <Stat label="σ(좋다·날씨)" value={fmt(sig(info.sp), 3)} />
            <Stat label="σ(자동차·날씨)" value={fmt(sig(info.sn), 3)} />
          </Stats>
        </div>
      </div>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>다음 스텝({n + 1}번째)의 계산</th>
            <th>기울기</th>
            <th>갱신 후</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>좋다 u_o 현재 {list(cur.up, 3)}</td>
            <td>{fmt(info.gp, 3)} × v = {list(info.gUp)}</td>
            <td>{list(info.next.up)}</td>
          </tr>
          <tr>
            <td>자동차 u_k 현재 {list(cur.uk, 3)}</td>
            <td>{fmt(info.gn, 3)} × v = {list(info.gUk)}</td>
            <td>{list(info.next.uk)}</td>
          </tr>
          <tr>
            <td>날씨 v 현재 {list(cur.v, 3)}</td>
            <td>{list(info.gV)}</td>
            <td>{list(info.next.v)}</td>
          </tr>
        </tbody>
      </table>
      <Note>
        갱신 후의 값은 모두 갱신 전의 기울기로 계산합니다. 한 스텝을 진행하면 좋다·날씨는 {fmt(dot(info.next.up, info.next.v), 3)}, 자동차·날씨는 {fmt(dot(info.next.uk, info.next.v), 3)}, 오차는 {fmt(lossOf(info.next.v, info.next.up, info.next.uk), 3)}이 됩니다.
        {n >= MAX ? ' 더 진행할 수 있는 스텝 수의 끝입니다.' : ''}
      </Note>
    </Viz>
  );
}
