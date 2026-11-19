import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {PEN0, clonePen, errorStats} from './util';

const TARGETS = ['11', '41', '111'];
const N = 40;
const W = 600;
const H = 150;

// 호의 벌점 자체를 파라미터로 보고 경사하강법을 N번 돌립니다. (설명용: 실제로는 이 벌점을 만드는 인식기의 가중치가 움직입니다.)
function run(target, fwd, lr) {
  let pen = clonePen(PEN0);
  const hist = [];
  for (let i = 0; i <= N; i += 1) {
    const st = errorStats(pen, target);
    hist.push({pen, e: fwd ? st.ef : st.ev, read: st.bu.label, cost: st.vitU});
    const g = fwd ? st.gradF : st.gradV;
    const next = clonePen(pen);
    st.ids.forEach((id) => {
      const [k, l] = id.split(':');
      next[k][l] = pen[k][l] - lr * g[id];
    });
    pen = next;
  }
  return hist;
}

export default function TrainingSteps() {
  const [target, setTarget] = useState('11');
  const [fwd, setFwd] = useState(false);
  const [lr, setLr] = useState(0.3);
  const [k, setK] = useState(0);
  const hist = useMemo(() => run(target, fwd, lr), [target, fwd, lr]);
  const cur = hist[k];
  const e0 = Math.max(hist[0].e, 0.001);
  const x = (i) => 40 + (i * (W - 60)) / N;
  const y = (v) => 12 + (H - 30) * (1 - Math.max(v, 0) / e0);
  const pts = hist.map((h, i) => `${x(i)},${y(h.e)}`).join(' ');
  const flip = hist.findIndex((h) => h.read === target);

  return (
    <Viz
      title="기울기를 따라 벌점을 움직이면 읽는 결과가 바뀐다"
      caption="호의 벌점을 기울기 반대 방향으로 조금씩 옮기는 일을 되풀이합니다. 설명용 값이고, 실제로는 이 벌점을 만든 인식기의 가중치가 움직입니다. 학습 횟수 슬라이더로 오차 E와 제약 없는 쪽이 읽는 문자열을 보세요."
    >
      <Controls>
        {TARGETS.map((t) => (
          <Btn key={t} on={t === target} onClick={() => { setTarget(t); setK(0); }}>정답 “{t}”</Btn>
        ))}
        <Btn on={!fwd} onClick={() => setFwd(false)}>비터비</Btn>
        <Btn on={fwd} onClick={() => setFwd(true)}>전방</Btn>
      </Controls>
      <Controls>
        <Slider label="학습 횟수" min={0} max={N} value={k} onChange={setK} />
        <Slider label="학습률" min={0.05} max={1} step={0.05} value={lr} onChange={setLr} format={(v) => fmt(v, 2)} />
        <Btn onClick={() => setK(Math.min(N, k + 1))}>한 번 더</Btn>
        <Btn onClick={() => setK(0)}>처음으로</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H + 10}`} className={s.svg} role="img" aria-label="학습 횟수에 따른 오차 E의 변화 그래프">
        <line x1={40} y1={H - 18} x2={W - 20} y2={H - 18} stroke="var(--ifm-color-emphasis-400)" />
        <line x1={40} y1={12} x2={40} y2={H - 18} stroke="var(--ifm-color-emphasis-400)" />
        <polyline points={pts} fill="none" stroke="var(--va)" strokeWidth={2} />
        <circle cx={x(k)} cy={y(cur.e)} r={5} fill="var(--vb)" />
        <text x={44} y={22} className={s.ts}>오차 E {fmt(hist[0].e, 3)}</text>
        <text x={W - 24} y={H - 4} textAnchor="end" className={s.ts}>학습 횟수 0 → {N}</text>
        <text x={44} y={H - 22} className={s.ts}>0</text>
      </svg>
      <Stats>
        <Stat label="오차 E" value={fmt(cur.e, 3)} tone={cur.e < 1e-6 ? 'good' : undefined} />
        <Stat label="제약 없는 쪽이 읽는 문자열" value={`“${cur.read}”`} tone={cur.read === target ? 'good' : 'bad'} />
        <Stat label="그 경로의 비용" value={fmt(cur.cost, 2)} />
        <Stat label="0→2 호의 1 / 4 벌점" value={`${fmt(cur.pen['0-2']['1'], 2)} / ${fmt(cur.pen['0-2']['4'], 2)}`} />
      </Stats>
      <Note>
        {target === '41'
          ? '정답이 처음부터 최소 경로입니다. 비터비로는 기울기가 0이라 아무것도 움직이지 않고, 전방에서는 오차가 천천히 줄어듭니다.'
          : flip >= 0
            ? `${flip}번째에 제약 없는 쪽이 “${target}”을 읽기 시작합니다. 비터비는 두 경로가 같아지면 기울기가 0이어서 오차가 0에서 멈추고, 전방은 그 뒤에도 정답과 오답 사이를 계속 벌립니다.`
            : '이 학습률과 횟수로는 아직 정답을 읽지 못합니다. 학습률을 키우거나 횟수를 늘려 보세요.'}
      </Note>
    </Viz>
  );
}
