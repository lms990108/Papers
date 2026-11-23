import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';

const TOK = ['오늘', '날씨', '좋다'];
const INIT = [
  [2, 0, 1],
  [2, 1, 3],
  [1, 2, 1],
];

const softmax = (row, allowed) => {
  const e = row.map((v, j) => (allowed[j] ? Math.exp(v) : 0));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
};

function Table({title, scores, causal, sel}) {
  return (
    <div>
      <div className={s.title}>{title}</div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>묻는 쪽 ↓ / 보는 쪽 →</th>
            {TOK.map((t) => (
              <th key={t}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scores.map((row, i) => {
            const allowed = row.map((v, j) => !causal || j <= i);
            const p = softmax(row, allowed);
            return (
              <tr key={i}>
                <th>{TOK[i]}</th>
                {p.map((v, j) => (
                  <td
                    key={j}
                    className={i === sel && allowed[j] ? s.cellOn : undefined}
                    style={allowed[j] ? undefined : {color: 'var(--ifm-color-emphasis-500)', background: 'var(--ifm-color-emphasis-100)'}}
                  >
                    {allowed[j] ? fmt(v, 3) : '가림'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AttentionMasks() {
  const [scores, setScores] = useState(INIT);
  const [sel, setSel] = useState(1);
  const set = (j, v) => setScores(scores.map((row, i) => (i === sel ? row.map((x, c) => (c === j ? v : x)) : row)));
  const row = scores[sel];
  const full = softmax(row, [true, true, true]);
  const fut = TOK.map((t, j) => j > sel);
  const leak = full.reduce((a, v, j) => a + (fut[j] ? v : 0), 0);

  return (
    <Viz
      title="양방향 어텐션 표와 앞만 보는 어텐션 표"
      caption="같은 점수에서 소프트맥스를 한 줄(행)씩 계산한 표입니다. 점수는 설명용 값입니다. 행을 고르고 점수를 바꿔 보세요. 오른쪽 표는 뒤쪽 칸을 가린 뒤 소프트맥스를 합니다."
    >
      <Controls>
        {TOK.map((t, i) => (
          <Btn key={t} on={i === sel} onClick={() => setSel(i)}>
            {t} 행 고르기
          </Btn>
        ))}
        <Btn onClick={() => setScores(INIT)}>점수 되돌리기</Btn>
      </Controls>
      <Controls>
        {TOK.map((t, j) => (
          <Slider key={t} label={TOK[sel] + ' 행의 ' + t + ' 칸 점수'} min={-2} max={5} step={0.5} value={row[j]} onChange={(v) => set(j, v)} format={(v) => fmt(v, 1)} />
        ))}
      </Controls>
      <div className={s.two}>
        <Table title="양방향 (버트): 앞뒤를 모두 봅니다" scores={scores} causal={false} sel={sel} />
        <Table title="인과 (다음 token): 자기 앞만 봅니다" scores={scores} causal sel={sel} />
      </div>
      <Note>
        {TOK[sel]} 행에서 뒤쪽 token이 가져가는 비율은 양방향 표에서 {fmt(leak, 3)}이고, 인과 표에서는 0입니다.
        {sel === 2
          ? ' 마지막 token은 뒤쪽이 없어서 두 표의 행이 같습니다.'
          : ' 다음 단어를 맞히는 학습에서 이 비율이 살아 있으면 정답이 입력으로 새 버립니다.'}
      </Note>
    </Viz>
  );
}
