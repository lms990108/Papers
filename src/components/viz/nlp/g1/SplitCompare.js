import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 설명용 값: 형태소 분리는 분석기마다 다를 수 있다. 첫 문장은 원문의 예시이다.
const SENTS = [
  {t: '날씨가 좋았다', eo: ['날씨가', '좋았다'], mo: ['날씨', '가', '좋', '았', '다']},
  {t: '날씨가 좋다', eo: ['날씨가', '좋다'], mo: ['날씨', '가', '좋', '다']},
  {t: '오늘 날씨가 정말 좋았다', eo: ['오늘', '날씨가', '정말', '좋았다'], mo: ['오늘', '날씨', '가', '정말', '좋', '았', '다']},
];
const UNITS = ['어절(띄어쓰기)', '형태소', '글자', 'UTF-8 바이트'];

// 한글 한 글자는 UTF-8에서 바이트 3개이다.
const utf8 = (ch) => {
  const c = ch.charCodeAt(0);
  if (c < 0x80) return [c];
  if (c < 0x800) return [0xc0 | (c >> 6), 0x80 | (c & 63)];
  return [0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)];
};

const chip = (extra) => ({
  display: 'inline-block',
  padding: '2px 9px',
  margin: '3px 4px 3px 0',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  fontSize: '0.92rem',
  fontVariantNumeric: 'tabular-nums',
  ...extra,
});

export default function SplitCompare() {
  const [si, setSi] = useState(0);
  const [u, setU] = useState(0);
  const sent = SENTS[si];
  const chars = sent.t.split('').filter((c) => c !== ' ');
  const bytes = [];
  chars.forEach((c) => utf8(c).forEach((b) => bytes.push(b)));
  const lists = [sent.eo, sent.mo, chars, bytes];
  const toks = lists[u];
  const nChars = chars.length;
  const hasKa = (list) => list.some((t) => t === '가');

  return (
    <Viz
      title="같은 문장을 다른 단위로 자르기"
      caption="슬라이더를 오른쪽으로 밀수록 잘게 잘립니다. 토큰 수는 늘고, 토큰 하나가 맡는 글자 수는 줄어듭니다. 형태소 분리는 설명용이며 분석기마다 결과가 조금씩 다릅니다."
    >
      <Controls>
        {SENTS.map((x, i) => (
          <Btn key={x.t} on={i === si} onClick={() => setSi(i)}>
            {x.t}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="자르는 단위" min={0} max={3} value={u} onChange={setU} format={(v) => UNITS[v]} />
      </Controls>
      <div>
        {toks.map((t, i) => (
          <span key={i} style={chip(t === '가' ? {borderColor: 'var(--vb)', background: 'color-mix(in srgb, var(--vb) 18%, transparent)'} : undefined)}>
            {t}
          </span>
        ))}
      </div>
      <Stats>
        <Stat label="토큰 수" value={toks.length} />
        <Stat label="토큰당 글자 수(평균)" value={u === 3 ? '글자의 1/3' : fmt(nChars / toks.length, 2)} />
        <Stat label="조사 가가 따로 떨어졌나" value={hasKa(toks) ? '예' : u === 3 ? '바이트로 쪼개짐' : '아니오'} tone={hasKa(toks) ? 'good' : undefined} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>자르는 단위</th>
            {UNITS.map((n) => (
              <th key={n}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>토큰 수</td>
            {lists.map((l, i) => (
              <td key={i} className={i === u ? s.cellOn : undefined}>
                {l.length}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {u === 0 ? (
        <Note>
          어절로 자르면 가가 날씨에 붙어 있어서 날씨와 날씨가가 서로 다른 토큰(표의 다른 행)이 됩니다.
        </Note>
      ) : u === 3 ? (
        <Note>한글 한 글자는 바이트 3개입니다. 합쳐지지 못한 한글은 글자 하나가 토큰 여러 개로 쪼개질 수 있습니다.</Note>
      ) : (
        <Note>조사 가가 날씨에서 떨어져 나와, 날씨라는 줄기를 여러 말이 같이 씁니다.</Note>
      )}
    </Viz>
  );
}
