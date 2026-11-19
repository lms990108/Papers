import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const DS = [2, 4, 8, 16];
const divisors = (d) => Array.from({length: d}, (_, i) => i + 1).filter((h) => d % h === 0);

const chip = (hl) => ({
  padding: '4px 8px',
  borderRadius: 6,
  fontSize: '0.78rem',
  border: '1.5px solid ' + (hl ? 'var(--va)' : 'var(--ifm-color-emphasis-300)'),
  background: hl ? 'color-mix(in srgb, var(--va) 14%, transparent)' : 'transparent',
});

export default function BlockStack() {
  const [layers, setLayers] = useState(3);
  const [T, setT] = useState(3);
  const [d, setD] = useState(4);
  const [heads, setHeads] = useState(2);
  const [V, setV] = useState(4);

  const hs = divisors(d);
  const h = hs.indexOf(heads) >= 0 ? heads : 1;
  const shape = T + ' × ' + d;
  const table = V * d;

  return (
    <Viz
      title="블록을 쌓아도 목록의 모양은 그대로입니다"
      caption="토큰 수, hidden size, 층 수를 바꿔 보세요. 블록 하나는 (토큰 수 × hidden size) 모양의 표를 받아 같은 모양으로 돌려주므로, 몇 층을 쌓아도 이어 붙일 수 있습니다."
    >
      <Controls>
        <Slider label="토큰 수" min={1} max={8} step={1} value={T} onChange={setT} />
        <Slider label="블록 수" min={1} max={12} step={1} value={layers} onChange={setLayers} />
      </Controls>
      <Controls>
        <span style={{fontSize: '0.85rem'}}>hidden size d:</span>
        {DS.map((v) => (
          <Btn key={v} on={d === v} onClick={() => setD(v)}>
            {v}
          </Btn>
        ))}
        <span style={{fontSize: '0.85rem'}}>head 수:</span>
        {hs.map((v) => (
          <Btn key={v} on={h === v} onClick={() => setHeads(v)}>
            {v}
          </Btn>
        ))}
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: '8px 0'}} role="img" aria-label={'입력 ' + shape + '이 블록 ' + layers + '개를 지나도 ' + shape + '입니다'}>
        <span style={chip(true)}>입력 {shape}</span>
        {Array.from({length: layers}, (_, i) => (
          <React.Fragment key={i}>
            <span aria-hidden="true">→</span>
            <span style={chip(false)}>블록 {i + 1}</span>
            <span aria-hidden="true">→</span>
            <span style={chip(true)}>{shape}</span>
          </React.Fragment>
        ))}
      </div>
      <Stats>
        <Stat label="입력 모양" value={shape} />
        <Stat label="출력 모양" value={shape} tone="good" />
        <Stat label="head dim = d ÷ head 수" value={String(d / h)} />
        <Stat label="head마다 보는 칸" value={h + '개 × ' + d / h + '칸'} />
      </Stats>
      <div className={s.title} style={{marginTop: 14}}>weight tying: 토큰 표와 점수 행렬을 같은 수로 쓰면</div>
      <Controls>
        <Slider label="단어 수 V" min={2} max={50} step={1} value={V} onChange={setV} />
        <Btn onClick={() => { setV(4); setD(2); setHeads(1); }}>원문 예 (단어 4개, d = 2)</Btn>
        <Btn onClick={() => { setD(4); setHeads(2); }}>원문 head 예 (d = 4, head 2)</Btn>
      </Controls>
      <Stats>
        <Stat label="토큰 표 V × d" value={String(table)} />
        <Stat label="점수 행렬 d × V" value={String(table)} />
        <Stat label="따로 두면" value={String(2 * table)} />
        <Stat label="묶으면" value={String(table)} tone="good" />
      </Stats>
      <Note>
        길이 4의 목록을 head 2개로 나누면 head dim은 2이고, 각 head는 칸 두 개만 봅니다. 단어 4개, hidden size 2이면 표가 4 × 2 = 8칸이고 점수 행렬도 8칸이라 따로 두면 16칸, 묶으면 8칸입니다.
      </Note>
    </Viz>
  );
}
