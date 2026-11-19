import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const GOOD = [[1, -2], [1, -1], [1, 0], [2, -2], [2, -1], [2, 0]];
const PRESETS = [
  {t: '(1, 1)', x: [1, 1]},
  {t: '(2, 1)', x: [2, 1]},
  {t: '(1, 2)', x: [1, 2]},
  {t: '나쁘지 않다 (0, 0)', x: [0, 0]},
];

export default function NewReviewVote() {
  const [x, setX] = useState([1, 1]);
  const rows = GOOD.map((w) => {
    const sc = w[0] * x[0] + w[1] * x[1];
    return {w, sc, pos: sc > 0};
  });
  const np = rows.filter((r) => r.pos).length;
  const split = np > 0 && np < rows.length;

  return (
    <Viz
      title="학습 쌍을 다 맞히는 가중치 여섯 개에 새 리뷰를 넣어 보기"
      caption="아래 여섯 쌍은 학습 쌍 네 개를 모두 맞히는 후보입니다. 학습에 없던 새 리뷰의 특성을 바꿔 보세요. 후보끼리 답이 갈리는 입력이 있습니다."
    >
      <Controls>
        <Slider label="새 리뷰의 좋다 횟수 x1" min={0} max={3} step={1} value={x[0]} onChange={(v) => setX([v, x[1]])} />
        <Slider label="나쁘다 횟수 x2" min={0} max={3} step={1} value={x[1]} onChange={(v) => setX([x[0], v])} />
      </Controls>
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={x[0] === p.x[0] && x[1] === p.x[1]} onClick={() => setX(p.x)}>{p.t}</Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr><th>후보 w</th><th>점수 s</th><th>읽은 답</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.w.join()} className={split && r.pos ? s.cellOn : undefined}>
              <td>({r.w[0]}, {r.w[1]})</td>
              <td><b>{r.sc}</b></td>
              <td>{r.pos ? '긍정' : '부정'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="긍정으로 읽은 후보" value={np + ' / 6'} />
        <Stat label="부정으로 읽은 후보" value={6 - np + ' / 6'} />
        <Stat label="후보끼리" value={split ? '답이 갈림' : '답이 같음'} tone={split ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {split
          ? '같은 학습 쌍을 다 맞힌 가중치인데 새 리뷰에서는 답이 다릅니다. 학습 데이터만으로는 이 중 무엇을 고를지 정해지지 않습니다.'
          : x[0] === 0 && x[1] === 0
            ? '입력이 (0, 0)이면 가중치가 무엇이든 점수가 0이라 여섯 후보 모두 부정으로 읽습니다.'
            : '이 입력에서는 여섯 후보의 답이 같습니다. (1, 1)처럼 좋다와 나쁘다가 같이 나오는 입력을 골라 보세요.'}
      </Note>
    </Viz>
  );
}
