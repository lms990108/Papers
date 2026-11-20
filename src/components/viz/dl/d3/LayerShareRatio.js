import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {num, trim} from './util';

// (층, 학습 파라미터, 연결 수, 설명)
const LAYERS = [
  ['C1', 156, 122304, '맵이 28×28이라 위치 784곳이 가중치를 나눠 씁니다. 122,304 ÷ 156 = 784.'],
  ['S2', 12, 5880, '14×14 맵의 유닛마다 입력 4개와 바이어스를 씁니다. 맵마다 계수는 2개입니다. 196 × 5 ÷ 2 = 490.'],
  ['C3', 1516, 151600, '맵이 10×10이라 위치 100곳이 나눠 씁니다. 151,600 ÷ 1,516 = 100.'],
  ['S4', 32, 2000, '5×5 맵의 유닛마다 입력 4개와 바이어스를 씁니다. 맵마다 계수는 2개입니다. 25 × 5 ÷ 2 = 62.5.'],
  ['C5', 48120, 48120, '맵이 1×1이라 위치가 하나뿐입니다. 공유할 상대가 없어 연결 수와 파라미터 수가 같습니다.'],
  ['F6', 10164, 10164, '완전 연결이라 공유할 상대가 없습니다. 연결 수와 파라미터 수가 같습니다.'],
];

export default function LayerShareRatio() {
  const [sel, setSel] = useState(0);
  const [share, setShare] = useState(true);
  const par = (i) => (share ? LAYERS[i][1] : LAYERS[i][2]);
  const sumPar = LAYERS.reduce((a, _, i) => a + par(i), 0);
  const sumConn = LAYERS.reduce((a, l) => a + l[2], 0) + 840;
  const lg = (x) => Math.log10(Math.max(1, x));
  const X = (v) => 70 + (lg(v) / 6) * 440;
  const rowH = 46;

  return (
    <Viz
      title="층마다 공유가 얼마나 줄이는가"
      caption="층 이름은 LeNet-5의 층입니다. C는 합성곱층, S는 서브샘플링층, F는 완전 연결층이고 숫자는 순서입니다. 층 이름을 눌러 보세요. 파란 막대는 연결 수, 주황 막대는 학습 파라미터입니다(로그 눈금). '가중치 공유 꺼짐'은 모든 연결이 따로 값을 가진다고 가정한 설명용 계산입니다."
    >
      <Controls>
        {LAYERS.map((l, i) => (
          <Btn key={l[0]} on={sel === i} onClick={() => setSel(i)}>{l[0]}</Btn>
        ))}
        <Btn on={share} onClick={() => setShare(!share)}>가중치 공유 {share ? '켜짐' : '꺼짐'}</Btn>
      </Controls>
      <svg viewBox={`0 0 640 ${LAYERS.length * rowH + 28}`} className={s.svg} role="img" aria-label="층별 연결 수와 학습 파라미터 수의 로그 막대 비교">
        {[0, 1, 2, 3, 4, 5, 6].map((e) => (
          <g key={e}>
            <line x1={70 + (e / 6) * 440} y1={4} x2={70 + (e / 6) * 440} y2={LAYERS.length * rowH + 4} stroke="var(--ifm-color-emphasis-200)" />
            <text x={70 + (e / 6) * 440} y={LAYERS.length * rowH + 20} textAnchor="middle" className={s.ts}>{e === 0 ? '1' : `10^${e}`}</text>
          </g>
        ))}
        {LAYERS.map((l, i) => {
          const y = 8 + i * rowH;
          const p = par(i);
          return (
            <g key={l[0]} onClick={() => setSel(i)} style={{cursor: 'pointer'}}>
              {sel === i ? <rect x={0} y={y - 4} width={640} height={rowH - 2} fill="color-mix(in srgb, var(--vb) 10%, transparent)" /> : null}
              <text x={8} y={y + 24} className={s.t} style={{fontWeight: 600}}>{l[0]}</text>
              <rect x={70} y={y} width={Math.max(2, X(l[2]) - 70)} height={14} fill="var(--va)" opacity={0.75} />
              <text x={X(l[2]) + 6} y={y + 12} className={s.ts}>연결 {num(l[2])}</text>
              <rect x={70} y={y + 18} width={Math.max(2, X(p) - 70)} height={14} fill="var(--vb)" opacity={0.85} />
              <text x={X(p) + 6} y={y + 30} className={s.ts}>파라미터 {num(p)} ({trim(l[2] / p, 1)}배)</text>
            </g>
          );
        })}
      </svg>
      <Note><b>{LAYERS[sel][0]}</b>: {share ? LAYERS[sel][3] : '공유를 껐으므로 연결마다 값이 따로라 파라미터 수가 연결 수와 같습니다.'}</Note>
      <Stats>
        <Stat label="학습 파라미터 합" value={num(sumPar)} tone={share ? 'good' : 'bad'} />
        <Stat label="연결 합 (RBF 840 포함)" value={num(sumConn)} />
      </Stats>
      <Note>출력 RBF의 연결 840개(84 × 10)는 기준 벡터가 고정이라 학습 파라미터에 들어가지 않습니다. 앞 층일수록 공유 효과가 크고, 뒤로 갈수록 공유할 위치가 사라집니다.</Note>
    </Viz>
  );
}
