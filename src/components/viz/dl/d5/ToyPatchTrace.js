import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, fmt, styles as s} from '../../Viz';

const IMG0 = [1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0];
const E = [
  [0.5, 0],
  [0, 0.5],
  [0.5, 0],
  [0, 0.5],
];
const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];
const STEPS = ['이미지', '자르기', '펴기', '투영', '분류·위치', '어텐션'];

const trim = (v) => String(Number(v.toFixed(3)));
const vec = (v) => `[${v.map(trim).join(', ')}]`;
const softmax = (a) => {
  const m = Math.max.apply(null, a);
  const e = a.map((v) => Math.exp(v - m));
  const t = e.reduce((x, y) => x + y, 0);
  return e.map((v) => v / t);
};

export default function ToyPatchTrace() {
  const [img, setImg] = useState(IMG0);
  const [step, setStep] = useState(5);
  const [g, setG] = useState(1);
  const [swap, setSwap] = useState(false);
  const [q, setQ] = useState(0);

  const flip = (i) => setImg(img.map((v, j) => (j === i ? 1 - v : v)));
  const patchVec = (p) => {
    const r0 = 2 * Math.floor(p / 2);
    const c0 = 2 * (p % 2);
    return [img[r0 * 4 + c0], img[r0 * 4 + c0 + 1], img[(r0 + 1) * 4 + c0], img[(r0 + 1) * 4 + c0 + 1]];
  };
  const emb = [0, 1, 2, 3].map((p) => [0, 1].map((c) => patchVec(p).reduce((a, v, i) => a + v * E[i][c], 0)));
  const order = swap ? [0, 2, 1, 3] : [0, 1, 2, 3];
  const toks = [{name: '분류', color: 'var(--ifm-color-emphasis-700)', emb: [1, 1], pos: [0, 0]}].concat(
    order.map((p, j) => ({name: `p${p + 1}`, color: COLORS[p], emb: emb[p], pos: [0.1 * g * (j + 1), 0]})),
  );
  toks.forEach((t) => {
    t.z = [t.emb[0] + t.pos[0], t.emb[1] + t.pos[1]];
  });
  const sc = toks.map((a) => toks.map((b) => (a.z[0] * b.z[0] + a.z[1] * b.z[1]) / Math.SQRT2));
  const ratio = sc.map(softmax);
  const out = ratio.map((r) => [0, 1].map((c) => r.reduce((a, w, j) => a + w * toks[j].z[c], 0)));
  const qi = Math.min(q, 4);

  const cells = img.map((v, i) => {
    const r = Math.floor(i / 4);
    const c = i % 4;
    return (
      <g
        key={i}
        role="button"
        tabIndex={0}
        aria-label={`${r + 1}행 ${c + 1}열 칸, 값 ${v}. 누르면 바뀝니다`}
        style={{cursor: 'pointer'}}
        onClick={() => flip(i)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? (e.preventDefault(), flip(i)) : null)}
      >
        <rect x={10 + c * 50} y={10 + r * 50} width="50" height="50" fill={v ? 'var(--vb)' : 'transparent'} fillOpacity={v ? 0.75 : 0} stroke="var(--ifm-color-emphasis-500)" />
        <text x={35 + c * 50} y={40 + r * 50} textAnchor="middle" className={s.t}>
          {v}
        </text>
      </g>
    );
  });
  const frames = [0, 1, 2, 3].map((p) => (
    <rect key={p} x={10 + (p % 2) * 100 + 2} y={10 + Math.floor(p / 2) * 100 + 2} width="96" height="96" fill="none" stroke={COLORS[p]} strokeWidth="3" />
  ));
  const labels = [0, 1, 2, 3].map((p) => (
    <text key={p} x={10 + (p % 2) * 100 + 8} y={10 + Math.floor(p / 2) * 100 + 16} className={s.ts} style={{fill: COLORS[p], fontWeight: 700}}>
      p{p + 1}
    </text>
  ));

  return (
    <Viz
      title="4×4 이미지를 2×2 패치 네 개로 잘라 토큰으로 만들기"
      caption="설명용 값입니다. 투영 행렬 E는 학습된 값이 아니라, 열 1은 왼쪽 열의 평균, 열 2는 오른쪽 열의 평균이 되도록 고른 값입니다. 분류 토큰의 값 [1, 1]과 위치 목록도 계산이 보이게 정했습니다. 실제 인코더의 층 정규화와 W_Q, W_K, W_V는 생략하고 단위행렬로 둡니다. 이미지의 칸을 눌러 0과 1을 바꿀 수 있습니다."
    >
      <Controls>
        {STEPS.map((t, i) => (
          <Btn key={t} on={step === i} onClick={() => setStep(i)}>
            {i}. {t}
          </Btn>
        ))}
      </Controls>
      <div className={s.two}>
        <svg viewBox="0 0 220 220" className={s.svg} style={{maxWidth: 300}} role="img" aria-label="4×4 이미지. 칸의 값은 0 또는 1이고, 2×2 패치 네 개로 나뉩니다.">
          {cells}
          {step >= 1 ? frames : null}
          {step >= 1 ? labels : null}
        </svg>
        <div style={{overflowX: 'auto'}}>
          {step === 0 ? <Note>칸 16개는 켜진 칸(1)과 꺼진 칸(0)입니다. 이 이미지를 그대로 어텐션에 넣으면 토큰이 16개이고, 어텐션 표는 16×16 = 256칸입니다.</Note> : null}
          {step === 1 ? <Note>한 변 4칸을 패치 한 변 2칸으로 나누면 가로 2개, 세로 2개이고 토큰은 (4÷2)² = 4개입니다. 패치 번호는 왼쪽 위부터 줄 순서로 매깁니다.</Note> : null}
          {step >= 2 && step <= 3 ? (
            <table className={s.grid}>
              <thead>
                <tr>
                  <th>패치</th>
                  <th>펴기 (줄 순서로 읽기)</th>
                  {step >= 3 ? <th>× E = 임베딩</th> : null}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3].map((p) => (
                  <tr key={p}>
                    <td style={{color: COLORS[p], fontWeight: 700}}>p{p + 1}</td>
                    <td>{vec(patchVec(p))}</td>
                    {step >= 3 ? <td className={s.cellOn}>{vec(emb[p])}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {step === 3 ? <Note>E는 4×2 행렬입니다. 열 1은 [0.5, 0, 0.5, 0], 열 2는 [0, 0.5, 0, 0.5]이고, 패치 길이 4를 토큰 길이 2로 줄입니다.</Note> : null}
          {step >= 4 ? (
            <table className={s.grid}>
              <thead>
                <tr>
                  <th>자리</th>
                  <th>토큰</th>
                  <th>임베딩</th>
                  <th>+ 위치</th>
                  <th>= z</th>
                </tr>
              </thead>
              <tbody>
                {toks.map((t, j) => (
                  <tr key={j}>
                    <td>{j}</td>
                    <td style={{color: t.color, fontWeight: 700}}>{t.name}</td>
                    <td>{vec(t.emb)}</td>
                    <td>{vec(t.pos)}</td>
                    <td className={s.cellOn}>{vec(t.z)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
      {step >= 4 ? (
        <Controls>
          <Slider label="위치 목록 크기 배율" min={0} max={5} step={0.5} value={g} onChange={setG} format={(v) => fmt(v, 1)} />
          <Btn on={swap} onClick={() => setSwap(!swap)}>
            p2와 p3의 자리 맞바꾸기
          </Btn>
        </Controls>
      ) : null}
      {step >= 5 ? (
        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>점수 (질문 ↓ 열쇠 →)</th>
                {toks.map((t, j) => (
                  <th key={j} style={{color: t.color}}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toks.map((t, i) => (
                <tr key={i}>
                  <td style={{color: t.color, fontWeight: 700}}>{t.name}</td>
                  {sc[i].map((v, j) => (
                    <td key={j} className={i === qi ? s.cellOn : undefined}>
                      {fmt(v, 3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Controls>
            <span>질문 토큰</span>
            {toks.map((t, i) => (
              <Btn key={i} on={qi === i} onClick={() => setQ(i)}>
                {t.name}
              </Btn>
            ))}
          </Controls>
          {toks.map((t, j) => (
            <Bar key={j} label={`${toks[qi].name} → ${t.name}`} value={ratio[qi][j]} max={1} color={j === 0 ? 'var(--vc)' : t.color} text={fmt(ratio[qi][j], 3)} />
          ))}
          <Note>
            {toks[qi].name}의 출력 y = 비율로 z를 더한 값 = {vec(out[qi])}. 점수는 z끼리의 곱을 √2로 나눈 것이고, 비율은 행마다 소프트맥스입니다(합 {fmt(ratio[qi].reduce((a, b) => a + b, 0), 3)}).
            {g === 0 ? ' 위치 목록 배율이 0이면 자리를 맞바꿔도 각 토큰의 출력은 그대로이고 행의 순서만 바뀝니다. 어텐션은 순서를 모르기 때문입니다.' : ''}
          </Note>
        </div>
      ) : null}
    </Viz>
  );
}
