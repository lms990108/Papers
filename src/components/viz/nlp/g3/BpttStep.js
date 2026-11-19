import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const X = [1, 0, 1]; // 오늘, 날씨, 좋다의 첫 칸
const NAMES = ['오늘', '날씨', '좋다'];

function forward(w) {
  const h = [0];
  X.forEach((x, t) => h.push(Math.tanh(w * h[t] + x)));
  return h;
}

export default function BpttStep() {
  const [k, setK] = useState(0);
  const [w, setW] = useState(0.5);

  const h = forward(w);
  // 거슬러 가기: t = 3, 2, 1
  const back = [];
  let dh = 1;
  [3, 2, 1].forEach((t) => {
    const da = dh * (1 - h[t] * h[t]);
    back.push({t, dh, da, share: da * h[t - 1]});
    dh = da * w;
  });
  const shown = back.slice(0, k);
  const dw = shown.reduce((acc, b) => acc + b.share, 0);
  const eps = 1e-6;
  const num = (forward(w + eps)[3] - forward(w - eps)[3]) / (2 * eps);
  const dhAt = (t) => {
    const b = back.find((x) => x.t === t);
    return t === 3 || k >= 3 - t ? fmt(b.dh, 3) : '?';
  };
  const mult = (i) => {
    // i: 3->2 이면 back[0], 2->1 이면 back[1]
    const b = back[i];
    return `×${fmt(1 - h[b.t] * h[b.t], 3)} ×${fmt(w, 1)}`;
  };

  return (
    <Viz
      title="시간 펼침 역전파: 거슬러 가며 기울기 모으기"
      caption="상태의 첫 칸만 떼어 낸 스칼라 예입니다. 오차를 마지막 상태 h3으로 두고, 버튼을 눌러 한 칸씩 거슬러 가 보세요. 한 칸마다 tanh의 기울기와 w가 곱해지고, 같은 w가 쓰인 세 자리의 몫을 모두 더합니다."
    >
      <Controls>
        <Btn onClick={() => setK(Math.min(3, k + 1))}>한 칸 거슬러 가기</Btn>
        <Btn onClick={() => setK(Math.max(0, k - 1))}>한 칸 되돌리기</Btn>
        <Btn onClick={() => setK(3)}>끝까지</Btn>
        <Btn onClick={() => setK(0)}>처음으로</Btn>
        <Slider label="w" min={0.1} max={1.5} step={0.1} value={w} onChange={setW} format={(x) => fmt(x, 1)} />
      </Controls>

      <svg viewBox="0 0 680 170" className={s.svg} role="img" aria-label="h1, h2, h3 상태와 거슬러 가며 줄어드는 기울기">
        <defs>
          <marker id="bpttArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--vb)" />
          </marker>
        </defs>
        {[1, 2, 3].map((t) => {
          const cx = 105 + (t - 1) * 235;
          const on = t === 3 || k >= 3 - t;
          return (
            <g key={t}>
              <rect x={cx - 70} y={20} width={140} height={62} rx={8} fill="none" stroke={t === 3 ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={t === 3 ? 3 : 1.5} />
              <text x={cx} y={42} textAnchor="middle" className={s.t}>{`h${t} = ${fmt(h[t], 3)}`}</text>
              <text x={cx} y={58} textAnchor="middle" className={s.ts}>{NAMES[t - 1]}</text>
              <text x={cx} y={74} textAnchor="middle" className={s.t} style={{fill: on ? 'var(--vb)' : 'var(--ifm-color-emphasis-600)'}}>기울기 {dhAt(t)}</text>
            </g>
          );
        })}
        {[0, 1].map((i) => (
          <g key={i} opacity={k > i ? 1 : 0.25}>
            <line x1={105 + (2 - i) * 235 - 74} y1={110} x2={105 + (1 - i) * 235 + 74} y2={110} stroke="var(--vb)" strokeWidth="2" markerEnd="url(#bpttArrow)" />
            <text x={105 + (1.5 - i) * 235} y={132} textAnchor="middle" className={s.ts} style={{fill: 'var(--vb)'}}>{mult(i)}</text>
          </g>
        ))}
      </svg>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>자리 t</th>
            <th>dL/dh_t</th>
            <th>dL/da_t = dL/dh_t × (1 − h_t²)</th>
            <th>w의 몫 = dL/da_t × h_(t−1)</th>
          </tr>
        </thead>
        <tbody>
          {back.map((b, i) => (
            <tr key={b.t}>
              <td className={i === k - 1 ? s.cellOn : undefined}>{b.t} ({NAMES[b.t - 1]})</td>
              <td className={i === k - 1 ? s.cellOn : undefined}>{i < k ? fmt(b.dh, 4) : '—'}</td>
              <td className={i === k - 1 ? s.cellOn : undefined}>{i < k ? fmt(b.da, 4) : '—'}</td>
              <td className={i === k - 1 ? s.cellOn : undefined}>{i < k ? fmt(b.share, 4) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="모은 dL/dw" value={k > 0 ? fmt(dw, 4) : '—'} />
        <Stat label="수치 미분" value={fmt(num, 4)} />
        <Stat label="일치" value={k === 3 ? (Math.abs(dw - num) < 1e-4 ? '일치' : '불일치') : '끝까지 가면 확인'} tone={k === 3 ? 'good' : undefined} />
      </Stats>
      <Note>
        마지막 상태에서 첫 상태까지 오는 동안 기울기가 1에서 {fmt(back[2].dh, 3)}로 줄었습니다. 첫 자리의 w 몫은 h0 = 0이라 0입니다. w를 바꿔도 끝까지 거슬러 가면 수치 미분과 같은 값이 나옵니다.
      </Note>
    </Viz>
  );
}
