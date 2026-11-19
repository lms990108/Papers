import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';

const NAMES = ['맑음', '비'];
const ORIGIN = [0, 0, 0, 1, 1, 0, 0, 1, 1, 1];

export default function TransitionCounter() {
  const [days, setDays] = useState(ORIGIN);
  const cnt = [[0, 0], [0, 0]];
  for (let i = 0; i + 1 < days.length; i += 1) cnt[days[i]][days[i + 1]] += 1;
  const rowSum = cnt.map((r) => r[0] + r[1]);

  return (
    <Viz
      title="상태가 보이는 10일 기록에서 전이표 만들기"
      caption="날짜 칸을 누르면 맑음과 비가 바뀝니다. 전이표는 센 횟수를 행의 합으로 나눈 값입니다. 기본값은 원문의 10일(맑음 맑음 맑음 비 비 맑음 맑음 비 비 비)입니다. 원문의 표는 이 예를 위해 직접 정한 값이고 실제 날씨 통계가 아닙니다."
    >
      <Controls>
        <Btn on={false} onClick={() => setDays(ORIGIN)}>원문 기록</Btn>
        <Btn on={false} onClick={() => setDays(days.map(() => 0))}>모두 맑음</Btn>
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 12px'}}>
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setDays(days.map((x, j) => (j === i ? 1 - x : x)))}
            aria-label={`${i + 1}일째 ${NAMES[d]}, 누르면 바뀜`}
            style={{minWidth: 52, padding: '6px 4px', border: '2px solid', borderColor: d ? 'var(--va)' : 'var(--vb)', borderRadius: 8, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', cursor: 'pointer'}}
          >
            <div className={s.ts}>{i + 1}일</div>
            <b>{NAMES[d]}</b>
          </button>
        ))}
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>전이 (행: 어제, 열: 오늘)</th>
            <th>맑음</th>
            <th>비</th>
            <th>행의 합</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1].map((a) => (
            <tr key={a}>
              <td>{NAMES[a]}</td>
              {[0, 1].map((b) => (
                <td key={b} className={rowSum[a] > 0 && cnt[a][b] > 0 ? s.cellOn : undefined}>
                  {rowSum[a] > 0 ? `${cnt[a][b]}/${rowSum[a]} = ${fmt(cnt[a][b] / rowSum[a], 2)}` : '-'}
                </td>
              ))}
              <td>{rowSum[a] > 0 ? '1' : '출발 횟수 0'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        10일이면 전이는 {days.length - 1}번입니다. 마지막 날은 출발한 전이가 없습니다.
        {rowSum[0] === 0 || rowSum[1] === 0 ? ' 한 상태에서 출발한 전이가 하나도 없으면 그 행의 확률은 정할 수 없습니다.' : ' 맑음 열의 합은 1이 아니라는 점도 확인해 보세요.'}
      </Note>
    </Viz>
  );
}
