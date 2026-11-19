import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const N = 8;
const KS = [2, 4, 8];

export default function FoldRotator() {
  const [k, setK] = useState(4);
  const [f, setF] = useState(0);
  const cur = Math.min(f, k - 1);
  const size = N / k;
  const fold = (i) => Math.floor(i / size);
  const idx = [];
  for (let i = 0; i < N; i += 1) idx.push(i);
  const rounds = [];
  for (let r = 0; r < k; r += 1) rounds.push(r);

  return (
    <Viz
      title="교차 검증: 묶음을 돌려 가며 검증으로 쓰기"
      caption="시험 둘을 떼고 남은 여덟 문장을 k묶음으로 나눕니다. 한 묶음씩 돌아가며 검증으로 쓰고 나머지로 학습합니다. 시험 둘은 끝에 한 번만 씁니다."
    >
      <Controls>
        {KS.map((q) => (
          <Btn key={q} on={q === k} onClick={() => {setK(q); setF(0);}}>{q}묶음</Btn>
        ))}
        <Btn onClick={() => setF((cur + 1) % k)}>다음 묶음을 검증으로</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>학습 횟수</th>
            {idx.map((i) => <th key={i}>문장 {i + 1}</th>)}
            <th>시험 2</th>
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r} className={r === cur ? s.cellOn : undefined}>
              <th>{r + 1}번째</th>
              {idx.map((i) => (
                <td key={i} style={{color: fold(i) === r ? 'var(--va)' : undefined, fontWeight: fold(i) === r ? 700 : 400}}>
                  {fold(i) === r ? '검증' : '학습'}
                </td>
              ))}
              <td style={{color: 'var(--ifm-color-emphasis-700)'}}>건드리지 않음</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Stats>
        <Stat label="한 번의 학습 문장 수" value={String(N - size)} />
        <Stat label="한 번의 검증 문장 수" value={String(size)} />
        <Stat label="학습 횟수" value={k + '번'} />
        <Stat label="문장 하나가 검증에 쓰인 횟수" value="정확히 1번" tone="good" />
      </Stats>
      <Note>
        {k === 4 ? '4묶음이면 학습 6, 검증 2로 4번 학습합니다. ' : ''}
        k번의 검증 오류를 평균하면 문장 하나가 검증으로 한 번씩만 쓰인 값이라 안정적이지만, 학습을 k번 해야 합니다. 시험 둘은 그 뒤에 한 번만 셉니다.
      </Note>
    </Viz>
  );
}
