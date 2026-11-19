import React, {useRef, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, useDrag, fmt, styles as s} from '../../Viz';

const W = 420;
const H = 330;
const OX = 165;
const OY = 165;
const SC = 100;
const MATCH = [1, 0];
const OTHER = [0, 1];

const toPx = (v) => [OX + v[0] * SC, OY - v[1] * SC];
const fromPx = (p) => [(p[0] - OX) / SC, (OY - p[1]) / SC];
const len = (v) => Math.hypot(v[0], v[1]);
const cap = (v, m = 1.5) => {
  const l = len(v);
  return l > m ? [(v[0] * m) / l, (v[1] * m) / l] : v;
};
const cosOf = (a, b) => {
  const la = len(a);
  const lb = len(b);
  return la < 0.03 || lb < 0.03 ? NaN : (a[0] * b[0] + a[1] * b[1]) / (la * lb);
};

function Arrow({v, color, dashed, label}) {
  const [x, y] = toPx(v);
  return (
    <g>
      <line x1={OX} y1={OY} x2={x} y2={y} stroke={color} strokeWidth="2.5" strokeDasharray={dashed ? '5 4' : undefined} />
      <circle cx={x} cy={y} r={dashed ? 4 : 5} fill={color} />
      <text x={x + 8} y={y - 8} className={s.t} style={{fill: color}}>{label}</text>
    </g>
  );
}

export default function ContrastCosine() {
  const ref = useRef(null);
  const [img, setImg] = useState([1, 0]);

  const {start, svgProps} = useDrag(ref, W, H, (id, p) => setImg(cap(fromPx(p))));
  const cm = cosOf(img, MATCH);
  const co = cosOf(img, OTHER);
  const ok = Number.isFinite(cm);
  const [px, py] = toPx(img);

  const learn = () => {
    const nx = img[0] + 0.3 * (MATCH[0] - OTHER[0]);
    const ny = img[1] + 0.3 * (MATCH[1] - OTHER[1]);
    setImg(cap([nx, ny]));
  };

  return (
    <Viz
      title="대조 학습: 그림 목록과 맞는 문장, 다른 문장의 코사인"
      caption="파랑이 맞는 문장 [1, 0], 주황이 다른 문장 [0, 1]입니다. 보라 화살표 끝의 동그라미(그림 목록)를 끌어 보세요. '한 걸음 학습'의 이동 크기는 원문에 없는 설명용입니다. 맞는 쪽으로 밀고 다른 쪽에서 밀어냅니다."
    >
      <Controls>
        <Btn on={img[0] === 1 && img[1] === 0} onClick={() => setImg([1, 0])}>[1, 0]</Btn>
        <Btn on={img[0] === 1 && img[1] === 1} onClick={() => setImg(cap([1, 1]))}>[1, 1]</Btn>
        <Btn on={img[0] === 0 && img[1] === 1} onClick={() => setImg([0, 1])}>[0, 1]</Btn>
        <Btn onClick={learn}>한 걸음 학습 (설명용)</Btn>
        <Btn onClick={() => setImg([0, 0])}>길이 0으로</Btn>
      </Controls>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 520}} role="img" aria-label="그림 목록과 두 문장 목록의 방향" {...svgProps}>
        <line x1={20} y1={OY} x2={W - 20} y2={OY} stroke="var(--vgrid)" />
        <line x1={OX} y1={14} x2={OX} y2={H - 14} stroke="var(--vgrid)" />
        <circle cx={OX} cy={OY} r={SC} fill="none" stroke="var(--vgrid)" strokeDasharray="4 4" />
        <Arrow v={MATCH} color="var(--va)" dashed label="맞는 문장" />
        <Arrow v={OTHER} color="var(--vb)" dashed label="다른 문장" />
        {len(img) > 0.03 ? <line x1={OX} y1={OY} x2={px} y2={py} stroke="var(--vc)" strokeWidth="3" /> : null}
        <circle cx={px} cy={py} r={13} fill="var(--vc)" fillOpacity="0.2" stroke="var(--vc)" strokeWidth="2" cursor="grab" onPointerDown={start('img')} />
        <text x={px + 16} y={py + 16} className={s.t} style={{fill: 'var(--vc)'}}>그림</text>
      </svg>
      <Stats>
        <Stat label="그림 목록" value={`[${fmt(img[0], 2)}, ${fmt(img[1], 2)}]`} />
        <Stat label="맞는 문장과의 코사인" value={ok ? fmt(cm, 3) : '정의 안 됨'} tone={ok ? undefined : 'bad'} />
        <Stat label="다른 문장과의 코사인" value={ok ? fmt(co, 3) : '정의 안 됨'} tone={ok ? undefined : 'bad'} />
        <Stat label="차이 (맞는 − 다른)" value={ok ? fmt(cm - co, 3) : '—'} tone={ok && cm - co > 0.5 ? 'good' : undefined} />
      </Stats>
      <Note>
        {ok
          ? '학습이 키우려는 것은 맞는 쌍의 코사인이고 줄이려는 것은 다른 쌍의 코사인입니다. 맞는 쌍은 1, 다른 쌍은 0이 되게 목록을 밉니다. 예를 들어 [1, 1]은 둘 다 0.707이라 구별이 안 됩니다.'
          : '길이가 0인 목록은 방향이 없어서 코사인을 계산할 수 없습니다.'}
      </Note>
    </Viz>
  );
}
