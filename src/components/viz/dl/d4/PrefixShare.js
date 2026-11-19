import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note} from '../../Viz';

const PAGE = 4;
const KV_PER_TOKEN = 8; // 원문: 4토큰의 키와 값이 32개 → 토큰당 8개

export default function PrefixShare() {
  const [clen, setClen] = useState(8);
  const [pre, setPre] = useState(4);

  const prefix = Math.min(pre, clen);
  const sharedPages = Math.floor(prefix / PAGE);
  const reused = sharedPages * PAGE;
  const compute = clen - reused;

  return (
    <Viz
      title="prefix cache: 같은 앞부분의 page는 한 번만 계산하기"
      caption="요청 B의 프롬프트는 8토큰(page 2개)입니다. 요청 C가 B의 앞부분과 같은 토큰으로 시작하면 그 page를 가져옵니다. C의 길이는 원문에 없는 설명용 값이고, 원문의 예는 같은 앞 4토큰입니다. 공유는 page 단위(4토큰)로 일어난다고 둡니다."
    >
      <Controls>
        <Slider label="C의 프롬프트 길이" min={1} max={12} value={clen} onChange={setClen} />
        <Slider label="B와 같은 앞부분" min={0} max={8} value={pre} onChange={setPre} />
      </Controls>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 3, margin: '8px 0', fontSize: '0.75rem'}} role="img" aria-label="C의 토큰이 재사용인지 새로 계산인지">
        {Array.from({length: clen}, (_, i) => {
          const shared = i < reused;
          return (
            <span
              key={i}
              style={{
                width: 34,
                padding: '6px 0',
                textAlign: 'center',
                borderRadius: 5,
                border: `1.5px solid ${shared ? 'var(--vok)' : 'var(--vb)'}`,
                background: `color-mix(in srgb, ${shared ? 'var(--vok)' : 'var(--vb)'} 18%, transparent)`,
                marginRight: i % PAGE === PAGE - 1 ? 8 : 0,
              }}
            >
              {i + 1}
              <br />
              {shared ? '공유' : '계산'}
            </span>
          );
        })}
      </div>
      <Stats>
        <Stat label="공유하는 page" value={`${sharedPages}개`} />
        <Stat label="다시 계산하지 않는 토큰" value={`${reused}개`} tone={reused > 0 ? 'good' : undefined} />
        <Stat label="다시 계산하지 않는 키와 값" value={`${reused * KV_PER_TOKEN}개`} />
        <Stat label="C가 prefill할 토큰" value={`${compute}개`} />
      </Stats>
      <Note>
        {prefix > 0 && prefix % PAGE !== 0 ? '앞부분이 page 크기에 못 미치는 나머지 토큰은 공유되지 않고 새로 계산합니다(이 그림의 단순화입니다). ' : ''}
        원문의 예처럼 앞 4토큰이 같으면 키와 값 32개를 다시 계산하지 않고, C는 자기 뒷부분만 prefill합니다. 앞부분을 토큰 열의 나무에서 찾아 재사용하면 radix cache입니다.
      </Note>
    </Viz>
  );
}
