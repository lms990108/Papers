import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const TOTAL = 100;
const PARTS = [
  {key: 'wait', name: 'all-reduce를 기다림', color: 'var(--vb)', max: 60},
  {key: 'idle', name: 'pipeline의 쉬는 칸', color: 'var(--vc)', max: 60},
  {key: 'low', name: '바이트당 연산이 작은 구간(decode 등)', color: 'var(--vbad)', max: 60},
];

export default function MfuBar() {
  const [v, setV] = useState({wait: 30, idle: 20, low: 10});

  const lost = v.wait + v.idle + v.low;
  const matmul = Math.max(0, TOTAL - lost);
  const mfu = matmul / TOTAL;
  const over = lost > TOTAL;

  return (
    <Viz
      title="MFU: 기계가 낼 수 있는 100번 중 가중치에 곱한 몇 번인가"
      caption="기계가 1초에 100번 연산할 수 있다고 둡니다. 곱하지 못한 시간을 세 갈래로 나눈 값은 원문에 없는 설명용 값이고, 기본값 30 + 20 + 10 = 60이면 곱한 연산이 40번, MFU는 0.4입니다."
    >
      <Controls>
        {PARTS.map((p) => (
          <Slider key={p.key} label={p.name} min={0} max={p.max} value={v[p.key]} onChange={(x) => setV({...v, [p.key]: x})} />
        ))}
      </Controls>
      <Controls>
        <Btn onClick={() => setV({wait: 30, idle: 20, low: 10})}>원문 (곱한 연산 40번)</Btn>
        <Btn onClick={() => setV({wait: 0, idle: 0, low: 0})}>하나도 안 놀면</Btn>
      </Controls>
      <div style={{display: 'flex', height: 34, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--ifm-color-emphasis-300)'}} role="img" aria-label={`연산 100번 중 곱한 연산 ${matmul}번`}>
        <div style={{width: `${matmul}%`, background: 'var(--va)', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {matmul >= 12 ? `곱함 ${matmul}` : ''}
        </div>
        {PARTS.map((p) => (
          <div key={p.key} style={{width: `${over ? (v[p.key] / lost) * (100 - matmul) : v[p.key]}%`, background: p.color, opacity: 0.6}} title={p.name} />
        ))}
      </div>
      <div className={s.legend}>
        <span><i style={{background: 'var(--va)'}} />가중치에 곱함</span>
        {PARTS.map((p) => (
          <span key={p.key}><i style={{background: p.color}} />{p.name} {v[p.key]}</span>
        ))}
      </div>
      <Stats>
        <Stat label="곱한 연산" value={`${matmul}번`} />
        <Stat label="MFU" value={fmt(mfu, 2)} tone={mfu >= 0.5 ? 'good' : 'bad'} />
        <Stat label="곱하지 못한 몫" value={fmt(1 - mfu, 2)} />
      </Stats>
      <Note>
        {over ? '세 갈래의 합이 100을 넘어도 곱한 연산은 0입니다(설명용 값 범위를 넘었습니다). ' : ''}
        나머지에는 all-reduce를 기다리는 시간, pipeline의 쉬는 칸, decode처럼 바이트당 연산이 작은 구간이 들어갑니다. 행렬 곱 자체는 GEMM입니다.
      </Note>
    </Viz>
  );
}
