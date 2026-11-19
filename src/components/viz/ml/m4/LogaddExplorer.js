import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';
import {logadd} from './LabelFlip';

const PRESETS = [
  {name: '3, 7', n: 2, v: [3, 7, 6, 7], off: 0},
  {name: '3, 3.2', n: 2, v: [3, 3.2, 6, 7], off: 0},
  {name: '3, 4, 6, 7 (비터비 페이지의 네 경로)', n: 4, v: [3, 4, 6, 7], off: 0},
  {name: '1000, 1001', n: 2, v: [0, 1, 6, 7], off: 1000},
];

export default function LogaddExplorer() {
  const [n, setN] = useState(4);
  const [v, setV] = useState([3, 4, 6, 7]);
  const [off, setOff] = useState(0);
  const xs = v.slice(0, n).map((x) => x + off);
  const mn = Math.min(...xs);
  const la = logadd(xs);
  const shares = xs.map((x) => Math.exp(-(x - mn)) / xs.reduce((a, y) => a + Math.exp(-(y - mn)), 0));
  const sum = xs.reduce((a, x) => a + Math.exp(-x), 0);
  const naive = sum > 0 ? -Math.log(sum) : null;
  const cols = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];

  return (
    <Viz
      title="logadd: 경로 비용을 확률 쪽에서 더한 뒤 비용으로 돌리기"
      caption="logadd(x1, ..., xn) = -log(e^(-x1) + ... + e^(-xn))입니다. 비용을 바꿔 최솟값, logadd, 경로별 몫을 보세요. 몫은 logadd를 각 비용으로 미분한 값(기울기)이며 모두 더하면 1입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.name} on={false} onClick={() => { setN(p.n); setV(p.v); setOff(p.off); }}>{p.name}</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="경로 수" min={1} max={4} step={1} value={n} onChange={setN} />
        <Btn on={off === 0} onClick={() => setOff(0)}>비용 그대로</Btn>
        <Btn on={off === 1000} onClick={() => setOff(1000)}>모든 비용에 1000 더하기</Btn>
      </Controls>
      <Controls>
        {[0, 1, 2, 3].slice(0, n).map((i) => (
          <Slider key={i} label={`경로 ${i + 1}${off ? ' (+1000)' : ''}`} min={0} max={10} step={0.1} value={v[i]} onChange={(x) => setV(v.map((y, j) => (j === i ? x : y)))} format={(x) => fmt(x + off, 1)} />
        ))}
      </Controls>
      <div>
        {xs.map((x, i) => (
          <Bar key={i} label={`경로 ${i + 1}: 비용 ${fmt(x, 1)}`} value={shares[i]} max={1} color={cols[i]} text={`${fmt(shares[i], 3)}`} />
        ))}
      </div>
      <Stats>
        <Stat label="최솟값 (비터비)" value={fmt(mn, 3)} />
        <Stat label="logadd (가장 작은 값을 빼서 계산)" value={fmt(la, 3)} tone="good" />
        <Stat label="최솟값 - logadd" value={fmt(mn - la, 3)} />
        <Stat label="그대로 -log(e^(-x)의 합)" value={naive === null ? '계산 불가' : fmt(naive, 3)} tone={naive === null ? 'bad' : undefined} />
      </Stats>
      <Note>
        {naive === null
          ? 'e^(-1000)은 컴퓨터에서 0이 되어(언더플로) 합이 0이고, 0의 로그를 구할 수 없습니다. 가장 작은 값 m을 밖으로 빼서 m - log(합 e^(-(x-m)))으로 계산하면 지수 안이 0 이하라 항이 1을 넘지 않고, 1000과 1001의 logadd는 999.687이 나옵니다.'
          : n === 1
            ? '경로가 하나면 logadd는 그 비용과 같습니다.'
            : '비용이 크게 벌어지면 logadd는 최솟값에 가까워지고(몫이 한 경로에 쏠림), 비슷하면 최솟값보다 눈에 띄게 낮아집니다.'}
      </Note>
    </Viz>
  );
}
