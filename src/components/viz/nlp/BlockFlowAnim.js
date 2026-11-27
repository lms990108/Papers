import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../Viz';

// 벡터 한 개가 블록을 지나며 바뀌는 과정을 자동으로 재생한다.
// 주황 길: 원래 값이 그대로 내려가는 길(잔차). 파랑 길: 복사본이 단계를 거쳐 수정분을 만드는 길.

const rms = (v) => Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length);
const rmsNorm = (v) => v.map((e) => e / rms(v));
const layerNorm = (v) => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
  return v.map((e) => (e - m) / sd);
};
const add = (a, b) => a.map((e, i) => e + b[i]);
const num = (e) => String(+e.toFixed(3));
const vec = (v) => '[' + v.map(num).join(', ') + ']';

const X = [1, 0];

function config(variant) {
  if (variant === 'post') {
    const A = [0.67, 0.33];
    const F = [0, 3];
    const z1 = add(X, A);
    const l1 = layerNorm(z1);
    const z2 = add(l1, F);
    const l2 = layerNorm(z2);
    return {
      title: '트랜스포머 블록 한 개가 벡터를 바꾸는 과정',
      start: {label: '입력 x', vec: X, cap: `"오늘" token의 입력 벡터 x = ${vec(X)}입니다.`},
      segs: [
        {
          fork: '벡터가 두 갈래로 나뉩니다. 주황 길은 원래 값을 그대로 들고 내려가고, 파랑 길의 복사본이 어텐션을 지납니다.',
          stations: [{name: '어텐션', label: '어텐션 결과', vec: A, cap: `어텐션이 다른 token의 정보를 섞어 낸 결과: ${vec(A)}. 원래 벡터에 보탤 수정분입니다.`}],
          plus: {label: '더한 값', vec: z1, cap: `더하기: 원래 값 ${vec(X)}에 수정분을 더해 ${vec(z1)}이 됩니다.`},
          after: {name: '층 정규화', label: '정규화한 값', vec: l1, cap: `층 정규화: 평균 1을 빼고 표준편차 0.67로 나눠 ${vec(l1)}.`},
        },
        {
          fork: '다시 두 갈래로 나뉩니다. 이번에는 FFN 차례입니다.',
          stations: [{name: 'FFN', label: 'FFN 결과', vec: F, cap: `FFN이 이 token 벡터 하나를 혼자 가공한 결과(설명용으로 고른 값): ${vec(F)}.`}],
          plus: {label: '더한 값', vec: z2, cap: `더하기: 정규화한 ${vec(l1)}에 FFN 결과를 더해 ${vec(z2)}.`},
          after: {name: '층 정규화', label: '블록의 출력', vec: l2, cap: `층 정규화: 평균 1.5를 빼고 표준편차 0.5로 나눠 ${vec(l2)}. 이 벡터가 다음 블록의 입력이 됩니다.`},
        },
      ],
    };
  }
  const A = [0.2, 0.1];
  const F = [0.3, -0.1];
  const n1 = rmsNorm(X);
  const h = add(X, A);
  const n2 = rmsNorm(h);
  const y = add(h, F);
  return {
    title: 'decoder block 한 층이 벡터를 바꾸는 과정',
    start: {label: '입력 x', vec: X, cap: `입력 벡터 x = ${vec(X)}입니다.`},
    segs: [
      {
        fork: '벡터가 두 갈래로 나뉩니다. 주황 길은 원래 값을 그대로 들고 내려가고, 파랑 길의 복사본이 단계를 지납니다.',
        stations: [
          {name: '정규화', label: '정규화한 값', vec: n1, cap: `복사본을 먼저 정규화합니다. 어텐션에 넣을 값: ${vec(n1)}.`},
          {name: '어텐션', label: '어텐션 결과', vec: A, cap: `어텐션 결과(설명용으로 고른 값): ${vec(A)}. 원래 벡터에 보탤 수정분입니다.`},
        ],
        plus: {label: '더한 값 h', vec: h, cap: `더하기: 정규화하지 않은 원래 값 ${vec(X)}에 수정분을 더해 ${vec(h)}.`},
      },
      {
        fork: '다시 두 갈래로 나뉩니다. 이번에는 FFN 차례입니다.',
        stations: [
          {name: '정규화', label: '정규화한 값', vec: n2, cap: `정규화: FFN에 넣을 값 ${vec(n2)}.`},
          {name: 'FFN', label: 'FFN 결과', vec: F, cap: `FFN 결과(설명용으로 고른 값): ${vec(F)}.`},
        ],
        plus: {label: '블록의 출력 y', vec: y, cap: `더하기: 정규화하지 않은 ${vec(h)}에 FFN 결과를 더해 ${vec(y)}. 이 벡터가 다음 층의 입력이 됩니다.`},
      },
    ],
  };
}

const GAP = 58;
const RX = 70;
const LX = 272;
const PX = 176;
const Y0 = 36;
const W = 360;

