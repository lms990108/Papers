import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const CX = 40;
const CY = 8;
const CW = 200;
const CH = 120;
const px = (p) => CX + ((p - 0.02) / 0.98) * CW;
const py = (e) => CY + CH - (e / 4) * CH;

export default function SftSpanDemo() {
  const [qn, setQn] = useState(3);
  const [qp, setQp] = useState(0.5);
  const [ap, setAp] = useState(0.5);
  const [ansOnly, setAnsOnly] = useState(false);

  const qe = -Math.log(qp);
  const ae = -Math.log(ap);
  const qsum = qn * qe;
  const total = ansOnly ? ae : qsum + ae;
  const share = qsum / (qsum + ae);
  const gain = ae - -Math.log(Math.min(1, ap + 0.05));
  const cell = 52;
  const curve = [];
  for (let i = 0; i <= 48; i += 1) {
    const p = 0.02 + (i / 48) * 0.98;
    curve.push(`${px(p)},${py(-Math.log(p))}`);
  }

  return (
    <Viz
      title="SFT: 오차를 답 구간에만 두기"
      caption="질문 토큰이 3개이고 각 정답 확률이 0.5이면 질문 구간의 오차는 2.079입니다. 질문 구간을 합에 넣을지 빼 보세요. 오른쪽 곡선은 한 칸의 오차 -log p입니다(p는 그 칸의 정답 토큰에 모델이 준 확률)."
    >
      <Controls>
        <Btn on={!ansOnly} onClick={() => setAnsOnly(false)}>질문과 답 모두 오차에 넣기</Btn>
        <Btn on={ansOnly} onClick={() => setAnsOnly(true)}>답 구간에만 오차 (SFT)</Btn>
      </Controls>
      <Controls>
        <Slider label="질문 토큰 수" min={1} max={6} value={qn} onChange={setQn} />
        <Slider label="질문 칸의 정답 확률 p" min={0.05} max={0.99} step={0.01} value={qp} onChange={setQp} format={(v) => fmt(v, 2)} />
        <Slider label="답 칸의 정답 확률 p" min={0.05} max={0.99} step={0.01} value={ap} onChange={setAp} format={(v) => fmt(v, 2)} />
      </Controls>
      <div className={s.two}>
        <svg viewBox="0 0 420 110" className={s.svg} role="img" aria-label="질문 토큰들과 답 토큰 하나. 답 구간에만 오차를 두면 질문 칸은 합에서 빠진다">
          {Array.from({length: qn}).map((_, i) => (
            <g key={i}>
              <rect x={6 + i * (cell + 4)} y={30} width={cell} height={50} rx={6} fill={ansOnly ? 'none' : 'var(--vb)'} fillOpacity={ansOnly ? 0 : 0.25} stroke="var(--vb)" strokeDasharray={ansOnly ? '4 3' : undefined} />
              <text x={6 + i * (cell + 4) + cell / 2} y={52} textAnchor="middle" className={s.ts}>질문 {i + 1}</text>
              <text x={6 + i * (cell + 4) + cell / 2} y={70} textAnchor="middle" className={s.ts}>{ansOnly ? '빠짐' : fmt(qe, 3)}</text>
            </g>
          ))}
          <rect x={6 + qn * (cell + 4) + 8} y={30} width={cell} height={50} rx={6} fill="var(--va)" fillOpacity="0.3" stroke="var(--va)" strokeWidth="2" />
          <text x={6 + qn * (cell + 4) + 8 + cell / 2} y={52} textAnchor="middle" className={s.ts}>답 “4”</text>
          <text x={6 + qn * (cell + 4) + 8 + cell / 2} y={70} textAnchor="middle" className={s.ts}>{fmt(ae, 3)}</text>
          <text x={6} y={104} className={s.ts}>점선 = 오차에서 빠진 칸</text>
        </svg>
        <svg viewBox="0 0 270 150" className={s.svg} style={{maxWidth: 360}} role="img" aria-label="한 칸의 오차 마이너스 로그 p 곡선. p가 작을수록 가파르다">
          <line x1={CX} y1={CY + CH} x2={CX + CW + 6} y2={CY + CH} stroke="var(--ifm-color-emphasis-400)" />
          <line x1={CX} y1={CY} x2={CX} y2={CY + CH} stroke="var(--ifm-color-emphasis-400)" />
          <polyline points={curve.join(' ')} fill="none" stroke="var(--ifm-color-emphasis-700)" strokeWidth="1.5" />
          <circle cx={px(ap)} cy={py(ae)} r={5} fill="var(--va)" />
          <text x={px(ap) + 8} y={py(ae) - 6} className={s.ts}>{`p ${fmt(ap, 2)}, 오차 ${fmt(ae, 3)}`}</text>
          <text x={CX} y={CY + CH + 16} textAnchor="middle" className={s.ts}>0</text>
          <text x={CX + CW} y={CY + CH + 16} textAnchor="middle" className={s.ts}>p = 1</text>
          <text x={CX - 6} y={CY + 6} textAnchor="end" className={s.ts}>4</text>
        </svg>
      </div>
      <Stats>
        <Stat label="질문 구간 오차" value={fmt(qsum, 3)} />
        <Stat label="답 구간 오차" value={fmt(ae, 3)} />
        <Stat label={ansOnly ? '합에 들어가는 오차' : '합 (질문 + 답)'} value={fmt(total, 3)} />
        <Stat label="질문이 차지하는 비중" value={`${fmt(share * 100, 0)}%`} tone={share > 0.5 ? 'bad' : undefined} />
        <Stat label="답 p를 0.05 올리면 줄어드는 오차" value={fmt(gain, 3)} />
      </Stats>
      <Note>질문을 오차에 넣으면 받아 적는 쪽이 합의 대부분을 차지합니다. 곡선은 p가 0.5 근처일 때 가파르고 1 근처에서는 거의 평평해서, 이미 높은 칸을 더 올리는 것보다 0.5 근처의 답 칸을 올리는 쪽이 오차를 더 줄입니다.</Note>
    </Viz>
  );
}
