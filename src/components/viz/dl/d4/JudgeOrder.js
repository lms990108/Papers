import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const f2 = (x) => fmt(x, 2);

export default function JudgeOrder() {
  const [a1, setA1] = useState(0.8); // A가 앞일 때 A의 점수
  const [b1, setB1] = useState(0.4); // A가 앞일 때 B의 점수
  const [b2, setB2] = useState(0.7); // B가 앞일 때 B의 점수
  const [a2, setA2] = useState(0.5); // B가 앞일 때 A의 점수
  const [flip, setFlip] = useState(true);

  const avgA = (a1 + a2) / 2;
  const avgB = (b1 + b2) / 2;
  const first = (a1 + b2) / 2;
  const second = (b1 + a2) / 2;
  const win1 = a1 === b1 ? '동점' : a1 > b1 ? 'A' : 'B';
  const win2 = a2 === b2 ? '동점' : a2 > b2 ? 'A' : 'B';

  return (
    <Viz
      title="심판이 준 점수는 순서를 뒤집어도 같은가"
      caption="이 점수는 측정값이 아니라 본문이 든 설명용 값입니다. 슬라이더로 점수를 바꿔 보세요. 같은 두 답을 순서만 뒤집어 두 번 채점하고, 두 번의 평균을 비교합니다."
    >
      <Controls>
        <Btn on={flip} onClick={() => setFlip(true)}>순서를 뒤집어 두 번 채점</Btn>
        <Btn on={!flip} onClick={() => setFlip(false)}>한 순서로만 채점</Btn>
        <Btn
          onClick={() => {
            setA1(0.8);
            setB1(0.4);
            setB2(0.7);
            setA2(0.5);
          }}
        >
          본문 값으로
        </Btn>
        <Btn
          onClick={() => {
            setA1(0.9);
            setFlip(false);
          }}
        >
          연습 3: 0.9 하나
        </Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <b style={{fontSize: '0.85rem'}}>순서 1: A가 앞</b>
          <Controls>
            <Slider label="A 점수" min={0} max={1} step={0.05} value={a1} onChange={setA1} format={f2} />
            <Slider label="B 점수" min={0} max={1} step={0.05} value={b1} onChange={setB1} format={f2} />
          </Controls>
          <Bar label="A (앞)" value={a1} max={1} color="var(--va)" text={f2(a1)} />
          <Bar label="B (뒤)" value={b1} max={1} color="var(--vb)" text={f2(b1)} />
          <p className={s.note}>이 순서의 승자: {win1}</p>
        </div>
        {flip ? (
          <div>
            <b style={{fontSize: '0.85rem'}}>순서 2: B가 앞</b>
            <Controls>
              <Slider label="B 점수" min={0} max={1} step={0.05} value={b2} onChange={setB2} format={f2} />
              <Slider label="A 점수" min={0} max={1} step={0.05} value={a2} onChange={setA2} format={f2} />
            </Controls>
            <Bar label="B (앞)" value={b2} max={1} color="var(--vb)" text={f2(b2)} />
            <Bar label="A (뒤)" value={a2} max={1} color="var(--va)" text={f2(a2)} />
            <p className={s.note}>이 순서의 승자: {win2}</p>
          </div>
        ) : (
          <div>
            <b style={{fontSize: '0.85rem'}}>순서 2: 채점하지 않음</b>
            <p className={s.note}>뒤집은 점수가 없으므로 평균을 만들 수 없습니다. {f2(a1)} 하나에는 앞에 놓인 효과와 내용의 효과가 같이 들어 있습니다.</p>
          </div>
        )}
      </div>
      <Stats>
        <Stat label="A의 평균" value={flip ? f2(avgA) : '계산 불가'} tone={flip ? undefined : 'bad'} />
        <Stat label="B의 평균" value={flip ? f2(avgB) : '계산 불가'} tone={flip ? undefined : 'bad'} />
        <Stat label="앞에 놓인 답의 평균 점수" value={flip ? f2(first) : '계산 불가'} />
        <Stat label="뒤에 놓인 답의 평균 점수" value={flip ? f2(second) : '계산 불가'} />
      </Stats>
      {flip ? (
        <Note>
          A의 내용은 같은데 {f2(a1)}에서 {f2(a2)}로 {a1 === a2 ? '변하지 않았습니다' : a1 > a2 ? '줄었습니다' : '늘었습니다'}. 두 번의 평균은 A가 ({f2(a1)} + {f2(a2)}) / 2 = {f2(avgA)}, B가 ({f2(b1)} + {f2(b2)}) / 2 = {f2(avgB)}입니다. 한 번만 본 {f2(a1)}과 {f2(b1)}의 간격 {f2(Math.abs(a1 - b1))}보다 평균의 간격 {f2(Math.abs(avgA - avgB))}이 {Math.abs(avgA - avgB) < Math.abs(a1 - b1) ? '좁습니다' : '좁지 않습니다'}.
          {win1 !== win2 ? ' 순서를 뒤집자 승자가 바뀌었습니다. 이 점수에는 순서가 섞여 있습니다.' : ''}
        </Note>
      ) : null}
    </Viz>
  );
}
