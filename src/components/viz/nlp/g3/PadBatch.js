import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const BATCH = [
  ['날씨', '좋다'],
  ['오늘', '날씨', '정말', '좋다'],
];

export default function PadBatch() {
  const [maxLen, setMaxLen] = useState(4);
  const [front, setFront] = useState(false);

  const rows = BATCH.map((toks) => {
    const kept = toks.slice(0, maxLen);
    const cut = toks.slice(maxLen);
    const pads = Math.max(0, maxLen - kept.length);
    const cells = front
      ? Array(pads).fill(null).concat(kept)
      : kept.concat(Array(pads).fill(null));
    return {cells, cut, kept: kept.length, pads};
  });
  const total = maxLen * BATCH.length;
  const padN = rows.reduce((acc, r) => acc + r.pads, 0);
  const cutN = rows.reduce((acc, r) => acc + r.cut.length, 0);
  const longest = Math.max(...BATCH.map((b) => b.length));

  return (
    <Viz
      title="길이가 다른 문장을 한 묶음으로"
      caption="최대 길이를 바꾸면 짧은 문장은 빈 칸(0)으로 채워지고, 긴 문장은 앞쪽 token만 남고 잘립니다. 0은 번호가 아니라 빈 칸이라는 표시입니다. 마스크는 칸마다 실제 단어면 1, 빈 칸이면 0으로 적은 목록입니다. 밑줄은 마지막 실제 단어입니다."
    >
      <Controls>
        <Slider label="최대 길이" min={1} max={6} value={maxLen} onChange={setMaxLen} />
        <Btn on={maxLen === longest} onClick={() => setMaxLen(longest)}>가장 긴 문장에 맞추기</Btn>
        <Btn on={!front} onClick={() => setFront(false)}>뒤에 붙이기</Btn>
        <Btn on={front} onClick={() => setFront(true)}>앞에 붙이기</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문장</th>
            {Array.from({length: maxLen}, (_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
            <th>마스크</th>
            <th>잘린 token</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => {
            const lastReal = front ? maxLen - 1 : r.kept - 1;
            return (
              <tr key={k}>
                <td>{k + 1}</td>
                {r.cells.map((c, i) => (
                  <td
                    key={i}
                    className={c === null ? s.cellOn : undefined}
                    style={i === lastReal && c !== null ? {textDecoration: 'underline'} : undefined}
                  >
                    {c === null ? '0' : c}
                  </td>
                ))}
                <td>[{r.cells.map((c) => (c === null ? 0 : 1)).join(', ')}]</td>
                <td style={{textDecoration: r.cut.length ? 'line-through' : undefined}}>{r.cut.length ? r.cut.join(' ') : '없음'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Stats>
        <Stat label="전체 칸" value={total} />
        <Stat label="빈 칸" value={padN} tone={padN > 0 ? 'bad' : 'good'} />
        <Stat label="빈 칸 비율" value={`${fmt((padN / total) * 100, 1)}%`} />
        <Stat label="잘린 token" value={cutN} tone={cutN > 0 ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {maxLen < longest
          ? '최대 길이가 가장 긴 문장보다 짧으면 잘리는 token이 생깁니다. 잘린 뒤의 단어는 그 학습 단계에 없습니다.'
          : maxLen === longest
          ? '가장 긴 문장에 맞추면 아무것도 잘리지 않고 짧은 문장에만 빈 칸이 붙습니다.'
          : '최대 길이를 가장 긴 문장보다 크게 잡으면 잘리는 것 없이 빈 칸만 늘어납니다.'}
        {front ? ' 앞에 붙이면 모든 문장의 마지막 실제 단어가 같은 칸에 놓입니다.' : ''}
      </Note>
    </Viz>
  );
}
