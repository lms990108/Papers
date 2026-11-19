import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Note, Stats, Stat, fmt, styles as s} from '../../Viz';
import {V, COUNTS, pBigram, pUnigram} from './lmCore';

export default function NextWordBars() {
  const [h, setH] = useState(1);
  const [mode, setMode] = useState('k');
  const [k, setK] = useState(0);
  const [lam, setLam] = useState(0.8);
  const [noDen, setNoDen] = useState(false);

  const hw = V[h];
  const ch = COUNTS.hist[hw];
  const seen = ch > 0;

  const probs = V.map((w) => {
    if (mode === 'k') {
      const num = COUNTS.big[hw][w] + k;
      const den = noDen ? ch : ch + k * V.length;
      return den === 0 ? NaN : num / den;
    }
    // 보간: 앞 단어 뒤를 본 적이 없으면 유니그램만 쓴다(설명용 약속)
    return seen ? lam * pBigram(w, hw, 0) + (1 - lam) * pUnigram(w) : pUnigram(w);
  });
  const valid = probs.every((p) => !Number.isNaN(p));
  const sum = valid ? probs.reduce((a, b) => a + b, 0) : NaN;
  const sumOk = valid && Math.abs(sum - 1) < 1e-9;

  return (
    <Viz
      title="앞 단어를 고르면 다음 단어의 비율이 나옵니다"
      caption="학습 글은 세 줄(오늘 날씨 좋다 / 오늘 날씨 나쁘다 / 오늘 날씨 좋다)입니다. 왼쪽 표의 앞 단어를 누르면 그 줄의 횟수가 비율 막대가 됩니다. 비율은 횟수 ÷ 앞 단어의 횟수입니다."
    >
      <div className={s.two}>
        <div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>앞 → 다음</th>
                {V.map((w) => (
                  <th key={w}>{w}</th>
                ))}
                <th>count(앞)</th>
              </tr>
            </thead>
            <tbody>
              {V.map((a, i) => (
                <tr key={a}>
                  <td>
                    <Btn on={h === i} onClick={() => setH(i)}>
                      {a}
                    </Btn>
                  </td>
                  {V.map((b) => (
                    <td key={b} className={h === i ? s.cellOn : undefined}>
                      {COUNTS.big[a][b]}
                    </td>
                  ))}
                  <td>{COUNTS.hist[a]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <Controls>
            <Btn on={mode === 'k'} onClick={() => setMode('k')}>더하기-k 스무딩</Btn>
            <Btn on={mode === 'interp'} onClick={() => setMode('interp')}>보간</Btn>
          </Controls>
          {mode === 'k' ? (
            <Controls>
              <Slider label="k" min={0} max={2} step={0.1} value={k} onChange={setK} format={(v) => fmt(v, 1)} />
              <Btn on={noDen} onClick={() => setNoDen(!noDen)}>분모에 k·|V| 더하지 않기</Btn>
            </Controls>
          ) : (
            <Controls>
              <Slider label="λ" min={0} max={1} step={0.05} value={lam} onChange={setLam} format={(v) => fmt(v, 2)} />
            </Controls>
          )}
          {V.map((w, j) => (
            <Bar
              key={w}
              label={`P(${w} | ${hw})`}
              value={Number.isNaN(probs[j]) ? 0 : probs[j]}
              max={1}
              color="var(--vb)"
              text={Number.isNaN(probs[j]) ? '정의 안 됨' : fmt(probs[j], 3)}
            />
          ))}
        </div>
      </div>
      <Stats>
        <Stat label="네 비율의 합" value={valid ? fmt(sum, 3) : '—'} tone={valid ? (sumOk ? 'good' : 'bad') : undefined} />
        <Stat label={`count(${hw})`} value={ch} />
      </Stats>
      {mode === 'k' && !seen && k === 0 ? (
        <Note>{hw} 뒤에 무엇이 왔는지 학습 글에 없습니다. 횟수가 0이라 0으로 나누게 되어 비율이 정의되지 않습니다. k를 올려 보세요.</Note>
      ) : null}
      {mode === 'k' && noDen && k > 0 ? (
        <Note>분자에만 k를 더하면 합이 1을 넘어 비율이 아닙니다. 분모에 k·|V|를 같이 더하는 이유입니다.</Note>
      ) : null}
      {mode === 'k' && !noDen && k > 0 && seen ? (
        <Note>
          예: ({COUNTS.big[hw][V[2]]} + {fmt(k, 1)}) / ({ch} + {fmt(k * V.length, 1)}) = {fmt(probs[2], 3)}. k가 클수록 본 쌍에서 깎아 못 본 쌍에 나눠 줍니다.
        </Note>
      ) : null}
      {mode === 'interp' ? (
        <Note>
          {seen
            ? 'λ P(2-그램) + (1-λ) P(1-그램). 한 번도 못 본 쌍도 유니그램 비율만큼의 몫을 받습니다.'
            : `${hw} 뒤를 본 적이 없어서 설명용으로 유니그램 비율만 씁니다.`}
        </Note>
      ) : null}
    </Viz>
  );
}
