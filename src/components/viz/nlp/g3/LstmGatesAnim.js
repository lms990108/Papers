import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

// 장단기 메모리의 통로 c가 네 자리를 지나는 과정을 한 단계씩 자동 재생한다.
// 한 자리는 네 단계: 1) 잊는 문 f x 이전 c  2) 넣는 문 i x g  3) 더해서 새 c  4) 내보내는 문 h = o x tanh(c)
// 값은 본문 표(lstm.md)와 같다. 모든 숫자는 아래 STEPS에서 계산한다.

const num = (x) => {
  const v = +x.toFixed(3);
  return String(Object.is(v, -0) ? 0 : v);
};
const paren = (x) => (x < 0 ? `(${num(x)})` : num(x));

// [f, i, g, o] 네 자리의 문 값
const GATES = [
  [0, 1, 1, 0],
  [1, 0, 0.8, 0],
  [1, 0, -0.6, 0],
  [1, 0, 0.4, 1],
];

function compute() {
  let c = 0;
  return GATES.map(([f, i, g, o]) => {
    const prev = c;
    const fc = f * prev;
    const ig = i * g;
    c = fc + ig;
    const th = Math.tanh(c);
    const h = o * th;
    return {f, i, g, o, prev, fc, ig, c, th, h};
  });
}

const STEPS = compute();
const NAMES = ['잊는 문', '넣는 문', '더하기', '내보내는 문'];

function caption(t, k) {
  const r = STEPS[t - 1];
  if (k === 1) {
    const tail = r.f === 0
      ? (r.prev === 0 ? ' f = 0이면 이전 값을 지웁니다. 지금은 이전 값이 0이라 달라지는 것은 없습니다.' : ' f = 0이라 이전 값이 지워집니다.')
      : ' f = 1이라 이전 값이 그대로 지나갑니다.';
    return `시점 ${t}, 잊는 문: 잊는 문 값은 f = ${num(r.f)}이고, 이전 통로 값은 c = ${num(r.prev)}입니다. 둘을 곱하면 ${num(r.f)} × ${num(r.prev)} = ${num(r.fc)}.${tail}`;
  }
  if (k === 2) {
    const tail = r.i === 1
      ? ' i = 1이라 문이 완전히 열려 새 내용이 통째로 들어옵니다.'
      : ' i = 0이라 g가 얼마든 하나도 들어오지 않습니다.';
    return `시점 ${t}, 넣는 문: 넣는 문 값은 i = ${num(r.i)}이고, 새 내용은 g = ${num(r.g)}입니다. 둘을 곱하면 ${num(r.i)} × ${paren(r.g)} = ${num(r.ig)}.${tail}`;
  }
  if (k === 3) {
    const tail = t === 1 ? ' 통로에 1이 저장되었습니다.' : ` 통로 값이 ${num(r.c)} 그대로입니다. 이전 값이 곱셈 한 번(×${num(r.f)})만 거쳐 넘어왔습니다.`;
    return `시점 ${t}, 더하기: 새 c = ${num(r.fc)} + ${num(r.ig)} = ${num(r.c)}.${tail}`;
  }
  const tail = r.o === 0
    ? ` o = 0이라 통로에 ${num(r.c)}이 들어 있어도 밖으로 나가지 않습니다.`
    : ` o = 1이라 문이 열려 h = ${num(r.h)}가 나갑니다. 첫 자리에서 저장한 값이 두 자리를 건너 나온 것입니다.`;
  return `시점 ${t}, 내보내는 문: h = ${num(r.o)} × tanh(${num(r.c)}) = ${num(r.o)} × ${num(r.th)} = ${num(r.h)}.${tail}`;
}

// phases: 0은 시작, 1..16은 (시점-1)*4 + 단계
const PHASES = [{t: 0, k: 0, cap: '시작: 통로 c₀ = 0입니다. 아직 저장된 것이 없습니다. 재생을 누르면 첫 자리부터 한 단계씩 진행합니다.'}];
for (let t = 1; t <= 4; t += 1) {
  for (let k = 1; k <= 4; k += 1) PHASES.push({t, k, cap: caption(t, k)});
}

