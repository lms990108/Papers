import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';
import {T4, runMini} from './lib';

const EPS = 0.1;

export default function DuplicateSamples() {
  const [k, setK] = useState(2);

  const ts = [];
  for (let i = 0; i < k; i++) T4.forEach((t) => ts.push(t));
  const sgd = runMini(ts, EPS, 1, 1);
  const batch = runMini(ts, EPS, 1, ts.length);
  const same = runMini(T4, EPS, k, 1);
  const eq = Math.abs(same.w - sgd.w) < 1e-9;
  const cells = sgd.trace.slice(1);

  return (
    <Viz
      title="같은 쌍을 복사하면 배치만 손해"
      caption="네 쌍(정답 3, 3, 1, 3)을 k번 복사해 한 에폭만 학습합니다. 학습률은 0.1이고 시작은 w = 0입니다. 평균 기울기는 복사해도 그대로 −5입니다. 설명용 구성입니다."
    >
      <Controls>
        <Slider label="복사 수 k" min={1} max={4} step={1} value={k} onChange={setK} />
        <span className={s.ts}>학습 쌍 {ts.length}개</span>
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, margin: '4px 0 10px'}}>
        {cells.map((q, i) => (
          <div
            key={i}
            style={{
              width: 62,
              padding: '3px 4px',
              textAlign: 'center',
              fontSize: '0.75rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 6,
              background: ts[i] === 1 ? 'var(--ifm-color-emphasis-100)' : 'transparent',
            }}
          >
            정답 {ts[i]}
            <br />
            <b>{fmt(q.w, 3)}</b>
          </div>
        ))}
      </div>
      <Bar label="배치 w (갱신 1번)" value={batch.w} max={3} color="var(--va)" text={fmt(batch.w, 3)} />
      <Bar label={`SGD w (갱신 ${ts.length}번)`} value={sgd.w} max={3} color="var(--vb)" text={fmt(sgd.w, 3)} />
      <Bar label="목표 (최솟값)" value={2.5} max={3} color="var(--vok)" text="2.5" />
      <Stats>
        <Stat label="기울기 계산 (둘 다)" value={`${ts.length}번`} />
        <Stat label="평균 기울기" value={fmt(ts.reduce((a, t) => a + 2 * (0 - t), 0) / ts.length, 2)} />
        <Stat label={`원본 네 쌍으로 ${k}에폭 SGD`} value={fmt(same.w, 3)} tone={eq ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {k === 1
          ? '복사가 없으면 위 그림의 한 에폭과 같습니다. 복사 수를 늘려 보세요.'
          : `복사본이 ${k}개이면 한 번 도는 일이 작은 부분집합(원본 네 쌍)을 ${k}번 학습하는 것과 같아서, SGD의 결과가 원본 네 쌍으로 ${k}에폭을 돈 값과 같습니다. 배치는 계산을 ${k}배 하고도 w = ${fmt(batch.w, 1)}에 그대로입니다.`}
      </Note>
    </Viz>
  );
}
