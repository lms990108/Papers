import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {lin, T4, runMini} from './lib';

const W = 560;
const H = 250;
const NAMES = {1: '표본 하나 (SGD)', 2: '미니배치 2', 4: '전체 4개 (배치)'};

export default function EpochCompare() {
  const [E, setE] = useState(6);
  const [eps, setEps] = useState(0.1);
  const [m, setM] = useState(1);
  const [decay, setDecay] = useState(false);

  const batch = runMini(T4, eps, E, 4, decay);
  const mini = runMini(T4, eps, E, m, decay);
  const px = lin(0, E, 44, W - 14);
  const py = lin(-0.2, 3.2, H - 34, 14);
  const poly = (tr) => tr.map((q) => `${px(q.ep)},${py(q.w)}`).join(' ');
  const tableRows = [1, 2, 3, 4, 5, 6];
  const nb = Math.ceil(T4.length / m);
  const ticks = E <= 10 ? Array.from({length: E + 1}, (_, i) => i) : [0, Math.round(E / 4), Math.round(E / 2), Math.round((3 * E) / 4), E];

  return (
    <Viz
      title="같은 에폭에서 배치와 SGD 비교"
      caption="정답이 3, 3, 1, 3이라 평균 오차의 최솟값은 w = 2.5입니다. 시작은 w = 0이고, 가로축은 학습 쌍을 훑은 횟수(에폭)입니다. 에폭을 51까지 늘려 SGD의 흔들림을 보세요."
    >
      <Controls>
        {[1, 2, 4].map((v) => (
          <Btn key={v} on={m === v} onClick={() => setM(v)}>
            {NAMES[v]}
          </Btn>
        ))}
        <Btn on={decay} onClick={() => setDecay(!decay)}>학습률 줄이기</Btn>
      </Controls>
      <Controls>
        <Slider label="에폭 수" min={1} max={51} step={1} value={E} onChange={setE} />
        <Slider label="학습률 ε" min={0.02} max={0.3} step={0.02} value={eps} onChange={setEps} format={(v) => fmt(v, 2)} />
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="에폭에 따른 w의 변화">
        <line x1={44} y1={py(2.5)} x2={W - 14} y2={py(2.5)} stroke="var(--vok)" strokeDasharray="5 4" />
        <text x={W - 16} y={py(2.5) - 5} textAnchor="end" className={s.ts} style={{fill: 'var(--vok)'}}>최솟값 2.5</text>
        <line x1={44} y1={py(0)} x2={W - 14} y2={py(0)} stroke="var(--ifm-color-emphasis-300)" />
        <line x1={44} y1={14} x2={44} y2={H - 34} stroke="var(--ifm-color-emphasis-400)" />
        {[0, 1, 2, 3].map((v) => (
          <text key={v} x={38} y={py(v) + 4} textAnchor="end" className={s.ts}>{v}</text>
        ))}
        {ticks.map((v) => (
          <text key={v} x={px(v)} y={H - 18} textAnchor="middle" className={s.ts}>{v}</text>
        ))}
        <text x={W - 14} y={H - 3} textAnchor="end" className={s.ts}>에폭</text>
        <text x={4} y={12} className={s.ts}>w</text>
        <polyline points={poly(batch.trace)} fill="none" stroke="var(--va)" strokeWidth="2.5" />
        {m !== 4 ? <polyline points={poly(mini.trace)} fill="none" stroke="var(--vb)" strokeWidth="1.8" strokeDasharray="5 3" /> : null}
        <text x={52} y={26} className={s.ts} style={{fill: 'var(--va)'}}>파란 실선: 배치 (에폭당 갱신 1번)</text>
        {m !== 4 ? (
          <text x={52} y={42} className={s.ts} style={{fill: 'var(--vb)'}}>주황 점선: {NAMES[m]} (에폭당 갱신 {nb}번)</text>
        ) : null}
      </svg>
      <Stats>
        <Stat label={`에폭 ${E}의 배치 w`} value={fmt(batch.w, 3)} />
        <Stat label={`에폭 ${E}의 ${m === 4 ? '선택' : '주황'} w`} value={fmt(mini.w, 3)} />
        <Stat label="갱신 횟수 (배치 / 주황)" value={`${E} / ${E * nb}`} />
        <Stat label="기울기 계산 횟수 (둘 다)" value={4 * E} />
      </Stats>
      <Note>
        마지막 에폭의 갱신 값 (주황): {mini.last.map((v) => fmt(v, 3)).join(', ')}.
        {nb > 1 && E >= 20 && !decay ? ' 학습률이 고정이면 최솟값 2.5에 서지 못하고 이 값들 사이를 오갑니다. 학습률 줄이기를 켜면 흔들림이 줄어듭니다(설명용: 에폭마다 ε을 1 + (에폭 − 1)/5로 나눔).' : ''}
      </Note>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>에폭</th>
            <th>배치 w (갱신수)</th>
            <th>{m === 4 ? '선택' : NAMES[m]} w (갱신수)</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((e) => {
            const b = runMini(T4, eps, e, 4, decay).w;
            const q = runMini(T4, eps, e, m, decay).w;
            return (
              <tr key={e}>
                <td>{e}</td>
                <td>{fmt(b, 3)} ({e})</td>
                <td>{fmt(q, 3)} ({e * nb})</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Viz>
  );
}