const W = 448;
const B0 = 32;
const COL = 96;
const HY = 62;
const bnd = (t) => B0 + COL * t;
const SUB = ['₀', '₁', '₂', '₃', '₄'];

function Chip({x, y, w, h, color, on, active, lines, bold, still}) {
  return (
    <g style={{opacity: on ? 1 : 0, transition: still ? 'none' : 'opacity 500ms ease'}}>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={6}
        fill={`color-mix(in srgb, ${color} ${active ? 32 : 16}%, var(--ifm-background-surface-color))`}
        stroke={color}
        strokeWidth={active ? 3 : 1.5}
      />
      {lines.map((ln, j) => (
        <text
          key={j}
          x={x}
          y={y + (lines.length === 1 ? 4 : j === 0 ? -3 : 11)}
          textAnchor="middle"
          className={s.t}
          style={{fontSize: 11, fontWeight: bold ? 700 : 400}}
        >
          {ln}
        </text>
      ))}
    </g>
  );
}

function Node({x, y, r, color, on, active, label, still}) {
  return (
    <g style={{opacity: on ? 1 : 0.35, transition: still ? 'none' : 'opacity 500ms ease'}}>
      <circle cx={x} cy={y} r={r} fill="var(--ifm-background-surface-color)" stroke={color} strokeWidth={active ? 3.5 : 2} />
      <text x={x} y={y + 5} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{label}</text>
    </g>
  );
}

