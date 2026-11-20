import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';

const START = ['날씨 좋다', '날씨 나쁘다', '날씨 날씨 좋다'];
const EXTRA = ['날씨 좋다 좋다', '나쁘다 나쁘다 날씨', '오늘 날씨 좋다', '오늘 오늘 나쁘다'];
const inputStyle = {
  padding: '3px 8px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  color: 'var(--ifm-font-color-base)',
  fontSize: '0.85rem',
  width: '100%',
  minWidth: 140,
};

export default function TfIdfTable() {
  const [docs, setDocs] = useState(START);
  const [step, setStep] = useState(3);

  const toks = docs.map((d) => d.split(/\s+/).filter(Boolean));
  const vocab = [];
  toks.forEach((t) =>
    t.forEach((w) => {
      if (vocab.indexOf(w) < 0) vocab.push(w);
    }),
  );
  const N = toks.filter((t) => t.length > 0).length;
  const cnt = (t, w) => t.filter((x) => x === w).length;
  const df = vocab.map((w) => toks.filter((t) => cnt(t, w) > 0).length);
  const idf = df.map((d) => Math.log(N / d));
  const tf = toks.map((t) => vocab.map((w) => (t.length ? cnt(t, w) / t.length : 0)));
  const tfidf = tf.map((row) => row.map((v, j) => v * idf[j]));

  const edit = (i, v) => setDocs(docs.map((d, j) => (j === i ? v : d)));
  const add = () => docs.length < 5 && setDocs(docs.concat([EXTRA[(docs.length - 3 + EXTRA.length) % EXTRA.length]]));
  const remove = (i) => docs.length > 1 && setDocs(docs.filter((_, j) => j !== i));

  return (
    <Viz
      title="TF, IDF, TF-IDF를 단계별로 계산하기"
      caption="문서를 고쳐 쓰거나 추가해 보세요. tf는 단어가 한 문서에 나온 횟수를 그 문서의 단어 수로 나눈 값, N은 문서의 총 수, df는 그 단어가 들어 있는 문서의 수, idf는 ln(N / df)입니다. 문서가 바뀌면 N과 df가 바뀌고 idf도 바뀝니다. 모든 문서에 있는 단어는 idf가 0이라 칸이 0으로 지워집니다(주황 칸)."
    >
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문서</th>
            <th>내용 (띄어쓰기로 구분)</th>
            <th>단어 수</th>
            <th>지우기</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d, i) => (
            <tr key={i}>
              <td>d{i + 1}</td>
              <td>
                <input type="text" aria-label={`d${i + 1} 내용`} style={inputStyle} value={d} onChange={(e) => edit(i, e.target.value)} />
              </td>
              <td>{toks[i].length}</td>
              <td>
                <Btn onClick={() => remove(i)}>−</Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Controls>
        <Btn onClick={add}>+ 문서 추가</Btn>
        <Btn onClick={() => setDocs(START)}>처음 문서로</Btn>
        <span>|</span>
        <Btn on={step === 1} onClick={() => setStep(1)}>1 tf</Btn>
        <Btn on={step === 2} onClick={() => setStep(2)}>2 df · idf</Btn>
        <Btn on={step === 3} onClick={() => setStep(3)}>3 tf-idf</Btn>
      </Controls>

      {N === 0 || vocab.length === 0 ? (
        <Note>문서에 단어가 없습니다. 단어를 입력해 보세요.</Note>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <div className={s.title}>1. tf = 문서 안 횟수 ÷ 문서의 단어 수</div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>tf</th>
                {vocab.map((w) => (
                  <th key={w}>{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toks.map((t, i) => (
                <tr key={i}>
                  <td>d{i + 1}</td>
                  {vocab.map((w, j) => (
                    <td key={w}>
                      {t.length ? (
                        <>
                          <span className={s.ts}>{cnt(t, w)}/{t.length} = </span>
                          {fmt(tf[i][j], 3)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {step >= 2 ? (
            <>
              <div className={s.title} style={{marginTop: 12}}>2. df = 단어가 들어 있는 문서 수, idf = ln(N / df), N = {N} (문서의 총 수)</div>
              <table className={s.grid}>
                <thead>
                  <tr>
                    <th />
                    {vocab.map((w) => (
                      <th key={w}>{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>df</td>
                    {df.map((d, j) => (
                      <td key={j}>{d}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>idf</td>
                    {idf.map((v, j) => (
                      <td key={j} className={df[j] === N ? s.cellOn : undefined}>
                        <span className={s.ts}>ln({N}/{df[j]}) = </span>
                        {fmt(v, 3)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </>
          ) : null}
          {step >= 3 ? (
            <>
              <div className={s.title} style={{marginTop: 12}}>3. tf-idf = tf × idf</div>
              <table className={s.grid}>
                <thead>
                  <tr>
                    <th>tf-idf</th>
                    {vocab.map((w) => (
                      <th key={w}>{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tfidf.map((row, i) => (
                    <tr key={i}>
                      <td>d{i + 1}</td>
                      {row.map((v, j) => (
                        <td key={j} className={df[j] === N ? s.cellOn : undefined}>
                          {fmt(v, 3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}
        </div>
      )}
    </Viz>
  );
}
