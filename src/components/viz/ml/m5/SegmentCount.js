import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, Bar, styles as s} from '../../Viz';

function segmentations(m, k) {
  const ways = [1];
  for (let i = 1; i <= m; i += 1) {
    let t = 0;
    for (let j = 1; j <= Math.min(k, i); j += 1) t += ways[i - j];
    ways.push(t);
  }
  return ways[m];
}

function arcCount(m, k) {
  let t = 0;
  for (let st = 0; st < m; st += 1) t += Math.min(k, m - st);
  return t;
}

const lg = (v) => Math.log10(1 + v);
const W = 600;

export default function SegmentCount() {
  const [m, setM] = useState(20);
  const [k, setK] = useState(2);
  const arcs = arcCount(m, k);
  const segs = segmentations(m, k);
  const free = segmentations(m, m);
  const mx = Math.max(lg(arcs), lg(segs), lg(free));
  const small = m <= 8;
  const x = (i) => 30 + (i * (W - 60)) / m;

  const drawn = [];
  if (small) {
    for (let st = 0; st < m; st += 1) {
      for (let j = 1; j <= Math.min(k, m - st); j += 1) drawn.push([st, st + j]);
    }
  }

  return (
    <Viz
      title="조각 수가 늘 때 호와 분할은 얼마나 늘까"
      caption="조각이 m개이고 호가 최대 k조각을 건너뛸 수 있습니다. 호는 거의 m×k로 늘지만, 시작에서 끝까지의 분할은 훨씬 빨리 늘어납니다. 막대는 로그 눈금이고 숫자는 실제 값입니다."
    >
      <Controls>
        <Slider label="조각 수 m" min={1} max={20} value={m} onChange={setM} />
        <Slider label="건너뛸 수 있는 조각 k" min={1} max={6} value={k} onChange={setK} />
      </Controls>
      <Controls>
        {[3, 10, 20].map((v) => (
          <Btn key={v} on={m === v && k === 2} onClick={() => { setM(v); setK(2); }}>m={v}, k=2 (원본 코드)</Btn>
        ))}
        <Btn onClick={() => { setM(4); setK(2); }}>m=4, k=2 (연습 문제 1)</Btn>
      </Controls>
      {small ? (
        <svg viewBox="0 0 600 120" className={s.svg} role="img" aria-label={`노드 ${m + 1}개를 잇는 호 ${arcs}개의 그림`}>
          {drawn.map((a, i) => {
            const x1 = x(a[0]);
            const x2 = x(a[1]);
            const h = 18 + (a[1] - a[0]) * 14;
            return (
              <path key={i} d={`M ${x1},90 C ${x1},${90 - h} ${x2},${90 - h} ${x2},90`} fill="none" stroke={a[1] - a[0] === 1 ? 'var(--ifm-color-emphasis-500)' : 'var(--va)'} strokeWidth={1.4} />
            );
          })}
          {Array.from({length: m + 1}, (_, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={90} r={9} fill="var(--ifm-background-color)" stroke="var(--ifm-font-color-base)" />
              <text x={x(i)} y={94} textAnchor="middle" className={s.ts}>{i}</text>
            </g>
          ))}
        </svg>
      ) : (
        <Note>조각이 9개 이상이면 호가 너무 많아 그림은 생략합니다. 아래 숫자로 보세요.</Note>
      )}
      <Bar label="호 수" value={lg(arcs)} max={mx} color="var(--va)" text={`${arcs}`} />
      <Bar label={`분할 수 (k=${k})`} value={lg(segs)} max={mx} color="var(--vb)" text={`${segs}`} />
      <Bar label="제한 없을 때 분할" value={lg(free)} max={mx} color="var(--vc)" text={`${free}`} />
      <Stats>
        <Stat label="호" value={arcs} />
        <Stat label="분할" value={segs} tone={segs > arcs ? 'bad' : undefined} />
        <Stat label="분할 ÷ 호" value={(segs / arcs).toFixed(1)} />
      </Stats>
      <Note>
        {segs > arcs
          ? '분할을 하나씩 채점하면 호의 수십 배 일을 합니다. 비터비는 노드마다 가장 싼 도착 하나만 남겨서 호 수에 비례하는 계산으로 이 전체의 최솟값을 구합니다.'
          : '이 크기에서는 분할이 아직 많지 않습니다. m을 늘려 보세요.'}
      </Note>
    </Viz>
  );
}
