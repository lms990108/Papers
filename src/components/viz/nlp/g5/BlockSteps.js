import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, fmt, styles as s} from '../../Viz';

const rms = (v) => Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length);
const norm = (v) => {
  const r = rms(v);
  return r > 0 ? v.map((e) => e / r) : v.map(() => 0);
};
const silu = (z) => z / (1 + Math.exp(-z));
const add = (a, b) => a.map((e, i) => e + b[i]);
const list = (v) => '[' + v.map((e) => fmt(e, 3)).join(', ') + ']';

function build(mode, x, a) {
  const n1 = norm(x);
  const h = add(x, a);
  const steps = [
    {t: '입력', f: '입력 x', rows: [['x', x]], d: '목록 하나가 블록에 들어옵니다. 길이 2는 칸을 보이게 줄인 것입니다.'},
    {t: '층 정규화', f: 'rms = ' + fmt(rms(x), 3) + ',  Norm(x) = x ÷ rms', rows: [['x', x], ['Norm(x)', n1]], d: 'RMSNorm은 제곱평균의 제곱근으로 나눠 크기를 맞춥니다. 평균은 빼지 않습니다.'},
    {t: '어텐션', f: 'Attn(Norm(x)) = a (설명용 값)', rows: [['Norm(x)', n1], ['a', a]], d: '정규화한 목록으로 어텐션을 계산합니다. 출력 a는 보이게 고른 값이고 어텐션 페이지의 계산 결과가 아닙니다.'},
    {t: '더하기 (잔차)', f: 'h = x + a', rows: [['x', x], ['a', a], ['h', h]], d: '어텐션 출력만 넘기지 않고 입력 x에 더합니다. 입력이 남고 어텐션 결과가 붙습니다.'},
  ];
  if (mode === 'orig') {
    const u = x;
    const g = u.map(silu);
    const f = g.map((e, i) => e * u[i]);
    steps.push({t: 'FFN', f: 'SiLU(문) × 값 (단위행렬 가중치)', rows: [['입력 u = x', u], ['SiLU(u)', g], ['FFN 출력', f]], d: '원문처럼 FFN만 따로 보기 위해 입력을 x로 다시 둡니다. 문과 값 갈래의 가중치는 단위행렬입니다.'});
    steps.push({t: '더하기 (잔차)', f: 'y = u + FFN', rows: [['u', u], ['FFN 출력', f], ['y', add(u, f)]], d: '입력에 FFN 출력을 더합니다. 문이 0인 칸은 더해지지 않습니다.'});
  } else {
    const n2 = norm(h);
    const g = n2.map(silu);
    const f = g.map((e, i) => e * n2[i]);
    steps.push({t: '층 정규화', f: 'rms = ' + fmt(rms(h), 3) + ',  Norm(h) = h ÷ rms', rows: [['h', h], ['Norm(h)', n2]], d: 'pre-norm이라 FFN 앞에서도 정규화합니다. 잔차로 지나가는 h는 정규화를 거치지 않습니다.'});
    steps.push({t: 'FFN', f: 'SiLU(문) × 값 (단위행렬 가중치)', rows: [['Norm(h)', n2], ['SiLU', g], ['FFN 출력', f]], d: '정규화한 목록을 문과 값 두 갈래로 보내 칸마다 곱합니다.'});
    steps.push({t: '더하기 (잔차)', f: 'y = h + FFN', rows: [['h', h], ['FFN 출력', f], ['y', add(h, f)]], d: '정규화 전의 h에 FFN 출력을 더합니다. y의 길이는 입력 x와 같습니다.'});
  }
  return steps;
}

function SBar({label, value, max, color}) {
  const pct = Math.min(100, (Math.abs(value) / max) * 100) / 2;
  return (
    <div className={s.barRow}>
      <span>{label}</span>
      <div className={s.barTrack} style={{position: 'relative'}}>
        <div style={{position: 'absolute', top: 0, bottom: 0, left: value >= 0 ? '50%' : 50 - pct + '%', width: pct + '%', background: color, borderRadius: 4}} />
        <div style={{position: 'absolute', top: -2, bottom: -2, left: '50%', width: 1, background: 'var(--ifm-color-emphasis-600)'}} />
      </div>
      <b>{fmt(value, 3)}</b>
    </div>
  );
}

