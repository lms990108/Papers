import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const CAND = ['오늘', '날씨', '좋다', '나쁘다'];
const ANS = 1;
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)', 'var(--vok)'];

const box = (on, mask) => ({
  display: 'inline-block',
  minWidth: '4.2em',
  padding: '6px 14px',
  borderRadius: 8,
  textAlign: 'center',
  border: '1.5px ' + (mask ? 'dashed' : 'solid') + ' ' + (mask ? 'var(--vb)' : on ? 'var(--va)' : 'var(--ifm-color-emphasis-300)'),
  background: on ? 'color-mix(in srgb, var(--va) 16%, transparent)' : 'transparent',
  opacity: on || mask ? 1 : 0.5,
});

export default function MaskPredict() {
  const [left, setLeft] = useState(true);
  const [right, setRight] = useState(true);
  const [manual, setManual] = useState(null);

  const sc = [0, (left ? 1 : 0) + (right ? 2 : 0), 0, 0];
  const e = sc.map((v) => Math.exp(v));
  const z = e.reduce((a, b) => a + b, 0);
  const p = manual == null ? e.map((v) => v / z) : CAND.map((w, i) => (i === ANS ? manual : (1 - manual) / 3));
  const loss = -Math.log(p[ANS]);
  const toggle = (f) => {
    f();
    setManual(null);
  };

  return (
    <Viz
      title="가린 칸을 앞뒤 문맥으로 맞히기"
      caption="“오늘 [마스크] 좋다”에서 정답은 날씨입니다. 문맥을 켜고 끄면 날씨 칸의 점수가 달라집니다. 오늘 +1, 좋다 +2는 설명용 값입니다."
    >
      <Controls>
        <Btn on={left} onClick={() => toggle(() => setLeft(!left))}>왼쪽 문맥 “오늘” 보기</Btn>
        <Btn on={right} onClick={() => toggle(() => setRight(!right))}>오른쪽 문맥 “좋다” 보기</Btn>
      </Controls>
      <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '4px 0 12px'}}>
        <span style={box(left)}>오늘</span>
        <span aria-hidden="true">{left ? '→' : '·'}</span>
        <span style={box(false, true)}>[마스크]</span>
        <span aria-hidden="true">{right ? '←' : '·'}</span>
        <span style={box(right)}>좋다</span>
      </div>
      {CAND.map((w, i) => (
        <Bar
          key={w}
          label={i === ANS ? w + ' (정답)' : w}
          value={p[i]}
          max={1}
          color={COLORS[i]}
          text={fmt(p[i], 3)}
        />
      ))}
      <Stats>
        <Stat label="날씨 칸의 점수" value={manual == null ? String(sc[ANS]) : '직접 설정'} />
        <Stat label="정답 비율 p(날씨)" value={fmt(p[ANS], 3)} />
        <Stat label="마스크 오차 −log p" value={fmt(loss, 3)} tone={loss < 0.3 ? 'good' : loss > 1.2 ? 'bad' : undefined} />
      </Stats>
      <Controls>
        <Slider label="정답 비율 직접 정하기" min={0.01} max={0.99} step={0.01} value={p[ANS]} onChange={setManual} format={(v) => fmt(v, 2)} />
        {[0.25, 0.5, 0.8, 0.9].map((v) => (
          <Btn key={v} on={manual === v} onClick={() => setManual(v)}>
            p = {v}
          </Btn>
        ))}
        <Btn onClick={() => setManual(null)}>문맥으로 계산</Btn>
      </Controls>
      <Note>
        둘 다 끄면 네 칸이 같은 점수라 p = 0.25이고 오차는 1.386입니다. 오늘만 보면 0.475(오차 0.744), 좋다만 보면 0.711(오차 0.341), 양쪽을 보면 0.870(오차 0.139)입니다. 직접 정하기에서 p를 0.5로 두면 오차 0.693, 0.9로 두면 0.105입니다. 이때 나머지 세 칸은 남은 비율을 똑같이 나눕니다.
      </Note>
    </Viz>
  );
}
