import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Bar, Note, fmt, styles as s} from '../../Viz';

const MODES = [
  {id: 'greedy', t: 'greedy'},
  {id: 'topk', t: 'top-k'},
  {id: 'topp', t: 'top-p'},
  {id: 'minp', t: 'min-p'},
  {id: 'all', t: '필터 없음'},
];
const NAMES = ['첫째 칸', '둘째 칸', '셋째 칸'];

export default function DecodingSampler() {
  const [lg, setLg] = useState([2, 1, 0]);
  const [temp, setTemp] = useState(1);
  const [mode, setMode] = useState('topk');
  const [k, setK] = useState(2);
  const [tp, setTp] = useState(0.9);
  const [mp, setMp] = useState(0.2);

  const ex = lg.map((v) => Math.exp(v / temp));
  const z = ex.reduce((a, b) => a + b, 0);
  const pr = ex.map((v) => v / z);
  const order = [0, 1, 2].sort((a, b) => pr[b] - pr[a] || a - b);
  const keep = [false, false, false];
  let cum = 0;
  order.forEach((idx, rank) => {
    if (mode === 'greedy') keep[idx] = rank === 0;
    else if (mode === 'topk') keep[idx] = rank < k;
    else if (mode === 'topp') {
      keep[idx] = cum < tp - 1e-9;
      cum += pr[idx];
    } else if (mode === 'minp') keep[idx] = pr[idx] >= mp * pr[order[0]] - 1e-12;
    else keep[idx] = true;
  });
  const zk = pr.reduce((a, v, i) => a + (keep[i] ? v : 0), 0);
  const after = pr.map((v, i) => (keep[i] ? v / zk : 0));
  const nk = keep.filter(Boolean).length;
  const setL = (i) => (v) => setLg(lg.map((x, j) => (j === i ? v : x)));

  return (
    <Viz
      title="점수에서 다음 칸 고르기"
      caption="세 칸의 점수(logit)에서 소프트맥스로 비율을 만들고, 고르는 규칙에 따라 후보를 남깁니다. 기본값은 글의 점수 2, 1, 0입니다."
    >
      <Controls>
        {NAMES.map((n, i) => (
          <Slider key={n} label={`${n} 점수`} min={-2} max={5} step={0.5} value={lg[i]} onChange={setL(i)} format={(v) => fmt(v, 1)} />
        ))}
        <Slider label="온도" min={0.1} max={2} step={0.1} value={temp} onChange={setTemp} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        {MODES.map((x) => (
          <Btn key={x.id} on={mode === x.id} onClick={() => setMode(x.id)}>
            {x.t}
          </Btn>
        ))}
        {mode === 'topk' ? <Slider label="k" min={1} max={3} value={k} onChange={setK} /> : null}
        {mode === 'topp' ? <Slider label="p" min={0.1} max={1} step={0.05} value={tp} onChange={setTp} format={(v) => fmt(v, 2)} /> : null}
        {mode === 'minp' ? <Slider label="곱할 비율" min={0.05} max={1} step={0.05} value={mp} onChange={setMp} format={(v) => fmt(v, 2)} /> : null}
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.ts}>소프트맥스 비율 (온도 {fmt(temp, 1)})</div>
          {NAMES.map((n, i) => (
            <Bar key={n} label={n} value={pr[i]} max={1} color="var(--va)" text={fmt(pr[i], 3)} />
          ))}
          <div className={s.ts}>logprob (비율의 로그)</div>
          <div className={s.note}>{NAMES.map((n, i) => `${n} ${fmt(Math.log(pr[i]), 3)}`).join(' / ')}</div>
        </div>
        <div>
          <div className={s.ts}>남긴 뒤 다시 나눈 비율</div>
          {NAMES.map((n, i) => (
            <Bar key={n} label={n} value={after[i]} max={1} color={keep[i] ? 'var(--vok)' : 'var(--ifm-color-emphasis-400)'} text={keep[i] ? fmt(after[i], 3) : '버림'} />
          ))}
        </div>
      </div>
      <Stats>
        <Stat label="남은 칸" value={String(nk)} />
        <Stat label="1등 칸 (greedy)" value={NAMES[order[0]]} />
        <Stat label="남기기 전 1등 비율" value={fmt(pr[order[0]], 3)} />
      </Stats>
      <Note>
        {mode === 'minp' ? `기준은 1등 비율 ${fmt(pr[order[0]], 3)}에 ${fmt(mp, 2)}를 곱한 ${fmt(pr[order[0]] * mp, 3)}입니다. ` : ''}
        온도를 1보다 작게 하면 1등이 더 커지고, 1보다 크게 하면 비율이 고른 쪽으로 움직입니다.
      </Note>
    </Viz>
  );
}
