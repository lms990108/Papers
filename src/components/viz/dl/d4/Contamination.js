import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const VOCAB = ['오늘', '날씨', '좋다', '나쁘다'];
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)', 'var(--vok)'];

export default function Contamination() {
  const [seen, setSeen] = useState(true);
  const [rephrase, setRephrase] = useState(false);
  const [score, setScore] = useState(2);

  const e = [0, 0, score, 0].map((v) => Math.exp(v));
  const z = e.reduce((a, b) => a + b, 0);
  const p = e.map((v) => v / z);
  const loss = -Math.log(p[2]);

  let verdict;
  let tone;
  if (rephrase) {
    verdict = '시험 문장이 바뀌었습니다. 0.711이던 칸이 사라졌고, 자리의 정답도 입력 목록도 다릅니다. 원래 문장에서의 오차를 이 문장에 그대로 쓸 수 없습니다.';
    tone = 'bad';
  } else if (seen) {
    verdict = '시험 문장이 학습 문서에 있었습니다. 낮은 오차는 그 칸을 학습 때 이미 맞춘 결과일 수 있습니다.';
    tone = 'bad';
  } else {
    verdict = '시험 문장이 학습 문서에 없었다면, 이 오차는 처음 본 문장에서 나온 값으로 읽을 수 있습니다.';
    tone = 'good';
  }

  return (
    <Viz
      title="점수가 좋은 이유가 외워서일 수 있는가 (benchmark contamination)"
      caption="'오늘 날씨' 다음 칸의 점수가 0, 0, 2, 0일 때 '좋다'의 비율이 0.711, 오차가 0.341입니다(원문). 슬라이더로 '좋다'의 점수를 바꾸는 것은 설명용입니다. 학습이 그 칸을 더 맞출수록 점수가 오르고 오차가 줄어듭니다."
    >
      <Controls>
        <Btn on={seen} onClick={() => setSeen(true)}>시험 문장이 학습 문서에 있었다</Btn>
        <Btn on={!seen} onClick={() => setSeen(false)}>없었다</Btn>
        <Btn on={!rephrase} onClick={() => setRephrase(false)}>시험 문장: 오늘 날씨 좋다</Btn>
        <Btn on={rephrase} onClick={() => setRephrase(true)}>다른 말로: 날씨가 오늘 좋다</Btn>
      </Controls>
      <Controls>
        <Slider label="'좋다'의 점수 (설명용)" min={0} max={6} step={0.25} value={score} onChange={setScore} format={(v) => fmt(v, 2)} />
        <Btn onClick={() => setScore(2)}>원문 (2)</Btn>
      </Controls>
      {rephrase ? (
        <Note>다른 문장 “날씨가 오늘 좋다”의 칸별 비율은 따로 계산해야 하며, 아래 막대(오늘 날씨 다음 칸)를 쓸 수 없습니다.</Note>
      ) : null}
      {VOCAB.map((w, i) => (
        <Bar
          key={w}
          label={`‘오늘 날씨’ 다음: ${w}`}
          value={rephrase ? 0 : p[i]}
          max={1}
          color={COLORS[i]}
          text={rephrase ? '—' : fmt(p[i], 3)}
        />
      ))}
      <Stats>
        <Stat label="‘좋다’의 비율" value={rephrase ? '쓸 수 없음' : fmt(p[2], 3)} />
        <Stat label="오차 −ln(비율)" value={rephrase ? '쓸 수 없음' : fmt(loss, 3)} />
        <Stat label="읽는 법" value={tone === 'good' ? '그대로 읽기' : '조심해서 읽기'} tone={tone} />
      </Stats>
      <Note>{verdict} 점수를 읽을 때는 시험 문장이 학습 문서에 있었는지, 다른 말로 바꿨을 때 맞은 횟수가 줄어드는지가 같이 필요합니다.</Note>
    </Viz>
  );
}
