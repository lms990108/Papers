import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {W_STATES, W_OBS, weatherA, weatherEmit, weatherStart, trellis, backtrace} from './util';

const CX = [130, 320, 510];
const CY = [78, 178];
const HW = 56;

const fp = (x) => String(+x.toPrecision(4));
const cost = (x) => -Math.log(x);

export default function WeatherViterbi() {
  const [filled, setFilled] = useState(0);
  const [trace, setTrace] = useState(false);
  const [asCost, setAsCost] = useState(false);
  const [pSS, setPSS] = useState(0.7);
  const [pRR, setPRR] = useState(0.6);

  const A = useMemo(() => weatherA(pSS, pRR), [pSS, pRR]);
  const tr = useMemo(() => trellis(A, 3), [A]);
  const cols = Math.floor(filled / 2);
  const showTrace = trace && cols >= 1;
  const path = showTrace ? backtrace(tr.back.slice(0, cols), tr.v.slice(0, cols), cols) : [];
  const show = (x) => (asCost ? fmt(cost(x), 3) : fp(x));
  const isOn = (t, st) => showTrace && path[t] === st;
  const cellIdx = (t, st) => t * 2 + st;
  const isFilled = (t, st) => cellIdx(t, st) < filled;
  const latest = filled - 1;

  const edges = [];
  for (let t = 1; t < 3; t += 1) {
    for (let r = 0; r < 2; r += 1) {
      for (let st = 0; st < 2; st += 1) {
        const x1 = CX[t - 1] + HW;
        const x2 = CX[t] - HW;
        const y1 = CY[r];
        const y2 = CY[st];
        const ok = isFilled(t, st);
        const chosen = ok && tr.back[t][st] === r;
        const onPath = showTrace && path[t] === st && path[t - 1] === r;
        const f = r === st ? 0.5 : 0.32;
        edges.push({
          key: `${t}${r}${st}`,
          x1, y1, x2, y2, ok, chosen, onPath,
          lx: x1 + (x2 - x1) * f,
          ly: y1 + (y2 - y1) * f + (r === st ? (r === 0 ? -8 : 16) : r === 0 ? 14 : -6),
          text: fmt(A[r][st], 2),
        });
      }
    }
  }

  const rows = [];
  for (let i = 0; i < filled; i += 1) {
    const t = Math.floor(i / 2);
    const st = i % 2;
    rows.push({t, st, i});
  }

  return (
    <Viz
      title="날씨 격자에서 비터비 표 채우기"
      caption="칸을 하나씩 채워 보세요. 칸마다 두 후보 중 큰 것(비용으로는 작은 것) 하나만 남기고, 출처를 적어 둡니다. 채운 뒤 '거꾸로 따라가기'를 누르면 경로가 나옵니다."
    >
      <Controls>
        <Slider label="채운 칸" min={0} max={6} value={filled} onChange={(x) => { setFilled(x); }} />
        <Btn onClick={() => setFilled(Math.min(6, filled + 1))}>한 칸 더</Btn>
        <Btn onClick={() => { setFilled(0); setTrace(false); }}>처음으로</Btn>
        <Btn on={trace} onClick={() => setTrace(!trace)}>거꾸로 따라가기</Btn>
        <Btn on={asCost} onClick={() => setAsCost(!asCost)}>{asCost ? '비용(−log)으로 보는 중' : '확률로 보는 중'}</Btn>
      </Controls>
      <Controls>
        <Slider label="맑음→맑음" min={0.05} max={0.95} step={0.05} value={pSS} onChange={setPSS} format={(x) => fmt(x, 2)} />
        <Slider label="비→비" min={0.05} max={0.95} step={0.05} value={pRR} onChange={setPRR} format={(x) => fmt(x, 2)} />
        <Btn onClick={() => { setPSS(0.7); setPRR(0.6); }}>원본 값 (0.7, 0.6)</Btn>
      </Controls>
      <svg viewBox="0 0 640 250" className={s.svg} role="img" aria-label="맑음과 비 두 상태, 시각 세 개의 격자. 채운 칸에는 그 칸까지의 최대 확률이 적힙니다.">
        {CX.map((x, t) => (
          <text key={t} x={x} y={18} textAnchor="middle" className={s.ts}>시각 {t + 1} · {W_OBS[t]}</text>
        ))}
        {edges.map((e) => (
          <g key={e.key}>
            <line
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke={e.onPath ? 'var(--vok)' : e.chosen ? 'var(--vb)' : 'var(--ifm-color-emphasis-400)'}
              strokeWidth={e.onPath ? 5 : e.chosen ? 3 : 1}
              strokeDasharray={e.ok ? undefined : '3 4'}
              opacity={e.ok ? 1 : 0.5}
            />
            <text x={e.lx} y={e.ly} textAnchor="middle" className={s.ts} opacity={e.ok ? 1 : 0.5}>{e.text}</text>
          </g>
        ))}
        {[0, 1, 2].map((t) =>
          [0, 1].map((st) => {
            const ok = isFilled(t, st);
            const cur = cellIdx(t, st) === latest;
            return (
              <g key={`${t}${st}`}>
                <rect
                  x={CX[t] - HW} y={CY[st] - 28} width={HW * 2} height={56} rx={8}
                  fill={cur ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : 'var(--ifm-background-color)'}
                  stroke={isOn(t, st) ? 'var(--vok)' : 'var(--ifm-font-color-base)'}
                  strokeWidth={isOn(t, st) ? 4 : 1.2}
                  strokeDasharray={ok ? undefined : '4 3'}
                  opacity={ok ? 1 : 0.55}
                />
                <text x={CX[t]} y={CY[st] - 8} textAnchor="middle" className={s.ts}>{W_STATES[st]}</text>
                <text x={CX[t]} y={CY[st] + 14} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>
                  {ok ? show(tr.v[t][st]) : '?'}
                </text>
              </g>
            );
          }),
        )}
        <text x={320} y={242} textAnchor="middle" className={s.ts}>호 위의 숫자는 전이 확률입니다. 주황 호는 칸마다 남긴 출처입니다.</text>
      </svg>
      {rows.length ? (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>시각, 관측</th><th>상태</th><th>맑음에서 오는 후보</th><th>비에서 오는 후보</th><th>선택</th><th>방출</th><th>v</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cls = r.i === latest ? s.cellOn : undefined;
              const first = r.t === 0;
              const c = first ? null : tr.cand[r.t][r.st];
              const txt = (q) => {
                const pv = tr.v[r.t - 1][q];
                return asCost ? fmt(cost(c[q]), 3) : `${fp(pv)} × ${fp(A[q][r.st])} = ${fp(c[q])}`;
              };
              return (
                <tr key={r.i}>
                  <td className={cls}>{r.t + 1}, {W_OBS[r.t]}</td>
                  <td className={cls}>{W_STATES[r.st]}</td>
                  <td className={cls}>{first ? `시작 ${weatherStart(r.st)}` : txt(0)}</td>
                  <td className={cls}>{first ? '' : txt(1)}</td>
                  <td className={cls}>{first ? '' : W_STATES[tr.back[r.t][r.st]]}</td>
                  <td className={cls}>{weatherEmit(r.st, r.t)}</td>
                  <td className={cls}>{show(tr.v[r.t][r.st])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <Note>아직 채운 칸이 없습니다. 슬라이더를 움직이거나 '한 칸 더'를 누르세요.</Note>
      )}
      {showTrace ? (
        <Stats>
          <Stat label={`시각 ${cols}까지의 경로`} value={path.map((q) => W_STATES[q]).join('-')} tone="good" />
          <Stat label={asCost ? '비용' : '확률'} value={show(Math.max(tr.v[cols - 1][0], tr.v[cols - 1][1]))} />
        </Stats>
      ) : trace ? (
        <Note>거꾸로 따라가려면 한 시각(두 칸) 이상 채워야 합니다.</Note>
      ) : null}
      <Note>
        {asCost
          ? '비용 모드는 확률에 −log를 취해 곱을 합으로, 큰 값 선택을 작은 값 선택으로 바꾼 것입니다. 후보 열에는 후보의 비용만 보입니다.'
          : '칸 수를 4로 하고 따라가면 연습 문제 1번(관측이 산책, 쇼핑까지)의 답이 나옵니다.'}
      </Note>
    </Viz>
  );
}
