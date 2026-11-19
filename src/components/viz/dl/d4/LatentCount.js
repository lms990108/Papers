import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, Bar, fmt} from '../../Viz';

const PIX = [1, 0, 1, 0];
// 인코더: multimodal 페이지의 projector 두 줄
const ENC = [
  [0.5, 0, 0, 0],
  [0, 0, 0.5, 0],
];
const DECS = [
  {name: '정확히 되돌리는 행렬', f: (z) => [2 * z[0], 0, 2 * z[1], 0]},
  {name: '엉성한 행렬', f: (z) => [z[0], z[0], z[1], z[1]]},
];

export default function LatentCount() {
  const [steps, setSteps] = useState(4);
  const [dec, setDec] = useState(0);

  const z = ENC.map((row) => row.reduce((a, b, i) => a + b * PIX[i], 0));
  const back = DECS[dec].f(z);
  const err = back.reduce((a, b, i) => a + Math.abs(b - PIX[i]), 0);
  const addsPix = 4 * steps;
  const addsLat = 2 * steps;

  return (
    <Viz
      title="픽셀 4개 대신 잠재 2개에서 걷기 (latent diffusion)"
      caption="밝기 네 칸 [1, 0, 1, 0]을 multimodal 페이지의 projector 두 줄로 줄이면 [0.5, 0.5]입니다. 되돌리는 행렬은 원문에 없는 설명용 값입니다."
    >
      <Controls>
        <Slider label="걸음 수" min={1} max={16} value={steps} onChange={setSteps} />
        <Btn onClick={() => setSteps(4)}>연습 3 (4번)</Btn>
      </Controls>
      <Bar label="픽셀 4칸에서 걷기" value={addsPix} max={64} color="var(--vb)" text={`덧셈 ${addsPix}번`} />
      <Bar label="잠재 2개에서 걷기" value={addsLat} max={64} color="var(--va)" text={`덧셈 ${addsLat}번`} />
      <Stats>
        <Stat label="픽셀 한 걸음의 덧셈" value="4번" />
        <Stat label="잠재 한 걸음의 덧셈" value="2번" />
        <Stat label="잠재 / 픽셀" value={fmt(addsLat / addsPix, 2)} tone="good" />
      </Stats>
      <Controls>
        <span style={{fontSize: '0.85rem'}}>끝난 뒤 펼치는 행렬:</span>
        {DECS.map((d, i) => (
          <Btn key={d.name} on={dec === i} onClick={() => setDec(i)}>
            {d.name}
          </Btn>
        ))}
      </Controls>
      <Stats>
        <Stat label="잠재 (줄인 목록)" value={`[${z.map((v) => fmt(v, 2)).join(', ')}]`} />
        <Stat label="다시 펼친 네 칸" value={`[${back.map((v) => fmt(v, 2)).join(', ')}]`} tone={err < 1e-9 ? 'good' : 'bad'} />
        <Stat label="원래 밝기" value={`[${PIX.join(', ')}]`} />
      </Stats>
      <Note>
        {err < 1e-9
          ? '잠재에서 0에 도착한 뒤 되돌려도 픽셀 네 칸이 원래 밝기와 같습니다.'
          : '되돌리는 행렬이 엉성하면 잠재에서는 목표에 도착해도 픽셀 네 칸이 원래 밝기와 달라집니다. 잠재의 걸음 수와 픽셀로 되돌리는 오차는 다른 자리입니다.'}
        {' '}
        {steps === 4 ? '걸음이 4번이면 잠재는 2 × 4 = 8번, 픽셀은 4 × 4 = 16번입니다.' : null}
      </Note>
    </Viz>
  );
}
