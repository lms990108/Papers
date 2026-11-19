import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const NAMES = ['1', '7', '3'];
const PRESETS = [
  {name: '정답만 가깝다', y: [0.2, 6, 7]},
  {name: '오답도 같이 가깝다', y: [0.2, 0.2, 7]},
  {name: '모두 0.2', y: [0.2, 0.2, 0.2]},
];
export const lossE = (y, d, j) => y[d] + Math.log(Math.exp(-j) + y.reduce((a, v) => a + Math.exp(-v), 0));

export default function RbfLoss() {
  const [y, setY] = useState([0.2, 6, 7]);
  const [d, setD] = useState(0);
  const [j, setJ] = useState(2);
  const setOne = (i, v) => setY(y.map((q, k) => (k === i ? v : q)));
  const sum = Math.exp(-j) + y.reduce((a, v) => a + Math.exp(-v), 0);
  const logTerm = Math.log(sum);
  const E = y[d] + logTerm;
  const same = PRESETS.findIndex((p) => p.y.every((v, i) => v === y[i]) && d === 0);

  return (
    <Viz
      title="E = y_D + log(e^(−j) + Σ e^(−y_i)): 정답만 가까운 것과 오답도 가까운 것을 구분합니다"
      caption="세 클래스의 벌점과 정답 클래스 D를 바꿔 보세요. 정답 벌점 y_D가 같은 0.2여도 오답이 같이 가까우면 오차가 커집니다. 모두 같은 벌점인 해, 곧 기준이 한 점으로 모인 해의 오차가 가장 큽니다. 기본 j = 2입니다."
    >
      <Controls>
        {PRESETS.map((p, i) => (
          <Btn key={p.name} on={same === i} onClick={() => { setY(p.y); setD(0); setJ(2); }}>{p.name}</Btn>
        ))}
        <span className={s.ts}>정답 클래스 D</span>
        {NAMES.map((n, i) => <Btn key={n} on={d === i} onClick={() => setD(i)}>{n}</Btn>)}
      </Controls>
      <Controls>
        {NAMES.map((n, i) => (
          <Slider key={n} label={`y(${n})`} min={0} max={8} step={0.1} value={y[i]} onChange={(v) => setOne(i, v)} format={(v) => fmt(v, 1)} />
        ))}
        <Slider label="상수 j" min={0.1} max={5} step={0.1} value={j} onChange={setJ} format={(v) => fmt(v, 1)} />
      </Controls>
      {NAMES.map((n, i) => (
        <Bar key={n} label={`e^(−y) · 클래스 ${n}${i === d ? ' (정답)' : ''}`} value={Math.exp(-y[i])} max={1} color={i === d ? 'var(--vok)' : 'var(--va)'} text={fmt(Math.exp(-y[i]), 3)} />
      ))}
      <Bar label="바닥 e^(−j)" value={Math.exp(-j)} max={1} color="var(--vc)" text={fmt(Math.exp(-j), 3)} />
      <Stats>
        <Stat label="첫 항 y_D (정답 벌점)" value={fmt(y[d], 3)} />
        <Stat label="로그 항" value={fmt(logTerm, 3)} />
        <Stat label="오차 E" value={fmt(E, 3)} tone={E > 0 ? 'good' : 'bad'} />
        <Stat label="로그 항 ≥ −y_D ?" value={logTerm >= -y[d] - 1e-12 ? '예' : '아니오'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr><th>경우 (D = 1, j = {fmt(j, 1)})</th><th>벌점 (1, 7, 3)</th><th>y_D만 본 값</th><th>오차 E</th></tr>
        </thead>
        <tbody>
          {PRESETS.map((p, i) => (
            <tr key={p.name} className={same === i ? s.cellOn : undefined}>
              <td>{p.name}</td><td>{p.y.map((v) => fmt(v, 1)).join(', ')}</td><td>{fmt(p.y[0], 1)}</td>
              <td>{fmt(lossE(p.y, 0, j), 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>j = 2에서 위 표의 오차는 0.157, 0.773, 1.152입니다(본문 파이썬 출력과 같습니다). 로그 안의 합에는 정답 항 e^(−y_D)가 들어 있어 로그 항이 −y_D보다 작을 수 없으므로 E는 0 아래로 내려가지 않습니다.</Note>
    </Viz>
  );
}
