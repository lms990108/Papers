import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, styles as s} from '../../Viz';
import {trim} from './util';

const G0 = [1, 0.35, 0, 0, 0, 0.55, 0.25, 0, 0, 0, 0.45, 0, 0.7, 1, 0, 0.2];
const MODES = [
  ['avg', '평균'],
  ['max', '최대'],
  ['sum', '합'],
];
const CS = 64;

const block = (g, br, bc) => [0, 1, 2, 3].map((q) => g[(2 * br + (q >> 1)) * 4 + 2 * bc + (q & 1)]);
const reduce = (vals, mode) => {
  const sum = vals.reduce((a, b) => a + b, 0);
  return mode === 'max' ? Math.max(...vals) : mode === 'sum' ? sum : sum / 4;
};

export default function PoolGrid() {
  const [g, setG] = useState(G0);
  const [sel, setSel] = useState(0);
  const [mode, setMode] = useState('avg');

  const out = [0, 1, 2, 3].map((q) => reduce(block(g, q >> 1, q & 1), mode));
  const setVal = (v) => setG(g.map((e, i) => (i === sel ? v : e)));
  const sb = [sel >> 3, (sel >> 1) & 1];
  const same = G0.every((v, i) => v === g[i]);

  return (
    <Viz
      title="2×2 덩어리를 하나의 수로 요약하기"
      caption="왼쪽 4×4의 칸을 눌러 고른 뒤 슬라이더로 짙은 정도(0~1)를 바꿔 보세요. 겹치지 않는 2×2 덩어리마다 하나씩 나옵니다. 기본값은 본문의 4×4이고, 평균은 0.475, 0.0625, 0.425, 0.1625입니다."
    >
      <Controls>
        {MODES.map(([id, name]) => (
          <Btn key={id} on={mode === id} onClick={() => setMode(id)}>{name}</Btn>
        ))}
        <Slider label={`${(sel >> 2) + 1}행 ${(sel & 3) + 1}열`} min={0} max={1} step={0.05} value={g[sel]} onChange={setVal} format={(v) => trim(v, 2)} />
        <Btn onClick={() => setG(G0)}>본문 예로</Btn>
      </Controls>
      <div className={s.two}>
        <svg viewBox={`0 0 ${4 * CS + 8} ${4 * CS + 8}`} className={s.svg} style={{maxWidth: 300}} role="img" aria-label="4×4 칸과 겹치지 않는 2×2 덩어리 네 개">
          {g.map((v, i) => {
            const r = i >> 2;
            const c = i & 3;
            const vals = block(g, r >> 1, c >> 1);
            const isMax = mode === 'max' && v === Math.max(...vals) && v > 0;
            return (
              <g key={i} onClick={() => setSel(i)} onKeyDown={(e) => e.key === 'Enter' && setSel(i)} role="button" tabIndex={0} aria-label={`${r + 1}행 ${c + 1}열 값 ${trim(v, 2)}`} style={{cursor: 'pointer'}}>
                <rect x={4 + c * CS} y={4 + r * CS} width={CS} height={CS} fill="var(--vb)" fillOpacity={Math.max(0, Math.min(1, v)) * 0.85} stroke={i === sel ? 'var(--va)' : 'var(--ifm-color-emphasis-400)'} strokeWidth={i === sel ? 3.5 : 1} />
                <text x={4 + c * CS + CS / 2} y={4 + r * CS + CS / 2 + 5} textAnchor="middle" className={s.t} style={{fontWeight: isMax ? 800 : 400, textDecoration: isMax ? 'underline' : 'none'}}>{trim(v, 2)}</text>
              </g>
            );
          })}
          {[0, 1].map((br) =>
            [0, 1].map((bc) => (
              <rect key={`${br}${bc}`} x={4 + bc * 2 * CS} y={4 + br * 2 * CS} width={2 * CS} height={2 * CS} fill="none" stroke={br === sb[0] && bc === sb[1] ? 'var(--va)' : 'var(--ifm-font-color-base)'} strokeWidth={br === sb[0] && bc === sb[1] ? 3.5 : 2} pointerEvents="none" />
            )),
          )}
        </svg>
        <div>
          <div className={s.title}>{MODES.find((m) => m[0] === mode)[1]} 풀링의 결과 (2×2)</div>
          <table className={s.grid} style={{maxWidth: 260}}>
            <tbody>
              {[0, 1].map((r) => (
                <tr key={r}>
                  {[0, 1].map((c) => (
                    <td key={c} className={r === sb[0] && c === sb[1] ? s.cellOn : undefined} style={{fontSize: '1rem'}}>{trim(out[r * 2 + c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Note>
            고른 덩어리({sb[0] + 1}행 {sb[1] + 1}열)의 네 값은 {block(g, sb[0], sb[1]).map((v) => trim(v, 2)).join(', ')}입니다. 합 {trim(block(g, sb[0], sb[1]).reduce((a, b) => a + b, 0))}, 평균 {trim(reduce(block(g, sb[0], sb[1]), 'avg'))}, 최대 {trim(reduce(block(g, sb[0], sb[1]), 'max'))}입니다.
            {same && mode === 'sum' ? ' 본문의 합은 1.9, 0.25, 1.7, 0.65입니다.' : ''}
            {same && mode === 'max' ? ' 본문의 최대는 1.0, 0.25, 1.0, 0.45입니다.' : ''}
          </Note>
          <Note>평균은 덩어리가 전체적으로 얼마나 짙은지, 최대는 그 안에 센 반응이 하나라도 있는지를 말합니다. 같은 덩어리에서 두 값이 얼마나 다른지 비교해 보세요.</Note>
        </div>
      </div>
    </Viz>
  );
}
