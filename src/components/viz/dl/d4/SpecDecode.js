import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const INIT = [
  {q: 0.8, p: 0.9, u: 0.5},
  {q: 0.8, p: 0.2, u: 0.5},
  {q: 0.5, p: 0.5, u: 0.5},
];
const f2 = (x) => fmt(x, 2);

export default function SpecDecode() {
  const [toks, setToks] = useState(INIT);

  const set = (i, key, v) => setToks(toks.map((t, j) => (j === i ? {...t, [key]: v} : t)));
  let rejected = false;
  let kept = 0;
  const rows = toks.map((t) => {
    const ratio = t.q > 0 ? Math.min(1, t.p / t.q) : NaN;
    let verdict;
    if (rejected) verdict = '버림 (앞에서 거절됨)';
    else if (t.u <= ratio) {
      verdict = '남김';
      kept += 1;
    } else {
      verdict = '거절';
      rejected = true;
    }
    return {ratio, verdict};
  });

  return (
    <Viz
      title="speculative decoding: 초안 3토큰을 큰 모델이 한 번에 검사하기"
      caption="초안 비율을 q, 큰 모델 비율을 p라 하면 그 토큰을 min(1, p/q)의 확률로 남깁니다. 아래 u는 그 확률과 비교할 뽑은 수이고(u가 확률 이하이면 남김), 첫 거절 뒤의 초안은 버립니다. 원문의 두 토큰 외 셋째 줄의 값과 u는 설명용입니다."
    >
      <Controls>
        <Btn onClick={() => setToks(INIT)}>원문의 예 (0.8/0.9, 0.8/0.2)</Btn>
        <Btn onClick={() => setToks([{q: 0.4, p: 0.8, u: 0.5}, INIT[1], INIT[2]])}>연습 3 (0.4, 0.8)</Btn>
      </Controls>
      {toks.map((t, i) => (
        <div key={i}>
          <Controls>
            <b style={{fontSize: '0.85rem', minWidth: '4.5em'}}>초안 {i + 1}</b>
            <Slider label="초안 q" min={0.05} max={1} step={0.05} value={t.q} onChange={(v) => set(i, 'q', v)} format={f2} />
            <Slider label="큰 모델 p" min={0} max={1} step={0.05} value={t.p} onChange={(v) => set(i, 'p', v)} format={f2} />
            <Slider label="뽑은 u" min={0} max={1} step={0.05} value={t.u} onChange={(v) => set(i, 'u', v)} format={f2} />
          </Controls>
          <table className={s.grid}>
            <tbody>
              <tr>
                <td>p/q = {f2(t.p / t.q)}</td>
                <td>min(1, p/q) = {f2(rows[i].ratio)}</td>
                <td className={rows[i].verdict === '남김' ? s.cellOn : undefined}><b>{rows[i].verdict}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      <Stats>
        <Stat label="큰 모델의 읽기" value="1번" />
        <Stat label="남긴 토큰" value={`${kept}개`} tone={kept >= 2 ? 'good' : undefined} />
        <Stat label="같은 토큰 수를 decode로 얻는 읽기" value={`${kept}번`} />
      </Stats>
      <Note>
        초안 0.8, 큰 모델 0.9이면 0.9/0.8 = 1.125라 1로 잘리고 그 토큰은 남습니다. 초안 0.8, 큰 모델 0.2이면 0.2/0.8 = 0.25이고, u = 0.5이면 거절입니다. 초안이 큰 모델과 자주 같으면 한 읽기에 남는 토큰이 늘고, 자주 다르면 버린 초안을 계산한 시간이 남습니다. 남길지는 p/q로 정하며 큰 모델의 확률을 초안으로 바꾸는 것은 아닙니다.
      </Note>
    </Viz>
  );
}
