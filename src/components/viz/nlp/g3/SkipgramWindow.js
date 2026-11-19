import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const SENTS = [
  {name: '어제 오늘 날씨 좋다 보다', t: ['어제', '오늘', '날씨', '좋다', '보다'], c: 2},
  {name: '어제 오늘 날씨 좋다', t: ['어제', '오늘', '날씨', '좋다'], c: 2},
  {name: '오늘 날씨 좋다', t: ['오늘', '날씨', '좋다'], c: 1},
];

function neighbors(n, i, win) {
  const out = [];
  for (let j = Math.max(0, i - win); j < Math.min(n, i + win + 1); j++) {
    if (j !== i) out.push(j);
  }
  return out;
}

export default function SkipgramWindow() {
  const [si, setSi] = useState(0);
  const [win, setWin] = useState(1);
  const [center, setCenter] = useState(2);

  const sent = SENTS[si];
  const toks = sent.t;
  const n = toks.length;
  const c = Math.min(center, n - 1);
  const w = Math.min(win, n - 1);
  const near = neighbors(n, c, w);

  const rows = toks.map((t, i) => ({i, t, nb: neighbors(n, i, w)}));
  const total = rows.reduce((acc, r) => acc + r.nb.length, 0);

  const pick = (k) => {
    setSi(k);
    setCenter(SENTS[k].c);
  };

  return (
    <Viz
      title="창(window) 안의 단어 쌍 뽑기"
      caption="단어를 눌러 가운데 단어를 바꾸고, 슬라이더로 창의 크기를 바꿔 보세요. 창 안의 옆 단어마다 (가운데, 옆) 쌍이 하나씩 생깁니다."
    >
      <Controls>
        {SENTS.map((x, k) => (
          <Btn key={x.name} on={k === si} onClick={() => pick(k)}>
            {x.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="창 크기" min={1} max={n - 1} value={w} onChange={setWin} />
      </Controls>

      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, margin: '4px 0 10px'}}>
        {toks.map((t, i) => {
          const isC = i === c;
          const isN = near.indexOf(i) >= 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setCenter(i)}
              aria-pressed={isC}
              style={{
                minWidth: 76,
                padding: '8px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--ifm-font-color-base)',
                background: isC ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : isN ? 'color-mix(in srgb, var(--va) 16%, transparent)' : 'var(--ifm-background-color)',
                border: `2px ${isC || isN ? 'solid' : 'dashed'} ${isC ? 'var(--vb)' : isN ? 'var(--va)' : 'var(--ifm-color-emphasis-300)'}`,
                opacity: isC || isN ? 1 : 0.6,
              }}
            >
              <div style={{fontWeight: 600}}>{t}</div>
              <div className={s.ts} style={{fontSize: 12}}>
                {isC ? '가운데' : isN ? '옆 (쌍이 됨)' : '창 밖'}
              </div>
            </button>
          );
        })}
      </div>

      <table className={s.grid}>
        <thead>
          <tr>
            <th>가운데 단어</th>
            <th>맞혀야 할 옆 단어</th>
            <th>쌍 수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i}>
              <td className={r.i === c ? s.cellOn : undefined}>{r.t}</td>
              <td className={r.i === c ? s.cellOn : undefined}>{r.nb.map((j) => toks[j]).join(', ')}</td>
              <td className={r.i === c ? s.cellOn : undefined}>{r.nb.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Stats>
        <Stat label={`${toks[c]}의 쌍`} value={near.length} />
        <Stat label="문장 전체의 쌍" value={total} />
      </Stats>
      <Note>
        문장 끝 단어는 한쪽에만 이웃이 있어서 쌍이 적습니다. 5단어 문장은 창 1에서 8개, 창 2에서 14개입니다.
      </Note>
    </Viz>
  );
}
