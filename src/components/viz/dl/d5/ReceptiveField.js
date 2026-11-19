import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const G = 14; // 224 / 16 = 14: 한 변의 패치 수
const M = 7; // 창의 한 변
const CELL = 20;

// 한 축에서 층마다 어떤 구간으로 나뉘는지: 짝수 번째는 그대로, 홀수 번째는 M/2 만큼 민 창
const segs = (shifted) => {
  const sh = shifted ? Math.floor(M / 2) : 0;
  const cuts = [0];
  for (let c = sh === 0 ? M : sh; c < G; c += M) cuts.push(c);
  cuts.push(G);
  const out = [];
  for (let i = 0; i + 1 < cuts.length; i += 1) out.push([cuts[i], cuts[i + 1] - 1]);
  return out;
};

const grow = (rng, shifted) => {
  let lo = G;
  let hi = -1;
  segs(shifted).forEach((sg) => {
    if (sg[1] >= rng[0] && sg[0] <= rng[1]) {
      lo = Math.min(lo, sg[0]);
      hi = Math.max(hi, sg[1]);
    }
  });
  return [lo, hi];
};

// 가운데 칸 c에서 L층 뒤에 닿는 구간
const reach = (mode, c, L) => {
  let rng = [c, c];
  for (let l = 1; l <= L; l += 1) {
    if (mode === 'conv') rng = [Math.max(0, rng[0] - 1), Math.min(G - 1, rng[1] + 1)];
    else if (mode === 'global') rng = [0, G - 1];
    else rng = grow(rng, l % 2 === 0);
  }
  return rng;
};

function makePanel({title, mode, r, c, L, onPick}) {
  const rr = reach(mode, r, L);
  const cc = reach(mode, c, L);
  const cells = [];
  for (let i = 0; i < G; i += 1) {
    for (let j = 0; j < G; j += 1) {
      const on = i >= rr[0] && i <= rr[1] && j >= cc[0] && j <= cc[1];
      const me = i === r && j === c;
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={5 + j * CELL}
          y={5 + i * CELL}
          width={CELL}
          height={CELL}
          fill={me ? 'var(--vb)' : on ? 'var(--va)' : 'transparent'}
          fillOpacity={me ? 0.95 : on ? 0.5 : 0}
          stroke="var(--ifm-color-emphasis-300)"
          strokeWidth="0.6"
          style={{cursor: 'pointer'}}
          onClick={() => onPick(i, j)}
        />,
      );
    }
  }
  const lines = [];
  if (mode === 'window') {
    const layerSegs = segs(L % 2 === 0);
    layerSegs.forEach((sg, k) => {
      if (k > 0) {
        lines.push(<line key={`a${k}`} x1={5 + sg[0] * CELL} y1="5" x2={5 + sg[0] * CELL} y2={5 + G * CELL} />);
        lines.push(<line key={`b${k}`} x1="5" y1={5 + sg[0] * CELL} x2={5 + G * CELL} y2={5 + sg[0] * CELL} />);
      }
    });
  }
  const count = (rr[1] - rr[0] + 1) * (cc[1] - cc[0] + 1);
  return {
    count,
    node: (
      <div>
        <div className={s.title} style={{fontSize: '0.85rem'}}>
          {title}
        </div>
        <svg viewBox={`0 0 ${G * CELL + 10} ${G * CELL + 10}`} className={s.svg} role="img" aria-label={`${title}: ${L}층 뒤에 가운데 토큰이 보는 토큰 ${count}개`}>
          {cells}
          <g stroke="var(--vc)" strokeWidth="2" strokeDasharray="5 3">
            {lines}
          </g>
          <rect x="5" y="5" width={G * CELL} height={G * CELL} fill="none" stroke="var(--ifm-font-color-base)" />
        </svg>
      </div>
    ),
  };
}

export default function ReceptiveField() {
  const [L, setL] = useState(1);
  const [r, setR] = useState(6);
  const [c, setC] = useState(6);
  const onPick = (i, j) => {
    setR(i);
    setC(j);
  };
  const a = makePanel({title: '3×3 합성곱 (칸 이동 1)', mode: 'conv', r, c, L, onPick});
  const b = makePanel({title: '셀프 어텐션 (전역)', mode: 'global', r, c, L, onPick});
  const w = makePanel({title: '7×7 창 어텐션 (창을 번갈아 밀기)', mode: 'window', r, c, L, onPick});
  const tot = G * G;

  return (
    <Viz
      title={`${G}×${G} 토큰 격자에서 가운데 토큰이 L층 뒤에 보는 범위`}
      caption="주황 칸이 고른 토큰이고, 파란 칸이 그 토큰의 값에 L층 뒤까지 영향을 줄 수 있는 토큰입니다. 224×224 이미지를 패치 16으로 자른 14×14 격자입니다. 합성곱은 3×3, 풀링 없음의 단순한 경우이고, 창 어텐션은 Swin 논문의 방식(창 7, 층마다 창을 3칸 밀기)을 따른 설명용 계산입니다. 점선은 그 층의 창 경계입니다. 칸을 눌러 토큰을 바꿀 수 있습니다."
    >
      <Controls>
        <Slider label="층 수 L" min={1} max={8} step={1} value={L} onChange={setL} />
        <Slider label="행" min={1} max={G} step={1} value={r + 1} onChange={(v) => setR(v - 1)} />
        <Slider label="열" min={1} max={G} step={1} value={c + 1} onChange={(v) => setC(v - 1)} />
        <Btn onClick={() => onPick(6, 6)}>가운데</Btn>
        <Btn onClick={() => onPick(0, 0)}>모서리</Btn>
      </Controls>
      <div className={s.two} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))'}}>
        {a.node}
        {w.node}
        {b.node}
      </div>
      <Stats>
        <Stat label="합성곱이 보는 토큰" value={`${a.count} / ${tot}`} tone={a.count === tot ? 'good' : undefined} />
        <Stat label="창 어텐션이 보는 토큰" value={`${w.count} / ${tot}`} tone={w.count === tot ? 'good' : undefined} />
        <Stat label="전역 어텐션이 보는 토큰" value={`${b.count} / ${tot}`} tone="good" />
        <Stat label="1층에서 토큰 하나의 연결" value="9 / 49 / 196" />
      </Stats>
      <Note>1층의 연결 수는 합성곱 9개, 창 49개, 전역 196개입니다. L을 키우면 합성곱의 범위는 층마다 한 칸씩 넓어지고, 창 어텐션은 창을 밀면서 서서히 넓어집니다. 전역 어텐션은 1층부터 전체입니다.</Note>
    </Viz>
  );
}
