import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {X, Y, STUMPS, stumpPred, stumpLabel, weightedError, bestStumpIndex, round, runRounds, errCount} from './boostCore';

const W = 520;
const H = 240;
const gx = (i) => 30 + i * 46;
const MAXR = 8;
const sg = (v) => (v > 0 ? '+' : '−');

export default function BoostRounds() {
  const [picks, setPicks] = useState([]);
  const [sel, setSel] = useState(null);
  const R = runRounds(picks);
  const w = R.w;
  const errs = STUMPS.map((st) => weightedError(w, stumpPred(st)));
  const best = bestStumpIndex(w);
  const k = sel == null ? best : sel;
  const pred = stumpPred(STUMPS[k]);
  const pv = round(w, pred);
  const next = pv.bad ? w : pv.next;
  const Fnew = pv.bad ? R.F : R.F.map((f, i) => f + pv.alpha * pred[i]);
  const full = picks.length >= MAXR;
  const apply = () => { if (!pv.bad && !full) { setPicks(picks.concat([k])); setSel(null); } };
  const auto = () => {
    let p = [];
    let cw = X.map(() => 0.1);
    for (let r = 0; r < 3; r++) {
      const b = bestStumpIndex(cw);
      p = p.concat([b]);
      cw = runRounds(p).w;
    }
    setPicks(p);
    setSel(null);
  };
  const bound = R.rounds.reduce((a, r) => a * r.Z, 1);
  const maxW = Math.max(0.3, Math.max.apply(null, w), Math.max.apply(null, next));
  const bh = (v) => (v / maxW) * 120;
  const rechk = pv.bad ? NaN : weightedError(pv.next, pred);

  return (
    <Viz
      title={`AdaBoost ${picks.length + 1}라운드: 분류기를 고르고 가중치를 갱신합니다`}
      caption="10개 예시의 가중치가 처음에는 모두 0.1입니다. 표에서 결정 그루터기(문턱 하나로 답하는 분류기)를 누르면 그 가중 오류 ε이 보이고, 가장 작은 것(★)이 본문의 선택입니다. 갱신 버튼을 누르면 틀린 예시의 가중치가 커진 채 다음 라운드로 넘어갑니다. 자동 3라운드는 본문 파이썬 출력과 같은 값을 냅니다."
    >
      <Controls>
        <Btn onClick={apply}>이 분류기로 갱신 → 라운드 {Math.min(picks.length + 2, MAXR + 1)}</Btn>
        <Btn onClick={() => { setPicks(picks.slice(0, -1)); setSel(null); }}>한 라운드 되돌리기</Btn>
        <Btn onClick={() => { setPicks([]); setSel(null); }}>처음부터</Btn>
        <Btn onClick={auto}>가장 좋은 것으로 3라운드</Btn>
      </Controls>
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr><th>가중 오류 ε</th>{STUMPS.filter((q) => q.s === 1).map((q) => <th key={q.t}>x &lt; {q.t}</th>)}</tr>
          </thead>
          <tbody>
            {[1, -1].map((sgn) => (
              <tr key={sgn}>
                <td>{sgn > 0 ? '아래쪽 +1, 위쪽 −1' : '아래쪽 −1, 위쪽 +1'}</td>
                {STUMPS.map((q, idx) => (q.s === sgn ? (
                  <td key={idx} style={{padding: 2}}>
                    <button
                      type="button"
                      onClick={() => setSel(idx)}
                      aria-label={`${stumpLabel(q)}, 가중 오류 ${fmt(errs[idx], 3)}`}
                      aria-pressed={idx === k}
                      style={{width: '100%', padding: '3px 2px', cursor: 'pointer', color: 'var(--ifm-font-color-base)', fontWeight: idx === best ? 700 : 400, border: idx === k ? '2.5px solid var(--vok)' : '1px solid var(--ifm-color-emphasis-300)', borderRadius: 5, background: `color-mix(in srgb, var(--vb) ${Math.round(errs[idx] * 70)}%, transparent)`}}
                    >
                      {fmt(errs[idx], 3)}{idx === best ? ' ★' : ''}
                    </button>
                  </td>
                ) : null))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="예시 열 개의 정답, 선택한 분류기의 답, 갱신 전후 가중치 막대">
        <text x={4} y={20} className={s.ts}>정답</text>
        <text x={4} y={48} className={s.ts}>h</text>
        {X.map((x, i) => {
          const wrong = pred[i] !== Y[i];
          return (
            <g key={x}>
              <circle cx={gx(i) + 18} cy={16} r={9} fill={Y[i] > 0 ? 'var(--vb)' : 'var(--va)'} />
              <text x={gx(i) + 18} y={20} textAnchor="middle" style={{fill: '#fff', fontSize: 12, fontWeight: 700}}>{sg(Y[i])}</text>
              <circle cx={gx(i) + 18} cy={44} r={9} fill="none" stroke={wrong ? 'var(--vbad)' : 'var(--ifm-color-emphasis-500)'} strokeWidth={wrong ? 2.5 : 1} />
              <text x={gx(i) + 18} y={48} textAnchor="middle" className={s.ts} style={{fill: wrong ? 'var(--vbad)' : undefined}}>{sg(pred[i])}</text>
              <rect x={gx(i)} y={H - 32 - bh(w[i])} width={16} height={bh(w[i])} fill="var(--ifm-color-emphasis-500)" />
              <rect x={gx(i) + 18} y={H - 32 - bh(next[i])} width={16} height={bh(next[i])} fill={wrong ? 'var(--vbad)' : 'var(--vb)'} />
              <text x={gx(i) + 26} y={H - 36 - bh(next[i])} textAnchor="middle" style={{fontSize: 10, fill: 'var(--ifm-font-color-base)'}}>{fmt(next[i], 3)}</text>
              <text x={gx(i) + 18} y={H - 14} textAnchor="middle" className={s.ts}>{x}</text>
            </g>
          );
        })}
        <text x={W - 6} y={H - 2} textAnchor="end" className={s.ts}>회색: 갱신 전 · 막대: 갱신 후(빨강은 틀린 예시)</text>
      </svg>
      <Stats>
        <Stat label="고른 분류기" value={stumpLabel(STUMPS[k])} />
        <Stat label="가중 오류 ε" value={fmt(pv.eps, 3)} />
        <Stat label="표의 크기 α" value={pv.bad ? '정의 안 됨' : fmt(pv.alpha, 3)} tone={pv.bad ? 'bad' : undefined} />
        <Stat label="Z (곱의 합)" value={pv.bad ? '—' : fmt(pv.Z, 3)} />
        <Stat label="갱신 후 틀린 쪽 가중치 합" value={pv.bad ? '—' : fmt(pv.bad ? 0 : pred.reduce((a, p, i) => a + (p !== Y[i] ? next[i] : 0), 0), 3)} />
        <Stat label="같은 분류기를 새 가중치로 채점" value={pv.bad ? '—' : fmt(rechk, 3)} />
        <Stat label="합친 점수의 오류 수" value={`${errCount(Fnew)} / 10`} tone={errCount(Fnew) === 0 ? 'good' : undefined} />
        <Stat label="지금까지 Z의 곱(학습 오류 상한)" value={picks.length ? fmt(bound, 3) : '—'} />
      </Stats>
      {pv.bad ? <Note>이 분류기는 가중 오류가 0이거나 1이라 α의 로그가 정의되지 않습니다.</Note> : null}
      {full ? <Note>이 그림은 8라운드까지만 보여 줍니다.</Note> : null}
      <div style={{overflowX: 'auto'}}>
        <table className={s.grid}>
          <thead>
            <tr><th>x</th><th>정답</th><th>h</th><th>결과</th><th>갱신 전 w</th><th>배율</th><th>곱한 값</th><th>갱신 후 w</th><th>합친 점수 F</th></tr>
          </thead>
          <tbody>
            {X.map((x, i) => {
              const wrong = pred[i] !== Y[i];
              return (
                <tr key={x} className={wrong ? s.cellOn : undefined}>
                  <td>{x}</td><td>{sg(Y[i])}</td><td>{sg(pred[i])}</td><td>{wrong ? '틀림' : '맞음'}</td>
                  <td>{fmt(w[i], 4)}</td><td>{pv.bad ? '—' : fmt(pv.factor[i], 3)}</td><td>{pv.bad ? '—' : fmt(pv.prod[i], 4)}</td><td>{fmt(next[i], 4)}</td><td>{fmt(Fnew[i], 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {R.rounds.length ? (
        <div style={{overflowX: 'auto'}}>
          <table className={s.grid}>
            <thead>
              <tr><th>지난 라운드</th><th>분류기</th><th>ε</th><th>α</th><th>Z</th><th>합친 오류 수</th></tr>
            </thead>
            <tbody>
              {R.rounds.map((r, i) => (
                <tr key={i}><td>{i + 1}</td><td>{stumpLabel(STUMPS[r.k])}</td><td>{fmt(r.eps, 3)}</td><td>{fmt(r.alpha, 3)}</td><td>{fmt(r.Z, 3)}</td><td>{errCount(r.F)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Viz>
  );
}
