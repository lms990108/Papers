import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {outSize, num} from './util';

const SPEC = [['C1', 5, 1], ['S2', 2, 2], ['C3', 5, 1], ['S4', 2, 2], ['C5', 5, 1]];
const C5_PARAMS = 48120;

export default function InputGrow() {
  const [N, setN] = useState(32);
  let n = N;
  const sizes = SPEC.map(([name, K, S]) => {
    n = outSize(n, K, S, 0);
    return {name, n};
  });
  const m = sizes[4].n;
  const cs = m > 0 ? Math.min(44, Math.floor(300 / m)) : 0;
  const box = m * cs + 8;

  return (
    <Viz
      title="입력을 키우면 C5의 맵이 커진다"
      caption="다른 것은 그대로 두고 입력의 한 변 N만 바꿔 보세요. 32이면 C5의 맵이 1×1이라 완전 연결과 같지만, 입력이 커지면 같은 가중치가 여러 위치를 훑습니다. 기본 버튼 세 개는 본문 코드의 32, 36, 64입니다."
    >
      <Controls>
        <Slider label="입력 한 변 N" min={28} max={80} value={N} onChange={setN} />
        {[32, 36, 64].map((v) => (
          <Btn key={v} on={N === v} onClick={() => setN(v)}>{v}×{v}</Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr><th>입력</th>{sizes.map((z) => <th key={z.name}>{z.name}</th>)}</tr>
        </thead>
        <tbody>
          <tr>
            <td>{N}×{N}</td>
            {sizes.map((z) => <td key={z.name} className={z.name === 'C5' ? s.cellOn : undefined}>{z.n > 0 ? `${z.n}×${z.n}` : '-'}</td>)}
          </tr>
        </tbody>
      </table>
      {m > 0 ? (
        <>
          <svg viewBox={`0 0 ${box} ${box}`} className={s.svg} style={{maxWidth: box, margin: '10px auto 0'}} role="img" aria-label={`C5의 맵이 ${m}×${m}이라 같은 가중치가 ${m * m}곳을 훑는다`}>
            {Array.from({length: m * m}, (_, i) => (
              <rect key={i} x={4 + (i % m) * cs} y={4 + Math.floor(i / m) * cs} width={cs - 2} height={cs - 2} rx={2} fill="color-mix(in srgb, var(--va) 35%, transparent)" stroke="var(--va)" />
            ))}
          </svg>
          <Stats>
            <Stat label="C5 맵 한 변" value={`${m}×${m}`} tone="good" />
            <Stat label="같은 가중치가 놓이는 위치" value={m * m} />
            <Stat label="C5 학습 파라미터" value={num(C5_PARAMS)} />
            <Stat label="C5 연결 (파라미터 × 위치 수)" value={num(C5_PARAMS * m * m)} />
          </Stats>
          <Note>
            {m === 1
              ? 'C5의 맵이 1×1이라 위치가 하나뿐입니다. 이 입력 크기에서는 완전 연결과 계산이 같습니다.'
              : `48,120개가 줄어드는 일은 없습니다. 위치만 ${m * m}곳으로 늘어, 가중치를 바꾸지 않고 큰 입력을 그대로 넣는 것이 공간 이동 신경망의 출발점입니다.`}
          </Note>
        </>
      ) : (
        <Note>입력이 너무 작아 어느 층에서 맵이 사라집니다. N을 32 이상으로 올려 보세요.</Note>
      )}
    </Viz>
  );
}
