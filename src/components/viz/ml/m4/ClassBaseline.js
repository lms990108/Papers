import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const TRAIN = [5923, 6742, 5958, 6131, 5842, 5421, 5918, 6265, 5851, 5949];
const TEST = [980, 1135, 1032, 1010, 982, 892, 958, 1028, 974, 1009];
const sum = (a) => a.reduce((x, y) => x + y, 0);

export default function ClassBaseline() {
  const [pick, setPick] = useState(1);
  const total = sum(TEST);
  const right = TEST[pick];
  const err = 100 * (1 - right / total);
  const best = TEST.indexOf(Math.max(...TEST));

  return (
    <Viz
      title="무엇을 넣어도 숫자 하나만 답하면 오류가 얼마일까"
      caption="클래스(숫자)별 장수는 고르지 않습니다. 아래 버튼으로 항상 답할 숫자를 고르세요. 시험 오류 = 1 - (그 숫자의 시험 장수 / 10,000)입니다."
    >
      <Controls>
        <span className={s.ts}>항상 이 숫자라고 답하기:</span>
        {TEST.map((_, d) => (
          <Btn key={d} on={pick === d} onClick={() => setPick(d)}>{d}</Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <div>
          <b style={{fontSize: '0.85rem'}}>학습 {sum(TRAIN).toLocaleString('en-US')}장</b>
          {TRAIN.map((v, d) => (
            <Bar key={d} label={`숫자 ${d}`} value={v} max={7000} color={d === pick ? 'var(--vb)' : 'var(--va)'} text={v.toLocaleString('en-US')} />
          ))}
        </div>
        <div>
          <b style={{fontSize: '0.85rem'}}>시험 {total.toLocaleString('en-US')}장</b>
          {TEST.map((v, d) => (
            <Bar key={d} label={`숫자 ${d}${d === best ? ' (최다)' : ''}`} value={v} max={1200} color={d === pick ? 'var(--vb)' : 'var(--va)'} text={v.toLocaleString('en-US')} />
          ))}
        </div>
      </div>
      <Stats>
        <Stat label={`항상 ${pick}만 답하면 맞히는 장`} value={`${right.toLocaleString('en-US')}장`} />
        <Stat label="시험 오류" value={`${fmt(err, 2)}%`} tone={err < 90 ? 'good' : 'bad'} />
        <Stat label="열 개를 무작위로 찍는 기준선" value="90%" />
        <Stat label="선형 분류기" value="12%" tone="good" />
      </Stats>
      <Note>
        {pick === best
          ? '시험에서 가장 많은 숫자 1을 고르면 오류가 88.65%입니다. 이 값이 어떤 방법도 넘어야 하는 바닥이고, 12%인 선형 분류기도 이 바닥보다 훨씬 낫습니다.'
          : '1이 아닌 숫자를 고르면 오류가 더 높습니다. 가장 많은 숫자(1)를 골라야 오류가 가장 낮은 88.65%가 됩니다.'}
      </Note>
    </Viz>
  );
}
