import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 설명용 평가 세트: 질문마다 정답 청크(rel)와, 검색 시스템 하나가 돌려준 전체 순위(설명용).
const SET = [
  {q: '연차는 며칠인가요?', rel: ['c1'], rank: ['c1', 'c3', 'c2', 'c7', 'c6', 'c4', 'c5', 'c8']},
  {q: '휴가 일수', rel: ['c1'], rank: ['c4', 'c6', 'c1', 'c3', 'c2', 'c7', 'c5', 'c8']},
  {q: '연차 이월', rel: ['c3'], rank: ['c3', 'c1', 'c2', 'c7', 'c6', 'c4', 'c5', 'c8']},
  {q: '입사 첫해 연차는 며칠이고 병가는 연차에서 빠지나요?', rel: ['c1', 'c2'], rank: ['c2', 'c3', 'c1', 'c7', 'c6', 'c4', 'c5', 'c8']},
  {q: 'ERR-4021이 뭔가요?', rel: ['c7'], rank: ['c8', 'c7', 'c4', 'c5', 'c1', 'c2', 'c3', 'c6']},
];

const pct = (a, b) => (b === 0 ? '—' : `${fmt((a / b) * 100, 0)}%`);

export default function RetrievalEval() {
  const [k, setK] = useState(2);
  // 생성 답이 정답과 같은지: 직접 표시하는 설명용 값
  const [gen, setGen] = useState([true, false, true, false, false]);
  const flip = (i) => setGen((g) => g.map((x, j) => (j === i ? !x : x)));

  const rows = SET.map((e, i) => {
    const top = e.rank.slice(0, k);
    const got = e.rel.filter((id) => top.indexOf(id) >= 0).length;
    return {...e, top, got, recall: got / e.rel.length, hit: got > 0, ok: gen[i]};
  });
  const n = rows.length;
  const recall = rows.reduce((a, r) => a + r.recall, 0) / n;
  const hits = rows.filter((r) => r.hit).length;
  const okAll = rows.filter((r) => r.ok).length;
  const okHit = rows.filter((r) => r.hit && r.ok).length;
  const okMiss = rows.filter((r) => !r.hit && r.ok).length;

  return (
    <Viz
      title="검색 단계와 생성 단계를 따로 재기"
      caption="k를 바꿔 recall@k를 보고, 질문마다 생성 답이 맞았는지를 눌러 바꿔 보세요. 질문 5개, 검색 순위, 생성 정답 여부는 모두 설명용 값입니다."
    >
      <Controls>
        <Slider label="k (상위로 볼 개수)" min={1} max={8} value={k} onChange={setK} />
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문</th>
            <th>정답 청크</th>
            <th>상위 k개</th>
            <th>recall</th>
            <th>생성 답</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.q}>
              <td style={{textAlign: 'left'}}>{r.q}</td>
              <td>{r.rel.join(', ')}</td>
              <td style={{textAlign: 'left'}}>
                {r.top.map((id) => (
                  <span key={id} style={{marginRight: 6, fontWeight: r.rel.indexOf(id) >= 0 ? 700 : 400, color: r.rel.indexOf(id) >= 0 ? 'var(--vok)' : undefined}}>
                    {id}{r.rel.indexOf(id) >= 0 ? '(정답)' : ''}
                  </span>
                ))}
              </td>
              <td>{fmt(r.recall, 2)}</td>
              <td>
                <Btn on={r.ok} onClick={() => flip(i)}>{r.ok ? '맞음' : '틀림'}</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label={`recall@${k}(질문 평균)`} value={fmt(recall, 2)} />
        <Stat label={`hit@${k}(하나라도 포함)`} value={`${hits} / ${n}`} />
        <Stat label="답 정확도(끝에서 끝)" value={`${okAll} / ${n}`} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            <th>답이 맞음</th>
            <th>답이 틀림</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>검색이 정답을 올림({hits})</b></td>
            <td>{okHit}</td>
            <td className={hits - okHit > 0 ? s.cellOn : undefined}>{hits - okHit}</td>
          </tr>
          <tr>
            <td><b>검색이 못 올림({n - hits})</b></td>
            <td className={okMiss > 0 ? s.cellOn : undefined}>{okMiss}</td>
            <td>{n - hits - okMiss}</td>
          </tr>
        </tbody>
      </table>
      <Note>
        검색이 올린 질문 중 답이 맞은 비율은 {pct(okHit, hits)}이고, 검색이 못 올린 질문 중 답이 맞은 비율은 {pct(okMiss, n - hits)}입니다.
        {okMiss > 0 ? ' 검색이 못 올렸는데 답이 맞은 칸은, 근거 없이 우연히 일치했을 수 있어서 답 정확도만 보면 검색 실패가 가려집니다.' : ' 끝에서 끝 정확도 하나만 보면 틀린 답이 검색 탓인지 생성 탓인지 알 수 없습니다.'}
        {' '}“올렸는데 틀림” 칸이 크면 생성 쪽을, “못 올림” 줄이 크면 검색 쪽을 먼저 봅니다.
      </Note>
    </Viz>
  );
}
