import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {X, Y, STUMPS, stumpPred, stumpLabel, bestStumpIndex, runRounds, errCount} from './boostCore';

// 본문 파이썬과 같은 세 라운드의 분류기와 표의 크기
const picks = [];
let cw = X.map(() => 0.1);
for (let r = 0; r < 3; r++) {
  const b = bestStumpIndex(cw);
  picks.push(b);
  cw = runRounds(picks).w;
}
const RUN = runRounds(picks);
const ALPHA = RUN.rounds.map((r) => r.alpha);
const PRED = picks.map((k) => stumpPred(STUMPS[k]));
const W = 520;
const H = 190;
const gx = (i) => 40 + i * 46;
const sg = (v) => (v > 0 ? '+' : '−');

export default function BoostVote() {
  const [al, setAl] = useState(ALPHA);
  const F = X.map((_, i) => al.reduce((a, v, j) => a + v * PRED[j][i], 0));
  const wrongs = errCount(F);
  const setOne = (j, v) => setAl(al.map((q, i) => (i === j ? v : q)));
  const wrongAt = (i) => (F[i] > 0 ? 1 : -1) !== Y[i];
  const mid = 100;
  const sc = 38;

  return (
    <Viz
      title="분류기 셋의 표를 α만큼 더하면 열 점이 모두 맞습니다"
      caption="각 분류기의 표 크기 α를 바꿔 보세요. 라운드 1, 2, 3의 분류기는 단독으로는 이 데이터를 맞히지 못하고(각각 2, 2, 6개 틀림), α로 가중해 더한 점수 F의 부호만 열 점을 모두 맞힙니다. 첫째만 쓰거나 α를 0으로 줄이면 오류가 다시 생깁니다."
    >
      <Controls>
        <Btn onClick={() => setAl(ALPHA)}>AdaBoost의 α</Btn>
        <Btn onClick={() => setAl([1, 1, 1])}>모두 한 표씩</Btn>
        <Btn onClick={() => setAl([ALPHA[0], 0, 0])}>첫째만</Btn>
      </Controls>
      <Controls>
        {al.map((a, j) => (
          <Slider key={j} label={`α${j + 1}`} min={0} max={1.5} step={0.01} value={a} onChange={(v) => setOne(j, v)} format={(v) => fmt(v, 3)} />
        ))}
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="x가 1부터 10일 때 세 분류기의 표와 합친 점수 F">
        <line x1={30} y1={mid} x2={W - 10} y2={mid} stroke="var(--ifm-color-emphasis-400)" />
        {X.map((x, i) => {
          const bad = wrongAt(i);
          const h = Math.min(Math.abs(F[i]), 2.6) * sc;
          return (
            <g key={x}>
              <rect x={gx(i)} y={F[i] > 0 ? mid - h : mid} width={26} height={h} fill={bad ? 'var(--vbad)' : F[i] > 0 ? 'var(--vb)' : 'var(--va)'} fillOpacity="0.85" />
              <text x={gx(i) + 13} y={F[i] > 0 ? mid - h - 3 : mid + h + 11} textAnchor="middle" style={{fontSize: 10, fill: 'var(--ifm-font-color-base)'}}>{fmt(F[i], 2)}</text>
              <text x={gx(i) + 13} y={H - 6} textAnchor="middle" className={s.ts}>x={x}</text>
              <text x={gx(i) + 13} y={14} textAnchor="middle" className={s.t} style={{fill: Y[i] > 0 ? 'var(--vb)' : 'var(--va)', fontWeight: 700}}>{sg(Y[i])}</text>
              {bad ? <text x={gx(i) + 13} y={H - 20} textAnchor="middle" style={{fontSize: 11, fill: 'var(--vbad)', fontWeight: 700}}>틀림</text> : null}
            </g>
          );
        })}
        <text x={4} y={14} className={s.ts}>정답</text>
        <text x={4} y={mid - 4} className={s.ts}>F &gt; 0 → +</text>
        <text x={4} y={mid + 12} className={s.ts}>F &lt; 0 → −</text>
      </svg>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr><th>분류기</th><th>α</th>{X.map((x) => <th key={x}>{x}</th>)}</tr>
          </thead>
          <tbody>
            {PRED.map((p, j) => (
              <tr key={j}>
                <td>{stumpLabel(STUMPS[picks[j]])}</td><td>{fmt(al[j], 3)}</td>
                {p.map((v, i) => <td key={i} className={v !== Y[i] ? s.cellOn : undefined}>{sg(v)}</td>)}
              </tr>
            ))}
            <tr><td>정답</td><td /> {Y.map((v, i) => <td key={i}>{sg(v)}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <Stats>
        <Stat label="합친 점수의 오류 수" value={`${wrongs} / 10`} tone={wrongs === 0 ? 'good' : 'bad'} />
        {PRED.map((p, j) => <Stat key={j} label={`분류기 ${j + 1} 단독 오류 수`} value={`${p.filter((v, i) => v !== Y[i]).length} / 10`} />)}
      </Stats>
      <Note>강조한 칸이 각 분류기가 틀리는 점입니다. AdaBoost의 α(0.693, 0.973, 0.650)에서는 F가 1.02, 1.02, 1.02, −0.37, −0.37, 0.93, 0.93, −1.02, −1.02, −1.02이고 오류가 0입니다.</Note>
    </Viz>
  );
}
