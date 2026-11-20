import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt, styles as s} from '../../Viz';
import {CHUNKS, QUERIES, bm25Parts} from './advData';

const W = 520;
const H = 190;
const L = 38;
const R = 12;
const T = 14;
const B = 30;
const LINES = [
  {rho: 0.5, label: '짧은 청크(평균의 0.5배)', color: 'var(--va)'},
  {rho: 1, label: '평균 길이', color: 'var(--vb)'},
  {rho: 2, label: '긴 청크(평균의 2배)', color: 'var(--vc)'},
];

// BM25의 tf 항: tf(k1+1) / (tf + k1(1-b+b·rho))
const tfTerm = (tf, k1, b, rho) => (tf === 0 ? 0 : (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * rho)));

function Saturation({k1, b}) {
  const ymax = k1 + 1;
  const x = (tf) => L + (tf / 10) * (W - L - R);
  const y = (v) => T + (1 - v / ymax) * (H - T - B);
  const pts = (rho) => {
    const a = [];
    for (let i = 0; i <= 40; i += 1) {
      const tf = i / 4;
      a.push(`${x(tf).toFixed(1)},${y(tfTerm(tf, k1, b, rho)).toFixed(1)}`);
    }
    return a.join(' ');
  };
  return (
    <svg
      className={s.svg}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`BM25의 단어 횟수 항. 횟수가 늘어도 k1 더하기 1, 즉 ${fmt(ymax, 1)}을 넘지 않고, 긴 청크일수록 낮습니다.`}
    >
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ifm-color-emphasis-400)" />
      <line x1={L} y1={y(ymax)} x2={W - R} y2={y(ymax)} stroke="var(--ifm-color-emphasis-400)" strokeDasharray="4 3" />
      <text className={s.ts} x={W - R} y={y(ymax) - 4} textAnchor="end">상한 k1 + 1 = {fmt(ymax, 1)}</text>
      {[0, 2, 4, 6, 8, 10].map((t) => (
        <text key={t} className={s.ts} x={x(t)} y={H - B + 14} textAnchor="middle">{t}</text>
      ))}
      <text className={s.ts} x={(L + W - R) / 2} y={H - 4} textAnchor="middle">청크 안에서 단어가 나온 횟수 tf</text>
      <text className={s.ts} x={L - 6} y={y(0) + 4} textAnchor="end">0</text>
      {LINES.map((ln) => (
        <polyline key={ln.rho} points={pts(ln.rho)} fill="none" stroke={ln.color} strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function Bm25Explorer() {
  const [qi, setQi] = useState(0);
  const [k1, setK1] = useState(1.2);
  const [b, setB] = useState(0.75);
  const q = QUERIES[qi];
  const {avgdl, rows} = bm25Parts(q.toks, k1, b);
  const max = Math.max(0.0001, ...rows.map((r) => r.score));
  const termInfo = rows[0].terms;
  const matched = rows.filter((r) => r.score > 0).length;

  return (
    <Viz
      title="BM25 점수를 직접 계산해 보기"
      caption="질문, k1, b를 바꿔 보세요. 청크 8개와 단어 나누기는 설명용이고, 점수는 아래 함수 그대로 계산한 값입니다(idf는 Lucene 형태, 자연로그). 점수가 0인 청크는 키워드 검색 목록에 오르지 않습니다."
    >
      <Controls>
        {QUERIES.map((x, i) => (
          <Btn key={x.key} on={i === qi} onClick={() => setQi(i)}>질문: {x.text}</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="k1 (횟수 포화 정도)" min={0} max={3} step={0.1} value={k1} onChange={setK1} format={(v) => fmt(v, 1)} />
        <Slider label="b (길이 보정 세기)" min={0} max={1} step={0.05} value={b} onChange={setB} format={(v) => fmt(v, 2)} />
      </Controls>
      <div className={s.note} style={{margin: '0 0 6px'}}>
        청크 수 N = {CHUNKS.length}, 평균 길이 avgdl = {fmt(avgdl, 3)}단어.{' '}
        {termInfo.map((t) => `${t.t}: 든 청크 수 df = ${t.df}, idf = ${fmt(t.idf, 3)}`).join(' / ')}
      </div>
      {rows.map((r) => {
        const c = CHUNKS.find((x) => x.id === r.id);
        const tfs = r.terms.map((t) => `${t.t} ${t.tf}`).join(', ');
        return (
          <div key={r.id}>
            <div className={s.note} style={{margin: '8px 0 0'}}>
              {r.id}. {c.text} (길이 {r.len}, tf: {tfs})
            </div>
            <Bar label="BM25 점수" value={r.score} max={max} color="var(--va)" text={r.score > 0 ? fmt(r.score, 3) : '0 (목록 밖)'} />
          </div>
        );
      })}
      <Note>
        {matched === 0 ? '질문 단어가 들어 있는 청크가 하나도 없어서 키워드 검색 결과가 비었습니다. ' : `${matched}개 청크가 목록에 오릅니다. `}
        {q.note}
      </Note>
      <div className={s.title} style={{margin: '14px 0 4px'}}>단어가 여러 번 나와도 점수는 포화합니다</div>
      <Saturation k1={k1} b={b} />
      <div className={s.legend}>
        {LINES.map((ln) => (
          <span key={ln.rho}><i style={{background: ln.color}} />{ln.label}</span>
        ))}
      </div>
      <Note>
        세로축은 tf 항 하나의 값입니다. k1을 0으로 내리면 한 번만 나와도 만점이고, 올리면 횟수를 더 쳐 줍니다. b를 0으로 내리면 세 선이 겹쳐 길이 보정이 사라지고, 1로 올리면 긴 청크가 크게 깎입니다.
      </Note>
    </Viz>
  );
}
