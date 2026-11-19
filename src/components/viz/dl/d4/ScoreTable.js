import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const SIZES = [4, 8, 16, 32, 64, 128];

export default function ScoreTable() {
  const [i, setI] = useState(0);
  const [tile, setTile] = useState(false);

  const n = SIZES[i];
  const cells = n * n;
  const show = Math.min(n, 16);
  const px = 224 / show;

  return (
    <Viz
      title="어텐션의 점수 표는 토큰 수의 제곱 칸"
      caption="토큰 n개이면 점수 표는 n × n칸입니다. 표를 메모리에 모두 썼다가 다시 읽으면 곱보다 읽기가 시간을 가져갑니다. 타일로 나눠 그 안에서 소프트맥스와 값의 곱까지 끝내는 구현이 FlashAttention입니다. 화면은 16×16칸까지만 그리고, 타일 크기는 설명용입니다."
    >
      <Controls>
        <Slider label="토큰 수 n" min={0} max={SIZES.length - 1} value={i} onChange={setI} format={(k) => String(SIZES[k])} />
        <Btn on={tile} onClick={() => setTile(!tile)}>타일로 나눠 처리</Btn>
      </Controls>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${show}, ${px}px)`, gap: 1, justifyContent: 'center', margin: '8px 0'}} role="img" aria-label={`${n}×${n} 점수 표`}>
        {Array.from({length: show * show}, (_, k) => {
          const r = Math.floor(k / show);
          const c = k % show;
          const tr = Math.floor((r * 4) / show);
          const tc = Math.floor((c * 4) / show);
          const alt = tile && (tr + tc) % 2 === 0;
          return (
            <span
              key={k}
              style={{
                height: px,
                background: tile ? (alt ? 'color-mix(in srgb, var(--va) 40%, transparent)' : 'color-mix(in srgb, var(--vc) 40%, transparent)') : 'color-mix(in srgb, var(--vb) 40%, transparent)',
                borderRadius: 1,
              }}
            />
          );
        })}
      </div>
      <Stats>
        <Stat label="표의 칸 수 n × n" value={`${n} × ${n} = ${cells.toLocaleString('en-US')}`} />
        <Stat label="n이 4일 때의 칸" value="16" />
        <Stat label="n을 두 배로 하면 칸" value="4배" tone="bad" />
        <Stat label="메모리에 저장하는 표" value={tile ? '저장하지 않음' : `${cells.toLocaleString('en-US')}칸`} tone={tile ? 'good' : undefined} />
      </Stats>
      <Note>
        토큰 4개면 16칸, 128개면 128 × 128 = 16,384칸입니다. {tile ? '타일 안에서 소프트맥스와 값의 곱까지 끝내면 표 전체를 저장하지 않습니다.' : '표 전체를 쓰고 다시 읽으면, 곱보다 읽기가 시간을 가져갑니다.'}
      </Note>
    </Viz>
  );
}
