import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)', 'var(--ifm-color-emphasis-600)'];
const PRESETS = [
  {name: '길이가 제각각', v: [2, 5, 3, 6, 2, 4]},
  {name: '모두 같음', v: [4, 4, 4, 4, 4, 4]},
  {name: '하나만 아주 김', v: [2, 2, 8, 2, 2, 2]},
];

// slots: 동시에 돌리는 칸 수. 반환: lanes[slot] = [{id, from, to}], total
function schedule(lens, slots, continuous) {
  const lanes = Array.from({length: slots}, () => []);
  if (continuous) {
    const free = Array.from({length: slots}, () => 0);
    lens.forEach((len, id) => {
      let best = 0;
      for (let k = 1; k < slots; k += 1) if (free[k] < free[best]) best = k;
      lanes[best].push({id, from: free[best], to: free[best] + len});
      free[best] += len;
    });
    return {lanes, total: Math.max.apply(null, free)};
  }
  let t = 0;
  for (let b = 0; b < lens.length; b += slots) {
    const group = lens.slice(b, b + slots);
    const dur = Math.max.apply(null, group);
    group.forEach((len, j) => lanes[j].push({id: b + j, from: t, to: t + len}));
    t += dur;
  }
  return {lanes, total: t};
}

export default function SlotSchedule() {
  const [lens, setLens] = useState(PRESETS[0].v);
  const [slots, setSlots] = useState(3);
  const [cont, setCont] = useState(true);

  const {lanes, total} = schedule(lens, slots, cont);
  const work = lens.reduce((a, b) => a + b, 0);
  const util = total > 0 ? work / (slots * total) : NaN;
  const cw = 560 / Math.max(total, 1);
  const H = slots * 36 + 22;

  return (
    <Viz
      title="배치를 미리 정해 두는 방식과 continuous batching"
      caption="한 칸은 한 회전이고, 가로로 한 회전씩 흐릅니다. 요청 여섯 개의 출력 길이는 설명용 값입니다. 미리 정한 배치는 가장 긴 요청이 끝날 때까지 짧은 요청의 자리를 붙잡아 두고, continuous batching은 끝난 자리를 다음 회전의 새 요청이 채웁니다."
    >
      <Controls>
        <Btn on={!cont} onClick={() => setCont(false)}>미리 정한 배치</Btn>
        <Btn on={cont} onClick={() => setCont(true)}>continuous batching</Btn>
        <Slider label="동시에 돌리는 자리" min={1} max={4} value={slots} onChange={setSlots} />
      </Controls>
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.name} on={p.v.join() === lens.join()} onClick={() => setLens(p.v)}>
            {p.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {lens.map((v, i) => (
          <Slider key={i} label={`요청 ${i + 1}`} min={1} max={8} value={v} onChange={(x) => setLens(lens.map((y, j) => (j === i ? x : y)))} />
        ))}
      </Controls>
      <svg viewBox={`0 0 580 ${H}`} className={s.svg} role="img" aria-label="자리별로 요청이 차지한 회전">
        {lanes.map((lane, k) => (
          <g key={k}>
            <text x={0} y={k * 36 + 28} className={s.ts}>자리 {k + 1}</text>
            <rect x={20 + 0} y={k * 36 + 8} width={560} height={30} fill="var(--ifm-color-emphasis-100)" rx={4} />
            {lane.map((r) => (
              <g key={r.id}>
                <rect x={20 + r.from * cw} y={k * 36 + 8} width={Math.max((r.to - r.from) * cw - 2, 1)} height={30} rx={4} fill={COLORS[r.id % COLORS.length]} fillOpacity="0.35" stroke={COLORS[r.id % COLORS.length]} />
                <text x={20 + ((r.from + r.to) / 2) * cw} y={k * 36 + 28} className={s.ts} textAnchor="middle">요청 {r.id + 1}</text>
              </g>
            ))}
          </g>
        ))}
        <text x={580} y={H - 4} className={s.ts} textAnchor="end">회전 →</text>
      </svg>
      <Stats>
        <Stat label="모두 끝나는 회전" value={String(total)} />
        <Stat label="실제 일한 칸의 합" value={String(work)} />
        <Stat label="자리 이용률" value={Number.isFinite(util) ? fmt(util * 100, 0) + '%' : '—'} tone={util > 0.85 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        회색으로 남은 빈 칸이 놀고 있는 자리입니다. {cont ? '끝난 요청의 자리는 바로 다음 요청이 받아 갑니다.' : '같은 묶음의 짧은 요청은 가장 긴 요청이 끝날 때까지 자리를 비워 둡니다.'} 요청 길이를 모두 같게 하면 두 방식의 차이가 사라지는지 확인해 보세요.
      </Note>
    </Viz>
  );
}
