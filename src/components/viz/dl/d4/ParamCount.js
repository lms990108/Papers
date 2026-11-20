import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const PRESETS = [
  {name: 'MNIST 은닉 300개', n: 784, h: 300, o: 10, P: 60000},
  {name: '연습 문제 3', n: 100, h: 20, o: 5, P: 500},
];
const comma = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function ParamCount() {
  const [n, setN] = useState(784);
  const [h, setH] = useState(300);
  const [o, setO] = useState(10);
  const [P, setP] = useState(60000);

  const l1 = (n + 1) * h;
  const l2 = (h + 1) * o;
  const total = l1 + l2;
  const ratio = P > 0 ? total / P : NaN;
  const more = total > P;

  return (
    <Viz
      title="완전 연결망의 파라미터 수와 학습 쌍의 수 비교"
      caption="각 층의 파라미터는 (입력 수 + 1) × 출력 수입니다. 1은 바이어스(편향)입니다. 기본값은 본문의 MNIST 예(입력 28×28 = 784, 은닉 300, 출력 10, 학습 영상 60,000장)이고, 버튼으로 연습 문제 3의 값을 불러올 수 있습니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn
            key={p.name}
            on={n === p.n && h === p.h && o === p.o && P === p.P}
            onClick={() => {
              setN(p.n);
              setH(p.h);
              setO(p.o);
              setP(p.P);
            }}
          >
            {p.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="입력" min={1} max={1000} value={n} onChange={setN} />
        <Slider label="은닉" min={1} max={1000} value={h} onChange={setH} />
        <Slider label="출력" min={1} max={100} value={o} onChange={setO} />
      </Controls>
      <Controls>
        <Slider label="학습 쌍 P" min={100} max={100000} step={100} value={P} onChange={setP} format={comma} />
      </Controls>
      <Bar label={`첫 층 (${n}+1)×${h}`} value={l1} max={Math.max(total, P, 1)} color="var(--va)" text={comma(l1)} />
      <Bar label={`둘째 층 (${h}+1)×${o}`} value={l2} max={Math.max(total, P, 1)} color="var(--vc)" text={comma(l2)} />
      <Bar label="파라미터 합" value={total} max={Math.max(total, P, 1)} color="var(--vb)" text={comma(total)} />
      <Bar label="학습 쌍 P" value={P} max={Math.max(total, P, 1)} color="var(--vok)" text={comma(P)} />
      <Stats>
        <Stat label="파라미터 ÷ 학습 쌍" value={Number.isFinite(ratio) ? `${fmt(ratio, 2)}배` : '—'} tone={more ? 'bad' : 'good'} />
        <Stat label="더 많은 쪽" value={more ? '파라미터' : total === P ? '같음' : '학습 쌍'} />
      </Stats>
      <Note>
        {more
          ? '파라미터가 학습 쌍보다 많습니다. 이런 경우 학습 오류만으로는 외웠는지 알 수 없어서 따로 둔 검증과 시험이 필요합니다.'
          : '학습 쌍이 파라미터보다 같거나 많습니다. 용량 대비 쌍이 넉넉하면 외울 자리가 줄어듭니다.'}
        {' '}
        MNIST 예는 785×300 + 301×10 = 238,510개로 영상 수의 4배 가까이이고, 연습 문제 3은 2,125개로 쌍 500개의 4배를 넘습니다.
      </Note>
    </Viz>
  );
}
