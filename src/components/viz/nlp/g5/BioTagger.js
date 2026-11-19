import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

const TAGS = ['O', 'B-LOC', 'I-LOC', 'B-PER', 'I-PER'];
const PRESETS = [
  {name: '맞는 열', words: ['서울', '특별시', '날씨', '좋다'], tags: ['B-LOC', 'I-LOC', 'O', 'O']},
  {name: '서울만 장소', words: ['서울', '특별시', '날씨', '좋다'], tags: ['B-LOC', 'O', 'O', 'O']},
  {name: '시작 없는 I', words: ['서울', '특별시', '날씨', '좋다'], tags: ['O', 'I-LOC', 'O', 'O']},
  {name: 'B-PER 뒤 I-LOC', words: ['서울', '특별시', '날씨', '좋다'], tags: ['B-PER', 'I-LOC', 'O', 'O']},
];

// 개체 구간 추출: 원문 코드와 같은 규칙(끝은 포함하지 않음)
function spans(tags) {
  const out = [];
  let start = null;
  let kind = null;
  tags.concat(['O']).forEach((t, i) => {
    if (t === 'O' || t.indexOf('B-') === 0 || (t.indexOf('I-') === 0 && t.slice(2) !== kind)) {
      if (kind !== null) out.push([kind, start, i]);
      if (t === 'O') {
        start = null;
        kind = null;
      } else {
        start = i;
        kind = t.slice(2);
      }
    }
  });
  return out;
}

// 규칙 위반: I-X 앞이 B-X 또는 I-X가 아님
const errors = (tags) =>
  tags
    .map((t, i) => {
      if (t.indexOf('I-') !== 0) return null;
      const prev = i === 0 ? 'O' : tags[i - 1];
      return prev.slice(2) === t.slice(2) && prev !== 'O' ? null : i;
    })
    .filter((x) => x !== null);

export default function BioTagger() {
  const [preset, setPreset] = useState(0);
  const [tags, setTags] = useState(PRESETS[0].tags);
  const words = PRESETS[0].words;
  const ents = spans(tags);
  const bad = errors(tags);

  const cycle = (i) => setTags(tags.map((t, j) => (j === i ? TAGS[(TAGS.indexOf(t) + 1) % TAGS.length] : t)));
  const color = (t) => (t === 'O' ? 'var(--ifm-color-emphasis-600)' : t.indexOf('PER') > 0 ? 'var(--vc)' : 'var(--vb)');

  return (
    <Viz
      title="표지를 눌러 바꾸고, 추출되는 이름 보기"
      caption="단어 아래 표지 버튼을 누르면 O, B-LOC, I-LOC, B-PER, I-PER 순서로 바뀝니다. 규칙에 어긋난 칸은 빨간 글씨와 설명으로 표시합니다."
    >
      <Controls>
        {PRESETS.map((p, i) => (
          <Btn
            key={p.name}
            on={preset === i && p.tags.join() === tags.join()}
            onClick={() => {
              setPreset(i);
              setTags(p.tags);
            }}
          >
            {p.name}
          </Btn>
        ))}
      </Controls>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', margin: '6px 0 12px'}}>
        {words.map((w, i) => {
          const inEnt = ents.some((e) => i >= e[1] && i < e[2]);
          const isBad = bad.indexOf(i) >= 0;
          return (
            <div key={i} style={{textAlign: 'center'}}>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1.5px solid ' + (isBad ? 'var(--vbad)' : inEnt ? 'var(--vb)' : 'var(--ifm-color-emphasis-300)'),
                  background: inEnt ? 'color-mix(in srgb, var(--vb) 16%, transparent)' : 'transparent',
                }}
              >
                {w}
              </div>
              <button
                type="button"
                className={s.btn}
                style={{marginTop: 6, minWidth: '5.5em', color: isBad ? 'var(--vbad)' : color(tags[i]), fontWeight: 600}}
                onClick={() => cycle(i)}
                aria-label={w + '의 표지 ' + tags[i] + ', 누르면 바뀝니다'}
              >
                {tags[i]}
              </button>
            </div>
          );
        })}
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>추출된 이름</th>
            <th>종류</th>
            <th>구간</th>
          </tr>
        </thead>
        <tbody>
          {ents.length ? (
            ents.map((e, i) => (
              <tr key={i}>
                <td className={s.cellOn}>{words.slice(e[1], e[2]).join(' ')}</td>
                <td>{e[0]}</td>
                <td>
                  {e[1] + 1}번째부터 {e[2]}번째까지
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>추출된 이름이 없습니다 (전부 O)</td>
            </tr>
          )}
        </tbody>
      </table>
      {bad.length ? (
        <Note>
          <b style={{color: 'var(--vbad)'}}>어긋난 표지 열입니다.</b>{' '}
          {bad
            .map((i) => {
              const t = tags[i];
              const prev = i === 0 ? '문장 앞(O)' : words[i - 1] + '의 ' + tags[i - 1];
              return words[i] + '의 ' + t + ' 앞이 ' + prev + '이라 ' + t.slice(2) + ' 이름의 시작이 없습니다';
            })
            .join('. ')}
          . I는 같은 종류의 B나 I 바로 뒤에서만 올 수 있습니다.
        </Note>
      ) : (
        <Note>규칙에 맞는 표지 열입니다. B는 이름의 시작, I는 그 이름의 속, O는 이름이 아닌 칸입니다.</Note>
      )}
    </Viz>
  );
}
