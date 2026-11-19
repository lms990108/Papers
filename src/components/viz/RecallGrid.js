import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from './Viz';

export default function RecallGrid() {
  const [K, setK] = useState(10);
  const [hit, setHit] = useState(() => Array.from({length: 20}, (_, i) => i < 8));

  const match = hit.slice(0, K).filter(Boolean).length;
  const toggle = (i) => setHit(hit.map((v, j) => (j === i ? !v : v)));
  const pct = Math.round((match / K) * 100);

  return (
    <Viz
      title="정답 K개와 반환 K개의 겹침"
      caption="아래 줄의 칸을 눌러 “정답과 일치/엉뚱”을 바꿔 보세요. 반환 수와 정답 수가 같아서 recall과 precision이 같은 값입니다."
    >
      <Controls>
        <span className={s.ts}>K</span>
        {[5, 10, 20].map((k) => (
          <Btn key={k} on={K === k} onClick={() => setK(k)}>
            {k}
          </Btn>
        ))}
      </Controls>
      <div className={s.ts} style={{marginBottom: 4}}>정답 (정확 검색의 상위 {K})</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10}}>
        {Array.from({length: K}, (_, i) => (
          <div key={i} style={{width: 28, height: 28, borderRadius: 6, background: 'var(--va)', opacity: 0.85}} />
        ))}
      </div>
      <div className={s.ts} style={{marginBottom: 4}}>반환 (인덱스 검색의 상위 {K}) · 눌러서 바꾸기</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 4}}>
        {Array.from({length: K}, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            aria-label={hit[i] ? '일치' : '엉뚱'}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: hit[i] ? '2px solid var(--vc)' : '2px dashed var(--ifm-color-emphasis-500)',
              background: hit[i] ? 'var(--va)' : 'transparent',
              color: hit[i] ? '#fff' : 'var(--ifm-color-emphasis-600)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {hit[i] ? '✓' : '✗'}
          </button>
        ))}
      </div>
      <Stats>
        <Stat label="일치" value={match} />
        <Stat label="놓친 정답" value={K - match} tone={K - match ? 'bad' : undefined} />
        <Stat label="엉뚱하게 포함" value={K - match} tone={K - match ? 'bad' : undefined} />
        <Stat label={`recall@${K} = precision@${K}`} value={`${pct}%`} />
      </Stats>
      <Note>recall@{K} = 일치 {match} / 정답 {K} = {pct}%. 반환 {K}개 중 정답 비율(precision)도 {match} / {K}로 같습니다.</Note>
    </Viz>
  );
}
