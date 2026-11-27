import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

// 출력 쪽에서 입력 쪽으로 신호(기울기)가 층을 거슬러 가며 층마다 곱해지는 과정을 자동으로 재생한다.
// 일반 사슬: 층마다 0.25를 곱한다. 잔차 사슬: 층마다 1 + 0.25 = 1.25를 곱한다. 막대 길이는 로그 눈금이다.

const N = 10;
const F = 0.25;
const STEP_MS = 1300;

const MODES = {
  plain: {name: '일반 사슬', mult: F, label: '층마다 × 0.25', color: 'var(--va)'},
  res: {name: '잔차 사슬', mult: 1 + F, label: '층마다 × (1 + 0.25) = × 1.25', color: 'var(--vb)'},
};

const SUP = {'-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'};
const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');

function fmtV(v) {
  if (v >= 1) return String(+v.toPrecision(3));
  if (v >= 0.01) return String(+v.toPrecision(6));
  const [m, e] = v.toExponential(1).split('e');
  return `${m} × 10${sup(Number(e))}`;
}

// 로그 눈금: 10^-7 ~ 10^1 을 막대 길이 0 ~ CW 에 대응시킨다.
const W = 420;
const LX = 90;
const CW = 200;
const LO = -7;
const HI = 1;
const VX = LX + CW + 8;
const ROW = 24;
const TOP = 8;
const AXIS = TOP + (N + 1) * ROW + 4;
const H = AXIS + 38;
const xOf = (v) => LX + ((Math.log10(v) - LO) / (HI - LO)) * CW;
const TICKS = [
  {e: -6, t: `10${sup(-6)}`},
  {e: -4, t: `10${sup(-4)}`},
  {e: -2, t: `10${sup(-2)}`},
  {e: 0, t: '1'},
  {e: 1, t: '10'},
];

const series = (m) => Array.from({length: N + 1}, (_, k) => m ** k);

export default function GradFlowAnim() {
  const [mode, setMode] = useState('plain');
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

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
    const id = setInterval(() => setK((v) => (v >= N ? 0 : v + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing]);

  const m = MODES[mode];
  const vals = series(m.mult);
  const plain = series(MODES.plain.mult);
  const res = series(MODES.res.mult);
  const dim = still ? 'none' : 'transform 700ms ease, opacity 500ms ease';

  let note;
  if (k === 0) {
    note = `출력 쪽에서 시작합니다. 여기의 신호 크기를 1로 둡니다. 지금 고른 ${m.name}은 ${m.label}가 곱해집니다.`;
  } else {
    note = `${k}번째 층을 거슬러 지납니다. ${fmtV(vals[k - 1])} × ${m.mult} = ${fmtV(vals[k])}.`;
    if (mode === 'plain' && k === 3) {
      note += ' learning rate 0.1이면 이 자리의 가중치는 0.1 × 0.015625 = 0.0015625만큼만 움직입니다.';
    }
    if (k === N) {
      note += mode === 'plain'
        ? ' 열 층을 지나자 신호가 거의 0입니다. 입력 쪽 층은 학습 신호를 거의 받지 못합니다.'
        : ' 열 층을 지나도 신호가 줄지 않고 오히려 커졌습니다. 그래서 트랜스포머는 정규화 층을 함께 둡니다.';
    }
  }

  return (
    <Viz
      title="신호가 층을 거슬러 가며 줄어드는 과정"
      caption="맨 위 막대가 출력 쪽 신호(크기 1)이고, 아래로 갈수록 입력 쪽입니다. 막대 길이는 로그 눈금이라 한 칸 눈금이 10배입니다. 초록 점선이 처음 크기 1입니다. 막대가 점선보다 짧으면 신호가 줄어든 것이고, 길면 커진 것입니다."
    >
      <Controls>
        <span className={s.ts}>층 사이의 길</span>
        {Object.keys(MODES).map((key) => (
          <Btn key={key} on={mode === key} onClick={() => setMode(key)}>{MODES[key].name} ({MODES[key].label})</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setPlaying(false); setK(Math.max(0, k - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setK(Math.min(N, k + 1)); }}>다음</Btn>
        <Btn onClick={() => setK(0)}>처음으로</Btn>
        <span className={s.ts}>{k} / {N}</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 520}} role="img" aria-label="출력 쪽에서 입력 쪽으로 층을 거슬러 갈 때 신호 크기가 일반 사슬에서는 줄어들고 잔차 사슬에서는 줄지 않는 모습을 로그 눈금 막대로 보여 주는 그림">
        <line x1={LX} y1={TOP} x2={LX} y2={AXIS} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={LX} y1={AXIS} x2={LX + CW} y2={AXIS} stroke="var(--ifm-color-emphasis-500)" />
        {TICKS.map((t) => (
          <g key={t.e}>
            <line x1={xOf(10 ** t.e)} y1={AXIS} x2={xOf(10 ** t.e)} y2={AXIS + 4} stroke="var(--ifm-color-emphasis-500)" />
            <text x={xOf(10 ** t.e)} y={AXIS + 17} textAnchor="middle" className={s.ts}>{t.t}</text>
          </g>
        ))}
        <text x={LX + CW / 2} y={AXIS + 32} textAnchor="middle" className={s.ts}>신호 크기 (로그 눈금)</text>
        <line x1={xOf(1)} y1={TOP} x2={xOf(1)} y2={AXIS} stroke="var(--vok)" strokeDasharray="4 3" />
        {vals.map((v, i) => {
          const shown = i <= k;
          const cur = i === k;
          const y = TOP + i * ROW;
          return (
            <g key={i}>
              <text x={LX - 8} y={y + ROW / 2 + 4} textAnchor="end" className={s.ts} style={{fontWeight: cur ? 700 : 400}}>
                {i === 0 ? '출력 쪽' : i === N ? '10층 뒤 (입력 쪽)' : `${i}층 뒤`}
              </text>
              <rect
                x={LX}
                y={y + 4}
                width={Math.max(1, xOf(v) - LX)}
                height={ROW - 8}
                rx={3}
                fill={`color-mix(in srgb, ${m.color} ${cur ? 55 : 28}%, var(--ifm-background-surface-color))`}
                stroke={m.color}
                strokeWidth={cur ? 2 : 1}
                style={{transformBox: 'fill-box', transformOrigin: '0 50%', transform: `scaleX(${shown ? 1 : 0})`, opacity: shown ? 1 : 0, transition: dim}}
              />
              <text x={VX} y={y + ROW / 2 + 4} className={s.t} style={{fontWeight: cur ? 700 : 400, opacity: shown ? 1 : 0, transition: still ? 'none' : 'opacity 500ms ease'}}>
                {fmtV(v)}
              </text>
            </g>
          );
        })}
      </svg>
      <Stats>
        <Stat label="지난 층 수" value={`${k} / ${N}`} />
        <Stat label="일반 사슬 (0.25ᵏ)" value={fmtV(plain[k])} tone={k === 0 ? undefined : 'bad'} />
        <Stat label="잔차 사슬 (1.25ᵏ)" value={fmtV(res[k])} tone={k === 0 ? undefined : 'good'} />
      </Stats>
      <Note>{note}</Note>
    </Viz>
  );
}
