import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

// 원문의 규칙: 긴 어미부터 하나만 뗀다. (긴 것이 먼저, 같은 길이는 적은 순서)
const KO = {endings: ['았다', '아요', '었다', '어요', '다'], min: 1, mode: 'rest'};
// 영어 규칙: ing, ed, es, s 중 하나만 떼고, 줄기가 3글자 이상일 때만 자른다.
const EN = {endings: ['ing', 'ed', 'es', 's'], min: 3};
const LEMMA = {better: 'good', ran: 'run', was: 'be'};
const PRESETS = {
  ko: ['좋았다', '좋아요', '좋다', '바다', '듣다', '들어요', '들었다'],
  en: ['plays', 'played', 'playing', 'studies', 'running', 'ran', 'better'],
};

function trace(word, lang) {
  const rule = lang === 'ko' ? KO : EN;
  let hit = -1;
  const rows = rule.endings.map((e, i) => {
    const ends = word.endsWith(e);
    const rest = word.length - e.length;
    const ok = ends && (lang === 'ko' ? word.length > e.length : rest >= rule.min);
    let state = '';
    if (hit >= 0) state = '건너뜀';
    else if (ok) {
      hit = i;
      state = '뗌';
    } else if (!ends) state = '끝이 다름';
    else state = lang === 'ko' ? '남는 글자가 없음' : '줄기가 3글자보다 짧음';
    return {e, ends, rest, state, ok: hit === i && state === '뗌'};
  });
  const cut = hit >= 0 ? rule.endings[hit] : '';
  return {rows, stem: cut ? word.slice(0, word.length - cut.length) : word, cut};
}

const box = (extra) => ({
  display: 'inline-block',
  padding: '4px 12px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  fontSize: '1.15rem',
  ...extra,
});

export default function StemStepper() {
  const [lang, setLang] = useState('ko');
  const [word, setWord] = useState('좋았다');
  const w = word.trim();
  const r = w ? trace(w, lang) : null;
  const pick = (l) => {
    setLang(l);
    setWord(PRESETS[l][0]);
  };

  return (
    <Viz
      title="어미를 한 단계씩 떼어 보기"
      caption="단어를 고르거나 직접 입력하세요. 규칙은 어미를 위에서부터 차례로 맞춰 보고, 처음 맞는 것 하나만 뗍니다. 영어는 원문의 사전(표제어 추출 흉내)도 함께 보여 줍니다."
    >
      <Controls>
        <Btn on={lang === 'ko'} onClick={() => pick('ko')}>
          한국어 규칙
        </Btn>
        <Btn on={lang === 'en'} onClick={() => pick('en')}>
          영어 규칙
        </Btn>
      </Controls>
      <Controls>
        {PRESETS[lang].map((p) => (
          <Btn key={p} on={p === w} onClick={() => setWord(p)}>
            {p}
          </Btn>
        ))}
        <label className={s.ctl}>
          <span>직접 입력</span>
          <input
            type="text"
            value={word}
            maxLength={16}
            onChange={(e) => setWord(e.target.value)}
            style={{width: 120, padding: '2px 6px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)'}}
          />
        </label>
      </Controls>
      <p className={s.note}>
        어미 목록(위에서부터 시도): {(lang === 'ko' ? KO : EN).endings.join(', ')}
        {lang === 'ko' ? ' / 남는 글자가 있어야 뗍니다.' : ' / 줄기가 3글자 이상일 때만 뗍니다.'}
      </p>
      {r ? (
        <div>
          <div style={{margin: '10px 0'}}>
            <span style={box()}>
              <b>{r.stem}</b>
              {r.cut ? (
                <span style={{textDecoration: 'line-through', color: 'var(--vbad)', marginLeft: 2}}>{r.cut}</span>
              ) : null}
            </span>
            <span className={s.ts}> → 줄기 </span>
            <b style={{color: 'var(--vok)', fontSize: '1.15rem'}}>{r.stem}</b>
            {lang === 'en' ? (
              <span className={s.ts}> / 사전(표제어): {Object.prototype.hasOwnProperty.call(LEMMA, w) ? LEMMA[w] : '-'}</span>
            ) : null}
          </div>
          <table className={s.grid}>
            <thead>
              <tr>
                <th>어미</th>
                <th>단어가 이 어미로 끝나나</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map((x) => (
                <tr key={x.e}>
                  <td>{x.e}</td>
                  <td>{x.ends ? '예' : '아니오'}</td>
                  <td className={x.ok ? s.cellOn : undefined}>{x.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!r.cut ? <Note>뗄 수 있는 어미가 없어서 단어가 그대로 줄기입니다.</Note> : null}
          {w === '바다' ? <Note>명사 바다도 끝의 다를 어미로 보고 떼어 바가 됩니다. 규칙은 명사와 용언을 구별하지 못합니다.</Note> : null}
          {w === '듣다' || w === '들어요' || w === '들었다' ? (
            <Note>듣다는 듣, 들어요와 들었다는 들이 됩니다. 같은 동사가 불규칙 활용(ㄷ 불규칙) 때문에 줄기 둘로 갈라집니다.</Note>
          ) : null}
          {w === 'studies' ? <Note>studi는 영어 단어가 아니지만 괜찮습니다. 줄기는 같은 칸을 가리키는 이름이기 때문입니다.</Note> : null}
          {w === 'running' ? <Note>runn은 run과 달라집니다. ran과 better는 자를 끝이 없어서 사전이 필요합니다.</Note> : null}
        </div>
      ) : (
        <Note>단어를 입력해 보세요.</Note>
      )}
    </Viz>
  );
}
