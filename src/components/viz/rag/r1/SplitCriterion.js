import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note} from '../../Viz';
import {box} from './ragToy';

// 설명용 문서: 문단 3개, 문장 6개
const PARAS = [
  ['연차는 15일입니다.', '입사 첫해는 11일입니다.'],
  ['병가는 연차와 별도입니다.', '병가는 진단서를 내면 쓸 수 있습니다.'],
  ['출장비는 출장이 끝난 뒤 정산합니다.', '출장 신청은 일주일 전에 합니다.'],
];
let TEXT = '';
const SENT = [];
PARAS.forEach((p, pi) => {
  if (pi > 0) TEXT += '\n\n';
  p.forEach((t, i) => {
    if (i > 0) TEXT += ' ';
    SENT.push({a: TEXT.length, b: TEXT.length + t.length});
    TEXT += t;
  });
});
const PSTART = [];
{
  let off = 0;
  PARAS.forEach((p, pi) => {
    PSTART.push(off);
    off += p.join(' ').length + 2;
  });
}
const WSTART = [];
{
  const re = /\S+/g;
  let m = re.exec(TEXT);
  while (m) {
    WSTART.push(m.index);
    m = re.exec(TEXT);
  }
}

const CRIT = ['글자 수', '어절 수', '문장 단위', '문단(빈 줄)'];

const cutsOf = (c, n) => {
  const cuts = [];
  if (c === 0) for (let i = n; i < TEXT.length; i += n) cuts.push(i);
  if (c === 1) for (let i = n; i < WSTART.length; i += n) cuts.push(WSTART[i]);
  if (c === 2) {
    let start = SENT[0].a;
    SENT.forEach((st, i) => {
      if (i > 0 && st.b - start > n) {
        cuts.push(st.a);
        start = st.a;
      }
    });
  }
  if (c === 3) PSTART.forEach((p, i) => i > 0 && cuts.push(p));
  return cuts;
};

export default function SplitCriterion() {
  const [c, setC] = useState(0);
  const [n, setN] = useState(14);
  const cuts = cutsOf(c, n);
  const midWord = cuts.filter((p) => /\S/.test(TEXT[p - 1]) && /\S/.test(TEXT[p])).length;
  const midSent = cuts.filter((p) => SENT.some((st) => st.a < p && p < st.b)).length;
  const bounds = [0].concat(cuts, [TEXT.length]);
  const chunks = [];
  for (let i = 0; i + 1 < bounds.length; i += 1) chunks.push(TEXT.slice(bounds[i], bounds[i + 1]).trim());
  const unit = c === 0 ? '글자' : c === 1 ? '어절' : '글자 이내';

  return (
    <Viz
      title="분할 기준 비교: 어디에서 자르나"
      caption="같은 문서를 네 가지 기준으로 잘라 봅니다. 빨간 세로선은 단어나 문장 중간에서 끊긴 자리입니다. 어절을 토큰의 대신으로 쓴 설명용 그림이며, 실제 토큰 수와는 다릅니다."
    >
      <Controls>
        {CRIT.map((x, i) => (
          <Btn key={x} on={i === c} onClick={() => setC(i)}>
            {x}
          </Btn>
        ))}
      </Controls>
      <Controls>
        {c === 3 ? (
          <span style={{fontSize: '0.85rem'}}>문단 기준은 길이 한도가 없습니다. 빈 줄이 곧 분할입니다.</span>
        ) : (
          <Slider label={`한도 (${unit})`} min={c === 1 ? 1 : 5} max={c === 1 ? 12 : 60} value={n} onChange={setN} />
        )}
      </Controls>
      <div style={box({whiteSpace: 'pre-wrap', lineHeight: 1.9})}>
        {bounds.slice(0, -1).map((a, i) => {
          const seg = TEXT.slice(a, bounds[i + 1]);
          const bad = i > 0 && (SENT.some((st) => st.a < a && a < st.b) || (/\S/.test(TEXT[a - 1]) && /\S/.test(TEXT[a])));
          return (
            <span key={i}>
              {i > 0 ? (
                <span style={{color: bad ? 'var(--vbad)' : 'var(--vok)', fontWeight: 700}} aria-label={bad ? '잘못 끊긴 자리' : '깨끗한 분할'}>
                  {'│'}
                </span>
              ) : null}
              {seg}
            </span>
          );
        })}
      </div>
      <Stats>
        <Stat label="청크 수" value={`${chunks.length}개`} />
        <Stat label="단어 중간에서 끊긴 곳" value={`${midWord}곳`} tone={midWord ? 'bad' : 'good'} />
        <Stat label="문장 중간에서 끊긴 곳" value={`${midSent}곳`} tone={midSent ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {c === 0
          ? '글자 수만으로 자르면 단어 중간에서 끊길 수 있습니다.'
          : c === 1
          ? '어절 기준이면 단어는 지키지만, 한도에 따라 문장은 잘립니다. 실제 서비스에서는 어절 대신 모델이 읽는 토큰으로 셉니다.'
          : c === 2
          ? '문장을 모아 한도를 넘기 직전에 자릅니다. 한도보다 긴 문장은 혼자 한 청크가 됩니다.'
          : '문단 빈 줄 기준은 사람이 나눈 단위와 가깝습니다. 문단이 너무 길면 청크도 길어집니다.'}
      </Note>
    </Viz>
  );
}
