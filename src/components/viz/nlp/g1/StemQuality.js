import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const KO_END = ['았다', '아요', '었다', '어요', '다'];
const EN_END = ['ing', 'ed', 'es', 's'];
const stemKo = (w) => {
  for (let i = 0; i < KO_END.length; i += 1) {
    const e = KO_END[i];
    if (w.endsWith(e) && w.length > e.length) return w.slice(0, w.length - e.length);
  }
  return w;
};
const stemEn = (w) => {
  for (let i = 0; i < EN_END.length; i += 1) {
    const e = EN_END[i];
    if (w.endsWith(e) && w.length - e.length >= 3) return w.slice(0, w.length - e.length);
  }
  return w;
};
const isKo = (w) => /[가-힣]/.test(w);
const rule = (w) => (isKo(w) ? stemKo(w) : stemEn(w));

// 설명용 사전. 없는 말은 규칙 자르기로 떨어진다.
const DICT = {
  좋다: '좋다', 좋았다: '좋다', 좋아요: '좋다',
  듣다: '듣다', 들어요: '듣다', 들었다: '듣다',
  나쁘다: '나쁘다', 나빴다: '나쁘다', 나빠요: '나쁘다',
  바다: '바다', 바: '바',
  study: 'study', studies: 'study',
  run: 'run', running: 'run', ran: 'run',
  better: 'good', good: 'good',
};

// want: 원래 몇 칸이어야 하는가. 같은 뜻이면 1, 다른 말이면 말의 수.
const GROUPS = [
  {name: '좋다 계열', words: ['좋다', '좋았다', '좋아요'], want: 1},
  {name: '듣다 계열', words: ['듣다', '들어요', '들었다'], want: 1},
  {name: '나쁘다 계열', words: ['나쁘다', '나빴다', '나빠요'], want: 1},
  {name: '바다 / 바', words: ['바다', '바'], want: 2, note: '바다와 바는 뜻이 다른 말입니다(바는 내가 아는 바의 바). 2칸이어야 합니다.'},
  {name: 'play 계열', words: ['play', 'plays', 'played', 'playing'], want: 1},
  {name: 'study 계열', words: ['study', 'studies'], want: 1},
  {name: 'run 계열', words: ['run', 'running', 'ran'], want: 1},
  {name: 'good / better', words: ['good', 'better'], want: 1},
];

const chip = (extra) => ({
  display: 'inline-block',
  padding: '1px 9px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  ...extra,
});

const run = (w, lemma) => (lemma && DICT[w] ? {k: DICT[w], by: '사전'} : {k: rule(w), by: '규칙'});
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);

export default function StemQuality() {
  const [lemma, setLemma] = useState(false);
  const [gi, setGi] = useState(1);
  const g = GROUPS[gi];
  const res = g.words.map((w) => ({w, ...run(w, lemma)}));
  const cells = uniq(res.map((x) => x.k)).length;
  const okOf = (grp) => uniq(grp.words.map((w) => run(w, lemma).k)).length === grp.want;
  const good = cells === g.want;
  const nOk = GROUPS.filter(okOf).length;

  return (
    <Viz
      title="같은 말이 한 칸에 모였나, 다른 말이 섞였나"
      caption="말 묶음을 고르고 방법을 바꿔 보세요. 같은 뜻의 말은 1칸으로 모여야 하고, 뜻이 다른 말은 따로 남아야 합니다. 사전은 설명용으로 적은 것이고, 사전에 없는 말은 규칙으로 자릅니다."
    >
      <Controls>
        <Btn on={!lemma} onClick={() => setLemma(false)}>
          규칙으로 끝 자르기(어간 추출)
        </Btn>
        <Btn on={lemma} onClick={() => setLemma(true)}>
          사전으로 기본형 찾기(표제어 추출)
        </Btn>
      </Controls>
      <Controls>
        {GROUPS.map((x, i) => (
          <Btn key={x.name} on={i === gi} onClick={() => setGi(i)}>
            {okOf(x) ? '✓ ' : '✗ '}
            {x.name}
          </Btn>
        ))}
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>단어</th>
            <th>얻은 칸(줄기)</th>
            <th>어떻게</th>
          </tr>
        </thead>
        <tbody>
          {res.map((x) => (
            <tr key={x.w}>
              <td>{x.w}</td>
              <td>
                <span style={chip({borderColor: 'var(--vb)'})}>{x.k}</span>
              </td>
              <td>{x.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="원래 있어야 할 칸" value={g.want} />
        <Stat label="실제 칸" value={cells} tone={good ? 'good' : 'bad'} />
        <Stat label="판정" value={good ? '맞음' : cells > g.want ? '갈라짐' : '잘못 합침'} tone={good ? 'good' : 'bad'} />
        <Stat label="맞게 처리한 묶음" value={`${nOk} / ${GROUPS.length}`} />
      </Stats>
      <Note>
        {g.note ? `${g.note} ` : ''}
        {good
          ? '이 묶음은 기대한 칸 수가 나옵니다.'
          : cells > g.want
            ? '같은 뜻인데 칸이 갈라졌습니다. 횟수가 흩어져 그 칸의 가중치를 배울 자료가 줄어듭니다.'
            : '뜻이 다른 말이 한 칸에 섞였습니다. 가중치도 섞여서 오차가 생깁니다.'}
      </Note>
    </Viz>
  );
}
