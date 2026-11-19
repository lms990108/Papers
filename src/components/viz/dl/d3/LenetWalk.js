import React, {useState} from 'react';
import {Viz, Controls, Btn, Bar, Stats, Stat, Note, styles as s} from '../../Viz';
import {num, trim} from './util';

// 본문 표의 값. 합성곱의 C3는 맵마다 보는 S2 맵 수가 다르다(3장 6개, 4장 9개, 6장 1개).
const C3P = [3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 6].reduce((a, t) => a + 25 * t + 1, 0);
const L = [
  {id: '입력', maps: 1, side: 32, units: 1024, p: 0, c: 0, job: '필기 숫자 32×32 (배경 −0.1, 전경 1.175)', side_f: '32', p_f: '학습하는 값 없음', c_f: '-', rf: '-'},
  {id: 'C1', maps: 6, side: 28, units: 4704, p: 156, c: 122304, job: '입력의 5×5', side_f: '32 − 5 + 1 = 28', p_f: '(25 + 1) · 6 = 156', c_f: '156 · 784 = 122,304', rf: '5×5'},
  {id: 'S2', maps: 6, side: 14, units: 1176, p: 12, c: 5880, job: '2×2 서브샘플링', side_f: '28 / 2 = 14', p_f: '2 · 6 = 12', c_f: '1,176 · 5 = 5,880', rf: '6×6'},
  {id: 'C3', maps: 16, side: 10, units: 1600, p: C3P, c: C3P * 100, job: 'S2 일부의 5×5', side_f: '14 − 5 + 1 = 10', p_f: '6·76 + 9·101 + 151 = 1,516', c_f: '1,516 · 100 = 151,600', rf: '14×14'},
  {id: 'S4', maps: 16, side: 5, units: 400, p: 32, c: 2000, job: '2×2 서브샘플링', side_f: '10 / 2 = 5', p_f: '2 · 16 = 32', c_f: '400 · 5 = 2,000', rf: '16×16'},
  {id: 'C5', maps: 120, side: 1, units: 120, p: 48120, c: 48120, job: 'S4 16장 전체의 5×5', side_f: '5 − 5 + 1 = 1', p_f: '120 · (16·25 + 1) = 48,120', c_f: '48,120 (맵이 1×1이라 파라미터와 같음)', rf: '32×32'},
  {id: 'F6', maps: 84, side: 1, units: 84, p: 10164, c: 10164, job: 'C5와 완전 연결', side_f: '1', p_f: '84 · (120 + 1) = 10,164', c_f: '10,164', rf: '-'},
  {id: '출력', maps: 10, side: 1, units: 10, p: 0, c: 840, job: '클래스마다 RBF', side_f: '1', p_f: '기준 벡터는 고정이라 0', c_f: '84 · 10 = 840', rf: '-'},
];
const METRICS = [
  ['units', '유닛 수'],
  ['p', '학습 파라미터'],
  ['c', '연결'],
];
const X = (i) => 14 + i * 78;

export default function LenetWalk() {
  const [sel, setSel] = useState(1);
  const [metric, setMetric] = useState('p');
  const cur = L[sel];
  const cumP = L.slice(0, sel + 1).reduce((a, l) => a + l.p, 0);
  const cumC = L.slice(0, sel + 1).reduce((a, l) => a + l.c, 0);
  const total = L.reduce((a, l) => a + l[metric], 0);
  const mx = Math.max(...L.map((l) => l[metric]));
  const sz = (l) => (l.side > 1 ? Math.max(6, Math.round(l.side * 2.3)) : 0);

  return (
    <Viz
      title="LeNet-5를 한 층씩 따라가기"
      caption="층을 눌러 보세요. 그림의 정사각형은 맵 한 장의 한 변에 비례합니다(겹친 장 수는 최대 4장까지만 그립니다). C5부터는 맵이 1×1이라 칸 수에 따라 높이를 줄여 그렸습니다. 아래 막대는 층마다의 유닛 수, 학습 파라미터, 연결 수입니다."
    >
      <Controls>
        {L.map((l, i) => (
          <Btn key={l.id} on={sel === i} onClick={() => setSel(i)}>{l.id}</Btn>
        ))}
      </Controls>
      <svg viewBox="0 0 640 190" className={s.svg} role="img" aria-label={`LeNet-5의 층 입력, C1, S2, C3, S4, C5, F6, 출력. 선택한 층 ${cur.id}`}>
        {L.map((l, i) => {
          const z = sz(l);
          const n = Math.min(l.maps, 4);
          const on = i === sel;
          const col = l.id[0] === 'C' ? 'var(--va)' : l.id[0] === 'S' ? 'var(--vc)' : 'var(--ifm-font-color-base)';
          const h = Math.min(95, 8 * Math.sqrt(l.units));
          return (
            <g key={l.id} onClick={() => setSel(i)} style={{cursor: 'pointer'}}>
              {on ? <rect x={X(i) - 6} y={4} width={74} height={176} rx={8} fill="color-mix(in srgb, var(--vb) 10%, transparent)" stroke="var(--vb)" /> : null}
              {l.side > 1
                ? Array.from({length: n}, (_, k) => n - 1 - k).map((k) => (
                    <rect key={k} x={X(i) + k * 6} y={96 - z / 2 - k * 6} width={z} height={z} fill="var(--ifm-background-color)" stroke={col} strokeWidth={2} />
                  ))
                : <rect x={X(i) + 28} y={96 - h / 2} width={12} height={h} fill={col} fillOpacity={0.35} stroke={col} strokeWidth={2} />}
              <text x={X(i) + 34} y={20} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{l.id}</text>
              <text x={X(i) + 34} y={158} textAnchor="middle" className={s.ts}>{l.side > 1 ? `${l.side}×${l.side}` : '1×1'}</text>
              <text x={X(i) + 34} y={173} textAnchor="middle" className={s.ts}>{l.id === '입력' ? '1장' : l.id === 'F6' || l.id === '출력' ? `${l.maps}개` : `${l.maps}장`}</text>
            </g>
          );
        })}
      </svg>

      <Stats>
        <Stat label={`${cur.id}: 하는 일`} value={cur.job} />
        <Stat label="출력 한 변" value={cur.side_f} />
        <Stat label="유닛 수" value={num(cur.units)} />
        <Stat label="수용장" value={cur.rf} />
      </Stats>
      <Stats>
        <Stat label="학습 파라미터" value={cur.p_f} />
        <Stat label="연결" value={cur.c_f} />
        <Stat label="여기까지의 파라미터 합" value={num(cumP)} tone={sel === 7 && cumP === 60000 ? 'good' : undefined} />
        <Stat label="여기까지의 연결 합" value={num(cumC)} tone={sel === 7 && cumC === 340908 ? 'good' : undefined} />
      </Stats>

      <Controls>
        {METRICS.map(([id, name]) => (
          <Btn key={id} on={metric === id} onClick={() => setMetric(id)}>{name}</Btn>
        ))}
      </Controls>
      {L.map((l, i) => (
        <Bar key={l.id} label={l.id} value={l[metric]} max={mx} color={i === sel ? 'var(--vb)' : 'var(--va)'} text={metric === 'units' ? num(l.units) : `${num(l[metric])} (${trim((l[metric] / total) * 100, 1)}%)`} />
      ))}
      <Note>
        합은 {num(total)}입니다{metric === 'p' ? ' (정확히 60,000)' : metric === 'c' ? ' (출력층의 840 포함)' : ''}. 파라미터가 가장 큰 층은 C5이고 전체의 80%입니다. 연결이 가장 많은 층은 C3입니다.
      </Note>
    </Viz>
  );
}
