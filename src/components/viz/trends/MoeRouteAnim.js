import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../Viz';

// token 하나가 router를 지나 top-2 expert만 켜고, 고른 expert의 출력을 비율대로 섞는 과정을 자동으로 재생한다.
// expert 4개, top-2. 점수와 expert 출력은 설명용으로 고른 값이다(본문 "계산" 절의 예와 같다).

const N = 4;
const K = 2;
const P_LABEL = 'P';
const OUT = [[1, 0], [0, 2], [1, 1], [2, 0]]; // expert 1~4의 출력(설명용)
const TOKENS = [
  {id: 'A', name: 'token A', note: '본문 예', scores: [2.0, 1.0, 0.5, -1.0]},
  {id: 'B', name: 'token B', note: '다른 token', scores: [0.5, -1.0, 2.0, 1.5]},
];

const trim = (e) => String(+e.toFixed(3));
const vec = (v) => '[' + v.map(trim).join(', ') + ']';
const sc = (e) => e.toFixed(1);

function compute(scores) {
  const order = scores.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  const top = order.slice(0, K).map((o) => o[1]).sort((a, b) => a - b);
  const ex = top.map((i) => Math.exp(scores[i]));
  const sum = ex.reduce((a, b) => a + b, 0);
  const w = ex.map((e) => e / sum);
  const out = [0, 1].map((d) => top.reduce((acc, i, j) => acc + w[j] * OUT[i][d], 0));
  return {top, w, out};
}

function captions(tok, r) {
  const [a, b] = r.top;
  const dropped = [0, 1, 2, 3].filter((i) => !r.top.includes(i)).map((i) => `${i + 1}번`).join('과 ');
  const terms = r.top.map((i, j) => `${trim(r.w[j])} × ${vec(OUT[i])}`).join(' + ');
  return [
    `${tok.name} 하나가 이 층의 FFN 자리에 도착합니다. 여기에는 expert가 ${N}개 있고, expert 하나의 FFN 파라미터를 ${P_LABEL}라고 하면 FFN 파라미터 전체는 ${N}${P_LABEL}입니다. 먼저 router를 거칩니다.`,
    `router가 expert마다 점수를 하나씩 냅니다. 이 token의 점수는 [${tok.scores.map(sc).join(', ')}]입니다.`,
    `점수가 높은 ${K}개(top-${K})를 고릅니다. ${a + 1}번(${sc(tok.scores[a])})과 ${b + 1}번(${sc(tok.scores[b])})이 뽑히고, ${dropped}은 이 token에서 쓰지 않습니다. 쓰는 FFN 파라미터는 ${N}${P_LABEL} 중 ${K}${P_LABEL}입니다.`,
    `고른 두 점수만 softmax에 넣어 합이 1인 비율로 바꿉니다. softmax(${sc(tok.scores[a])}, ${sc(tok.scores[b])}) = (${trim(r.w[0])}, ${trim(r.w[1])}). 이것이 두 expert의 출력을 섞을 비중입니다.`,
    `뽑힌 ${a + 1}번과 ${b + 1}번 expert만 이 token을 계산합니다. 출력은 ${a + 1}번이 ${vec(OUT[a])}, ${b + 1}번이 ${vec(OUT[b])}입니다(설명용 값). ${dropped}은 계산 자체를 하지 않습니다.`,
    `출력을 비율대로 더합니다(가중합). ${terms} = ${vec(r.out)}. 이것이 이 층에서 ${tok.name}의 FFN 출력입니다.`,
  ];
}

const W = 420;
const H = 396;
const CX = [52, 152, 252, 352];
const MID = 210;
const BUS = 112;
const EY = 190;
const EH = 56;
const STEP_MS = 3400;

