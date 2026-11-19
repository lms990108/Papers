import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const BASE = [
  {t: '연기가 좋다', x: [1, 0], lab: 1},
  {t: '결말이 나쁘다', x: [0, 1], lab: 0},
  {t: '연기가 좋다, 좋다', x: [2, 0], lab: 1},
  {t: '결말이 나쁘다, 나쁘다', x: [0, 2], lab: 0},
];
const ADD = {t: '새 쌍 (1, 1)', x: [1, 1], lab: 1};
const VALS = [-2, -1, 0, 1, 2];
const CAND = [];
VALS.forEach((a) => VALS.forEach((b) => CAND.push([a, b])));
const key = (a, b) => (a + 2) * 5 + (b + 2);

const score = (w, x) => w[0] * x[0] + w[1] * x[1];

export default function WeightSearch() {
  const [tried, setTried] = useState([]);
  const [sel, setSel] = useState(null);
  const [extra, setExtra] = useState(false);

  const data = extra ? BASE.concat([ADD]) : BASE;
  const n = data.length;
  const count = (w) => data.filter((r) => (score(w, r.x) > 0) === (r.lab === 1)).length;
  const isTried = (c) => tried.indexOf(key(c[0], c[1])) >= 0;
  const mark = (c) => {
    const k = key(c[0], c[1]);
    if (tried.indexOf(k) < 0) setTried(tried.concat([k]));
    setSel(c);
  };
  const next = () => {
    const c = CAND.find((q) => tried.indexOf(key(q[0], q[1])) < 0);
    if (c) mark(c);
  };
  const all = () => {
    setTried(CAND.map((c) => key(c[0], c[1])));
    setSel(CAND[CAND.length - 1]);
  };
  const reset = () => {
    setTried([]);
    setSel(null);
  };

  const good = CAND.filter((c) => isTried(c) && count(c) === n);
  let best = 0;
  CAND.forEach((c) => {
    if (isTried(c)) best = Math.max(best, count(c));
  });

  return (
    <Viz
      title="후보를 하나씩 넣어 보며 빈칸을 고르기"
      caption="칸마다 (w1, w2) 후보입니다. 칸 안의 수는 그 후보가 맞힌 리뷰 개수입니다. 후보를 시도하거나 칸을 눌러 보세요."
    >
      <Controls>
        <Btn onClick={next}>다음 후보 시도</Btn>
        <Btn onClick={all}>25개 전부 시도</Btn>
        <Btn onClick={reset}>처음부터</Btn>
        <Btn on={extra} onClick={() => setExtra(!extra)}>(1, 1)=긍정 쌍 추가</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>w2 \ w1</th>
            {VALS.map((a) => <th key={a}>{a}</th>)}
          </tr>
        </thead>
        <tbody>
          {VALS.slice().reverse().map((b) => (
            <tr key={b}>
              <th>{b}</th>
              {VALS.map((a) => {
                const c = [a, b];
                const t = isTried(c);
                const full = t && count(c) === n;
                const on = sel && sel[0] === a && sel[1] === b;
                return (
                  <td key={a} className={on ? s.cellOn : undefined}>
                    <button type="button" className={s.btn} style={{minWidth: '3.2em', fontWeight: full ? 700 : 400, borderColor: full ? 'var(--vok)' : undefined}} onClick={() => mark(c)} aria-label={'w1=' + a + ', w2=' + b + (t ? ', ' + count(c) + '개 맞힘' : ', 아직 시도 안 함')}>
                      {t ? count(c) + '/' + n : '?'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <Stats>
        <Stat label="시도한 후보" value={tried.length + ' / 25'} />
        <Stat label={'전부 맞히는 후보 (' + n + '/' + n + ')'} value={good.length + '개'} tone={good.length > 0 ? 'good' : undefined} />
        <Stat label="지금까지 최고" value={tried.length ? best + ' / ' + n : '-'} />
      </Stats>
      {sel ? (
        <Note>
          선택한 후보 w = ({sel[0]}, {sel[1]}):{' '}
          {data.map((r) => {
            const sc = score(sel, r.x);
            const ok = (sc > 0) === (r.lab === 1);
            return r.t + ' → 점수 ' + sc + (ok ? ' (맞음)' : ' (틀림)');
          }).join(', ')}
        </Note>
      ) : <Note>아직 시도한 후보가 없습니다.</Note>}
      {good.length > 0 ? <Note>전부 맞히는 후보: {good.map((c) => '(' + c[0] + ', ' + c[1] + ')').join(', ')}</Note> : null}
    </Viz>
  );
}