export default function BlockSteps() {
  const [mode, setMode] = useState('orig');
  const [x, setX] = useState([1, 0]);
  const [a, setA] = useState([0.2, 0.1]);
  const [step, setStep] = useState(0);

  const steps = build(mode, x, a);
  const cur = steps[Math.min(step, steps.length - 1)];
  const idx = Math.min(step, steps.length - 1);
  const maxAbs = Math.max(2, ...steps.reduce((acc, st) => acc.concat(st.rows.reduce((b, r) => b.concat(r[1].map(Math.abs)), [])), []));
  const colors = ['var(--va)', 'var(--vb)', 'var(--vc)'];
  const sl = (label, v, set, i, lo, hi) => (
    <Slider label={label} min={lo} max={hi} step={0.1} value={v[i]} onChange={(e) => set(v.map((q, j) => (j === i ? e : q)))} format={(e) => fmt(e, 1)} />
  );

  return (
    <Viz
      title="블록 하나를 단계별로 지나가기"
      caption="단계를 눌러 보세요. 입력 [1, 0], 어텐션 출력 [0.2, 0.1](설명용)이 기본값이고, 슬라이더로 바꿀 수 있습니다. 원문 순서에서는 FFN을 입력 x에서 따로 계산하고, 이어서 계산에서는 h를 정규화해 FFN에 넣습니다."
    >
      <Controls>
        <Btn on={mode === 'orig'} onClick={() => setMode('orig')}>원문 순서</Btn>
        <Btn on={mode === 'chain'} onClick={() => { setMode('chain'); }}>이어서 계산 (pre-norm)</Btn>
        <Btn onClick={() => { setX([1, 0]); setA([0.2, 0.1]); }}>기본값으로</Btn>
      </Controls>
      <Controls>
        {sl('입력 x 첫 칸', x, setX, 0, -2, 2)}
        {sl('입력 x 둘째 칸', x, setX, 1, -2, 2)}
        {sl('a 첫 칸', a, setA, 0, -1, 1)}
        {sl('a 둘째 칸', a, setA, 1, -1, 1)}
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 10px'}}>
        {steps.map((st, i) => (
          <button
            key={i}
            type="button"
            className={s.btn}
            onClick={() => setStep(i)}
            aria-label={i + 1 + '단계 ' + st.t}
            style={i === idx ? {borderColor: 'var(--vb)', background: 'color-mix(in srgb, var(--vb) 20%, transparent)', fontWeight: 700} : i < idx ? {background: 'var(--ifm-color-emphasis-100)'} : undefined}
          >
            {i + 1}. {st.t}
          </button>
        ))}
      </div>
      <div className={s.title}>{idx + 1}단계: {cur.t}</div>
      {cur.rows.map((r, k) => (
        <div key={r[0]}>
          <div style={{fontSize: '0.8rem', margin: '6px 0 0'}}>{r[0]} = {list(r[1])}</div>
          {r[1].map((e, j) => (
            <SBar key={j} label={j + 1 + '번째 칸'} value={e} max={maxAbs} color={colors[k % 3]} />
          ))}
        </div>
      ))}
      <Controls>
        <Btn onClick={() => setStep(Math.max(0, idx - 1))}>이전</Btn>
        <Btn onClick={() => setStep(Math.min(steps.length - 1, idx + 1))}>다음</Btn>
        <span style={{fontSize: '0.85rem'}}>{cur.f}</span>
      </Controls>
      <Note>{cur.d}</Note>
      {idx === steps.length - 1 ? <Note>출력 y의 칸 수는 입력 x와 같은 2칸입니다. 그래서 같은 블록을 이어 쌓을 수 있습니다.</Note> : null}
    </Viz>
  );
}
