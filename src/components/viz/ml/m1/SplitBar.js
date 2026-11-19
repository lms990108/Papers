import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt} from '../../Viz';

const REVIEWS = [
  ['연기가 좋다', '긍정'], ['결말이 나쁘다', '부정'], ['줄거리가 나쁘다', '부정'], ['음악이 좋다', '긍정'], ['연출이 좋다', '긍정'],
  ['편집이 나쁘다', '부정'], ['배우가 좋다', '긍정'], ['속도가 나쁘다', '부정'], ['대사가 좋다', '긍정'], ['마지막이 나쁘다', '부정'],
];
const ROLES = {
  train: {name: '학습', color: 'var(--vb)', use: '가중치를 움직일 때'},
  val: {name: '검증', color: 'var(--va)', use: '학습률 같은 수를 고를 때'},
  test: {name: '시험', color: 'var(--vc)', use: '모든 선택이 끝난 뒤 한 번'},
};
const N = REVIEWS.length;

export default function SplitBar() {
  const [tr, setTr] = useState(6);
  const [te, setTe] = useState(2);
  const t = Math.min(te, N - tr);
  const va = N - tr - t;

  const role = (i) => (i < tr ? 'train' : i < tr + va ? 'val' : 'test');
  const opts = [];
  for (let k = 0; k <= t; k += 1) opts.push(fmt(1 - k / t, 2));
  const se = t > 0 ? Math.sqrt(0.25 / t) : NaN;

  return (
    <Viz
      title="리뷰 열 개를 학습, 검증, 시험으로 나누기"
      caption="슬라이더로 나누는 개수를 바꿔 보세요. 리뷰와 레이블은 설명용 예입니다. 칸의 글자가 역할이고, 주황은 학습, 파랑은 검증, 보라는 시험입니다."
    >
      <Controls>
        <Slider label="학습" min={1} max={8} step={1} value={tr} onChange={setTr} />
        <Slider label="시험" min={0} max={N - tr} step={1} value={t} onChange={setTe} />
        <Btn on={tr === 6 && t === 2} onClick={() => {setTr(6); setTe(2);}}>6 / 2 / 2</Btn>
        <Btn on={tr === 8 && t === 2} onClick={() => {setTr(8); setTe(2);}}>8 / 0 / 2</Btn>
        <Btn on={tr === 5 && t === 5} onClick={() => {setTr(5); setTe(5);}}>5 / 0 / 5</Btn>
      </Controls>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(8.2em, 1fr))', gap: 6}}>
        {REVIEWS.map((r, i) => {
          const ro = ROLES[role(i)];
          return (
            <div key={r[0]} style={{border: '2px solid ' + ro.color, borderRadius: 8, padding: '4px 8px', fontSize: '0.8rem'}}>
              <b style={{color: ro.color}}>{ro.name}</b> {r[1]}
              <div>{r[0]}</div>
            </div>
          );
        })}
      </div>
      <Stats>
        <Stat label="학습" value={tr + '개'} />
        <Stat label="검증" value={va + '개'} tone={va === 0 ? 'bad' : undefined} />
        <Stat label="시험" value={t + '개'} tone={t === 0 ? 'bad' : undefined} />
        <Stat label="시험 오류가 가질 수 있는 값" value={t > 0 ? opts.join(', ') : '-'} />
        <Stat label="오류 0.5에서 표준오차" value={t > 0 ? fmt(se, 4) : '-'} tone={t > 0 && se > 0.2 ? 'bad' : undefined} />
      </Stats>
      <Note>
        {va === 0 ? '검증이 없으면 학습률 같은 수를 시험으로 고르게 되고, 그 순간 시험은 새 문장이 아닙니다. ' : ''}
        {t === 0 ? '시험이 없으면 새 문장에서의 오류를 잴 수 없습니다. ' : ''}
        {va > 0 && t > 0 ? ROLES.train.name + ': ' + ROLES.train.use + ', ' + ROLES.val.name + ': ' + ROLES.val.use + ', ' + ROLES.test.name + ': ' + ROLES.test.use + '. ' : ''}
        시험이 작으면 오류가 가질 수 있는 값이 몇 개뿐이고, 리뷰 하나가 오류를 크게 움직입니다. 시험 둘이면 0, 0.5, 1뿐입니다.
      </Note>
    </Viz>
  );
}
