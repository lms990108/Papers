import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const REVIEWS = [
  {t: '연기가 좋다', x: [1, 0], lab: 1},
  {t: '결말이 나쁘다', x: [0, 1], lab: 0},
  {t: '연기가 좋다, 좋다', x: [2, 0], lab: 1},
  {t: '결말이 나쁘다, 나쁘다', x: [0, 2], lab: 0},
];
const EMPTY = {t: '나쁘지 않다', x: [0, 0], lab: null};
const W = 480;
const RH = 34;
const CX = 300;
const UNIT = 36;

const ans = (v) => (v == null ? '-' : v === 1 ? '긍정' : '부정');

export default function ReviewScorer() {
  const [w1, setW1] = useState(1);
  const [w2, setW2] = useState(-1);
  const [extra, setExtra] = useState(false);

  const rows = (extra ? REVIEWS.concat([EMPTY]) : REVIEWS).map((r) => {
    const a = w1 * r.x[0];
    const b = w2 * r.x[1];
    const sc = a + b;
    const read = sc > 0 ? 1 : 0;
    return {...r, a, b, sc, read, ok: r.lab == null ? null : read === r.lab};
  });
  const correct = rows.filter((r) => r.ok === true).length;
  const H = rows.length * RH + 34;

  return (
    <Viz
      title="가중치를 채우면 리뷰마다 점수가 나옵니다"
      caption="w1과 w2를 바꿔 보세요. 점수가 0보다 크면 긍정으로 읽고, 읽은 답을 붙은 답과 비교합니다. 기본값은 학습으로 채운 (1, -1)입니다."
    >
      <Controls>
        <Slider label="w1 (좋다에 곱함)" min={-2} max={2} step={1} value={w1} onChange={setW1} />
        <Slider label="w2 (나쁘다에 곱함)" min={-2} max={2} step={1} value={w2} onChange={setW2} />
      </Controls>
      <Controls>
        <Btn on={w1 === 1 && w2 === -1} onClick={() => {setW1(1); setW2(-1);}}>(1, -1) 채운 뒤</Btn>
        <Btn on={w1 === 0 && w2 === 0} onClick={() => {setW1(0); setW2(0);}}>(0, 0) 빈칸 그대로</Btn>
        <Btn on={extra} onClick={() => setExtra(!extra)}>“나쁘지 않다” 넣어 보기</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>리뷰</th><th>(x1, x2)</th><th>w1·x1</th><th>w2·x2</th><th>점수 s</th><th>읽은 답</th><th>붙은 답</th><th>결과</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t} className={r.ok === false ? s.cellOn : undefined}>
              <td>{r.t}</td>
              <td>({r.x[0]}, {r.x[1]})</td>
              <td>{r.a}</td>
              <td>{r.b}</td>
              <td><b>{r.sc}</b></td>
              <td>{ans(r.read)}</td>
              <td>{ans(r.lab)}</td>
              <td>{r.ok == null ? '-' : r.ok ? '맞음' : '틀림'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label="리뷰별 점수 막대. 0보다 오른쪽이면 긍정">
        <line x1={CX} y1={4} x2={CX} y2={H - 22} stroke="var(--ifm-color-emphasis-500)" />
        {rows.map((r, i) => {
          const y = 10 + i * RH;
          const len = Math.abs(r.sc) * UNIT;
          return (
            <g key={r.t}>
              <text x={8} y={y + 17} className={s.ts}>{r.t}</text>
              {r.sc !== 0 ? (
                <rect x={r.sc > 0 ? CX : CX - len} y={y + 4} width={len} height={18} fill={r.sc > 0 ? 'var(--va)' : 'var(--vb)'} />
              ) : (
                <circle cx={CX} cy={y + 13} r={4} fill="var(--ifm-color-emphasis-700)" />
              )}
              <text x={r.sc > 0 ? CX + len + 6 : r.sc < 0 ? CX - len - 6 : CX + 10} y={y + 17} textAnchor={r.sc < 0 ? 'end' : 'start'} className={s.t}>{r.sc}</text>
            </g>
          );
        })}
        <text x={CX + 8} y={H - 6} className={s.ts}>긍정 쪽 (s &gt; 0)</text>
        <text x={CX - 8} y={H - 6} textAnchor="end" className={s.ts}>부정 쪽</text>
      </svg>
      <Stats>
        <Stat label="붙은 답을 맞힌 개수" value={correct + ' / 4'} tone={correct === 4 ? 'good' : correct <= 2 ? 'bad' : undefined} />
      </Stats>
      {w1 === 0 && w2 === 0 ? <Note>가중치가 둘 다 0이면 어떤 리뷰든 점수가 0입니다. 점수 0은 “0보다 크지 않다”라서 부정으로 읽히고, 부정 리뷰 둘이 우연히 맞습니다.</Note> : null}
      {extra ? <Note>“나쁘지 않다”는 “나쁘다” 토큰이 없어서 입력이 (0, 0)입니다. 가중치가 무엇이든 점수는 0이고, 0은 긍정이 아닙니다.</Note> : null}
    </Viz>
  );
}
