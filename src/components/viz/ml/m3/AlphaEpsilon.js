import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const alphaOf = (e) => 0.5 * Math.log((1 - e) / e);
const BW = 340;
const BH = 200;
const CW = 300;
const CH = 200;
const ex = (e) => 34 + e * (CW - 48);
const ey = (a) => 14 + (1 - (a + 2.2) / 4.4) * (CH - 44);

export default function AlphaEpsilon() {
  const [n, setN] = useState(10);
  const [k, setK] = useState(2);
  const kk = Math.min(k, n);
  const eps = kk / n;
  const ok = eps > 0 && eps < 1;
  const alpha = ok ? alphaOf(eps) : NaN;
  const Z = ok ? 2 * Math.sqrt(eps * (1 - eps)) : NaN;
  const wWrong = ok ? (1 / n) * Math.exp(alpha) / Z : NaN;
  const wRight = ok ? (1 / n) * Math.exp(-alpha) / Z : NaN;
  const bw = (BW - 20) / n;
  const bh = (w) => (w / 0.5) * (BH - 50);
  const curve = Array.from({length: 49}, (_, i) => 0.02 + (i * 0.96) / 48);

  return (
    <Viz
      title="오류 ε이 표의 크기 α와 가중치 변화를 정합니다"
      caption="예시 n개의 가중치가 모두 같고 그중 k개를 틀렸다고 합시다(ε = k/n). 틀린 예시의 가중치 합은 ε이 얼마든 갱신 뒤 정확히 0.5가 됩니다. 오류가 0.5이면 α = 0이고, 0.5보다 크면 α가 음수가 되어 답을 뒤집어 쓰는 것과 같습니다."
    >
      <Controls>
        <Slider label="예시 수 n" min={2} max={12} value={n} onChange={(v) => { setN(v); if (k > v) setK(v); }} />
        <Slider label="틀린 수 k" min={0} max={n} value={kk} onChange={setK} />
      </Controls>
      <Controls>
        <span className={s.ts}>n = 10에서</span>
        {[1, 2, 3, 4, 5, 6].map((q) => <Btn key={q} on={n === 10 && kk === q} onClick={() => { setN(10); setK(q); }}>ε = {q / 10}</Btn>)}
        <Btn on={n === 4 && kk === 1} onClick={() => { setN(4); setK(1); }}>4개 중 1개 (연습 1)</Btn>
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${BW} ${BH}`} className={s.svg} role="img" aria-label="예시별 가중치: 갱신 전과 갱신 후">
          {Array.from({length: n}, (_, i) => {
            const wrong = i < kk;
            const w0 = 1 / n;
            const w1 = ok ? (wrong ? wWrong : wRight) : w0;
            return (
              <g key={i}>
                <rect x={10 + i * bw + 1} y={BH - 30 - bh(w0)} width={bw / 2 - 1} height={bh(w0)} fill="var(--ifm-color-emphasis-500)" />
                <rect x={10 + i * bw + bw / 2} y={BH - 30 - bh(w1)} width={bw / 2 - 1} height={bh(w1)} fill={wrong ? 'var(--vbad)' : 'var(--vb)'} />
                <text x={10 + i * bw + bw / 2} y={BH - 14} textAnchor="middle" className={s.ts}>{wrong ? '×' : '○'}</text>
              </g>
            );
          })}
          <text x={BW - 6} y={BH - 2} textAnchor="end" className={s.ts}>회색: 갱신 전 · 색: 갱신 후 (× 틀림, ○ 맞음)</text>
          <text x={10} y={14} className={s.ts}>세로축: 가중치 (한 칸 높이 0.5)</text>
        </svg>
        <svg viewBox={`0 0 ${CW} ${CH}`} className={s.svg} role="img" aria-label="오류 ε에 따른 α 곡선">
          <line x1={34} y1={ey(0)} x2={CW - 14} y2={ey(0)} stroke="var(--ifm-color-emphasis-400)" />
          <line x1={ex(0.5)} y1={14} x2={ex(0.5)} y2={CH - 30} stroke="var(--vgrid)" />
          <polyline points={curve.map((e) => `${ex(e)},${ey(alphaOf(e))}`).join(' ')} fill="none" stroke="var(--vb)" strokeWidth="2.5" />
          {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((e) => <circle key={e} cx={ex(e)} cy={ey(alphaOf(e))} r={3} fill="var(--ifm-color-emphasis-700)" />)}
          {ok ? <circle cx={ex(eps)} cy={ey(alpha)} r={7} fill="var(--vok)" /> : null}
          <text x={ex(0)} y={CH - 14} textAnchor="middle" className={s.ts}>0</text>
          <text x={ex(0.5)} y={CH - 14} textAnchor="middle" className={s.ts}>0.5</text>
          <text x={ex(1)} y={CH - 14} textAnchor="middle" className={s.ts}>1</text>
          <text x={36} y={CH - 2} className={s.ts}>가로축 ε, 세로축 α</text>
        </svg>
      </div>
      <Stats>
        <Stat label="가중 오류 ε" value={fmt(eps, 3)} />
        <Stat label="α = ½ ln((1−ε)/ε)" value={ok ? fmt(alpha, 3) : '정의 안 됨'} tone={ok ? undefined : 'bad'} />
        <Stat label="Z = 2√(ε(1−ε))" value={ok ? fmt(Z, 3) : '—'} />
        <Stat label="틀린 예시 하나의 새 가중치" value={ok ? fmt(wWrong, 3) : '—'} />
        <Stat label="맞힌 예시 하나의 새 가중치" value={ok ? fmt(wRight, 3) : '—'} />
        <Stat label="틀린 쪽 가중치 합" value={ok ? fmt(wWrong * kk, 3) : '—'} tone="good" />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr><th>ε</th>{[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((e) => <th key={e} className={Math.abs(eps - e) < 1e-9 ? s.cellOn : undefined}>{e}</th>)}</tr>
        </thead>
        <tbody>
          <tr><td>α</td>{[0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((e) => <td key={e} className={Math.abs(eps - e) < 1e-9 ? s.cellOn : undefined}>{fmt(alphaOf(e), 3)}</td>)}</tr>
        </tbody>
      </table>
      {!ok ? <Note>ε이 0이거나 1이면 로그 안의 비가 0 또는 무한대라 α를 정할 수 없습니다.</Note> : eps === 0.5 ? <Note>ε = 0.5이면 α = 0이고 배율이 모두 1이라 가중치가 변하지 않습니다. 그 분류기는 표를 얻지 못합니다.</Note> : eps > 0.5 ? <Note>ε이 0.5보다 크면 α가 음수입니다. 음의 표는 그 분류기의 답을 뒤집어 쓰는 것과 같습니다.</Note> : null}
    </Viz>
  );
}
