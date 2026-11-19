import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const W = 680;
const H = 230;
const POS = {x: [80, 50], w: [80, 160], p: [270, 160], q: [450, 100], E: [610, 100]};
const BW = 84;
const BH = 42;

const calc = (x, w) => {
  const p = w * x;
  const q = p + x;
  return {p, q, E: q * q};
};

function Node({id, title, val}) {
  const [cx, cy] = POS[id];
  return (
    <g>
      <rect x={cx - BW / 2} y={cy - BH / 2} width={BW} height={BH} rx={6} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth="1.5" />
      <text x={cx} y={cy - 4} textAnchor="middle" className={s.ts}>{title}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>{val}</text>
    </g>
  );
}

function Edge({a, b, color, width = 1.5, dash}) {
  const [x1, y1] = POS[a];
  const [x2, y2] = POS[b];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  // 상자 가장자리에서 시작/끝나게 줄인다
  const sh = (u, v) => Math.min(BW / 2 / Math.max(Math.abs(u), 1e-6), BH / 2 / Math.max(Math.abs(v), 1e-6));
  const s0 = sh(ux, uy);
  const ax = x2 - ux * s0;
  const ay = y2 - uy * s0;
  const bx = x1 + ux * s0;
  const by = y1 + uy * s0;
  return (
    <g>
      <line x1={bx} y1={by} x2={ax} y2={ay} stroke={color} strokeWidth={width} strokeDasharray={dash} />
      <polygon points={`${ax},${ay} ${ax - ux * 9 - uy * 4},${ay - uy * 9 + ux * 4} ${ax - ux * 9 + uy * 4},${ay - uy * 9 - ux * 4}`} fill={color} />
    </g>
  );
}

export default function BranchGraph() {
  const [x, setX] = useState(2);
  const [w, setW] = useState(3);
  const [sum, setSum] = useState(true);

  const {p, q} = calc(x, w);
  const dq = 2 * q;
  const dp = dq;
  const dwv = dp * x;
  const viaP = dp * w;
  const viaQ = dq * 1;
  const dx = sum ? viaP + viaQ : viaP;
  const d = 1e-6;
  const num = (calc(x + d, w).E - calc(x - d, w).E) / (2 * d);
  const ok = Math.abs(dx - num) < 1e-3;
  const base = 'var(--ifm-font-color-base)';

  return (
    <Viz
      title="x가 두 곳에 쓰이면 기울기는 두 갈래의 합"
      caption="p = w·x, q = p + x, E = q·q입니다. x에서 나가는 길이 둘이라, 오차는 두 길로 동시에 x에 영향을 받습니다. 기본값 x = 2, w = 3에서 48 + 16 = 64가 나옵니다. 합하기를 끄면 한 갈래만 세어 틀린 값이 나옵니다."
    >
      <Controls>
        <Slider label="x" min={-3} max={3} step={0.5} value={x} onChange={setX} format={(v) => fmt(v, 1)} />
        <Slider label="w" min={-3} max={3} step={0.5} value={w} onChange={setW} format={(v) => fmt(v, 1)} />
        <Btn on={sum} onClick={() => setSum(!sum)}>두 갈래 더하기</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="x가 p와 q에 모두 쓰이는 계산 그래프와 기울기">
        <Edge a="w" b="p" color={base} />
        <Edge a="x" b="p" color="var(--vb)" width={2.5} />
        <Edge a="x" b="q" color="var(--vc)" width={2.5} dash="6 3" />
        <Edge a="p" b="q" color={base} />
        <Edge a="q" b="E" color={base} />
        <Node id="x" title="x" val={fmt(x, 2)} />
        <Node id="w" title="w" val={fmt(w, 2)} />
        <Node id="p" title="p = w·x" val={fmt(p, 2)} />
        <Node id="q" title="q = p + x" val={fmt(q, 2)} />
        <Node id="E" title="E = q·q" val={fmt(q * q, 2)} />
        <text x={150} y={72} className={s.ts} style={{fill: 'var(--vb)'}}>p를 거치는 길</text>
        <text x={230} y={42} className={s.ts} style={{fill: 'var(--vc)'}}>q로 바로 가는 길</text>
        <g style={{fill: 'var(--vb)'}}>
          <text x={80} y={100} textAnchor="middle" className={s.t}>∂E/∂x = {sum ? `${fmt(viaP, 2)} + ${fmt(viaQ, 2)} = ${fmt(dx, 2)}` : fmt(dx, 2)}</text>
          <text x={80} y={206} textAnchor="middle" className={s.t}>∂E/∂w = {fmt(dwv, 2)}</text>
          <text x={270} y={206} textAnchor="middle" className={s.t}>∂E/∂p = {fmt(dp, 2)}</text>
          <text x={450} y={148} textAnchor="middle" className={s.t}>∂E/∂q = {fmt(dq, 2)}</text>
        </g>
      </svg>
      <Stats>
        <Stat label="p를 거친 갈래 ∂E/∂q × w" value={fmt(viaP, 2)} />
        <Stat label="q로 바로 간 갈래 ∂E/∂q × 1" value={fmt(viaQ, 2)} />
        <Stat label="x의 기울기" value={fmt(dx, 2)} tone={ok ? 'good' : 'bad'} />
        <Stat label="수치 미분" value={fmt(num, 2)} />
      </Stats>
      <Note>
        {ok
          ? `역전파 값과 수치 미분이 같습니다. 검산으로 E = (x(w+1))²이라서 ∂E/∂x = 2x(w+1)² = ${fmt(2 * x * (w + 1) * (w + 1), 2)}, ∂E/∂w = 2x²(w+1) = ${fmt(2 * x * x * (w + 1), 2)}입니다.`
          : `한 갈래만 세면 수치 미분 ${fmt(num, 2)}와 맞지 않습니다. 한 값이 여러 곳에 쓰이면 갈래마다의 변화율을 더해야 합니다.`}
      </Note>
    </Viz>
  );
}
