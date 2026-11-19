import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note} from '../../Viz';
import Strip from './Strip';
import {outSize} from './util';

const PRESETS = [
  [32, 5, 1, 0, 'LeNet-5의 C1'],
  [32, 5, 1, 2, '크기 유지'],
  [32, 5, 2, 0, '절반 가까이'],
  [32, 3, 1, 1, '크기 유지'],
  [32, 3, 2, 1, '절반'],
  [7, 3, 2, 0, '딱 맞음'],
  [8, 3, 2, 0, '마지막 열 하나는 안 쓰임'],
];

export default function OutSizeStrip() {
  const [v, setV] = useState({N: 8, K: 3, S: 2, P: 0});
  const {N, K, S, P} = v;
  const set = (key) => (x) => setV({...v, [key]: x});
  const O = outSize(N, K, S, P);
  const w = N + 2 * P;
  const moves = w >= K ? Math.floor((w - K) / S) : 0;
  const note = PRESETS.find((p) => p[0] === N && p[1] === K && p[2] === S && p[3] === P);
  const same = S === 1 && K % 2 === 1 && P === (K - 1) / 2;

  return (
    <Viz
      title="출력 크기 O = ⌊(N + 2P − K) / S⌋ + 1"
      caption="N, K, S, P를 바꿔 보세요. 점선 칸이 패딩의 0이고, 색 막대 하나가 창이 놓이는 한 자리입니다. 빨간 칸은 창이 들어가지 못해 버려지는 자투리입니다. 아래 버튼은 본문 표의 일곱 줄입니다."
    >
      <Controls>
        <Slider label="입력 N" min={3} max={32} value={N} onChange={set('N')} />
        <Slider label="커널 K" min={1} max={7} value={K} onChange={set('K')} />
        <Slider label="스트라이드 S" min={1} max={4} value={S} onChange={set('S')} />
        <Slider label="패딩 P" min={0} max={3} value={P} onChange={set('P')} />
      </Controls>
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.slice(0, 4).join()} on={note === p} onClick={() => setV({N: p[0], K: p[1], S: p[2], P: p[3]})}>
            {p.slice(0, 4).join(', ')}
          </Btn>
        ))}
      </Controls>
      <Strip N={N} K={K} S={S} P={P} />
      <Stats>
        <Stat label="패딩 후 폭 N+2P" value={w} />
        <Stat label="옮길 수 있는 횟수" value={`⌊(${w}−${K})/${S}⌋ = ${moves}`} />
        <Stat label="출력 한 변 O" value={O} tone={O > 0 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {O === 0
          ? `커널(${K})이 패딩 후 폭(${w})보다 큽니다. 창이 한 번도 놓이지 못해 출력이 없습니다.`
          : `${note ? `표의 줄: ${note[4]}. ` : ''}${same ? 'same 패딩입니다(스트라이드 1, 홀수 커널, P = (K−1)/2). 출력이 입력과 같은 크기입니다. ' : ''}${P === 0 ? 'valid(패딩 없음)입니다. ' : ''}자투리 칸을 버리므로 입력이 한 칸 늘어도 출력이 그대로일 수 있습니다.`}
      </Note>
    </Viz>
  );
}
