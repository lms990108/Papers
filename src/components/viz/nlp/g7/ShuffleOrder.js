import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {attend, vec, heat} from './util';

const TOK = [
  {t: '오늘', x: [1, 0], c: 'var(--vb)'},
  {t: '날씨', x: [0, 1], c: 'var(--va)'},
  {t: '좋다', x: [1, 1], c: 'var(--vc)'},
];
const WQ = [[2, 0], [0, 1]];
const WK = [[1, 0], [0, 1]];
const WV = [[1, 0], [0, 2]];
const POS = [[0.1, 0], [0.2, 0], [0.3, 0]];
const PERMS = [
  [0, 1, 2],
  [1, 0, 2],
  [0, 2, 1],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

// perm[slot] = 그 자리에 놓인 토큰 번호
function run(perm, withPos) {
  const Xs = perm.map((k, slot) => TOK[k].x.map((v, c) => v + (withPos ? POS[slot][c] : 0)));
  return {Xs, ...attend(Xs, Xs, WQ, WK, WV)};
}

export default function ShuffleOrder() {
  const [pi, setPi] = useState(5);
  const [withPos, setWithPos] = useState(false);
  const perm = PERMS[pi];
  const base = run(PERMS[0], withPos);
  const cur = run(perm, withPos);

  // 토큰 번호 -> 그 토큰의 출력
  const outBase = {};
  PERMS[0].forEach((k, slot) => {
    outBase[k] = base.Y[slot];
  });
  const rows = perm.map((k, slot) => {
    const y = cur.Y[slot];
    const same = y.every((v, c) => Math.abs(v - outBase[k][c]) < 1e-9);
    return {k, slot, y, yb: outBase[k], same};
  });
  const nSame = rows.filter((r) => r.same).length;

  return (
    <Viz
      title="토큰 순서를 섞어 보기"
      caption="같은 세 토큰을 여섯 가지 순서로 넣습니다. 위치 목록을 더하지 않으면 각 토큰의 출력이 순서와 상관없이 같습니다. 위치 목록 [0.1, 0], [0.2, 0], [0.3, 0]은 설명용 값이고, 임베딩 페이지의 자리 목록을 셋째 자리까지 늘렸습니다. 가중치는 어텐션 페이지의 셋짜리 예와 같습니다."
    >
      <Controls>
        {PERMS.map((p, i) => (
          <Btn key={i} on={pi === i} onClick={() => setPi(i)}>
            {p.map((k) => TOK[k].t).join(' ')}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={!withPos} onClick={() => setWithPos(false)}>위치 목록 없음</Btn>
        <Btn on={withPos} onClick={() => setWithPos(true)}>위치 목록 더하기</Btn>
      </Controls>

      <div className={s.title}>어텐션 행렬 (행과 열이 같은 순서로 놓입니다)</div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>질문 \ 열쇠</th>
            {perm.map((k, slot) => (
              <th key={slot} style={{color: TOK[k].c}}>
                {slot + 1}번 {TOK[k].t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perm.map((k, i) => (
            <tr key={i}>
              <td style={{fontWeight: 600, color: TOK[k].c}}>
                {i + 1}번 {TOK[k].t}
              </td>
              {cur.A[i].map((a, j) => (
                <td key={j} style={{background: heat(a)}}>
                  <b>{fmt(a, 3)}</b>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className={s.title} style={{marginTop: 14}}>
        토큰마다의 출력: 이 순서와 원래 순서(오늘 날씨 좋다) 비교
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>토큰</th>
            <th>입력 x{withPos ? ' + 위치' : ''}</th>
            <th>이 순서의 출력</th>
            <th>원래 순서의 출력</th>
            <th>같은가</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td style={{fontWeight: 600, color: TOK[r.k].c}}>{TOK[r.k].t}</td>
              <td>{vec(cur.Xs[r.slot], 2)}</td>
              <td>{vec(r.y)}</td>
              <td>{vec(r.yb)}</td>
              <td className={r.same ? s.good : s.bad}>
                <b>{r.same ? '같음' : '다름'}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="출력이 같은 토큰" value={`${nSame} / 3`} tone={nSame === 3 ? 'good' : 'bad'} />
        <Stat label="순서" value={perm.map((k) => TOK[k].t).join(' ')} />
      </Stats>
      {!withPos ? (
        <Note>
          위치 목록이 없으면 어느 순서로 넣어도 각 토큰의 출력은 그대로이고, 출력이 놓이는 줄만 따라 바뀝니다. 행렬도 같은 행과 열이 같은 순서로 따라 움직일 뿐입니다.
        </Note>
      ) : perm.join() === '0,1,2' ? (
        <Note>원래 순서입니다. 순서를 바꾸는 버튼을 눌러 출력이 달라지는지 보세요.</Note>
      ) : (
        <Note>
          위치 목록을 더하면 같은 토큰이어도 놓인 자리에 따라 입력이 달라지고, 출력도 달라집니다. 순서 정보는 이렇게 입력에 더해야 들어갑니다.
        </Note>
      )}
    </Viz>
  );
}
