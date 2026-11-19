import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

export default function WhyNormalize() {
  const [n, setN] = useState(0);
  const x1 = 1 + n; // 설명용: 한 층마다 첫째 칸에 비슷한 크기(1)가 더해짐
  const rms = Math.sqrt((x1 * x1 + 0) / 2);
  const normed = x1 / rms;
  const big = Math.exp(x1);
  const p = big / (big + 1);

  return (
    <Viz
      title="정규화 없이 덧셈을 쌓으면 칸이 커지고 소프트맥스가 한 칸으로 몰립니다"
      caption="입력 [1, 0]에 한 층마다 비슷한 크기(설명용으로 1)의 덧셈이 쌓인다고 합시다. 첫째 칸의 점수 x와 둘째 칸의 점수 0을 소프트맥스에 넣은 결과입니다."
    >
      <Controls>
        <Slider label="쌓은 덧셈 횟수" min={0} max={20} step={1} value={n} onChange={setN} />
        <Btn on={n === 0} onClick={() => setN(0)}>0번</Btn>
        <Btn on={n === 9} onClick={() => setN(9)}>9번 (첫 칸 10)</Btn>
      </Controls>
      <Bar label="정규화 전 첫째 칸" value={x1} max={21} color="var(--vb)" text={fmt(x1, 1)} />
      <Bar label="RMSNorm 뒤 첫째 칸" value={normed} max={21} color="var(--va)" text={fmt(normed, 3)} />
      <Bar label="큰 칸의 비율" value={p} max={1} color="var(--vc)" text={fmt(p, 5)} />
      <Stats>
        <Stat label="점수 차이 x − 0" value={fmt(x1, 1)} />
        <Stat label="e의 x제곱" value={big < 1e6 ? fmt(big, 1) : big.toExponential(2)} />
        <Stat label="작은 칸의 비율" value={fmt(1 - p, 5)} tone={1 - p < 0.001 ? 'bad' : undefined} />
        <Stat label="반응도 p(1−p)" value={fmt(p * (1 - p), 5)} tone={p * (1 - p) < 0.001 ? 'bad' : undefined} />
      </Stats>
      <Note>
        점수 1과 0이면 비율은 0.731과 0.269입니다. 점수 10과 0이면 e의 10제곱이 약 22026이라 큰 칸의 비율이 거의 1이고, 기울기도 거의 사라집니다. 정규화한 첫째 칸은 덧셈을 몇 번 쌓았든 1.414로 그대로입니다. 반응도 p(1−p)는 점수가 변할 때 비율이 얼마나 움직이는지를 나타냅니다.
      </Note>
    </Viz>
  );
}
