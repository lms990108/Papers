import React, {useState} from 'react';
import {Viz, Controls, Btn, Note} from '../../Viz';

const WORDS = ['오늘', '날씨', '좋다'];

const chip = (state) => ({
  display: 'inline-block',
  minWidth: '3.4em',
  padding: '4px 10px',
  borderRadius: 8,
  textAlign: 'center',
  border: '1.5px ' + (state === 'hidden' ? 'dashed' : 'solid') + ' ' + (state === 'ans' ? 'var(--vb)' : state === 'cur' ? 'var(--va)' : 'var(--ifm-color-emphasis-300)'),
  background: state === 'ans' ? 'color-mix(in srgb, var(--vb) 18%, transparent)' : state === 'cur' ? 'color-mix(in srgb, var(--va) 16%, transparent)' : 'transparent',
  color: state === 'hidden' ? 'var(--ifm-color-emphasis-600)' : 'var(--ifm-font-color-base)',
  opacity: state === 'hidden' ? 0.6 : 1,
  fontSize: '0.9rem',
});

export default function ShiftedPairs() {
  const [end, setEnd] = useState(false);
  const [sel, setSel] = useState(1);
  const tokens = end ? WORDS.concat(['[끝]']) : WORDS;
  const n = tokens.length - 1; // 자리 수
  const k = Math.min(sel, n - 1);

  return (
    <Viz
      title="글을 한 칸 밀면 입력과 정답이 됩니다"
      caption="자리를 눌러 보세요. 파란 칸이 그 자리의 입력이고, 주황 칸이 정답입니다. 점선 칸은 그 자리가 볼 수 없는 뒤쪽 토큰입니다."
    >
      <Controls>
        {Array.from({length: n}, (_, i) => (
          <Btn key={i} on={i === k} onClick={() => setSel(i)}>
            {i + 1}번째 자리
          </Btn>
        ))}
        <Btn on={end} onClick={() => setEnd(!end)}>문장 끝 토큰 넣기</Btn>
      </Controls>
      <div style={{display: 'grid', gap: 10}}>
        <div>
          <div style={{fontSize: '0.8rem', marginBottom: 4}}>글: {tokens.join(' ')}</div>
        </div>
        <div>
          <div style={{fontSize: '0.8rem', marginBottom: 4}}>입력 (뒤쪽은 가려집니다)</div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {tokens.slice(0, n).map((w, i) => (
              <span key={i} style={chip(i === k ? 'cur' : i < k ? 'plain' : 'hidden')}>
                {w}
                {i > k ? ' (가려짐)' : ''}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontSize: '0.8rem', marginBottom: 4}}>정답 (한 칸 뒤)</div>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {tokens.slice(1).map((w, i) => (
              <span key={i} style={chip(i === k ? 'ans' : 'plain')}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Note>
        {k + 1}번째 자리는 입력 {tokens.slice(0, k + 1).join(', ')}을(를) 보고 정답 {tokens[k + 1]}을(를) 맞힙니다.
        {end
          ? ' 끝 토큰이 있어서 마지막 자리의 정답도 생기고, 모델은 문장이 어디서 끝나는지도 배웁니다.'
          : ' 마지막 토큰 좋다는 다음 토큰이 없어서 입력 쪽에서는 빠집니다.'}
      </Note>
    </Viz>
  );
}
