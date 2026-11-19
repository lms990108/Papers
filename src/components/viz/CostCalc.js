import React, {useState} from 'react';
import {Viz, Controls, Slider, Bar, Note} from './Viz';

const unit = (x) => {
  if (x >= 1e12) return `${(x / 1e12).toFixed(1)}조`;
  if (x >= 1e8) return `${(x / 1e8).toFixed(1)}억`;
  if (x >= 1e4) return `${(x / 1e4).toFixed(1)}만`;
  return Math.round(x).toLocaleString('ko-KR');
};

export default function CostCalc() {
  const [eN, setEN] = useState(6.9);
  const [d, setD] = useState(1024);
  const [eV, setEV] = useState(3.2);
  const N = 10 ** eN;
  const V = Math.min(N, 10 ** eV);
  const brute = N * d;
  const graph = V * d;

  return (
    <Viz
      title="질문 하나를 처리하는 데 필요한 곱셈 횟수"
      caption="전부 비교하면 점 수 × 차원만큼 곱합니다. 인덱스는 이 중 일부만 비교합니다. 방문하는 점 수 V는 직접 정해 본 값이고, 실제로는 설정에 따라 달라집니다."
    >
      <Controls>
        <Slider label="점(청크) 수 N" min={3} max={9} step={0.1} value={eN} onChange={setEN} format={() => unit(N)} />
        <Slider label="차원 d" min={64} max={2048} step={64} value={d} onChange={setD} />
        <Slider label="방문하는 점 수 V" min={2} max={5} step={0.1} value={eV} onChange={setEV} format={() => unit(V)} />
      </Controls>
      <Bar label="전부 비교 (N × d)" value={brute} max={brute} color="var(--vb)" text={unit(brute)} />
      <Bar label="인덱스 (V × d)" value={Math.max(graph, brute * 0.004)} max={brute} color="var(--va)" text={unit(graph)} />
      <Note>
        인덱스가 계산량을 약 <b>{Math.round(N / V).toLocaleString('ko-KR')}배</b> 줄입니다. 대신 방문하지 못한 점 중에 진짜 가까운 점이 있을 수 있어서, 결과가 근사입니다.
      </Note>
    </Viz>
  );
}
