import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {softmax} from './util';

const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];

function Panel({title, scores, tone}) {
  const p = softmax(scores);
  const grad = p[0] * (1 - p[0]);
  return (
    <div>
      <div className={s.title}>{title}</div>
      <p className={s.note} style={{marginTop: 0}}>
        점수: [{scores.map((v) => fmt(v, 2)).join(', ')}]
      </p>
      {p.map((v, j) => (
        <Bar key={j} label={`열쇠 ${j + 1}`} value={v} max={1} color={COLORS[j]} text={fmt(v, 3)} />
      ))}
      <Stats>
        <Stat label="첫 비율 p" value={fmt(p[0], 3)} />
        <Stat label="기울기 p(1-p)" value={fmt(grad, 4)} tone={tone} />
      </Stats>
    </div>
  );
}

export default function AttentionSharpness() {
  const [score, setScore] = useState(8);
  const [keys, setKeys] = useState(4);
  const [k, setK] = useState(6);

  const d = Math.pow(2, k);
  const raw = [score].concat(Array(keys - 1).fill(0));
  const div = raw.map((v) => v / Math.sqrt(d));
  const g0 = softmax(raw)[0] * (1 - softmax(raw)[0]);
  const g1 = softmax(div)[0] * (1 - softmax(div)[0]);

  return (
    <Viz
      title="점수가 커지면 비율이 한 칸으로 쏠립니다"
      caption="첫 열쇠의 점수를 키워 보세요. 왼쪽은 나누지 않은 점수, 오른쪽은 √d로 나눈 점수의 소프트맥스입니다. 나머지 열쇠의 점수는 0으로 둔 설명용 값입니다."
    >
      <Controls>
        <Btn on={score === 8 && keys === 4 && k === 6} onClick={() => { setScore(8); setKeys(4); setK(6); }}>
          본문의 예 (점수 8, 열쇠 4개, d = 64)
        </Btn>
        <Btn on={score === 2 && keys === 2 && k === 2} onClick={() => { setScore(2); setKeys(2); setK(2); }}>
          연습 문제 2 (점수 2, 열쇠 2개, d = 4)
        </Btn>
        <Btn on={keys === 2} onClick={() => setKeys(2)}>열쇠 2개</Btn>
        <Btn on={keys === 4} onClick={() => setKeys(4)}>열쇠 4개</Btn>
      </Controls>
      <Controls>
        <Slider label="첫 열쇠의 점수" min={0} max={16} step={0.5} value={score} onChange={setScore} format={(v) => fmt(v, 1)} />
        <Slider label="칸 수 d" min={0} max={9} step={1} value={k} onChange={setK} format={() => `${d} (√d = ${fmt(Math.sqrt(d), 2)})`} />
      </Controls>
      <div className={s.two}>
        <Panel title="나누기 전" scores={raw} tone={g0 < 0.01 ? 'bad' : undefined} />
        <Panel title={`√d = ${fmt(Math.sqrt(d), 2)}로 나눈 뒤`} scores={div} tone={g1 < 0.01 ? 'bad' : 'good'} />
      </div>
      {g0 < 0.01 ? (
        <Note>나누지 않으면 비율이 한 칸에 거의 1로 쏠리고, 그 칸의 기울기 p(1-p)가 0에 가까워져 학습이 멈춥니다.</Note>
      ) : (
        <Note>점수를 키우면 나누기 전 비율이 먼저 쏠립니다. d를 키울수록 나눈 뒤의 비율은 평평해집니다.</Note>
      )}
    </Viz>
  );
}
