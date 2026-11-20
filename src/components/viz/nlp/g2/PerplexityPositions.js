import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, fmt} from '../../Viz';

const PRESETS = [
  {n: '오늘 날씨 좋다 (1, 1, 2/3)', p: [1, 1, 2 / 3]},
  {n: '오늘 날씨 나쁘다 (1, 1, 1/3)', p: [1, 1, 1 / 3]},
  {n: '균등 네 단어 (1/4 셋)', p: [0.25, 0.25, 0.25]},
  {n: '1/2, 1/4, 1/8', p: [0.5, 0.25, 0.125]},
];

export default function PerplexityPositions() {
  const [p, setP] = useState(PRESETS[0].p);
  const [bits, setBits] = useState(false);

  const prod = p.reduce((a, b) => a * b, 1);
  const logf = bits ? Math.log2 : Math.log;
  const mean = -p.reduce((a, v) => a + logf(v), 0) / p.length;
  const value = bits ? 2 ** mean : Math.exp(mean);
  const setOne = (i, v) => setP(p.map((o, j) => (j === i ? v : o)));

  return (
    <Viz
      title="자리별 정답 비율에서 퍼플렉서티까지"
      caption="세 자리의 정답 비율을 바꿔 보세요. 퍼플렉서티는 평균 몇 단어 중에서 고르는 셈인지를 말합니다. 비율이 모두 같은 값 p이면 퍼플렉서티는 1/p입니다."
    >
      <Controls>
        {PRESETS.map((x) => (
          <Btn key={x.n} on={x.p.join() === p.join()} onClick={() => setP(x.p)}>
            {x.n}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {p.map((v, i) => (
          <Slider key={i} label={`${i + 1}번째 자리의 정답 비율 p${i + 1}`} min={0.01} max={1} step={0.01} value={v} onChange={(x) => setOne(i, x)} format={(x) => fmt(x, 3)} />
        ))}
      </Controls>
      <Controls>
        <Btn on={!bits} onClick={() => setBits(false)}>자연로그 (오차)</Btn>
        <Btn on={bits} onClick={() => setBits(true)}>밑 2 (비트)</Btn>
      </Controls>
      <Stats>
        <Stat label="문장 비율 (곱)" value={fmt(prod, 4)} />
        <Stat label={`평균 ${bits ? '비트' : '오차'} (−로그의 평균)`} value={fmt(mean, 4)} />
        <Stat label={bits ? '2^비트 = 퍼플렉서티' : 'e^오차 = 퍼플렉서티'} value={fmt(value, 3)} />
      </Stats>
      <Bar label="이 문장의 퍼플렉서티" value={value} max={Math.max(4, value)} color="var(--vb)" text={fmt(value, 3)} />
      <Bar label="균등 모델 (사전 4)" value={4} max={Math.max(4, value)} color="var(--va)" text="4" />
    </Viz>
  );
}
