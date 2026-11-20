import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const VOCAB = ['오늘', '날씨', '좋다', '나쁘다'];
const W = [0, 0.2, -1, 1];
const CORPUS = ['오늘 날씨 좋다', '오늘 날씨 나쁘다', '오늘 날씨 좋다'];
const PRESETS = ['날씨 나쁘다', '오늘 날씨 정말 나쁘다', '날씨 좋다', '오늘 날씨 정말 좋다', '오늘 날씨 정말 나쁘다 나쁘다'];
const ADD = ['오늘', '날씨', '정말', '좋다', '나쁘다'];

function nextCounts(prev) {
  const c = {};
  CORPUS.forEach((line) => {
    const t = line.split(' ');
    for (let i = 0; i + 1 < t.length; i += 1) {
      if (t[i] === prev) c[t[i + 1]] = (c[t[i + 1]] || 0) + 1;
    }
  });
  return c;
}

export default function OutputShapes() {
  const [words, setWords] = useState(['날씨', '나쁘다']);
  const bag = VOCAB.map((v) => words.filter((x) => x === v).length);
  const score = bag.reduce((a, c, i) => a + c * W[i], 0);
  const dropped = words.filter((x) => VOCAB.indexOf(x) < 0);
  const last = words.length ? words[words.length - 1] : null;
  const nc = last ? nextCounts(last) : {};
  const keys = Object.keys(nc);
  const sentence = words.join(' ');

  return (
    <Viz
      title="같은 문장, 세 가지 출력 모양"
      caption="문장을 바꾸거나 단어를 붙여 보세요. 입력이 길어지면 어느 출력의 개수가 따라 늘어나는지 보면 됩니다. 가중치는 칸 순서(오늘, 날씨, 좋다, 나쁘다)대로 0, 0.2, -1, 1이고, 코퍼스는 “오늘 날씨 좋다”, “오늘 날씨 나쁘다”, “오늘 날씨 좋다” 세 줄입니다. 둘 다 단어 주머니와 엔그램 페이지의 예입니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={sentence === p} onClick={() => setWords(p.split(' '))}>
            {p}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <span className={s.ts}>단어 붙이기</span>
        {ADD.map((a) => (
          <Btn key={a} onClick={() => words.length < 8 && setWords(words.concat([a]))}>
            +{a}
          </Btn>
        ))}
        <Btn onClick={() => setWords(words.slice(0, -1))}>마지막 지우기</Btn>
      </Controls>
      <p className={s.t} style={{margin: '4px 0 10px'}}>
        입력: <b>{sentence || '(빈 문장)'}</b>
      </p>
      <div className={s.two}>
        <div>
          <b>문장 하나 → 레이블 하나</b>
          <table className={s.grid}>
            <thead>
              <tr>
                {VOCAB.map((v) => (
                  <th key={v}>{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>{bag.map((c, i) => <td key={i} className={c ? s.cellOn : undefined}>{c}</td>)}</tr>
              <tr>{W.map((c, i) => <td key={i}>×{c}</td>)}</tr>
            </tbody>
          </table>
          <p className={s.note}>
            점수 <b>{fmt(score, 1)}</b>. 출력 1개.
            {dropped.length ? ` 사전에 없는 ${dropped.join(', ')}은(는) 주머니에서 버려집니다.` : ''}
          </p>
        </div>
        <div>
          <b>단어마다 표지</b>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, margin: '8px 0'}}>
            {words.map((w, i) => (
              <span key={i} style={{border: '1.5px solid var(--vb)', borderRadius: 6, padding: '2px 8px', fontSize: '0.85rem'}}>
                {w} → 표지 {i + 1}
              </span>
            ))}
          </div>
          <p className={s.note}>출력 {words.length}개. 문장이 길어지면 표지도 길어지고, 순서를 버린 점수에 없는 정말도 자리가 있습니다.</p>
        </div>
        <div>
          <b>문장 생성 (다음 단어 맞히기)</b>
          {last ? (
            <p className={s.note}>
              마지막 단어 <b>{last}</b> 다음에 코퍼스에서 센 단어:{' '}
              {keys.length ? keys.map((k) => `${k} ${nc[k]}번`).join(', ') : '없음. 엔그램은 1을 더해 0이 아닌 비율을 남깁니다.'}
            </p>
          ) : (
            <p className={s.note}>문장이 비어 있습니다.</p>
          )}
          <p className={s.note}>출력은 다음 한 자리의 비율입니다. 길이는 입력과 따로 정해집니다.</p>
        </div>
      </div>
      <Stats>
        <Stat label="레이블 출력 수" value="1" />
        <Stat label="표지 출력 수" value={String(words.length)} />
        <Stat label="다음 단어 출력 수" value="한 자리" />
      </Stats>
      <Note>
        <b>단어 수가 바뀌어도 레이블 출력은 1개</b>입니다. 표지만 단어 수를 따라 늘어납니다.
      </Note>
    </Viz>
  );
}
