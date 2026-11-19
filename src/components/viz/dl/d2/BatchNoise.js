import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, T4} from './lib';

const W = 540;
const H = 210;

// 4개 중 m개를 고르는 모든 방법 (뽑는 순서는 상관없음)
const combos = (m) => {
  const out = [];
  const rec = (start, cur) => {
    if (cur.length === m) {
      out.push(cur.slice());
      return;
    }
    for (let i = start; i < T4.length; i++) {
      cur.push(i);
      rec(i + 1, cur);
      cur.pop();
    }
  };
  rec(0, []);
  return out;
};

export default function BatchNoise() {
  const [m, setM] = useState(1);
  const [w, setW] = useState(0);
  const [draws, setDraws] = useState([]);

  const grads = combos(m).map((c) => c.reduce((a, i) => a + 2 * (w - T4[i]), 0) / m);
  const total = grads.length;
  const bins = [];
  grads.forEach((g) => {
    const key = fmt(g, 4);
    const hit = bins.find((b) => b.key === key);
    if (hit) hit.n += 1;
    else bins.push({key, g, n: 1});
  });
  bins.sort((a, b) => a.g - b.g);
  const mean = grads.reduce((a, b) => a + b, 0) / total;
  const sd = Math.sqrt(grads.reduce((a, g) => a + (g - mean) * (g - mean), 0) / total);
  const full = T4.reduce((a, t) => a + 2 * (w - t), 0) / T4.length;
  const lo = Math.min(full, ...grads, -8) - 1;
  const hi = Math.max(full, ...grads, 2) + 1;
  const px = lin(lo, hi, 40, W - 20);
  const py = lin(0, 1, H - 40, 20);

  const draw = () => {
    const idx = [0, 1, 2, 3];
    const pick = [];
    while (pick.length < m) pick.push(idx.splice(Math.floor(Math.random() * idx.length), 1)[0]);
    const g = pick.reduce((a, i) => a + 2 * (w - T4[i]), 0) / m;
    setDraws(draws.concat([g]).slice(-30));
  };
  const dmean = draws.length ? draws.reduce((a, b) => a + b, 0) / draws.length : null;

  return (
    <Viz
      title="미니배치 크기와 기울기의 흔들림"
      caption="정답이 3, 3, 1, 3인 네 쌍에서 m개를 뽑을 때 나올 수 있는 기울기를 모두 세어 그렸습니다(w = 0이면 표본별 기울기는 −6, −6, −2, −6). 막대 높이는 그 기울기가 나올 비율이고, 점선이 전체 평균 기울기입니다."
    >
      <Controls>
        {[1, 2, 3, 4].map((v) => (
          <Btn key={v} on={m === v} onClick={() => { setM(v); setDraws([]); }}>
            {v === 1 ? '표본 하나' : v === 4 ? '전체 4개 (배치)' : `미니배치 ${v}`}
          </Btn>
        ))}
        <Slider label="현재 w" min={0} max={3} step={0.5} value={w} onChange={(v) => { setW(v); setDraws([]); }} format={(v) => fmt(v, 1)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="미니배치 크기별 기울기 분포">
        <line x1={40} y1={H - 40} x2={W - 20} y2={H - 40} stroke="var(--ifm-color-emphasis-400)" />
        {Array.from({length: Math.floor(hi) - Math.ceil(lo) + 1}, (_, i) => Math.ceil(lo) + i)
          .filter((v) => v % 2 === 0)
          .map((v) => (
            <text key={v} x={px(v)} y={H - 24} textAnchor="middle" className={s.ts}>{v}</text>
          ))}
        <text x={W - 20} y={H - 6} textAnchor="end" className={s.ts}>기울기 값</text>
        {bins.map((b) => (
          <g key={b.key}>
            <rect x={px(b.g) - 14} y={py(b.n / total)} width={28} height={H - 40 - py(b.n / total)} fill="var(--vb)" fillOpacity="0.8" />
            <text x={px(b.g)} y={py(b.n / total) - 5} textAnchor="middle" className={s.ts}>{fmt((b.n / total) * 100, 0)}%</text>
          </g>
        ))}
        <line x1={px(full)} y1={14} x2={px(full)} y2={H - 40} stroke="var(--va)" strokeWidth="2" strokeDasharray="5 3" />
        <text x={px(full) + 5} y={16} className={s.ts} style={{fill: 'var(--va)'}}>전체 평균 {fmt(full, 2)}</text>
        {draws.map((g, i) => (
          <circle key={i} cx={px(g) + ((i % 5) - 2) * 3} cy={H - 40 - 6 - (i % 6) * 3} r={2.2} fill="var(--vc)" />
        ))}
      </svg>
      <Controls>
        <Btn onClick={draw}>무작위로 하나 뽑기</Btn>
        <Btn onClick={() => setDraws([])}>뽑은 기록 지우기</Btn>
        <span className={s.ts}>보라 점: 뽑은 기울기 ({draws.length}번)</span>
      </Controls>
      <Stats>
        <Stat label="가능한 기울기 평균" value={fmt(mean, 3)} tone={Math.abs(mean - full) < 1e-9 ? 'good' : 'bad'} />
        <Stat label="흔들림 (표준편차)" value={fmt(sd, 3)} />
        <Stat label="가장 작은 값 ~ 가장 큰 값" value={`${fmt(Math.min(...grads), 2)} ~ ${fmt(Math.max(...grads), 2)}`} />
        <Stat label="뽑은 기울기의 평균" value={dmean == null ? '—' : fmt(dmean, 3)} />
      </Stats>
      <Note>
        {m === 4
          ? '네 개를 모두 쓰면 가능한 기울기가 하나뿐이라 흔들리지 않습니다.'
          : '표본 수가 적을수록 값이 퍼지지만, 모든 경우를 평균하면 언제나 전체 평균 기울기와 같습니다. 이것이 표본을 치우침 없이 뽑으면 방향만 흔들린다는 뜻입니다.'}
      </Note>
    </Viz>
  );
}
