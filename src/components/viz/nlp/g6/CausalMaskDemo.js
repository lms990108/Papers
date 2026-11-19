import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Bar, Note, fmt, styles as s} from '../../Viz';

const NAMES = ['과거 (오늘)', '현재 (날씨)', '미래 (좋다)'];

export default function CausalMaskDemo() {
  const [sc, setSc] = useState([2, 1, 3]);
  const [mask, setMask] = useState(false);
  const set = (i) => (v) => setSc(sc.map((x, j) => (j === i ? v : x)));
  const ex = sc.map((v, i) => (mask && i === 2 ? 0 : Math.exp(v)));
  const sum = ex.reduce((a, b) => a + b, 0);
  const w = ex.map((v) => v / sum);

  return (
    <Viz
      title="인과 마스크: 미래 칸을 점수에서 빼기"
      caption="둘째 자리(날씨)가 다음 토큰을 맞힐 때 보는 세 칸의 점수입니다. 기본값 과거 2, 현재 1, 미래 3은 Decoder block 페이지와 같습니다."
    >
      <Controls>
        <Btn on={!mask} onClick={() => setMask(false)}>마스크 없음 (미래가 보임)</Btn>
        <Btn on={mask} onClick={() => setMask(true)}>인과 마스크 (미래를 가림)</Btn>
      </Controls>
      <Controls>
        {NAMES.map((n, i) => (
          <Slider key={n} label={`${n} 점수`} min={-2} max={5} step={1} value={sc[i]} onChange={set(i)} />
        ))}
      </Controls>
      {NAMES.map((n, i) => {
        const hidden = mask && i === 2;
        return (
          <Bar
            key={n}
            label={n}
            value={w[i]}
            max={1}
            color={hidden ? 'var(--ifm-color-emphasis-400)' : i === 2 ? 'var(--vbad)' : 'var(--va)'}
            text={hidden ? '가려짐 0' : fmt(w[i], 3)}
          />
        );
      })}
      <Stats>
        <Stat label="과거 비율" value={fmt(w[0], 3)} />
        <Stat label="현재 비율" value={fmt(w[1], 3)} />
        <Stat label="미래 비율" value={fmt(w[2], 3)} tone={mask ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {mask
          ? '미래 칸은 점수에서 빠져 비율이 0입니다. 남은 둘의 합이 1입니다. 이런 블록만 쌓은 것이 decoder-only입니다.'
          : '미래 칸에 비율이 갑니다. 그 미래가 정답 토큰이면 정답을 입력에서 보는 것이라, 오차가 -log 1 = 0까지 내려가는 베끼기가 됩니다. 버트가 가운데를 가리는 이유입니다.'}
      </Note>
    </Viz>
  );
}
