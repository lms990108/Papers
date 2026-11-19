import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';
import {trim} from './util';

const PRESETS = [
  {t: '오늘 (마스크 없음)', v: [1, 0, 0.67, 0.33, 0, 3]},
  {t: '오늘 (마스크 있음)', v: [1, 0, 1, 0, 0, 3]},
  {t: '연습 문제 1', v: [1, 1, 0.5, 1.5, 0, 3]},
];

function layerNorm(z) {
  const mu = (z[0] + z[1]) / 2;
  const variance = ((z[0] - mu) ** 2 + (z[1] - mu) ** 2) / 2;
  const sd = Math.sqrt(variance);
  if (sd < 1e-9) return {out: [0, 0], mu, sd, flat: true};
  return {out: z.map((v) => (v - mu) / sd), mu, sd, flat: false};
}

function Bars({v}) {
  const sc = 17;
  return (
    <svg viewBox="0 0 130 34" width="130" height="34" aria-hidden="true" style={{display: 'block', margin: '0 auto'}}>
      <line x1={65} y1={2} x2={65} y2={32} stroke="var(--ifm-color-emphasis-500)" />
      {v.map((x, k) => {
        const w = Math.min(60, Math.abs(x) * sc);
        return <rect key={k} x={x >= 0 ? 65 : 65 - w} y={4 + k * 15} width={Math.max(1, w)} height={11} fill={x >= 0 ? 'var(--va)' : 'var(--vb)'} />;
      })}
    </svg>
  );
}

const vec = (v) => `[${v.map((x) => trim(x)).join(', ')}]`;

export default function TransformerBlockFlow() {
  const [val, setVal] = useState(PRESETS[0].v);
  const [stage, setStage] = useState(6);
  const set = (k) => (x) => setVal(val.map((a, j) => (j === k ? x : a)));

  const x = [val[0], val[1]];
  const a = [val[2], val[3]];
  const u = [val[4], val[5]];
  const z1 = [x[0] + a[0], x[1] + a[1]];
  const l1 = layerNorm(z1);
  const y = u.map((v) => Math.max(0, v));
  const z2 = [l1.out[0] + y[0], l1.out[1] + y[1]];
  const l2 = layerNorm(z2);

  const rows = [
    {n: '입력', f: '토큰의 목록 x (위치 목록을 더하기 전)', r: x},
    {n: '어텐션', f: '어텐션 출력 a', r: a},
    {n: '더하기 (잔차 연결)', f: 'z = x + a — 원래 목록 x가 그대로 지나갑니다', r: z1, res: true},
    {n: '층 정규화', f: `평균 ${trim(l1.mu)}, 표준편차 ${trim(l1.sd)} 기준으로 정규화`, r: l1.out},
    {n: '칸마다의 층', f: `ReLU(${vec(u)}) = ${vec(y)} (W₂ = 단위행렬)`, r: y},
    {n: '더하기 (잔차 연결)', f: 'z = 정규화한 목록 + 층의 출력', r: z2, res: true},
    {n: '층 정규화', f: `평균 ${trim(l2.mu)}, 표준편차 ${trim(l2.sd)} 기준으로 정규화`, r: l2.out},
  ];

  return (
    <Viz
      title="블록 하나를 한 단계씩 지나가 보기"
      caption="목록 [x1, x2]가 어텐션, 더하기, 층 정규화, 칸마다의 층, 더하기, 층 정규화를 차례로 지납니다(γ = 1, β = 0, ε = 0). 막대는 칸의 값이고 파랑은 양수, 주황은 음수입니다. 슬라이더로 값을 바꿔 보세요."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={p.v.join() === val.join()} onClick={() => setVal(p.v)}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="x1" min={-2} max={2} step={0.1} value={val[0]} onChange={set(0)} format={(v) => fmt(v, 1)} />
        <Slider label="x2" min={-2} max={2} step={0.1} value={val[1]} onChange={set(1)} format={(v) => fmt(v, 1)} />
        <Slider label="어텐션 출력 a1" min={-2} max={2} step={0.01} value={val[2]} onChange={set(2)} />
        <Slider label="a2" min={-2} max={2} step={0.01} value={val[3]} onChange={set(3)} />
        <Slider label="층의 첫째 곱 u1" min={-4} max={4} step={0.1} value={val[4]} onChange={set(4)} format={(v) => fmt(v, 1)} />
        <Slider label="u2" min={-4} max={4} step={0.1} value={val[5]} onChange={set(5)} format={(v) => fmt(v, 1)} />
      </Controls>
      <Controls>
        <Btn onClick={() => setStage(0)}>처음부터</Btn>
        <Btn onClick={() => setStage(Math.max(0, stage - 1))}>◀ 이전</Btn>
        <Btn onClick={() => setStage(Math.min(6, stage + 1))}>다음 ▶</Btn>
        <Btn on={stage === 6} onClick={() => setStage(6)}>전부 보기</Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>단계</th>
            <th>계산</th>
            <th>목록</th>
            <th>막대</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k} style={{opacity: k > stage ? 0.25 : 1}}>
              <td className={k === stage ? s.cellOn : undefined} style={r.res ? {color: 'var(--vb)', fontWeight: 600} : undefined}>
                {k}. {r.n}
              </td>
              <td style={{textAlign: 'left'}}>{k <= stage ? r.f : '—'}</td>
              <td className={k === stage ? s.cellOn : undefined}>{k <= stage ? vec(r.r.map((v) => Number(v.toFixed(3)))) : '—'}</td>
              <td>{k <= stage ? <Bars v={r.r} /> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {stage >= 3 && l1.flat ? (
        <Note>두 칸의 값이 같으면 표준편차가 0이라 나눌 수 없습니다. 실제 층 정규화는 표준편차 제곱에 아주 작은 수 ε을 더해 이를 막습니다. 여기서는 0으로 표시합니다.</Note>
      ) : null}
      {stage >= 2 ? (
        <Note>주황 글자의 단계가 잔차 연결입니다. 어텐션과 칸마다의 층은 새 목록이 아니라 원래 목록에 더할 변화량을 만듭니다.</Note>
      ) : null}
      {stage === 6 && val.join() === PRESETS[1].v.join() ? (
        <Note>마스크를 걸면 어텐션 출력이 [1, 0]이라 더한 목록이 [2, 0]이 됩니다. 평균 1, 표준편차 1이라 정규화 결과는 같은 [1, -1]입니다.</Note>
      ) : null}
    </Viz>
  );
}
