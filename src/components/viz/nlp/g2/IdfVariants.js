import React, {useState} from 'react';
import {Viz, Slider, Note, fmt, styles as s} from '../../Viz';

const VARIANTS = [
  {n: 'ln(N/df)', f: (N, d) => (d > 0 ? Math.log(N / d) : NaN)},
  {n: 'log10(N/df)', f: (N, d) => (d > 0 ? Math.log10(N / d) : NaN)},
  {n: 'log2(N/df)', f: (N, d) => (d > 0 ? Math.log2(N / d) : NaN)},
  {n: 'ln(N/(1+df))', f: (N, d) => Math.log(N / (1 + d))},
  {n: 'sk smooth', f: (N, d) => Math.log((1 + N) / (1 + d)) + 1},
  {n: 'sk no-smooth', f: (N, d) => (d > 0 ? Math.log(N / d) + 1 : NaN)},
];
const show = (v) => (Number.isNaN(v) ? '계산 불가' : fmt(v, 3));

export default function IdfVariants() {
  const [N, setN] = useState(3);
  const [df, setDf] = useState(3);
  const d = Math.min(df, N);
  const cols = Array.from({length: N + 1}, (_, i) => i);

  return (
    <Viz
      title="idf 식을 바꿔 보기"
      caption="문서 수 N과 문서 빈도 df(단어가 들어 있는 문서 수)를 바꿔 보세요. sk는 scikit-learn의 식이고, 스무딩은 df가 0이거나 N일 때의 문제를 피하려고 1을 더하는 변형입니다. 로그의 밑만 다른 처음 세 줄은 df=1과 df=2의 비가 같습니다. 스무딩한 sk 줄은 비가 달라집니다. 선택한 df 열이 주황색입니다."
    >
      <div className={s.controls}>
        <Slider label="문서 수 N" min={2} max={6} value={N} onChange={(v) => {
          setN(v);
          if (df > v) setDf(v);
        }} />
        <Slider label="선택한 df" min={0} max={N} value={d} onChange={setDf} />
      </div>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>식</th>
              {cols.map((c) => (
                <th key={c}>df={c}</th>
              ))}
              <th>df=1 ÷ df=2</th>
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map((v) => {
              const a = v.f(N, 1);
              const b = v.f(N, 2);
              const ratio = Math.abs(b) > 1e-9 && Number.isFinite(a / b) ? a / b : NaN;
              return (
                <tr key={v.n}>
                  <td>{v.n}</td>
                  {cols.map((c) => {
                    const x = v.f(N, c);
                    return (
                      <td key={c} className={c === d ? s.cellOn : undefined}>
                        <span className={x < 0 ? s.bad : undefined}>{show(x)}</span>
                      </td>
                    );
                  })}
                  <td>{Number.isNaN(ratio) ? '—' : fmt(ratio, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {d === 0 ? <Note>df=0이면 N/df를 계산할 수 없습니다. 분모에 1을 더하는 식만 값이 나옵니다.</Note> : null}
      {d === N ? (
        <Note>모든 문서에 있는 단어입니다. 처음 세 식은 0이 되어 단어가 사라지고, ln(N/(1+df))는 음수가 됩니다(빨강). sk smooth는 1입니다.</Note>
      ) : null}
    </Viz>
  );
}