export default function LstmGatesAnim() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);
  const last = PHASES.length - 1;

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
    const id = setInterval(() => setI((k) => (k >= last ? 0 : k + 1)), 2400);
    return () => clearInterval(id);
  }, [playing, last]);

  const p = Math.min(i, last);
  const ph = PHASES[p];
  const green = 'var(--vok)';
  const orange = 'var(--vb)';
  const blue = 'var(--va)';
  const purple = 'var(--vc)';
  const tr = still ? 'none' : undefined;

  // 통로 진행선이 닿은 x 위치
  let endX = B0;
  if (ph.t > 0) {
    const bp = bnd(ph.t - 1);
    endX = ph.k === 1 ? bp + 35 : ph.k === 2 ? bp + 61 : bnd(ph.t);
  }

  const reached = (t, k) => p >= (t - 1) * 4 + k;
  const isActive = (t, k) => p === (t - 1) * 4 + k;

  const status = ph.t === 0 ? '시작' : `시점 ${ph.t} · ${NAMES[ph.k - 1]}`;

  return (
    <Viz
      title="장단기 메모리: 통로 c가 네 자리를 지나는 과정"
      caption="값은 본문 표와 같습니다. 둘째~넷째 자리의 g(0.8, -0.6, 0.4)는 i = 0이면 g가 얼마든 결과가 같다는 것을 보이려고 고른 값입니다."
    >
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setI(0); }}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, p - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(last, p + 1)); }}>다음</Btn>
        <span className={s.ts}>{p + 1} / {PHASES.length} · {status}</span>
      </Controls>
      <div style={{fontSize: '0.85rem', margin: '4px 0'}}>
        <span style={{color: green, fontWeight: 700}}>초록 선</span>은 통로 c(고속도로), <span style={{color: orange, fontWeight: 700}}>주황</span>은 잊는 문 f, <span style={{color: blue, fontWeight: 700}}>파랑</span>은 넣는 문 i와 새 내용 g, <span style={{color: purple, fontWeight: 700}}>보라</span>는 내보내는 문 o와 출력 h입니다.
      </div>
      <svg
        viewBox={`0 0 ${W} 284`}
        className={s.svg}
        style={{maxWidth: 560, margin: '0 auto', display: 'block'}}
        role="img"
        aria-label="네 자리에 걸쳐 통로 c가 끊기지 않는 선으로 이어지고, 잊는 문은 곱하고 넣는 문은 더하며, 내보내는 문이 통로에서 갈라져 나온 값을 걸러 h를 만드는 과정"
      >
        {/* 통로 고속도로 */}
        <rect x={B0} y={HY - 3} width={bnd(4) - B0} height={6} rx={3} fill="var(--ifm-color-emphasis-300)" />
        <rect
          x={0}
          y={0}
          width={1}
          height={1}
          fill={green}
          style={{transform: `translate(${B0}px, ${HY - 3}px) scale(${Math.max(endX - B0, 0.001)}, 6)`, transition: still ? 'none' : 'transform 900ms ease'}}
        />
        {[1, 2, 3, 4].map((t) => {
          const r = STEPS[t - 1];
          const bp = bnd(t - 1);
          const bx = bnd(t);
          const xf = bp + 35;
          const xi = bp + 61;
          return (
            <g key={t}>
              <text x={bp + 46} y={16} textAnchor="middle" className={s.ts} style={{fontWeight: 700}}>시점 {t}</text>
              {/* 잊는 문 */}
              <line x1={xf} y1={93} x2={xf} y2={HY + 10} stroke={orange} strokeWidth={2} style={{opacity: reached(t, 1) ? 1 : 0.2, transition: tr || 'opacity 500ms ease'}} />
              <Node still={still} x={xf} y={HY} r={10} color={orange} on={reached(t, 1)} active={isActive(t, 1)} label="×" />
              <Chip still={still} x={xf} y={104} w={42} h={22} color={orange} on={reached(t, 1)} active={isActive(t, 1)} lines={[`f = ${num(r.f)}`]} />
              <text x={xf + 5} y={HY - 20} textAnchor="end" className={s.ts} style={{fontSize: 10.5, opacity: reached(t, 1) ? 1 : 0, transition: tr || 'opacity 500ms ease'}}>
                f×c={num(r.fc)}
              </text>
              {/* 넣는 문 */}
              <line x1={xi} y1={123} x2={xi} y2={HY + 10} stroke={blue} strokeWidth={2} style={{opacity: reached(t, 2) ? 1 : 0.2, transition: tr || 'opacity 500ms ease'}} />
              <Node still={still} x={xi} y={HY} r={10} color={blue} on={reached(t, 2)} active={isActive(t, 2)} label="+" />
              <Chip still={still} x={xi} y={140} w={42} h={34} color={blue} on={reached(t, 2)} active={isActive(t, 2)} lines={[`i = ${num(r.i)}`, `g = ${num(r.g)}`]} />
              <text x={xi - 5} y={HY - 20} textAnchor="start" className={s.ts} style={{fontSize: 10.5, opacity: reached(t, 2) ? 1 : 0, transition: tr || 'opacity 500ms ease'}}>
                i×g={num(r.ig)}
              </text>
              {/* 새 통로 값 */}
              <Chip still={still} x={bx} y={HY} w={46} h={22} color={green} on={reached(t, 3)} active={isActive(t, 3)} lines={[`c${SUB[t]} = ${num(r.c)}`]} bold />
              {/* 내보내는 길 */}
              <line x1={bx} y1={HY + 12} x2={bx} y2={250} stroke={purple} strokeWidth={2} strokeDasharray="5 4" style={{opacity: reached(t, 4) ? 1 : 0.25, transition: tr || 'opacity 500ms ease'}} />
              <g style={{opacity: reached(t, 4) ? 1 : 0.35, transition: tr || 'opacity 500ms ease'}}>
                <rect x={bx - 23} y={176} width={46} height={22} rx={6} fill="var(--ifm-background-surface-color)" stroke={purple} strokeWidth={isActive(t, 4) ? 3 : 1.5} />
                <text x={bx} y={191} textAnchor="middle" className={s.t} style={{fontSize: 11}}>tanh</text>
              </g>
              <Node still={still} x={bx} y={222} r={11} color={purple} on={reached(t, 4)} active={isActive(t, 4)} label="×" />
              <Chip still={still} x={bx - 40} y={222} w={42} h={22} color={purple} on={reached(t, 4)} active={isActive(t, 4)} lines={[`o = ${num(r.o)}`]} />
              <Chip still={still} x={bx} y={262} w={64} h={24} color={purple} on={reached(t, 4)} active={isActive(t, 4)} lines={[`h = ${num(r.h)}`]} bold />
            </g>
          );
        })}
        {/* 시작 값 */}
        <Chip still={still} x={B0} y={HY} w={46} h={22} color={green} on active={ph.t === 0} lines={[`c${SUB[0]} = 0`]} bold />
      </svg>
      <Note>{ph.cap}</Note>
    </Viz>
  );
}
