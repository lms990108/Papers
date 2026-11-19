import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Note, Stat, Stats, fmt, styles as s} from '../../Viz';
import {mulberry32} from '../../annSim';
import {V, COUNTS, pBigram} from './lmCore';

const COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)'];
const MAXLEN = 8;

export default function NgramSample() {
  const [seed, setSeed] = useState(1);
  const [k, setK] = useState(0);
  const [words, setWords] = useState(['오늘']);
  const [trace, setTrace] = useState([]);
  const [stuck, setStuck] = useState(false);

  const reset = () => {
    setWords(['오늘']);
    setTrace([]);
    setStuck(false);
  };

  const draw = () => {
    if (words.length >= MAXLEN) return;
    const h = words[words.length - 1];
    const probs = V.map((w) => pBigram(w, h, k));
    if (probs.some((p) => Number.isNaN(p))) {
      setStuck(true);
      return;
    }
    const r = mulberry32(seed * 1000 + words.length)();
    let acc = 0;
    let pick = V.length - 1;
    for (let i = 0; i < V.length; i += 1) {
      acc += probs[i];
      if (r < acc) {
        pick = i;
        break;
      }
    }
    setWords(words.concat([V[pick]]));
    setTrace(trace.concat([{h, r, probs, pick}]));
  };

  const last = trace.length ? trace[trace.length - 1] : null;

  return (
    <Viz
      title="횟수표로 문장을 한 단어씩 만들어 보기"
      caption="시작은 오늘입니다. 단추를 누르면 마지막 단어 뒤의 비율 띠에 난수 r(검은 선)이 떨어지고, 그 칸의 단어가 붙습니다. 시드가 같으면 같은 문장이 나옵니다. 난수는 시드를 고정한 설명용 값입니다."
    >
      <Controls>
        <Btn onClick={draw}>다음 단어 뽑기</Btn>
        <Btn onClick={reset}>처음부터</Btn>
        <Btn on={k === 0} onClick={() => { setK(0); reset(); }}>스무딩 없음</Btn>
        <Btn on={k === 1} onClick={() => { setK(1); reset(); }}>1을 더함</Btn>
        <Slider label="시드" min={1} max={9} value={seed} onChange={(v) => { setSeed(v); reset(); }} />
      </Controls>

      <div className={s.title}>만든 문장: {words.join(' ')}</div>

      {last ? (
        <div>
          <div className={s.note}>
            P(다음 | {last.h}) 띠에서 r = {fmt(last.r, 3)} → {V[last.pick]}
          </div>
          <div style={{position: 'relative', display: 'flex', height: 34, margin: '8px 0 14px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, overflow: 'hidden'}}>
            {V.map((w, i) => (
              <div
                key={w}
                style={{
                  width: `${last.probs[i] * 100}%`,
                  background: `color-mix(in srgb, ${COLORS[i]} ${i === last.pick ? 55 : 25}%, transparent)`,
                  fontSize: 11,
                  lineHeight: '34px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {last.probs[i] > 0 ? `${w} ${fmt(last.probs[i], 2)}` : ''}
              </div>
            ))}
            <div style={{position: 'absolute', top: 0, bottom: 0, left: `${last.r * 100}%`, width: 3, background: 'var(--ifm-font-color-base)'}} />
          </div>
        </div>
      ) : (
        <Note>아직 뽑지 않았습니다. 단추를 눌러 보세요.</Note>
      )}

      <Stats>
        <Stat label="뽑은 횟수" value={trace.length} />
        <Stat label="문장 길이" value={`${words.length} / ${MAXLEN}`} />
      </Stats>
      {stuck ? (
        <Note>
          {words[words.length - 1]} 뒤에 무엇이 왔는지 학습 글에 없어서 다음 비율을 만들 수 없습니다(횟수 0). 스무딩 없음에서는 여기서 멈춥니다. 1을 더하면 네 단어가 같은 몫(1/4)을 받아 계속 이어집니다.
        </Note>
      ) : null}
      {words.length >= MAXLEN ? <Note>최대 길이에 도달했습니다. 처음부터 다시 해 보세요.</Note> : null}
      {k === 0 && !stuck && words.length > 1 && COUNTS.hist[words[words.length - 1]] === 0 ? (
        <Note>다음 단추를 누르면 멈춥니다. 마지막 단어의 뒤가 학습 글에 없습니다.</Note>
      ) : null}
    </Viz>
  );
}