export default function MoeRouteAnim() {
  const [tokIdx, setTokIdx] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

  const tok = TOKENS[tokIdx];
  const r = compute(tok.scores);
  const caps = captions(tok, r);
  const last = caps.length - 1;

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

  const p = Math.min(i, last);
  const tr = (extra) => (still ? 'none' : extra);
  const fade = (on, lo = 0) => ({opacity: on ? 1 : lo, transition: tr('opacity 500ms ease')});
  const blue = 'var(--va)';
  const surface = 'var(--ifm-background-surface-color)';
  const weightOf = (e) => r.w[r.top.indexOf(e)];

  const choose = (k) => {
    setTokIdx(k);
    setI(0);
  };

  return (
    <Viz
      title="token 하나가 router를 거쳐 expert 2개만 켜는 과정"
      caption="expert 4개, top-2인 작은 예입니다. 점수와 expert 출력은 본문 계산 절의 값(설명용)이고, token B는 같은 expert를 다른 token이 어떻게 다르게 고르는지 보여 주려는 예입니다."
    >
      <Controls>
        <span className={s.ts}>token</span>
        {TOKENS.map((t, k) => (
          <Btn key={t.id} on={tokIdx === k} onClick={() => choose(k)}>{t.name} ({t.note})</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setI(0); }}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, p - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(last, p + 1)); }}>다음</Btn>
        <span className={s.ts}>{p + 1} / {caps.length}</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 500}} role="img" aria-label="token이 router에서 expert 4개의 점수를 받고, 점수가 높은 2개만 골라 계산한 뒤 비율대로 더하는 과정">
        {/* token */}
        <rect x={MID - 70} y={8} width={140} height={34} rx={8} fill={`color-mix(in srgb, var(--vb) 20%, ${surface})`} stroke="var(--vb)" strokeWidth={2} />
        <text x={MID} y={30} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{tok.name}의 벡터</text>
        <line x1={MID} y1={42} x2={MID} y2={64} stroke="var(--ifm-color-emphasis-500)" strokeWidth={2} />

        {/* router */}
        <rect x={MID - 80} y={66} width={160} height={34} rx={8} fill={`color-mix(in srgb, var(--vc) 18%, ${surface})`} stroke="var(--vc)" strokeWidth={2} />
        <text x={MID} y={88} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>router</text>

        {/* router -> expert 연결 */}
        {CX.map((x, e) => {
          const sel = r.top.includes(e);
          const picked = p >= 2 && sel;
          const dim = p >= 2 && !sel;
          return (
            <polyline
              key={`ln${e}`}
              points={`${MID},100 ${MID},${BUS} ${x},${BUS} ${x},${EY}`}
              fill="none"
              stroke={picked ? blue : 'var(--ifm-color-emphasis-500)'}
              strokeWidth={picked ? 3 : 1.5}
              style={{opacity: p >= 1 ? (dim ? 0.25 : 1) : 0, transition: tr('opacity 500ms ease')}}
            />
          );
        })}

        {/* 점수와 비율 배지 */}
        {CX.map((x, e) => {
          const sel = r.top.includes(e);
          const dim = p >= 2 && !sel;
          return (
            <g key={`sc${e}`} style={{opacity: p >= 1 ? (dim ? 0.35 : 1) : 0, transition: tr('opacity 500ms ease')}}>
              <rect x={x - 34} y={122} width={68} height={22} rx={6} fill={surface} stroke="var(--ifm-color-emphasis-400)" />
              <text x={x} y={137} textAnchor="middle" className={s.ts}>점수 <tspan className={s.t} style={{fontWeight: 700}}>{sc(tok.scores[e])}</tspan></text>
            </g>
          );
        })}
        {CX.map((x, e) => {
          if (!r.top.includes(e)) return null;
          return (
            <g key={`rt${e}`} style={fade(p >= 3)}>
              <rect x={x - 34} y={152} width={68} height={22} rx={6} fill={`color-mix(in srgb, ${blue} 18%, ${surface})`} stroke={blue} strokeWidth={1.5} />
              <text x={x} y={167} textAnchor="middle" className={s.ts}>비율 <tspan className={s.t} style={{fontWeight: 700}}>{trim(weightOf(e))}</tspan></text>
            </g>
          );
        })}

        {/* expert */}
        {CX.map((x, e) => {
          const sel = r.top.includes(e);
          const picked = p >= 2 && sel;
          const dim = p >= 2 && !sel;
          const calc = p >= 4 && sel;
          return (
            <g key={`ex${e}`} style={{opacity: dim ? 0.4 : 1, transition: tr('opacity 500ms ease')}}>
              <rect
                x={x - 43}
                y={EY}
                width={86}
                height={EH}
                rx={8}
                style={{
                  fill: calc ? `color-mix(in srgb, ${blue} 35%, ${surface})` : picked ? `color-mix(in srgb, ${blue} 15%, ${surface})` : 'none',
                  stroke: picked ? blue : 'var(--ifm-color-emphasis-500)',
                  strokeWidth: picked ? 3 : 1.5,
                  strokeDasharray: picked ? 'none' : '4 3',
                  transition: tr('fill 500ms ease, stroke 500ms ease'),
                }}
              />
              <text x={x} y={EY + 22} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>expert {e + 1}</text>
              <text x={x} y={EY + 41} textAnchor="middle" className={s.ts}>FFN 파라미터 {P_LABEL}</text>
              <text x={x} y={EY + EH + 20} textAnchor="middle" className={s.ts} style={{fill: picked ? blue : 'var(--ifm-color-emphasis-700)', fontWeight: picked ? 700 : 400}}>
                {p >= 4 ? (sel ? `출력 ${vec(OUT[e])}` : '계산 안 함') : p >= 2 ? (sel ? '선택' : '탈락') : ' '}
              </text>
            </g>
          );
        })}

        {/* 가중합 */}
        {CX.map((x, e) => {
          if (!r.top.includes(e)) return null;
          return (
            <g key={`sm${e}`} style={fade(p >= 5)}>
              <polyline points={`${x},${EY + EH + 28} ${x},300 ${MID},300 ${MID},310`} fill="none" stroke={blue} strokeWidth={2} />
              <text x={x} y={293} textAnchor="middle" className={s.ts} style={{fontWeight: 700}}>× {trim(weightOf(e))}</text>
            </g>
          );
        })}
        <g style={fade(p >= 5)}>
          <circle cx={MID} cy={321} r={11} fill={surface} stroke={blue} strokeWidth={2} />
          <text x={MID} y={326} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>+</text>
          <line x1={MID} y1={332} x2={MID} y2={346} stroke={blue} strokeWidth={2} />
          <rect x={MID - 85} y={348} width={170} height={36} rx={8} fill={`color-mix(in srgb, var(--vok) 18%, ${surface})`} stroke="var(--vok)" strokeWidth={2} />
          <text x={MID} y={362} textAnchor="middle" className={s.ts}>FFN 출력</text>
          <text x={MID} y={377} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{vec(r.out)}</text>
        </g>
      </svg>
      <Stats>
        <Stat label="FFN 파라미터 전체" value={`${N}${P_LABEL}`} />
        <Stat label="이 token이 쓰는 파라미터" value={p >= 2 ? `${K}${P_LABEL} (${(K / N) * 100}%)` : '아직 정해지지 않음'} tone={p >= 2 ? 'good' : undefined} />
      </Stats>
      <Note>{caps[p]}{p === last ? ' expert가 8개이고 top-2이면 같은 계산이 2P / 8P = 25%가 됩니다.' : ''}</Note>
    </Viz>
  );
}
