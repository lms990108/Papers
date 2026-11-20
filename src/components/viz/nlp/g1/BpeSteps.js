import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, Bar, styles as s} from '../../Viz';

const CORPORA = [
  {name: '날씨 예', items: [['날씨', 2], ['날씨가', 1]]},
  {name: '영어 예', items: [['low', 5], ['lower', 2], ['newest', 6], ['widest', 3]]},
  {name: '날씨 · 날씨가 · 날씨는', items: [['날씨', 3], ['날씨가', 1], ['날씨는', 1]]},
];

// 인접한 쌍을 처음 나온 순서대로 센다. 횟수가 같으면 먼저 나온 쌍이 이긴다.
function countPairs(words) {
  const order = [];
  const seen = {};
  words.forEach((w) => {
    for (let i = 0; i < w.toks.length - 1; i += 1) {
      const k = `${w.toks[i]}\u0001${w.toks[i + 1]}`;
      if (!seen[k]) {
        seen[k] = {a: w.toks[i], b: w.toks[i + 1], n: 0};
        order.push(seen[k]);
      }
      seen[k].n += w.c;
    }
  });
  return order;
}

function mergeWords(words, p) {
  const out = [];
  const idx = {};
  words.forEach((w) => {
    const t = [];
    let i = 0;
    while (i < w.toks.length) {
      if (i + 1 < w.toks.length && w.toks[i] === p.a && w.toks[i + 1] === p.b) {
        t.push(p.a + p.b);
        i += 2;
      } else {
        t.push(w.toks[i]);
        i += 1;
      }
    }
    const key = t.join('\u0001');
    if (idx[key] !== undefined) out[idx[key]].c += w.c;
    else {
      idx[key] = out.length;
      out.push({toks: t, c: w.c});
    }
  });
  return out;
}

const total = (ws) => ws.reduce((a, w) => a + w.toks.length * w.c, 0);

function runBpe(items) {
  let words = items.map(([w, c]) => ({toks: w.split(''), c}));
  const chars = {};
  words.forEach((w) => w.toks.forEach((t) => (chars[t] = 1)));
  const v0 = Object.keys(chars).length;
  const hist = [];
  let step = 0;
  for (;;) {
    const pairs = countPairs(words);
    let best = null;
    pairs.forEach((p) => {
      if (!best || p.n > best.n) best = p;
    });
    hist.push({words, tokens: total(words), vocab: v0 + step, pairs, best, merged: step ? hist[step - 1].best : null});
    if (!best) break;
    words = mergeWords(words, best);
    step += 1;
  }
  return hist;
}

const chip = (extra) => ({
  display: 'inline-block',
  padding: '1px 8px',
  margin: '2px 3px 2px 0',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  fontSize: '0.9rem',
  ...extra,
});

export default function BpeSteps() {
  const [ci, setCi] = useState(0);
  const [k, setK] = useState(0);
  const hist = useMemo(() => runBpe(CORPORA[ci].items), [ci]);
  const last = hist.length - 1;
  const step = Math.min(k, last);
  const h = hist[step];
  const start = hist[0];
  const pairRows = h.pairs.slice().sort((x, y) => y.n - x.n);
  const newTok = h.merged ? h.merged.a + h.merged.b : null;

  return (
    <Viz
      title="BPE: 자주 붙은 쌍을 한 단계씩 합치기"
      caption="슬라이더로 합친 횟수를 정하세요. 코퍼스는 학습에 쓰는 글 모음이고, 사전 크기는 토큰 종류의 수(표의 행 수)입니다. 합칠 때마다 사전에는 행이 하나 늘고, 코퍼스의 토큰 수는 줄어듭니다. 맨 오른쪽은 단어마다 토큰 하나인 어절 단위, 맨 왼쪽은 글자 단위입니다."
    >
      <Controls>
        {CORPORA.map((c, i) => (
          <Btn
            key={c.name}
            on={i === ci}
            onClick={() => {
              setCi(i);
              setK(0);
            }}
          >
            {c.name}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="합친 횟수" min={0} max={last} value={step} onChange={setK} />
        <Btn onClick={() => setK(Math.min(step + 1, last))}>한 번 더 합치기</Btn>
        <Btn onClick={() => setK(0)}>처음으로</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.title}>코퍼스 (단어 × 횟수)</div>
          {h.words.map((w, i) => (
            <div key={i}>
              {w.toks.map((t, j) => (
                <span
                  key={j}
                  style={chip(
                    t === newTok
                      ? {borderColor: 'var(--vb)', background: 'color-mix(in srgb, var(--vb) 22%, transparent)', fontWeight: 600}
                      : t.length > 1
                        ? {borderColor: 'var(--vb)'}
                        : undefined,
                  )}
                >
                  {t}
                </span>
              ))}
              <span className={s.ts}> × {w.c}</span>
            </div>
          ))}
          <p className={s.note}>
            {h.merged
              ? `방금 합친 쌍: ${h.merged.a} + ${h.merged.b} (${h.merged.n}번 나온 쌍)`
              : '글자 단위로 시작한 상태입니다.'}
          </p>
        </div>
        <div>
          <div className={s.title}>{h.best ? '다음에 합칠 쌍 후보' : '더 합칠 쌍이 없습니다'}</div>
          {h.best ? (
            <table className={s.grid}>
              <thead>
                <tr>
                  <th>쌍</th>
                  <th>횟수</th>
                </tr>
              </thead>
              <tbody>
                {pairRows.slice(0, 6).map((p) => (
                  <tr key={p.a + p.b + p.n}>
                    <td className={p === h.best ? s.cellOn : undefined}>
                      {p.a}, {p.b}
                    </td>
                    <td className={p === h.best ? s.cellOn : undefined}>{p.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Note>모든 단어가 토큰 하나입니다.</Note>
          )}
          {h.best ? <Note>횟수가 같으면 먼저 나온 쌍을 고릅니다. 한 번 더 합치면 {h.best.a}+{h.best.b}가 새 토큰이 됩니다.</Note> : null}
        </div>
      </div>
      <Stats>
        <Stat label="합친 횟수" value={step} />
        <Stat label="코퍼스 토큰 수" value={h.tokens} />
        <Stat label="사전 크기" value={h.vocab} />
      </Stats>
      <Bar label="사전 크기" value={h.vocab} max={hist[last].vocab} color="var(--va)" text={`${h.vocab}`} />
      <Bar label="코퍼스 토큰 수" value={h.tokens} max={start.tokens} color="var(--vb)" text={`${h.tokens}`} />
      <Note>사전 크기 = 처음 글자 수 + 합친 횟수입니다. 한쪽이 늘면 다른 쪽이 줄어듭니다.</Note>
    </Viz>
  );
}
