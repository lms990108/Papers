import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

const MERGES = [['e', 's'], ['es', 't'], ['l', 'o'], ['lo', 'w']];
const PRESETS = ['lowest', 'newer', 'wide', 'zzz', 'lower', 'newest'];

// 학습한 순서대로 합치기 목록을 적용한다. 단계마다 token 목록을 남긴다.
function encodeSteps(word) {
  let toks = word.split('');
  const trace = [{merge: null, toks}];
  MERGES.forEach(([a, b]) => {
    const t = toks.slice();
    let i = 0;
    while (i < t.length - 1) {
      if (t[i] === a && t[i + 1] === b) t.splice(i, 2, a + b);
      else i += 1;
    }
    toks = t;
    trace.push({merge: `${a} + ${b}`, toks: t});
  });
  return trace;
}

const chip = (extra) => ({
  display: 'inline-block',
  padding: '1px 8px',
  margin: '2px 3px 2px 0',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  fontSize: '0.9rem',
  ...extra,
});

export default function BpeEncode() {
  const [word, setWord] = useState('lowest');
  const w = word.replace(/\s/g, '');
  const trace = w ? encodeSteps(w) : [];

  return (
    <Viz
      title="새 단어에 학습된 합치기 목록 적용하기"
      caption="학습이 끝나면 합친 쌍의 목록이 남습니다. 새 단어는 글자로 시작해 이 목록을 학습한 순서대로 적용합니다. 아는 조각이 없어도 글자로는 항상 쓸 수 있습니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={p === w} onClick={() => setWord(p)}>
            {p}
          </Btn>
        ))}
        <label className={s.ctl}>
          <span>직접 입력</span>
          <input
            type="text"
            value={word}
            maxLength={14}
            onChange={(e) => setWord(e.target.value)}
            style={{width: 120, padding: '2px 6px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)'}}
          />
        </label>
      </Controls>
      <p className={s.note} style={{marginTop: 0}}>
        학습된 합치기 순서: {MERGES.map(([a, b], i) => `${i + 1}. ${a}+${b}`).join(' / ')}
      </p>
      {trace.length ? (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>단계</th>
              <th>적용한 합치기</th>
              <th>token 목록</th>
              <th>token 수</th>
            </tr>
          </thead>
          <tbody>
            {trace.map((r, i) => {
              const changed = i > 0 && r.toks.length !== trace[i - 1].toks.length;
              return (
                <tr key={i}>
                  <td>{i}</td>
                  <td className={changed ? s.cellOn : undefined}>{r.merge || '글자로 시작'}</td>
                  <td style={{textAlign: 'left'}}>
                    {r.toks.map((t, j) => (
                      <span key={j} style={chip(t.length > 1 ? {borderColor: 'var(--vb)'} : undefined)}>
                        {t}
                      </span>
                    ))}
                  </td>
                  <td>{r.toks.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Note>단어를 입력하거나 위 버튼을 눌러 보세요.</Note>
      )}
      {trace.length ? (
        <Note>
          결과: {trace[trace.length - 1].toks.map((t) => `'${t}'`).join(', ')}. 학습 글에 없던 단어도 아는 조각으로 쪼개집니다.
        </Note>
      ) : null}
    </Viz>
  );
}
