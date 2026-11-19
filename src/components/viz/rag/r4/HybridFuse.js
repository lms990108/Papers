import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {QUERIES, byId, bm25List, denseList, rrf} from './advData';

const initLists = (q) => ({kw: bm25List(q.toks), de: denseList(q.dense)});

const short = (t) => (t.length > 22 ? `${t.slice(0, 22)}…` : t);

function Column({title, ids, win, answer, onMove}) {
  return (
    <div>
      <div className={s.title} style={{margin: '0 0 4px'}}>{title}</div>
      {ids.length === 0 ? <div className={s.note}>목록이 비었습니다.</div> : null}
      {ids.map((id, i) => {
        const out = i >= win;
        return (
          <div
            key={id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2em 1fr auto',
              alignItems: 'center',
              gap: 6,
              padding: '3px 6px',
              marginBottom: 3,
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 6,
              fontSize: '0.82rem',
              opacity: out ? 0.45 : 1,
              background: answer.indexOf(id) >= 0 ? 'color-mix(in srgb, var(--vok) 14%, transparent)' : 'transparent',
            }}
          >
            <b>{i + 1}위</b>
            <span>{id} {short(byId(id).text)}{answer.indexOf(id) >= 0 ? ' (정답)' : ''}{out ? ' [창 밖]' : ''}</span>
            <span style={{whiteSpace: 'nowrap'}}>
              <button type="button" className={s.btn} style={{padding: '0 8px'}} disabled={i === 0} aria-label={`${id}를 한 칸 위로`} onClick={() => onMove(i, -1)}>▲</button>{' '}
              <button type="button" className={s.btn} style={{padding: '0 8px'}} disabled={i === ids.length - 1} aria-label={`${id}를 한 칸 아래로`} onClick={() => onMove(i, 1)}>▼</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function HybridFuse() {
  const [qi, setQi] = useState(0);
  const [lists, setLists] = useState(() => initLists(QUERIES[0]));
  const [k, setK] = useState(60);
  const [win, setWin] = useState(8);
  const q = QUERIES[qi];

  const pick = (i) => {
    setQi(i);
    setLists(initLists(QUERIES[i]));
  };
  const move = (key) => (i, d) => {
    setLists((prev) => {
      const a = prev[key].slice();
      const j = i + d;
      if (j < 0 || j >= a.length) return prev;
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
      return {...prev, [key]: a};
    });
  };

  const kw = lists.kw.slice(0, win);
  const de = lists.de.slice(0, win);
  const {score, order} = rrf([kw, de], k);
  const rk = (list, id) => (list.indexOf(id) >= 0 ? list.indexOf(id) + 1 : null);
  const pos = (list, a) => {
    const ps = a.map((id) => rk(list, id)).filter((x) => x);
    return ps.length ? `${Math.min(...ps)}위` : '목록 밖';
  };
  const ansFused = order.length ? `${Math.min(...q.answer.map((id) => (order.indexOf(id) >= 0 ? order.indexOf(id) + 1 : 99)))}` : '99';
  const top = order[0];
  const topTerms = top
    ? [rk(kw, top), rk(de, top)].filter((x) => x).map((r) => `1/(${k}+${r})`)
    : [];
  const topVals = top
    ? [rk(kw, top), rk(de, top)].filter((x) => x).map((r) => fmt(1 / (k + r), 5))
    : [];

  return (
    <Viz
      title="두 순위를 reciprocal rank fusion으로 합치기"
      caption="질문을 고르고, ▲▼로 순위를 바꾸고, k와 창 크기를 움직여 보세요. 키워드 목록은 위 BM25 함수로 계산한 값이고, 임베딩 목록은 설명용 코사인으로 만든 순위입니다. 합친 점수는 Cormack 등(2009)의 함수 그대로입니다."
    >
      <Controls>
        {QUERIES.map((x, i) => (
          <Btn key={x.key} on={i === qi} onClick={() => pick(i)}>질문: {x.text}</Btn>
        ))}
        <Btn on={false} onClick={() => setLists(initLists(q))}>순위 처음으로</Btn>
      </Controls>
      <Controls>
        <Slider label="상수 k" min={1} max={200} value={k} onChange={setK} />
        <Slider label="목록에서 쓰는 상위 개수(창)" min={1} max={8} value={win} onChange={setWin} />
      </Controls>
      <div className={s.two}>
        <Column title="키워드 검색(BM25)" ids={lists.kw} win={win} answer={q.answer} onMove={move('kw')} />
        <Column title="임베딩 검색" ids={lists.de} win={win} answer={q.answer} onMove={move('de')} />
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>합친 순위</th>
            <th>청크</th>
            <th>키워드 순위</th>
            <th>임베딩 순위</th>
            <th>RRF 점수</th>
          </tr>
        </thead>
        <tbody>
          {order.map((id, i) => (
            <tr key={id} className={q.answer.indexOf(id) >= 0 ? s.cellOn : undefined}>
              <td>{i + 1}</td>
              <td style={{textAlign: 'left'}}>{id}{q.answer.indexOf(id) >= 0 ? ' (정답)' : ''}</td>
              <td>{rk(kw, id) || '—'}</td>
              <td>{rk(de, id) || '—'}</td>
              <td>{fmt(score[id], 5)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {top ? (
        <Note>
          1등 {top}의 계산: {topTerms.join(' + ')} = {topVals.join(' + ')} = {fmt(score[top], 5)}. 목록에 없는 쪽(—)은 항이 없습니다.
        </Note>
      ) : (
        <Note>두 목록이 모두 비어서 합칠 것이 없습니다. 창 크기를 키워 보세요.</Note>
      )}
      <Stats>
        <Stat label="키워드 목록에서 정답" value={pos(kw, q.answer)} tone={pos(kw, q.answer) === '1위' ? 'good' : 'bad'} />
        <Stat label="임베딩 목록에서 정답" value={pos(de, q.answer)} tone={pos(de, q.answer) === '1위' ? 'good' : 'bad'} />
        <Stat label="합친 뒤 정답" value={ansFused === '99' ? '목록 밖' : `${ansFused}위`} tone={ansFused === '1' ? 'good' : 'bad'} />
      </Stats>
      <Note>{q.note}</Note>
    </Viz>
  );
}
