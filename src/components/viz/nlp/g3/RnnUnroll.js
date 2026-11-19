import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';

const TOKENS = {오늘: [1, 0], 날씨: [0, 1], 좋다: [1, 1], 나쁘다: [0, 0]};
const NAMES = Object.keys(TOKENS);
const COLX = [75, 245, 415, 585];

function run(words, w) {
  let h = [0, 0];
  const out = [{a: null, h}];
  words.forEach((nm) => {
    const x = TOKENS[nm];
    const a = [w * h[0] + x[0], w * h[1] + x[1]];
    h = [Math.tanh(a[0]), Math.tanh(a[1])];
    out.push({a, h});
  });
  return out;
}
const L = (v, d = 3) => `[${fmt(v[0], d)}, ${fmt(v[1], d)}]`;

function StateBox({cx, h, label, on, faded}) {
  const base = 118;
  return (
    <g opacity={faded ? 0.25 : 1}>
      <rect x={cx - 62} y={30} width={124} height={112} rx={8} fill="none" stroke={on ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={on ? 3 : 1.5} />
      <text x={cx} y={24} textAnchor="middle" className={s.ts}>{label}</text>
      <line x1={cx - 50} y1={base} x2={cx + 50} y2={base} stroke="var(--vgrid)" />
      {h.map((v, i) => {
        const x = cx - 38 + i * 48;
        const hh = Math.abs(v) * 56;
        return (
          <g key={i}>
            <rect x={x} y={v >= 0 ? base - hh : base} width={26} height={hh} fill={i === 0 ? 'var(--va)' : 'var(--vc)'} opacity={0.85} />
            <text x={x + 13} y={v >= 0 ? base - hh - 4 : base + hh + 12} textAnchor="middle" className={s.ts}>{fmt(v, 3)}</text>
          </g>
        );
      })}
      <text x={cx - 25} y={136} textAnchor="middle" className={s.ts}>첫 칸</text>
      <text x={cx + 23} y={136} textAnchor="middle" className={s.ts}>둘째 칸</text>
    </g>
  );
}

export default function RnnUnroll() {
  const [t, setT] = useState(0);
  const [w, setW] = useState(0.5);
  const [words, setWords] = useState(['오늘', '날씨', '좋다']);

  const st = run(words, w);
  const setWord = (i, nm) => setWords(words.map((x, k) => (k === i ? nm : x)));

  return (
    <Viz
      title="시간 순서로 펼친 순환 신경망"
      caption="‘다음 토큰’을 눌러 한 칸씩 읽어 보세요. 상태 h는 직전 상태에 w를 곱하고 지금 토큰을 더한 뒤 tanh로 누른 값입니다. w = 0.5와 오늘, 날씨, 좋다가 본문의 계산 예입니다."
    >
      <Controls>
        <Btn onClick={() => setT(Math.min(3, t + 1))}>다음 토큰</Btn>
        <Btn onClick={() => setT(Math.max(0, t - 1))}>이전</Btn>
        <Btn onClick={() => setT(0)}>처음으로</Btn>
        <Slider label="w (W_h = w × 단위행렬)" min={0} max={1.5} step={0.1} value={w} onChange={setW} format={(x) => fmt(x, 1)} />
      </Controls>
      <Controls>
        {words.map((nm, i) => (
          <label key={i} className={s.ctl}>
            <span>{i + 1}번째 토큰</span>
            <select value={nm} onChange={(e) => setWord(i, e.target.value)} style={{background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, padding: '2px 4px'}}>
              {NAMES.map((x) => (
                <option key={x} value={x}>{x} {L(TOKENS[x], 0)}</option>
              ))}
            </select>
          </label>
        ))}
      </Controls>

      <svg viewBox="0 0 680 250" className={s.svg} role="img" aria-label="시작 상태 h0에서 세 토큰을 차례로 읽으며 상태가 바뀌는 펼친 그림">
        <defs>
          <marker id="rnnArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ifm-color-emphasis-700)" />
          </marker>
        </defs>
        {st.map((x, i) => (
          <StateBox key={i} cx={COLX[i]} h={x.h} label={i === 0 ? 'h0 (시작 상태)' : `h${i}`} on={i === t} faded={i > t} />
        ))}
        {[1, 2, 3].map((i) => (
          <g key={i} opacity={i > t ? 0.25 : 1}>
            <line x1={COLX[i - 1] + 64} y1={86} x2={COLX[i] - 66} y2={86} stroke="var(--ifm-color-emphasis-700)" markerEnd="url(#rnnArrow)" />
            <text x={(COLX[i - 1] + COLX[i]) / 2} y={78} textAnchor="middle" className={s.ts}>× w</text>
            <line x1={COLX[i]} y1={200} x2={COLX[i]} y2={150} stroke="var(--ifm-color-emphasis-700)" markerEnd="url(#rnnArrow)" />
            <rect x={COLX[i] - 50} y={202} width={100} height={36} rx={6} fill="none" stroke="var(--vb)" strokeWidth={i === t ? 3 : 1.5} />
            <text x={COLX[i]} y={218} textAnchor="middle" className={s.t}>{words[i - 1]}</text>
            <text x={COLX[i]} y={232} textAnchor="middle" className={s.ts}>{L(TOKENS[words[i - 1]], 0)}</text>
          </g>
        ))}
      </svg>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>자리</th>
            <th>직전 상태 × w + 토큰 = a</th>
            <th>tanh(a) = 상태</th>
          </tr>
        </thead>
        <tbody>
          {st.slice(1).map((x, i) => (
            <tr key={i} className={undefined}>
              <td className={i + 1 === t ? s.cellOn : undefined}>{i + 1}번 {words[i]}</td>
              <td className={i + 1 === t ? s.cellOn : undefined}>
                {i + 1 <= t ? `${fmt(w, 1)} × ${L(st[i].h)} + ${L(TOKENS[words[i]], 0)} = ${L(x.a)}` : '아직 읽지 않음'}
              </td>
              <td className={i + 1 === t ? s.cellOn : undefined}>{i + 1 <= t ? L(x.h) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        첫 칸만 따라가면 {st.slice(1).map((x, i) => (i + 1 <= t ? fmt(x.h[0], 3) : '?')).join(' → ')}입니다. 첫 토큰의 값은 다음 자리에서 w배로 줄어 남아 있다가 새 토큰과 섞이므로, 첫 칸만 보고 어떤 토큰이었는지 가리킬 수는 없습니다.
      </Note>
    </Viz>
  );
}
