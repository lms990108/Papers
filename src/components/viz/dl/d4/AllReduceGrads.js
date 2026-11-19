import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const ORIG = [
  [1, 0, 0, 0],
  [0, 2, 0, 0],
  [0, 0, 3, 0],
  [0, 0, 0, 4],
];
const SAME = [
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
  [1, 0, 0, 0],
];
const show = (x) => (x === null ? '—' : fmt(x, 2).replace(/0+$/, '').replace(/\.$/, ''));

export default function AllReduceGrads() {
  const [g, setG] = useState(ORIG);
  const [mode, setMode] = useState('ar');
  const [stage, setStage] = useState(0);

  const sum = [0, 1, 2, 3].map((j) => g.reduce((a, row) => a + row[j], 0));
  const mean = sum.map((v) => v / 4);

  let rows;
  let title;
  if (stage === 0) {
    rows = g;
    title = '각 장이 만든 기울기';
  } else if (mode === 'ar') {
    rows = [0, 1, 2, 3].map(() => (stage === 1 ? sum : mean));
    title = stage === 1 ? 'all-reduce 뒤: 네 장이 모두 합을 가짐' : '합을 4로 나눈 평균 (이것으로 갱신)';
  } else if (stage === 1) {
    rows = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => (j === i ? sum[j] : null)));
    title = 'reduce-scatter 뒤: 장마다 합의 한 조각만 가짐';
  } else {
    rows = [0, 1, 2, 3].map(() => sum);
    title = 'all-gather 뒤: 모두에게 완성된 합';
  }

  const bump = (i, j) => {
    if (stage !== 0) return;
    setG(g.map((row, a) => row.map((v, b) => (a === i && b === j ? (v + 1) % 5 : v))));
  };

  return (
    <Viz
      title="데이터 병렬: 네 장의 기울기를 모아 같은 가중치로 갱신하기"
      caption="'처음' 단계에서 칸을 누르면 0~4로 바뀝니다. 기본값은 원문의 기울기 표입니다. 합을 그대로 갱신에 쓰면 평균의 4배입니다. 아래 단계 버튼으로 통신 전후를 비교하세요."
    >
      <Controls>
        <Btn on={g === ORIG} onClick={() => setG(ORIG)}>원문의 기울기</Btn>
        <Btn on={g === SAME} onClick={() => setG(SAME)}>연습 1: 모두 [1,0,0,0]</Btn>
      </Controls>
      <Controls>
        <Btn on={mode === 'ar'} onClick={() => setMode('ar')}>all-reduce</Btn>
        <Btn on={mode === 'rs'} onClick={() => setMode('rs')}>reduce-scatter 다음 all-gather</Btn>
      </Controls>
      <Controls>
        <Btn on={stage === 0} onClick={() => setStage(0)}>처음</Btn>
        <Btn on={stage === 1} onClick={() => setStage(1)}>{mode === 'ar' ? '합 (all-reduce)' : 'reduce-scatter'}</Btn>
        <Btn on={stage === 2} onClick={() => setStage(2)}>{mode === 'ar' ? '4로 나눈 평균' : 'all-gather'}</Btn>
      </Controls>
      <p className={s.note} style={{fontWeight: 600}}>{title}</p>
      <table className={s.grid}>
        <thead>
          <tr><th>장</th><th>칸 1</th><th>칸 2</th><th>칸 3</th><th>칸 4</th></tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              {row.map((v, j) => (
                <td key={j} className={stage > 0 && v !== null ? s.cellOn : undefined}>
                  {stage === 0 ? (
                    <button
                      type="button"
                      onClick={() => bump(i, j)}
                      aria-label={`${i + 1}번 장 ${j + 1}번째 칸 기울기 ${v}, 누르면 바뀜`}
                      style={{width: '100%', border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer'}}
                    >
                      {show(v)}
                    </button>
                  ) : (
                    show(v)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="칸마다 더한 합" value={`[${sum.map(show).join(', ')}]`} />
        <Stat label="4로 나눈 평균" value={`[${mean.map(show).join(', ')}]`} tone="good" />
        <Stat label="합으로 바로 갱신하면" value="기울기 4배" tone="bad" />
      </Stats>
      <Note>
        모두가 가진 값을 더해 모두에게 보내는 통신이 all-reduce입니다. 합을 4로 나누지 않고 쓰면 배치를 네 장으로 나눈 효과가 학습률에 네 번 곱해진 것과 같습니다. reduce-scatter는 더한 뒤 조각만 장마다 남기고, all-gather는 조각을 모아 모두에게 완성본을 줍니다.
      </Note>
    </Viz>
  );
}
