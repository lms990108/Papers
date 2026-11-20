import React, {useMemo, useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';
import {mulberry32} from '../../annSim';

const VOCAB = ['오늘', '날씨', '좋다', '나쁘다'];
const SETS = [
  {name: '본문 점수 0, 0, 2, 0', v: [0, 0, 2, 0]},
  {name: '설명용 점수 1, 0.5, 2, 0', v: [1, 0.5, 2, 0]},
];
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)', 'var(--vok)'];

export default function TemperatureSampler() {
  const [set, setSet] = useState(0);
  const [T, setT] = useState(1);
  const [k, setK] = useState(4);
  const [greedy, setGreedy] = useState(false);
  const [draws, setDraws] = useState([]);
  const stream = useMemo(() => {
    const r = mulberry32(2024);
    return Array.from({length: 400}, () => r());
  }, []);

  const scores = SETS[set].v;
  const e = scores.map((v) => Math.exp(v / T));
  const z = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / z);
  const order = scores.map((v, i) => i).sort((a, b) => p[b] - p[a] || a - b);
  const keep = order.slice(0, k);
  const kept = p.map((v, i) => (keep.indexOf(i) >= 0 ? v : 0));
  const zk = kept.reduce((a, b) => a + b, 0);
  const q = kept.map((v) => v / zk);
  const tie = k < 4 && p[order[k - 1]] - p[order[k]] < 1e-12;

  const pick = (u) => {
    if (greedy) return order[0];
    let acc = 0;
    for (let i = 0; i < 4; i += 1) {
      acc += q[i];
      if (u < acc) return i;
    }
    return order[0];
  };
  const draw = (m) => {
    const next = draws.slice();
    for (let j = 0; j < m; j += 1) next.push(pick(stream[next.length % stream.length]));
    setDraws(next);
  };
  const change = (f) => {
    f();
    setDraws([]);
  };
  const counts = VOCAB.map((w, i) => draws.filter((d) => d === i).length);

  return (
    <Viz
      title="온도와 Top-k로 비율을 다듬고, 한 토큰씩 뽑기"
      caption="점수를 온도 T로 나눈 뒤 소프트맥스를 하면 T가 작을수록 뾰족해집니다. 아래 뽑기는 같은 점수에서 반복해 뽑는 설명용 실험이며, 슬라이더를 바꾸면 뽑은 기록이 지워집니다."
    >
      <Controls>
        {SETS.map((o, i) => (
          <Btn key={o.name} on={i === set} onClick={() => change(() => setSet(i))}>
            {o.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="온도 T" min={0.2} max={3} step={0.05} value={T} onChange={(v) => change(() => setT(v))} format={(v) => fmt(v, 2)} />
        {[0.5, 1, 2].map((v) => (
          <Btn key={v} on={Math.abs(T - v) < 1e-9} onClick={() => change(() => setT(v))}>
            T = {v}
          </Btn>
        ))}
        <Slider label="Top-k" min={1} max={4} step={1} value={k} onChange={(v) => change(() => setK(v))} />
      </Controls>
      {VOCAB.map((w, i) => (
        <Bar
          key={w}
          label={w + ' (점수 ' + scores[i] + ')'}
          value={q[i]}
          max={1}
          color={COLORS[i]}
          text={keep.indexOf(i) >= 0 ? fmt(q[i], 3) : '제외 (' + fmt(p[i], 3) + ')'}
        />
      ))}
      <Stats>
        <Stat label="점수 ÷ T (칸 순서)" value={scores.map((v) => fmt(v / T, 1)).join(', ')} />
        <Stat label="가장 높은 칸의 비율" value={fmt(Math.max(...q), 3)} />
        <Stat label="후보 수" value={String(k)} />
      </Stats>
      {tie ? <Note>점수가 같은 칸이 걸치면 앞 칸을 먼저 남깁니다.</Note> : null}
      <Controls>
        <Btn onClick={() => draw(1)}>한 토큰 뽑기</Btn>
        <Btn onClick={() => draw(20)}>20번 뽑기</Btn>
        <Btn on={greedy} onClick={() => change(() => setGreedy(!greedy))}>늘 가장 높은 칸만 고르기</Btn>
        <Btn onClick={() => setDraws([])}>기록 지우기</Btn>
      </Controls>
      <div style={{fontSize: '0.85rem', minHeight: '2.6em', lineHeight: 1.6}}>
        뽑은 순서: {draws.length ? draws.map((d) => VOCAB[d]).join(' ') : '(아직 없음)'}
      </div>
      {VOCAB.map((w, i) => (
        <Bar
          key={w}
          label={w + ' 뽑힌 비율'}
          value={draws.length ? counts[i] / draws.length : 0}
          max={1}
          color={COLORS[i]}
          text={draws.length ? counts[i] + '/' + draws.length : '0/0'}
        />
      ))}
      <Note>
        T = 0.5이면 좋다가 0.948, T = 1이면 0.711, T = 2이면 0.475입니다(본문 점수). 많이 뽑을수록 뽑힌 비율이 위의 비율에 가까워집니다. 늘 가장 높은 칸만 고르면 같은 토큰만 나옵니다. Top-k는 비율이 큰 k개만 남기고 다시 합이 1이 되게 맞춥니다.
      </Note>
    </Viz>
  );
}