function build(cfg) {
  const stations = [];
  const lanes = [];
  const phases = [];
  let y = Y0;
  let cur = cfg.start.vec;
  let label = cfg.start.label;
  phases.push({main: {x: RX, y, label, vec: cur}, side: null, cap: cfg.start.cap});
  cfg.segs.forEach((seg) => {
    const F = y;
    const n = seg.stations.length;
    const P = F + GAP * (n + 1);
    lanes.push({F, P});
    seg.stations.forEach((st, i) => stations.push({x: LX, y: F + GAP * (i + 1), name: st.name}));
    const mainAt = {x: RX, y: F, label, vec: cur};
    phases.push({main: mainAt, side: {x: LX, y: F, op: 1, label: '복사본', vec: cur}, cap: seg.fork});
    seg.stations.forEach((st, i) => {
      phases.push({main: mainAt, side: {x: LX, y: F + GAP * (i + 1), op: 1, label: st.label, vec: st.vec}, cap: st.cap});
    });
    cur = seg.plus.vec;
    label = seg.plus.label;
    y = P;
    const lastSide = seg.stations[n - 1];
    phases.push({main: {x: RX, y, label, vec: cur}, side: {x: PX, y: P, op: 0, label: lastSide.label, vec: lastSide.vec}, cap: seg.plus.cap});
    if (seg.after) {
      const A = P + GAP;
      stations.push({x: RX, y: A, name: seg.after.name, rail: true});
      cur = seg.after.vec;
      label = seg.after.label;
      y = A;
      phases.push({main: {x: RX, y, label, vec: cur}, side: {x: PX, y: P, op: 0, label: lastSide.label, vec: lastSide.vec}, cap: seg.after.cap});
    }
  });
  return {phases, stations, lanes, height: y + 44};
}

function Chip({p, color, still}) {
  return (
    <g style={{transform: `translate(${p.x}px, ${p.y}px)`, opacity: p.op === undefined ? 1 : p.op, transition: still ? 'none' : 'transform 1000ms ease, opacity 600ms ease'}}>
      <rect x={-62} y={-21} width={124} height={42} rx={8} fill={`color-mix(in srgb, ${color} 20%, var(--ifm-background-surface-color))`} stroke={color} strokeWidth={2} />
      <text y={-5} textAnchor="middle" className={s.ts}>{p.label}</text>
      <text y={13} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{vec(p.vec)}</text>
    </g>
  );
}

const STEP_MS = 2600;

export default function BlockFlowAnim({variant = 'pre'}) {
  const cfg = config(variant);
  const {phases, stations, lanes, height} = build(cfg);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);
  const last = phases.length - 1;

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      reduce = false;
    }
    setStill(reduce);
    setPlaying(!reduce);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setI((k) => (k >= last ? 0 : k + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing, last]);

  const ph = phases[Math.min(i, last)];
  const orange = 'var(--vb)';
  const blue = 'var(--va)';

  return (
    <Viz
      title={cfg.title}
      caption="같은 계산을 자동으로 되풀이해 보여 줍니다. 값은 본문 표와 같고, 어텐션과 FFN의 결과는 설명용으로 고른 값입니다."
    >
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setI(0); }}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(last, i + 1)); }}>다음</Btn>
        <span className={s.ts}>{i + 1} / {phases.length}</span>
      </Controls>
      <div style={{fontSize: '0.85rem', margin: '4px 0'}}>
        <span style={{color: orange, fontWeight: 700}}>주황 길</span>은 원래 값이 그대로 내려가는 길(잔차)이고, <span style={{color: blue, fontWeight: 700}}>파랑 길</span>은 복사본이 단계를 지나며 수정분을 만드는 길입니다.
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} className={s.svg} style={{maxWidth: 460, margin: '0 auto', display: 'block'}} role="img" aria-label="벡터가 갈라져 한쪽은 그대로 내려가고 다른 쪽은 단계를 지난 뒤 다시 더해지는 과정">
        <line x1={RX} y1={Y0} x2={RX} y2={height - 44} stroke={orange} strokeWidth={3} />
        {lanes.map((l, k) => (
          <g key={k}>
            <polyline points={`${RX + 62},${l.F} ${LX},${l.F} ${LX},${l.P} ${RX + 62},${l.P}`} fill="none" stroke={blue} strokeWidth={2} opacity={0.55} />
            <polygon points={`${RX + 62},${l.P} ${RX + 72},${l.P - 5} ${RX + 72},${l.P + 5}`} fill={blue} opacity={0.7} />
            <circle cx={PX} cy={l.P} r={11} fill="var(--ifm-background-surface-color)" stroke={blue} strokeWidth={2} />
            <text x={PX} y={l.P + 5} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>+</text>
          </g>
        ))}
        {stations.map((st, k) => (
          <g key={k} transform={`translate(${st.x}, ${st.y})`}>
            <rect x={-62} y={-21} width={124} height={42} rx={8} fill="none" stroke="var(--ifm-color-emphasis-400)" strokeDasharray="4 3" />
            <text y={5} textAnchor="middle" className={s.ts}>{st.name}</text>
          </g>
        ))}
        <Chip p={ph.main} color={orange} still={still} />
        <Chip p={ph.side || {x: PX, y: ph.main.y, op: 0, label: '', vec: []}} color={blue} still={still} />
      </svg>
      <Note>{ph.cap}</Note>
    </Viz>
  );
}
