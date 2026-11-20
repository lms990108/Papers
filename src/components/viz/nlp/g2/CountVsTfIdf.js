import React, {useState} from 'react';
import {Viz, Controls, Btn, Bar, Note, fmt, styles as s} from '../../Viz';

const DOCS = [
  ['날씨', '좋다'],
  ['날씨', '나쁘다'],
  ['날씨', '날씨', '좋다'],
];
const VOCAB = ['날씨', '좋다', '나쁘다'];
const N = DOCS.length;
const cnt = (t, w) => t.filter((x) => x === w).length;
const df = VOCAB.map((w) => DOCS.filter((d) => cnt(d, w) > 0).length);
const counts = DOCS.map((d) => VOCAB.map((w) => cnt(d, w)));

function weights(kind) {
  if (kind === 'def') {
    const idf = df.map((d) => Math.log(N / d));
    return DOCS.map((d, i) => VOCAB.map((w, j) => (cnt(d, w) / d.length) * idf[j]));
  }
  const idf = df.map((d) => Math.log((1 + N) / (1 + d)) + 1);
  return counts.map((row) => {
    const x = row.map((c, j) => c * idf[j]);
    const n = Math.sqrt(x.reduce((a, b) => a + b * b, 0));
    return x.map((v) => v / n);
  });
}

const dot = (a, b) => a.reduce((acc, v, i) => acc + v * b[i], 0);
const cos = (a, b) => {
  const d = Math.sqrt(dot(a, a)) * Math.sqrt(dot(b, b));
  return d > 0 ? dot(a, b) / d : NaN;
};
const show = (v) => (Number.isNaN(v) ? '정의 안 됨' : fmt(v, 3));

export default function CountVsTfIdf() {
  const [d, setD] = useState(0);
  const [kind, setKind] = useState('def');
  const W = weights(kind);
  const max = kind === 'def' ? 0.6 : 1;

  return (
    <Viz
      title="횟수와 TF-IDF를 막대로 비교하기"
      caption="문서를 고르면 칸마다 횟수(파랑)와 TF-IDF(주황)가 나란히 나옵니다. 아래 표는 다른 문서와의 코사인 유사도입니다. 사전은 날씨, 좋다, 나쁘다입니다."
    >
      <Controls>
        {DOCS.map((doc, i) => (
          <Btn key={i} on={d === i} onClick={() => setD(i)}>
            d{i + 1} ({doc.join(' ')})
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={kind === 'def'} onClick={() => setKind('def')}>정의대로 (tf 비율 × ln(N/df))</Btn>
        <Btn on={kind === 'sk'} onClick={() => setKind('sk')}>scikit-learn 기본 (스무딩 + L2 정규화)</Btn>
      </Controls>

      {VOCAB.map((w, j) => (
        <div key={w}>
          <Bar label={`${w} 횟수`} value={counts[d][j]} max={2} color="var(--va)" text={String(counts[d][j])} />
          <Bar label={`${w} TF-IDF`} value={W[d][j]} max={max} color="var(--vb)" text={fmt(W[d][j], 3)} />
        </div>
      ))}
      {kind === 'def' && counts[d][0] > 0 ? (
        <Note>날씨는 횟수가 있어도 idf가 0이라 TF-IDF 막대가 사라집니다.</Note>
      ) : null}

      <table className={s.grid}>
        <thead>
          <tr>
            <th>d{d + 1}와 비교</th>
            <th>횟수 목록의 코사인</th>
            <th>TF-IDF 목록의 코사인</th>
          </tr>
        </thead>
        <tbody>
          {DOCS.map((_, o) =>
            o === d ? null : (
              <tr key={o}>
                <td>d{o + 1}</td>
                <td>{show(cos(counts[d], counts[o]))}</td>
                <td className={cos(W[d], W[o]) > cos(counts[d], counts[o]) + 1e-9 ? s.cellOn : undefined}>{show(cos(W[d], W[o]))}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      {kind === 'sk' ? (
        <Note>이 방식은 날씨 칸이 0으로 지워지지 않아서, d1과 d3의 코사인이 1이 아닌 0.94쯤입니다. 같은 이름이어도 식이 다르면 숫자가 다릅니다. 스무딩은 분자와 분모에 1을 더하는 변형이고, L2 정규화는 문서마다 목록의 길이가 1이 되게 나누는 것입니다.</Note>
      ) : null}
    </Viz>
  );
}
