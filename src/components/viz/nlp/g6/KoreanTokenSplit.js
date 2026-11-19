import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const PARTICLES = ['가', '는', '이', '은', '을', '를'];
const LANGS = {
  ko: {
    name: '한국어',
    sents: ['날씨가 좋다', '날씨는 좋다', '날씨 좋다', '날씨가 나쁘다'],
    base: '날씨',
    cut: (w) => {
      const l = w[w.length - 1];
      return w.length > 1 && PARTICLES.indexOf(l) >= 0 ? [w.slice(0, -1), l] : [w];
    },
    cutName: '조사 떼기 (설명용 규칙)',
  },
  en: {
    name: '영어',
    sents: ['I play', 'He plays', 'They played', 'We play'],
    base: 'play',
    cut: (w) => {
      if (w.endsWith('ed') && w.length > 4) return [w.slice(0, -2), 'ed'];
      if (w.endsWith('s') && w.length > 3) return [w.slice(0, -1), 's'];
      return [w];
    },
    cutName: '끝 떼기 (설명용 규칙)',
  },
};

export default function KoreanTokenSplit() {
  const [lang, setLang] = useState('ko');
  const [mode, setMode] = useState('space');
  const L = LANGS[lang];
  const tok = (sent) => {
    const words = sent.split(' ');
    if (mode === 'space') return words;
    if (mode === 'char') return sent.split('').filter((c) => c !== ' ');
    return words.reduce((a, w) => a.concat(L.cut(w)), []);
  };
  const rows = L.sents.map((x) => tok(x));
  const all = rows.reduce((a, r) => a.concat(r), []);
  const uniq = all.filter((v, i) => all.indexOf(v) === i);
  const baseCount = all.filter((x) => x === L.base).length;
  const avg = all.length / rows.length;

  return (
    <Viz
      title="어디를 자르느냐에 따라 표의 행이 바뀐다"
      caption="같은 네 문장을 세 가지로 잘라 보세요. 띄어쓰기로만 자르면 조사나 어미가 붙은 말이 다른 행이 됩니다. 떼기 규칙은 글의 설명을 따라 만든 간단한 설명용 규칙이고, 실제 형태소 분석이 아닙니다."
    >
      <Controls>
        {Object.keys(LANGS).map((k) => (
          <Btn key={k} on={lang === k} onClick={() => setLang(k)}>
            {LANGS[k].name}
          </Btn>
        ))}
        <span className={s.ts}>|</span>
        <Btn on={mode === 'space'} onClick={() => setMode('space')}>띄어쓰기</Btn>
        <Btn on={mode === 'cut'} onClick={() => setMode('cut')}>{L.cutName}</Btn>
        <Btn on={mode === 'char'} onClick={() => setMode('char')}>글자</Btn>
      </Controls>
      <table className={s.grid}>
        <tbody>
          {L.sents.map((sent, i) => (
            <tr key={sent}>
              <td style={{whiteSpace: 'nowrap'}}>{sent}</td>
              <td style={{textAlign: 'left'}}>
                {rows[i].map((t, j) => (
                  <span key={j} className={t === L.base ? s.cellOn : undefined} style={{display: 'inline-block', margin: '2px 3px', padding: '1px 7px', border: '1px solid var(--ifm-color-emphasis-400)', borderRadius: 5}}>
                    {t}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.note}>
        표의 행(서로 다른 토큰): {uniq.join(', ')}
      </p>
      <Stats>
        <Stat label="표의 행 수" value={String(uniq.length)} />
        <Stat label={`'${L.base}' 행에 모이는 횟수`} value={String(baseCount)} tone={baseCount >= 3 ? 'good' : 'bad'} />
        <Stat label="문장당 토큰 수 (평균)" value={String(Math.round(avg * 10) / 10)} />
      </Stats>
      <Note>
        {mode === 'space'
          ? `띄어쓰기로 자르면 ${L.base}가 한 행뿐이고, 붙은 말은 모두 다른 행입니다. 붙은 말을 한 번도 못 본 행은 비어 있습니다.`
          : mode === 'cut'
            ? `붙은 부분을 떼면 ${L.base}의 횟수가 한 행에 모입니다. 대신 떼어 낸 조각도 토큰이 되어 문장이 길어집니다.`
            : '글자로 자르면 조사만 다른 단어가 글자를 공유합니다. 대신 토큰 하나가 맡는 뜻이 작아지고 문장이 길어집니다.'}
      </Note>
    </Viz>
  );
}
