import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {mulberry32} from '../../annSim';

const NS = [2, 5, 10, 20, 50, 100, 1000, 10000];
const PRESETS = [[0.5, 2], [0.5, 10], [0.01, 100], [0.01, 10000], [0.05, 10000]];
const DRAWS = 30;
const W = 480;
const H = 190;
const L = 20;
const R = 20;
const pct = (v) => fmt(v * 100, 2) + '%';

export default function TestErrorNoise() {
  const [p, setP] = useState(0.5);
  const [ni, setNi] = useState(0);
  const [seed, setSeed] = useState(7);
  const n = NS[ni];

  const se = Math.sqrt((p * (1 - p)) / n);
  const draws = useMemo(() => {
    const r = mulberry32(seed);
    const out = [];
    for (let d = 0; d < DRAWS; d += 1) {
      let wrong = 0;
      for (let i = 0; i < n; i += 1) if (r() < p) wrong += 1;
      out.push(wrong / n);
    }
    return out;
  }, [p, n, seed]);

  const half = Math.max(4 * se, 1e-3);
  const lo = Math.max(0, p - half);
  const hi = Math.min(1, p + half);
  const X = (v) => L + ((v - lo) / (hi - lo)) * (W - L - R);
  const mean = draws.reduce((a, v) => a + v, 0) / DRAWS;
  const sd = Math.sqrt(draws.reduce((a, v) => a + (v - mean) ** 2, 0) / DRAWS);
  const seen = {};
  const dots = draws.map((v) => {
    const key = Math.round(v * 1e6);
    seen[key] = (seen[key] || 0) + 1;
    return {v, row: seen[key] - 1};
  });

  return (
    <Viz
      title="시험이 작으면 오류 숫자가 흔들립니다"
      caption="진짜 오류 p와 시험 개수 n을 고르고, 새 시험 집합을 30번 뽑아 보세요. 점 하나가 시험 집합 하나에서 잰 오류입니다. 표준오차는 sqrt(p(1-p)/n)입니다. 뽑기는 고정 난수열이라 같은 설정이면 같은 점이 나옵니다."
    >
      <Controls>
        <Slider label="진짜 오류 p" min={0.005} max={0.5} step={0.005} value={p} onChange={setP} format={(v) => fmt(v, 3)} />
        <Slider label="시험 개수 n" min={0} max={NS.length - 1} step={1} value={ni} onChange={setNi} format={() => String(n)} />
        <Btn onClick={() => setSeed(seed + 1)}>새 시험 집합 30개 뽑기</Btn>
      </Controls>
      <Controls>
        {PRESETS.map((q) => (
          <Btn key={q.join()} on={p === q[0] && n === q[1]} onClick={() => {setP(q[0]); setNi(NS.indexOf(q[1]));}}>
            p {q[0]}, n {q[1]}
          </Btn>
        ))}
      </Controls>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="시험 집합을 새로 뽑을 때 잰 오류의 분포">
        <rect x={X(Math.max(lo, p - se))} y={10} width={Math.max(2, X(Math.min(hi, p + se)) - X(Math.max(lo, p - se)))} height={H - 56} fill="var(--va)" fillOpacity="0.12" />
        <line x1={X(p)} y1={10} x2={X(p)} y2={H - 46} stroke="var(--va)" strokeDasharray="4 3" />
        <line x1={L} y1={H - 46} x2={W - R} y2={H - 46} stroke="var(--ifm-color-emphasis-400)" />
        {dots.map((d, i) => (
          <circle key={i} cx={X(d.v) + Math.floor(d.row / 12) * 9} cy={H - 54 - (d.row % 12) * 11} r={4.5} fill="var(--vb)" fillOpacity="0.85" />
        ))}
        <text x={L} y={H - 26} className={s.ts}>{pct(lo)}</text>
        <text x={W - R} y={H - 26} textAnchor="end" className={s.ts}>{pct(hi)}</text>
        <text x={X(p)} y={H - 26} textAnchor="middle" className={s.ts}>진짜 {pct(p)}</text>
        <text x={W / 2} y={H - 6} textAnchor="middle" className={s.ts}>시험 집합에서 잰 오류 (파랑 띠 = 표준오차 한 칸)</text>
      </svg>
      <Stats>
        <Stat label="표준오차" value={fmt(se, 4)} tone={se > 0.1 ? 'bad' : se < 0.003 ? 'good' : undefined} />
        <Stat label="뽑은 30개가 흔들린 폭 (표준편차)" value={fmt(sd, 4)} />
        <Stat label="가장 낮은 값 ~ 높은 값" value={pct(Math.min.apply(null, draws)) + ' ~ ' + pct(Math.max.apply(null, draws))} />
      </Stats>
      <Note>
        n = 2, p = 0.5이면 표준오차가 0.3536이고 점은 0, 0.5, 1에만 놓입니다. n = 100, p = 0.01에서는 0.0099라서 오류 1%만큼 흔들리고, n = 10000이면 0.0010입니다. 시험 수가 100배가 되면 표준오차는 10분의 1이 됩니다.
      </Note>
    </Viz>
  );
}
