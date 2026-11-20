import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, styles as s} from '../../Viz';
import {STATES, OBS, DEFAULT_PARAMS, toModel, joint, trim, ParamControls, ObsPicker} from './hmmCore';

const YS = [64, 144];
const YO = 222;
const HALO = {stroke: 'var(--ifm-background-color)', strokeWidth: 4, paintOrder: 'stroke'};

export default function HmmJoint() {
  const [p, setP] = useState(DEFAULT_PARAMS);
  const [T, setT] = useState(3);
  const [q4, setQ] = useState([0, 1, 1, 0]);
  const [o4, setO] = useState([0, 1, 2, 0]);
  const q = q4.slice(0, T);
  const o = o4.slice(0, T);
  const XS = Array.from({length: T}, (_, i) => (T === 1 ? 320 : 80 + (i * 440) / (T - 1)));
  const m = toModel(p);
  const {p: total, steps} = joint(m, q, o);
  const tx = (r, c) => m.A[r][c];

  return (
    <Viz
      title="상태열을 고르고 시각마다 확률을 곱해 보기"
      caption="동그라미가 그날의 날씨(상태), 아래 네모가 그날 한 일(관측)입니다. 상태열은 동그라미를 눌러 정하고, 관측은 버튼으로 정합니다. 확률표는 원문 값이 기본이고 슬라이더로 바꿀 수 있습니다. 방출표와 전이표는 각 행의 합이 1이 되도록 마지막 칸이 자동으로 정해집니다."
    >
      <ParamControls p={p} set={setP} />
      <Controls>
        <Slider label="날 수 T" min={1} max={4} step={1} value={T} onChange={setT} />
      </Controls>
      <ObsPicker obs={o4} set={setO} T={T} />
      <svg viewBox="0 0 640 262" className={s.svg} role="img" aria-label="시각마다 상태와 관측을 놓은 격자. 고른 상태열을 따라 전이와 방출 확률이 곱해진다.">
        {XS.slice(0, -1).map((_, t) =>
          [0, 1].map((r) =>
            [0, 1].map((c) => {
              const used = q[t] === r && q[t + 1] === c;
              return (
                <g key={`${t}${r}${c}`}>
                  <line x1={XS[t] + 24} y1={YS[r]} x2={XS[t + 1] - 24} y2={YS[c]} stroke={used ? 'var(--vb)' : 'var(--ifm-color-emphasis-300)'} strokeWidth={used ? 3 : 1.2} />
                  {used ? (
                    <text x={(XS[t] + XS[t + 1]) / 2} y={(YS[r] + YS[c]) / 2 + (r === c ? (r === 0 ? -8 : 16) : r < c ? -4 : 14)} textAnchor="middle" className={s.t} fontWeight="700" style={{...HALO, fill: 'var(--vb)'}}>
                      전이 {trim(tx(r, c))}
                    </text>
                  ) : null}
                </g>
              );
            }),
          ),
        )}
        {XS.map((x, t) => (
          <g key={t}>
            <text x={x} y="20" textAnchor="middle" className={s.ts}>{t + 1}일째</text>
            {[0, 1].map((r) => {
              const on = q[t] === r;
              return (
                <g key={r} role="button" tabIndex={0} aria-label={`${t + 1}일째 날씨를 ${STATES[r]}로`} style={{cursor: 'pointer'}}
                  onClick={() => setQ(q4.map((v, i) => (i === t ? r : v)))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setQ(q4.map((v, i) => (i === t ? r : v))); } }}>
                  <circle cx={x} cy={YS[r]} r="24" fill={on ? 'var(--vb)' : 'var(--ifm-background-color)'} stroke={on ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'} strokeWidth="2" />
                  <text x={x} y={YS[r] + 5} textAnchor="middle" className={s.t} style={{fill: on ? 'var(--ifm-background-color)' : undefined}} fontWeight="600">{STATES[r]}</text>
                </g>
              );
            })}
            {q[t] === 0 ? (
              <g>
                <line x1={x + 17} y1={YS[0] + 17} x2={x + 38} y2={YO - 16} stroke="var(--vb)" strokeWidth="2.4" />
                <polygon points={`${x + 38},${YO - 16} ${x + 32},${YO - 26} ${x + 43},${YO - 26}`} fill="var(--vb)" />
              </g>
            ) : (
              <g>
                <line x1={x} y1={YS[1] + 24} x2={x} y2={YO - 16} stroke="var(--vb)" strokeWidth="2.4" />
                <polygon points={`${x},${YO - 16} ${x - 5},${YO - 26} ${x + 5},${YO - 26}`} fill="var(--vb)" />
              </g>
            )}
            <text x={x + (q[t] === 0 ? 46 : 8)} y={YO - 36} className={s.t} fontWeight="700" style={{...HALO, fill: 'var(--vb)'}}>방출 {trim(m.B[q[t]][o[t]])}</text>
            <rect x={x - 44} y={YO - 12} width="88" height="32" rx="5" fill="var(--ifm-background-color)" stroke="var(--ifm-color-emphasis-500)" strokeWidth="1.5" />
            <text x={x} y={YO + 9} textAnchor="middle" className={s.t}>{OBS[o[t]]}</text>
          </g>
        ))}
      </svg>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>시각</th>
            <th>한 일</th>
            <th>곱한 확률</th>
            <th>누적</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((st, t) => (
            <tr key={t}>
              <td>{t + 1}</td>
              <td>{t === 0 ? `${STATES[q[0]]}에서 ${OBS[o[0]]}` : `${STATES[q[t - 1]]}→${STATES[q[t]]}, ${STATES[q[t]]}에서 ${OBS[o[t]]}`}</td>
              <td>{t === 0 ? `시작 π ${trim(st.trans)} × 방출 ${trim(st.emit)} = ${trim(st.trans * st.emit)}` : `${trim(st.trans)} × ${trim(st.emit)} = ${trim(st.trans * st.emit)}`}</td>
              <td className={t === T - 1 ? s.cellOn : undefined}>{trim(st.acc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="상태열과 관측열이 함께 나올 확률" value={trim(total)} />
        <Stat label="-ln(확률) (작을수록 확률이 큼)" value={total > 0 ? (-Math.log(total)).toFixed(3) : '무한대 (확률 0)'} />
      </Stats>
      <Note>
        {total === 0
          ? '확률이 0인 조각이 하나 들어 있어서 이 상태열은 이 관측을 낼 수 없습니다.'
          : '시각마다 곱할 항이 두 개씩이라 시각이 늘면 이 수는 빠르게 작아집니다. 기본값(3일, 맑음-비-비, 산책-쇼핑-청소)은 0.36, 0.0432, 0.01296입니다.'}
      </Note>
    </Viz>
  );
}
