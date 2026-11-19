import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note} from '../../Viz';
import Strip from './Strip';
import {outSize, num} from './util';

const PRESETS = [
  ['S2: 28×28, 6장', {N: 28, K: 2, S: 2, M: 6}],
  ['S4: 10×10, 16장', {N: 10, K: 2, S: 2, M: 16}],
  ['연습 3: 12×12, 8장', {N: 12, K: 2, S: 2, M: 8}],
  ['N = 7', {N: 7, K: 2, S: 2, M: 1}],
  ['N = 5', {N: 5, K: 2, S: 2, M: 1}],
];

export default function PoolSize() {
  const [v, setV] = useState(PRESETS[0][1]);
  const {N, K, S, M} = v;
  const set = (key) => (x) => setV({...v, [key]: x});
  const O = outSize(N, K, S, 0);
  const units = M * O * O;
  const conn = units * (K * K + 1);
  const unitsIn = M * N * N;

  return (
    <Viz
      title="풀링 한 층의 크기와 파라미터"
      caption="입력 한 변 N, 창 K, 보폭 S, 맵 수를 바꿔 보세요. 겹치지 않는 2×2는 K = S = 2입니다. 유닛 하나의 연결은 창 안의 입력과 바이어스 하나이고, 학습 값은 맵마다 계수와 바이어스 둘입니다. 빨간 칸은 창이 들어가지 못해 버려지는 자투리입니다."
    >
      <Controls>
        {PRESETS.map(([name, val]) => (
          <Btn key={name} on={JSON.stringify(val) === JSON.stringify(v)} onClick={() => setV(val)}>{name}</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="입력 한 변 N" min={2} max={32} value={N} onChange={set('N')} />
        <Slider label="창 K" min={1} max={6} value={K} onChange={set('K')} />
        <Slider label="보폭 S" min={1} max={6} value={S} onChange={set('S')} />
        <Slider label="맵 수" min={1} max={16} value={M} onChange={set('M')} />
      </Controls>
      <Strip N={N} K={K} S={S} P={0} />
      {O > 0 ? (
        <>
          <Stats>
            <Stat label="출력 한 변" value={`⌊(${N}−${K})/${S}⌋+1 = ${O}`} tone="good" />
            <Stat label="유닛 수" value={`${num(unitsIn)} → ${num(units)}`} />
            <Stat label="학습 파라미터" value={num(2 * M)} />
            <Stat label="연결" value={num(conn)} />
          </Stats>
          <Note>
            유닛 하나의 연결은 입력 {K * K}개와 바이어스 1개로 {K * K + 1}개입니다. 연결은 {num(units)} × {K * K + 1} = {num(conn)}, 학습 값은 {M} × 2 = {num(2 * M)}입니다.
            {K === 2 && S === 2 ? (N % 2 === 1 ? ' N이 홀수라 마지막 줄과 열이 버려집니다.' : ` 한 변이 절반, 칸 수가 4분의 1(${num(unitsIn)} → ${num(units)})이 됩니다.`) : ''}
          </Note>
        </>
      ) : (
        <Note>창이 입력보다 커서 출력이 없습니다. K를 줄여 보세요.</Note>
      )}
    </Viz>
  );
}
