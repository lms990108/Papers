import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const TAGS = ['B-LOC', 'I-LOC', 'O'];
const WORDS = ['서울', '특별시'];
const SCORE = [
  {'B-LOC': 2, 'I-LOC': 0, O: 3},
  {'B-LOC': 0, 'I-LOC': 5, O: 0},
];

const paths = [];
TAGS.forEach((a) => TAGS.forEach((b) => paths.push([a, b])));
const total = (p) => SCORE[0][p[0]] + SCORE[1][p[1]];
const violates = (p) => p[0] === 'I-LOC' || (p[1] === 'I-LOC' && p[0] === 'O');
const cost = (p, pen) => -total(p) + (violates(p) ? pen : 0);

export default function PathCost() {
  const [pen, setPen] = useState(5);
  const rows = paths.map((p, i) => ({p, i, total: total(p), cost: cost(p, pen), bad: violates(p)}));
  const raw = rows.reduce((a, r) => (r.total > a.total ? r : a), rows[0]);
  const bestCost = Math.min(...rows.map((r) => r.cost));
  const winners = rows.filter((r) => r.cost === bestCost);
  const sorted = rows.slice().sort((a, b) => a.cost - b.cost || a.i - b.i);
  const ok = winners.length === 1 && !winners[0].bad;
  const rawWins = winners.some((r) => r.i === raw.i);

  return (
    <Viz
      title="점수만 고르기와 규칙 비용을 더한 경로 고르기"
      caption="서울: B-LOC 2, I-LOC 0, O 3. 특별시: B-LOC 0, I-LOC 5, O 0 (점수가 클수록 좋음). 비용은 점수 합의 부호를 바꾼 값이고, 시작 없는 I가 있는 열에 규칙 비용을 더합니다."
    >
      <Controls>
        <Slider label="시작 없는 I의 비용" min={0} max={8} step={1} value={pen} onChange={setPen} />
        <Btn on={pen === 0} onClick={() => setPen(0)}>비용 없음</Btn>
        <Btn on={pen === 5} onClick={() => setPen(5)}>원문 값 5</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>순위</th>
            <th>서울</th>
            <th>특별시</th>
            <th>점수 합</th>
            <th>규칙</th>
            <th>비용</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, k) => {
            const win = r.cost === bestCost;
            return (
              <tr key={r.i} className={win ? s.cellOn : undefined}>
                <td>{k + 1}</td>
                <td>{r.p[0]}</td>
                <td>{r.p[1]}</td>
                <td>{r.total}</td>
                <td style={{color: r.bad ? 'var(--vbad)' : 'var(--vok)'}}>{r.bad ? '어긋남' : '맞음'}</td>
                <td>{r.cost}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Stats>
        <Stat label="점수만 보면" value={raw.p.join(' + ')} tone={raw.bad ? 'bad' : 'good'} />
        <Stat label="비용을 넣으면" value={winners.map((r) => r.p.join(' + ')).join(' / ')} tone={ok ? 'good' : 'bad'} />
        <Stat label="최소 비용" value={String(bestCost)} />
      </Stats>
      <Note>
        {winners.length > 1
          ? '비용이 같은 열이 둘 이상입니다(동점). 어긋난 열이 맞는 열과 똑같이 좋아서 규칙이 아직 충분하지 않습니다.'
          : rawWins && raw.bad
            ? '비용이 작아서 어긋난 열 O + I-LOC이 이깁니다. 비용을 올려 보세요.'
            : '맞는 열 B-LOC + I-LOC(점수 합 7, 비용 −7)이 이깁니다. 맞는 열이 이기려면 어긋난 열의 비용 −8 + c가 −7보다 커야 하므로, c가 1보다 커야 합니다.'}
      </Note>
    </Viz>
  );
}
