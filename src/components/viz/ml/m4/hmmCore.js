import React from 'react';
import {Controls, Slider, Btn} from '../../Viz';

// 날씨 예: 상태 = 맑음, 비 / 관측 = 산책, 쇼핑, 청소. 원문 표의 값이 기본값입니다.
export const STATES = ['맑음', '비'];
export const OBS = ['산책', '쇼핑', '청소'];
export const DEFAULT_PARAMS = {pi: 0.6, a0: 0.7, a1: 0.4, b: [[0.6, 0.3], [0.1, 0.4]]};

const r4 = (x) => Math.round(x * 10000) / 10000 + 0;

export function toModel(p) {
  return {
    pi: [r4(p.pi), r4(1 - p.pi)],
    A: [[r4(p.a0), r4(1 - p.a0)], [r4(p.a1), r4(1 - p.a1)]],
    B: p.b.map(([x, y]) => [r4(x), r4(y), r4(1 - x - y)]),
  };
}

// 상태열 q(상태 번호 배열)와 관측열 o(관측 번호 배열)의 결합 확률과 단계별 곱
export function joint(m, q, o) {
  const steps = [];
  let acc = 1;
  q.forEach((s, t) => {
    const trans = t === 0 ? m.pi[s] : m.A[q[t - 1]][s];
    const emit = m.B[s][o[t]];
    acc *= trans * emit;
    steps.push({trans, emit, acc});
  });
  return {p: acc, steps};
}

export function enumerate(m, o) {
  const T = o.length;
  const rows = [];
  const total = Math.pow(2, T);
  for (let code = 0; code < total; code += 1) {
    const q = [];
    for (let t = 0; t < T; t += 1) q.push((code >> (T - 1 - t)) & 1);
    rows.push({q, p: joint(m, q, o).p});
  }
  return rows;
}

// 전방(합)과 비터비(최댓값)를 같은 후보로 계산
export function lattice(m, o) {
  const alpha = [];
  const vit = [];
  const cand = [];
  o.forEach((ob, t) => {
    if (t === 0) {
      alpha.push([0, 1].map((s) => m.pi[s] * m.B[s][ob]));
      vit.push(alpha[0].slice());
      cand.push(null);
      return;
    }
    const cs = [0, 1].map((s) => [0, 1].map((r) => alpha[t - 1][r] * m.A[r][s]));
    const cv = [0, 1].map((s) => [0, 1].map((r) => vit[t - 1][r] * m.A[r][s]));
    cand.push({alpha: cs, vit: cv});
    alpha.push([0, 1].map((s) => (cs[s][0] + cs[s][1]) * m.B[s][ob]));
    vit.push([0, 1].map((s) => Math.max(cv[s][0], cv[s][1]) * m.B[s][ob]));
  });
  return {alpha, vit, cand};
}

export const trim = (x, d = 8) => {
  if (!Number.isFinite(x)) return '-';
  const t = parseFloat(x.toFixed(d));
  return String(t === 0 && x !== 0 ? x.toExponential(2) : t);
};

const sl = (label, min, max, value, onChange) => (
  <Slider label={label} min={min} max={max} step={0.05} value={value} onChange={onChange} format={(v) => v.toFixed(2)} />
);

// 확률 슬라이더 묶음. 각 행의 합이 1이 되도록 마지막 칸은 자동으로 정해집니다.
export function ParamControls({p, set}) {
  const setB = (s, k, v) => {
    const row = p.b[s].slice();
    row[k] = v;
    const other = 1 - k;
    if (row[0] + row[1] > 1 + 1e-9) row[other] = Math.max(0, r4(1 - v));
    set({...p, b: p.b.map((x, i) => (i === s ? row : x))});
  };
  const m = toModel(p);
  return (
    <div>
      <Controls>
        {sl('시작: 맑음', 0, 1, p.pi, (v) => set({...p, pi: v}))}
        <span style={{fontSize: '0.8rem'}}>비 = {m.pi[1].toFixed(2)}</span>
      </Controls>
      <Controls>
        {sl('전이 맑음→맑음', 0, 1, p.a0, (v) => set({...p, a0: v}))}
        <span style={{fontSize: '0.8rem'}}>맑음→비 = {m.A[0][1].toFixed(2)}</span>
        {sl('전이 비→맑음', 0, 1, p.a1, (v) => set({...p, a1: v}))}
        <span style={{fontSize: '0.8rem'}}>비→비 = {m.A[1][1].toFixed(2)}</span>
      </Controls>
      <Controls>
        {sl('맑음: 산책', 0, 1, p.b[0][0], (v) => setB(0, 0, v))}
        {sl('맑음: 쇼핑', 0, 1, p.b[0][1], (v) => setB(0, 1, v))}
        <span style={{fontSize: '0.8rem'}}>맑음: 청소 = {m.B[0][2].toFixed(2)}</span>
      </Controls>
      <Controls>
        {sl('비: 산책', 0, 1, p.b[1][0], (v) => setB(1, 0, v))}
        {sl('비: 쇼핑', 0, 1, p.b[1][1], (v) => setB(1, 1, v))}
        <span style={{fontSize: '0.8rem'}}>비: 청소 = {m.B[1][2].toFixed(2)}</span>
        <Btn on={false} onClick={() => set(DEFAULT_PARAMS)}>원문 표로</Btn>
      </Controls>
    </div>
  );
}

// 관측 고르기 버튼 묶음
export function ObsPicker({obs, set, T}) {
  return (
    <Controls>
      {Array.from({length: T}, (_, t) => (
        <span key={t} style={{display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem'}}>
          {t + 1}일째
          {OBS.map((name, k) => (
            <Btn key={name} on={obs[t] === k} onClick={() => set(obs.map((x, i) => (i === t ? k : x)))}>{name}</Btn>
          ))}
        </span>
      ))}
    </Controls>
  );
}
