import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const CATS = ['구조', '하이퍼파라미터', '파라미터', '입력과 정답'];

// 원문의 표와 본문에서 가져온 항목
const ITEMS = [
  {t: '층을 몇 개 둘지', ok: ['구조'], why: '층 수는 구조입니다. 학습 전에 사람이 정하고 학습 중에는 바뀌지 않습니다.'},
  {t: '784 → 100 → 10에서 층마다의 칸 수', ok: ['구조'], why: '층마다의 칸 수는 구조의 예입니다(784 → 100 → 10).'},
  {t: '5×5 창으로 앞 층의 어디를 볼지', ok: ['구조'], why: '어느 칸이 어느 칸을 볼지도 구조가 정합니다.'},
  {t: '모든 자리가 같은 빈칸을 쓰는지', ok: ['구조'], why: '빈칸을 어디서 같이 쓸지도 구조입니다. 가중치 공유가 그런 구조입니다.'},
  {t: '구부러지는 함수를 tanh로 둘지', ok: ['구조'], why: '어떤 함수를 쓸지는 학습이 고르지 않고, 사람이 구조를 정할 때 정합니다.'},
  {t: '은닉 칸 수', ok: ['구조', '하이퍼파라미터'], why: '은닉 칸 수는 구조의 일부이면서 하이퍼파라미터이기도 합니다. 두 말이 겹치는 부분입니다.'},
  {t: '학습률 0.1', ok: ['하이퍼파라미터'], why: '학습률은 배선이 아니라 경사하강법의 보폭입니다. 학습 전에 사람이 고르는 수입니다.'},
  {t: '선 위의 가중치 0.5와 -0.2', ok: ['파라미터'], why: '선 위에 적히는 수가 파라미터이고 갱신마다 바뀝니다.'},
  {t: '임베딩 행 안의 수', ok: ['파라미터'], why: '임베딩 목록 안의 수도 파라미터입니다. 학습이 고칩니다.'},
  {t: '7이라고 쓰인 그림', ok: ['입력과 정답'], why: '그림은 데이터이고 구조 밖에 있습니다.'},
  {t: '그 그림에 붙은 정답 7', ok: ['입력과 정답'], why: '정답도 데이터입니다. 구조 밖에 있고 바뀌지 않습니다.'},
];

export default function RoleSorter() {
  const [picks, setPicks] = useState([]); // 고른 분류 목록
  const idx = picks.length;
  const done = idx >= ITEMS.length;
  const [shown, setShown] = useState(false); // 방금 고른 항목의 해설을 보는 중
  const lastIdx = shown ? idx - 1 : idx;
  const item = ITEMS[Math.min(lastIdx, ITEMS.length - 1)];
  const lastPick = picks[picks.length - 1];
  const score = picks.filter((p, i) => ITEMS[i].ok.indexOf(p) >= 0).length;

  const choose = (c) => {
    if (shown || done) return;
    setPicks(picks.concat([c]));
    setShown(true);
  };

  return (
    <Viz
      title="구조, 하이퍼파라미터, 파라미터, 입력과 정답 분류하기"
      caption="항목마다 어느 쪽인지 눌러 보세요. 분류는 원문의 표를 따릅니다. 학습 중에 바뀌는 것은 파라미터뿐입니다."
    >
      {done && !shown ? (
        <>
          <Stats>
            <Stat label="맞힌 개수" value={`${score} / ${ITEMS.length}`} tone={score === ITEMS.length ? 'good' : undefined} />
          </Stats>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>항목</th>
                <th>내 답</th>
                <th>정답</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((it, i) => (
                <tr key={it.t}>
                  <td>{it.t}</td>
                  <td className={it.ok.indexOf(picks[i]) >= 0 ? undefined : s.cellOn}>{picks[i]}</td>
                  <td>{it.ok.join(' 또는 ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Controls>
            <Btn onClick={() => setPicks([])}>처음부터 다시</Btn>
          </Controls>
        </>
      ) : (
        <>
          <p style={{margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-700)'}}>
            {Math.min(lastIdx + 1, ITEMS.length)} / {ITEMS.length}
          </p>
          <div
            style={{
              padding: '12px 14px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 10,
              background: 'var(--ifm-color-emphasis-100)',
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            {item.t}
          </div>
          <Controls>
            {CATS.map((c) => (
              <Btn key={c} on={shown && lastPick === c} onClick={() => choose(c)}>
                {c}
              </Btn>
            ))}
          </Controls>
          {shown ? (
            <>
              <Note>
                <b>{item.ok.indexOf(lastPick) >= 0 ? '맞습니다. ' : `정답은 ${item.ok.join(' 또는 ')}입니다. `}</b>
                {item.why}
              </Note>
              <Controls>
                <Btn onClick={() => setShown(false)}>{idx >= ITEMS.length ? '결과 보기' : '다음 항목'}</Btn>
              </Controls>
            </>
          ) : null}
        </>
      )}
    </Viz>
  );
}
