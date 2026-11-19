import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {STATES, OBS, DEFAULT_PARAMS, toModel, enumerate, lattice, trim, ParamControls, ObsPicker} from './hmmCore';

const YS = [54, 134];
const YO = 190;

export default function ForwardGrid() {
  const [p, setP] = useState(DEFAULT_PARAMS);
  const [T, setT] = useState(3);
  const [o, setO] = useState([0, 1, 2, 0, 1]);
  const [step, setStep] = useState(3);
  const m = toModel(p);
  const obs = o.slice(0, T);
  const {alpha, vit, cand} = lattice(m, obs);
  const t = Math.min(step, T);
  const x = (i) => (T === 1 ? 320 : 80 + (i * 480) / (T - 1));
  const P = alpha[T - 1][0] + alpha[T - 1][1];
  const best = Math.max(vit[T - 1][0], vit[T - 1][1]);
  const rows = enumerate(m, obs).sort((a, b) => b.p - a.p);
  const enumSum = rows.reduce((a, r) => a + r.p, 0);
  const done = t === T;
  const col = t >= 1 ? t - 1 : 0;

  return (
    <Viz
      title="격자에서 전방 값이 시각 순서대로 채워지는 모습"
      caption="각 칸에 전방 값 α(합)와 비터비 값 v(최댓값)가 같은 후보로 계산됩니다. 걸음을 하나씩 넘겨 보세요. 기본값(3일, 산책-쇼핑-청소, 원문 확률표)에서 마지막 합이 0.03564, 최댓값이 0.01296입니다."
    >
      <ParamControls p={p} set={setP} />
      <Controls>
        <Slider label="날 수 T" min={1} max={5} step={1} value={T} onChange={(v) => { setT(v); setStep(Math.min(step, v)); }} />
      </Controls>
      <ObsPicker obs={o} set={setO} T={T} />
      <Controls>
        <Btn on={false} onClick={() => setStep(Math.max(0, t - 1))}>이전 걸음</Btn>
        <Btn on={false} onClick={() => setStep(Math.min(T, t + 1))}>다음 걸음</Btn>
        <Btn on={false} onClick={() => setStep(T)}>끝까지</Btn>
        <Btn on={false} onClick={() => setStep(0)}>처음으로</Btn>
        <span className={s.ts}>채운 시각: {t} / {T}</span>
      </Controls>
      <svg viewBox="0 0 640 226" className={s.svg} role="img" aria-label="시각 순서대로 격자 칸의 전방 값과 비터비 값이 채워진다">
        {obs.map((_, i) => (i > 0 ? [0, 1].map((r) => [0, 1].map((c) => (
          <line key={`${i}${r}${c}`} x1={x(i - 1) + 32} y1={YS[r]} x2={x(i) - 32} y2={YS[c]} stroke={i === t ? 'var(--vb)' : 'var(--ifm-color-emphasis-300)'} strokeWidth={i === t ? 2 : 1} opacity={i <= t ? 1 : 0.35} />
        ))) : null))}
        {obs.map((ob, i) => (
          <g key={i} opacity={i < t ? 1 : 0.35}>
            <text x={x(i)} y="10" textAnchor="middle" className={s.ts}>{i + 1}일째</text>
            {[0, 1].map((r) => (
              <g key={r}>
                <circle cx={x(i)} cy={YS[r]} r="32" fill={i === t - 1 ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : 'var(--ifm-background-color)'} stroke={i === t - 1 ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth="2" />
                <text x={x(i)} y={YS[r] - 9} textAnchor="middle" className={s.t} fontSize="12" fontWeight="600">{STATES[r]}</text>
                <text x={x(i)} y={YS[r] + 6} textAnchor="middle" className={s.ts} fontSize="10">{i < t ? `α ${trim(alpha[i][r], 5)}` : 'α ?'}</text>
                <text x={x(i)} y={YS[r] + 19} textAnchor="middle" className={s.ts} fontSize="10">{i < t ? `v ${trim(vit[i][r], 5)}` : 'v ?'}</text>
              </g>
            ))}
            <rect x={x(i) - 28} y={YO - 4} width="56" height="26" rx="5" fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" />
            <text x={x(i)} y={YO + 14} textAnchor="middle" className={s.t}>{OBS[ob]}</text>
          </g>
        ))}
      </svg>
      {t >= 1 ? (
        <div style={{overflowX: 'auto'}}>
          <table className={s.grid} style={{minWidth: 620}}>
            <thead>
              <tr>
                <th>{t}일째, {OBS[obs[col]]}</th>
                {col > 0 ? (<><th>전방: 맑음에서</th><th>전방: 비에서</th><th>sum</th><th>비터비: 맑음에서</th><th>비터비: 비에서</th><th>max</th></>) : null}
                <th>방출</th>
                <th>비터비 v</th>
                <th>전방 α</th>
              </tr>
            </thead>
            <tbody>
              {[0, 1].map((r) => (
                <tr key={r}>
                  <td>{STATES[r]}</td>
                  {col > 0 ? (
                    <>
                      <td>{trim(cand[col].alpha[r][0], 6)}</td>
                      <td>{trim(cand[col].alpha[r][1], 6)}</td>
                      <td>{trim(cand[col].alpha[r][0] + cand[col].alpha[r][1], 6)}</td>
                      <td>{trim(cand[col].vit[r][0], 6)}</td>
                      <td>{trim(cand[col].vit[r][1], 6)}</td>
                      <td>{trim(Math.max(cand[col].vit[r][0], cand[col].vit[r][1]), 6)}</td>
                    </>
                  ) : null}
                  <td>{col === 0 ? `${trim(m.pi[r])} × ${trim(m.B[r][obs[0]])}` : trim(m.B[r][obs[col]])}</td>
                  <td>{trim(vit[col][r], 6)}</td>
                  <td className={s.cellOn}>{trim(alpha[col][r], 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Note>아직 아무 칸도 채우지 않았습니다. 다음 걸음을 눌러 보세요.</Note>
      )}
      {col > 0 && t >= 1 ? <Note>후보는 앞 시각의 값에 전이 확률을 곱한 것입니다. 전방은 앞 시각 α에서, 비터비는 앞 시각 v에서 출발하므로 3일째부터 두 후보가 달라집니다. 전방은 후보를 더하고(sum), 비터비는 큰 쪽만 남깁니다(max). 거기에 방출을 곱합니다.</Note> : null}
      {done ? (
        <Stats>
          <Stat label="전방: 관측열의 확률 P" value={trim(P, 6)} tone="good" />
          <Stat label="비터비: 최대 경로 확률" value={trim(best, 6)} />
          <Stat label="나열해 더한 값" value={trim(enumSum, 6)} tone={Math.abs(enumSum - P) < 1e-12 ? 'good' : 'bad'} />
          <Stat label="비용 -ln (비터비, 전방)" value={P > 0 && best > 0 ? `${(-Math.log(best)).toFixed(3)}, ${(-Math.log(P)).toFixed(3)}` : '-'} />
          <Stat label="마지막 날 상태 분포 (맑음, 비)" value={P > 0 ? `${(alpha[T - 1][0] / P).toFixed(3)}, ${(alpha[T - 1][1] / P).toFixed(3)}` : '-'} />
          <Stat label="최대 / 합" value={P > 0 ? (best / P).toFixed(3) : '-'} />
        </Stats>
      ) : null}
      {done && P === 0 ? <Note>관측열의 확률이 0입니다. 이 모델에서는 나올 수 없는 관측열입니다.</Note> : null}
      {done && P > 0 ? <Note>마지막 시각의 두 전방 값을 합 P로 나누면 관측을 모두 본 뒤 마지막 날이 맑음일 확률과 비일 확률이 됩니다. 나열해 더한 값과 같은 P가 나오는 것을 확인하세요.</Note> : null}
    </Viz>
  );
}
