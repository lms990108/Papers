import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, Stats, Stat, fmt, styles as s} from '../../Viz';
import {V, ratios, safe, ppl, showPpl} from './lmCore';

const PRESETS = [
  ['오늘', '날씨', '좋다'],
  ['오늘', '날씨', '나쁘다'],
  ['오늘', '날씨', '오늘'],
  ['좋다', '날씨', '오늘'],
];
const MODELS = [
  {id: 'uniform', n: '균등'},
  {id: 'unigram', n: '유니그램'},
  {id: 'bigram', n: '바이그램'},
];

export default function ChainProduct() {
  const [sent, setSent] = useState(PRESETS[0]);
  const [model, setModel] = useState('bigram');
  const [k, setK] = useState(0);
  const [upto, setUpto] = useState(3);

  const n = sent.length;
  const step = Math.max(1, Math.min(upto, n));
  const ps = ratios(model, sent, k);
  const used = ps.slice(0, step).map(safe);
  const prod = used.reduce((a, b) => a * b, 1);
  const logsum = used.some((p) => p === 0) ? -Infinity : used.reduce((a, p) => a + Math.log(p), 0);
  const value = ppl(used);
  let run = 1;

  const setS = (x) => {
    setSent(x);
    setUpto(x.length);
  };
  const add = (w) => sent.length < 6 && setS(sent.concat([w]));

  return (
    <Viz
      title="문장 비율은 조건 비율의 곱"
      caption="문장을 만들고 모델을 고르세요. 단어마다 앞 단어가 주어졌을 때의 비율이 나오고, 그 곱이 문장 비율입니다. 바이그램은 첫 단어 비율을 1로 둡니다. k는 더하기-k 스무딩입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p.join(' ')} on={p.join() === sent.join()} onClick={() => setS(p)}>
            {p.join(' ')}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {V.map((w) => (
          <Btn key={w} onClick={() => add(w)}>
            + {w}
          </Btn>
        ))}
        <Btn onClick={() => setS([])}>지우기</Btn>
      </Controls>
      <Controls>
        {MODELS.map((m) => (
          <Btn key={m.id} on={model === m.id} onClick={() => setModel(m.id)}>
            {m.n}
          </Btn>
        ))}
        {model === 'bigram' ? <Slider label="k" min={0} max={2} step={0.1} value={k} onChange={setK} format={(v) => fmt(v, 1)} /> : null}
        {n > 1 ? <Slider label="몇 번째 단어까지" min={1} max={n} value={step} onChange={setUpto} /> : null}
      </Controls>

      {n === 0 ? (
        <Note>문장이 비어 있습니다. 위의 단어 단추로 문장을 만들어 보세요.</Note>
      ) : (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>자리</th>
              <th>조건 비율</th>
              <th>값</th>
              <th>누적 곱</th>
            </tr>
          </thead>
          <tbody>
            {sent.slice(0, step).map((w, i) => {
              const raw = ps[i];
              run *= safe(raw);
              const cond = model === 'bigram' && i > 0 ? `P(${w} | ${sent[i - 1]})` : `P(${w})`;
              return (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{cond}</td>
                  <td className={safe(raw) === 0 ? s.cellOn : undefined}>
                    {Number.isNaN(raw) ? '0 (앞 단어 뒤를 본 적 없음)' : fmt(raw, 4)}
                    {model === 'bigram' && i === 0 ? ' (약속)' : ''}
                  </td>
                  <td>{fmt(run, 4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {n > 0 ? (
        <Stats>
          <Stat label="문장 비율 (곱)" value={fmt(prod, 4)} />
          <Stat label="로그의 합" value={logsum === -Infinity ? '−∞' : fmt(logsum, 4)} />
          <Stat label="퍼플렉서티" value={showPpl(value)} tone={value === Infinity ? 'bad' : undefined} />
        </Stats>
      ) : null}
      {n > 0 && prod === 0 ? <Note>비율이 하나라도 0이면 곱 전체가 0이고 퍼플렉서티는 한없이 큽니다. k를 올려 0을 없애 보세요.</Note> : null}
      {model === 'unigram' ? <Note>유니그램은 앞 단어를 보지 않습니다. 단어 순서를 바꿔도 곱이 같습니다.</Note> : null}
    </Viz>
  );
}
