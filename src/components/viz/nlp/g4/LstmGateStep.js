import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const PRESETS = [
  {t: '절반만 남기기', v: {cPrev: 2, f: 0.5, i: 1, g: 0, o: 1}},
  {t: '앞을 지우고 새로 쓰기', v: {cPrev: 2, f: 0, i: 1, g: 1, o: 1}},
  {t: '그대로 유지, 밖으로는 닫기', v: {cPrev: 2, f: 1, i: 0, g: 0, o: 0}},
  {t: '그대로 유지, 밖으로 열기', v: {cPrev: 2, f: 1, i: 0, g: 0, o: 1}},
];

const box = {fill: 'var(--ifm-background-surface-color)', stroke: 'var(--ifm-color-emphasis-500)', strokeWidth: 1.5, rx: 6};

function Arrow({x1, x2, y, up}) {
  if (up) {
    return (
      <g stroke="var(--ifm-color-emphasis-600)" fill="var(--ifm-color-emphasis-600)">
        <line x1={x1} y1={y[0]} x2={x1} y2={y[1] + 6} />
        <polygon points={`${x1},${y[1]} ${x1 - 5},${y[1] + 9} ${x1 + 5},${y[1] + 9}`} />
      </g>
    );
  }
  return (
    <g stroke="var(--ifm-color-emphasis-600)" fill="var(--ifm-color-emphasis-600)">
      <line x1={x1} y1={y} x2={x2 - 6} y2={y} />
      <polygon points={`${x2},${y} ${x2 - 9},${y - 5} ${x2 - 9},${y + 5}`} />
    </g>
  );
}

export default function LstmGateStep() {
  const [v, setV] = useState(PRESETS[0].v);
  const set = (k) => (x) => setV({...v, [k]: x});
  const {cPrev, f, i, g, o} = v;

  const keep = f * cPrev;
  const add = i * g;
  const c = keep + add;
  const th = Math.tanh(c);
  const h = o * th;

  let msg = '';
  if (f > 0.99 && i < 0.01) msg = '잊는 문이 1, 넣는 문이 0이라 통로가 이전 값 그대로입니다. 앞 단어가 남습니다.';
  else if (f < 0.01) msg = '잊는 문이 0이라 이전 통로가 지워졌고, 넣는 문과 넣을 내용만 남았습니다.';
  else if (o < 0.01 && Math.abs(c) > 0.01) msg = '통로 안에는 값이 있지만 내보내는 문이 닫혀서 밖으로는 0이 나갑니다.';

  return (
    <Viz
      title="통로 갱신: 문을 열고 닫아 보기"
      caption="슬라이더로 세 문의 값과 넣을 내용을 바꿔 보세요. 통로 c는 이전 값에 f를 곱하고 i×g를 더해 정해지고, 숨은 상태 h는 c를 o만큼 열어 내보낸 값입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.t} on={JSON.stringify(p.v) === JSON.stringify(v)} onClick={() => setV(p.v)}>
            {p.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="이전 통로 c(t-1)" min={-3} max={3} step={0.1} value={cPrev} onChange={set('cPrev')} format={(x) => fmt(x, 1)} />
        <Slider label="잊는 문 f" min={0} max={1} step={0.01} value={f} onChange={set('f')} />
        <Slider label="넣는 문 i" min={0} max={1} step={0.01} value={i} onChange={set('i')} />
        <Slider label="넣을 내용 g" min={-1} max={1} step={0.01} value={g} onChange={set('g')} />
        <Slider label="내보내는 문 o" min={0} max={1} step={0.01} value={o} onChange={set('o')} />
      </Controls>
      <svg viewBox="0 0 720 190" className={s.svg} role="img" aria-label="이전 통로에 잊는 문을 곱하고 넣을 값을 더해 새 통로를 만들고, 내보내는 문을 곱해 숨은 상태를 만드는 흐름">
        <rect x={8} y={30} width={96} height={46} {...box} />
        <text x={56} y={50} className={s.ts} textAnchor="middle">이전 통로</text>
        <text x={56} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(cPrev, 2)}</text>
        <Arrow x1={104} x2={140} y={53} />
        <rect x={140} y={30} width={94} height={46} {...box} stroke="var(--vb)" />
        <text x={187} y={50} className={s.ts} textAnchor="middle">× 잊는 문 f</text>
        <text x={187} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(keep, 3)}</text>
        <Arrow x1={234} x2={274} y={53} />
        <circle cx={290} cy={53} r={16} {...box} />
        <text x={290} y={59} className={s.t} textAnchor="middle" fontSize="18">+</text>
        <rect x={238} y={118} width={104} height={46} {...box} stroke="var(--va)" />
        <text x={290} y={138} className={s.ts} textAnchor="middle">i × g (넣는 값)</text>
        <text x={290} y={156} className={s.t} textAnchor="middle" fontWeight="600">{fmt(add, 3)}</text>
        <Arrow x1={290} y={[118, 69]} up />
        <Arrow x1={306} x2={344} y={53} />
        <rect x={344} y={30} width={96} height={46} {...box} />
        <text x={392} y={50} className={s.ts} textAnchor="middle">새 통로 c(t)</text>
        <text x={392} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(c, 3)}</text>
        <Arrow x1={440} x2={472} y={53} />
        <rect x={472} y={30} width={104} height={46} {...box} stroke="var(--vc)" />
        <text x={524} y={50} className={s.ts} textAnchor="middle">tanh(c) × o</text>
        <text x={524} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(th, 3)} × {fmt(o, 2)}</text>
        <Arrow x1={576} x2={610} y={53} />
        <rect x={610} y={30} width={100} height={46} {...box} />
        <text x={660} y={50} className={s.ts} textAnchor="middle">숨은 상태 h</text>
        <text x={660} y={68} className={s.t} textAnchor="middle" fontWeight="600">{fmt(h, 3)}</text>
        <text x={187} y={100} className={s.ts} textAnchor="middle" style={{fill: 'var(--vb)'}}>이전 값이 남는 몫</text>
        <text x={524} y={100} className={s.ts} textAnchor="middle" style={{fill: 'var(--vc)'}}>밖으로 열어 주는 몫</text>
      </svg>
      <Stats>
        <Stat label="c = f·c(t-1) + i·g" value={`${fmt(keep, 3)} + ${fmt(add, 3)} = ${fmt(c, 3)}`} />
        <Stat label="tanh(c)" value={fmt(th, 3)} />
        <Stat label="h = o·tanh(c)" value={fmt(h, 3)} tone={o < 0.01 && Math.abs(c) > 0.01 ? 'bad' : undefined} />
      </Stats>
      {msg ? <Note>{msg}</Note> : null}
    </Viz>
  );
}
