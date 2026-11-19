import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, Stats, Stat, fmt, styles as s} from '../../Viz';

const WORDS = ['오늘', '날씨', '좋다', '나쁘다'];
const W0 = [0, 0.2, -1, 1];
const SENTS = ['날씨 좋다', '날씨 나쁘다', '날씨 나쁘다 날씨', '나쁘다 날씨 날씨', '나쁘다 날씨 나쁘다'];
const MODES = [
  {id: 'count', n: '횟수'},
  {id: 'bin', n: '이진'},
  {id: 'rel', n: '비율'},
];

export default function BagScore() {
  const [sent, setSent] = useState('날씨 나쁘다 날씨');
  const [rep, setRep] = useState(1);
  const [mode, setMode] = useState('count');
  const [w, setW] = useState(W0);

  const toks = sent.split(/\s+/).filter(Boolean);
  const counts = WORDS.map((x) => toks.filter((t) => t === x).length * rep);
  const total = counts.reduce((a, b) => a + b, 0);
  const x = counts.map((c) => (mode === 'bin' ? Math.min(c, 1) : mode === 'rel' ? (total ? c / total : 0) : c));
  const prods = x.map((v, i) => v * w[i]);
  const score = prods.reduce((a, b) => a + b, 0);
  const pos = 200 + (Math.max(-4, Math.min(4, score)) / 4) * 180;

  const setWi = (i, v) => setW(w.map((o, j) => (j === i ? v : o)));

  return (
    <Viz
      title="횟수 목록에 가중치를 곱해 불만 점수 만들기"
      caption="점수는 칸마다 값과 가중치를 곱해 더한 것입니다. 점수가 0보다 크면 불만 쪽입니다. 문장, 이어 쓴 횟수, 칸에 적는 값, 가중치를 바꿔 보세요."
    >
      <Controls>
        {SENTS.map((t) => (
          <Btn key={t} on={t === sent} onClick={() => setSent(t)}>
            {t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="문장을 이어 쓴 횟수" min={1} max={4} value={rep} onChange={setRep} />
        {MODES.map((m) => (
          <Btn key={m.id} on={mode === m.id} onClick={() => setMode(m.id)}>
            {m.n}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {WORDS.map((name, i) => (
          <Slider key={name} label={`w(${name})`} min={-2} max={2} step={0.1} value={w[i]} onChange={(v) => setWi(i, v)} format={(v) => fmt(v, 1)} />
        ))}
        <Btn onClick={() => setW(W0)}>가중치 처음 값</Btn>
      </Controls>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>칸</th>
            {WORDS.map((n) => (
              <th key={n}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>횟수</td>
            {counts.map((c, i) => (
              <td key={i}>{c}</td>
            ))}
          </tr>
          <tr>
            <td>{MODES.find((m) => m.id === mode).n} 값 x</td>
            {x.map((v, i) => (
              <td key={i}>{fmt(v, mode === 'rel' ? 3 : 0)}</td>
            ))}
          </tr>
          <tr>
            <td>가중치 w</td>
            {w.map((v, i) => (
              <td key={i}>{fmt(v, 1)}</td>
            ))}
          </tr>
          <tr>
            <td>곱 w × x</td>
            {prods.map((v, i) => (
              <td key={i} className={Math.abs(v) > 1e-9 ? s.cellOn : undefined}>
                {fmt(v, 3)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <svg viewBox="0 0 400 54" className={s.svg} role="img" aria-label={`불만 점수 ${fmt(score, 3)}. 0보다 위이면 불만 쪽.`}>
        <line x1="20" y1="22" x2="380" y2="22" stroke="var(--ifm-color-emphasis-300)" strokeWidth="2" />
        <line x1="200" y1="12" x2="200" y2="32" stroke="var(--ifm-color-emphasis-700)" strokeWidth="2" />
        <rect x={Math.min(200, pos)} y="16" width={Math.abs(pos - 200)} height="12" fill={score >= 0 ? 'var(--vb)' : 'var(--va)'} />
        <text x="20" y="48" className={s.ts}>-4 (좋다 쪽)</text>
        <text x="200" y="48" textAnchor="middle" className={s.ts}>0</text>
        <text x="380" y="48" textAnchor="end" className={s.ts}>+4 (불만 쪽)</text>
      </svg>
      <Stats>
        <Stat label="점수 s = w · x" value={fmt(score, 3)} tone={score > 0 ? 'bad' : 'good'} />
        <Stat label="횟수 목록" value={`[${counts.join(', ')}]`} />
      </Stats>
      {rep > 1 && mode === 'count' ? (
        <Note>이어 쓸수록 횟수가 늘어 점수도 같은 배수로 커집니다. 비율로 바꾸면 문장 길이에 상관없이 같은 점수가 나옵니다.</Note>
      ) : null}
      {mode === 'bin' ? <Note>이진 값은 같은 단어가 여러 번 나와도 1로 셉니다.</Note> : null}
    </Viz>
  );
}
