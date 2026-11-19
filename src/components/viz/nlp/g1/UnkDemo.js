import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

// 설명용 값: 학습 글에 들어 있는 말과 그 형태소 분리.
const TRAIN = [
  {w: '날씨', mo: ['날씨']},
  {w: '날씨가', mo: ['날씨', '가']},
  {w: '좋다', mo: ['좋', '다']},
  {w: '좋았다', mo: ['좋', '았', '다']},
];
const TEST = [
  {w: '날씨가', mo: ['날씨', '가']},
  {w: '좋았다', mo: ['좋', '았', '다']},
];
const UNITS = ['어절(띄어쓰기)', '형태소', '글자'];

const chip = (extra) => ({
  display: 'inline-block',
  padding: '2px 9px',
  margin: '3px 4px 3px 0',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  fontSize: '0.92rem',
  ...extra,
});

const split = (item, u) => (u === 0 ? [item.w] : u === 1 ? item.mo : item.w.split(''));
const uniq = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);

export default function UnkDemo() {
  const [on, setOn] = useState([true, false, true, false]);
  const [u, setU] = useState(0);

  const trainItems = TRAIN.filter((_, i) => on[i]);
  const vocab = uniq(trainItems.reduce((acc, it) => acc.concat(split(it, u)), []));
  const rows = TEST.map((it) => split(it, u).map((t) => ({t, ok: vocab.indexOf(t) >= 0})));
  const all = rows.reduce((acc, r) => acc.concat(r), []);
  const unk = all.filter((x) => !x.ok).length;

  const toggle = (i) => setOn(on.map((v, k) => (k === i ? !v : v)));

  return (
    <Viz
      title="처음 보는 말은 어떻게 되나"
      caption="학습 글에 들어 있는 말을 켜고 끄세요. 시험 문장 날씨가 좋았다를 사전의 행으로 읽습니다. 사전에 없는 토큰은 [UNK] 한 칸으로 뭉뚱그려집니다. 말과 분리는 설명용 값입니다."
    >
      <Controls>
        <span className={s.ts}>학습 글:</span>
        {TRAIN.map((x, i) => (
          <Btn key={x.w} on={on[i]} onClick={() => toggle(i)}>
            {x.w}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <span className={s.ts}>자르는 단위:</span>
        {UNITS.map((n, i) => (
          <Btn key={n} on={u === i} onClick={() => setU(i)}>
            {n}
          </Btn>
        ))}
      </Controls>
      <div className={s.title}>사전(표의 행) {vocab.length}개</div>
      <div>
        {vocab.length ? (
          vocab.map((t) => (
            <span key={t} style={chip()}>
              {t}
            </span>
          ))
        ) : (
          <span className={s.ts}>학습 글이 비어 있어서 사전도 비어 있습니다.</span>
        )}
      </div>
      <div className={s.title} style={{marginTop: 10}}>
        시험 문장: 날씨가 좋았다
      </div>
      <div>
        {rows.map((r, k) => (
          <span key={k} style={{display: 'inline-block', marginRight: 14}}>
            {r.map((x, i) => (
              <span
                key={i}
                style={chip({
                  borderColor: x.ok ? 'var(--vok)' : 'var(--vbad)',
                  background: x.ok ? 'color-mix(in srgb, var(--vok) 14%, transparent)' : 'color-mix(in srgb, var(--vbad) 14%, transparent)',
                })}
              >
                {x.ok ? x.t : '[UNK]'}
                <span className={s.ts}> {x.ok ? '' : `(${x.t})`}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <Stats>
        <Stat label="사전 크기" value={vocab.length} />
        <Stat label="시험 문장의 토큰 수" value={all.length} />
        <Stat label="[UNK] 수" value={unk} tone={unk ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {u === 0
          ? '어절 단위는 말 하나가 통째로 사전에 있어야 합니다. 날씨가는 날씨를 아무리 많이 봤어도 그 행이 비어 있습니다.'
          : u === 1
            ? '형태소 단위는 아는 조각의 합으로 읽습니다. 날씨 줄기는 알아도, 학습 글에 한 번도 없던 조각(가, 았)은 모릅니다.'
            : '글자 단위는 글자를 한 번이라도 봤으면 읽을 수 있습니다. 대신 토큰 수가 늘어납니다.'}
      </Note>
    </Viz>
  );
}
