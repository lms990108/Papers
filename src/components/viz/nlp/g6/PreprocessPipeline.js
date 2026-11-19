import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const SENTS = ['날씨는 좋았다', '날씨는 좋아요', '날씨는 좋다', '날씨는 나쁘다'];
const PARTICLES = ['은', '는', '이', '가', '을', '를'];
const ENDINGS = ['았다', '아요', '다'];
const STEPS = ['입력', '토큰화', '어간 추출', '불용어', '원-핫', '단어 주머니', 'TF-IDF'];

const stemOf = (t) => {
  if (PARTICLES.indexOf(t) >= 0) return t;
  for (let i = 0; i < ENDINGS.length; i += 1) {
    if (t.length > ENDINGS[i].length && t.endsWith(ENDINGS[i])) return t.slice(0, -ENDINGS[i].length);
  }
  return t;
};

function run(sent, o) {
  const words = sent.split(' ');
  const tokens = words.reduce((a, w) => {
    const l = w[w.length - 1];
    return o.cut && w.length > 1 && PARTICLES.indexOf(l) >= 0 ? a.concat([w.slice(0, -1), l]) : a.concat([w]);
  }, []);
  const stems = tokens.map((t) => (o.stem ? stemOf(t) : t));
  const kept = stems.filter((t) => !(o.stop && PARTICLES.indexOf(t) >= 0));
  return {tokens, stems, kept};
}

export default function PreprocessPipeline() {
  const [si, setSi] = useState(0);
  const [step, setStep] = useState(0);
  const [o, setO] = useState({cut: true, stem: true, stop: true});
  const flip = (k) => setO({...o, [k]: !o[k]});

  const all = SENTS.map((x) => run(x, o));
  const vocab = [];
  all.forEach((r) => r.kept.forEach((t) => vocab.indexOf(t) < 0 && vocab.push(t)));
  const cur = all[si];
  const bag = vocab.map((v) => cur.kept.filter((t) => t === v).length);
  const df = vocab.map((v) => all.filter((r) => r.kept.indexOf(v) >= 0).length);
  const idf = df.map((d) => Math.log(SENTS.length / d));
  const tf = bag.map((c) => (cur.kept.length ? c / cur.kept.length : 0));
  const tfidf = tf.map((t, i) => t * idf[i]);
  const chip = (t, j, extra) => (
    <span key={j} style={{display: 'inline-block', margin: '2px 3px', padding: '2px 9px', border: '1.5px solid var(--va)', borderRadius: 6, ...extra}}>
      {t}
    </span>
  );
  const skipped = (on, name) => (on ? null : <span className={s.ts}> ({name} 건너뜀)</span>);

  let body = null;
  if (step === 0) body = <div>{chip(SENTS[si], 0)}</div>;
  else if (step === 1) {
    body = <div>{cur.tokens.map((t, j) => chip(t, j))}{skipped(o.cut, '조사 자르기 끔: 날씨는이 한 토큰')}</div>;
  } else if (step === 2) {
    body = (
      <div>
        {cur.tokens.map((t, j) => chip(cur.stems[j] === t ? t : `${t} → ${cur.stems[j]}`, j, cur.stems[j] !== t ? {borderColor: 'var(--vb)'} : null))}
        {skipped(o.stem, '어간 추출')}
      </div>
    );
  } else if (step === 3) {
    body = (
      <div>
        {cur.stems.map((t, j) => {
          const gone = o.stop && PARTICLES.indexOf(t) >= 0;
          return chip(gone ? `${t} (지움)` : t, j, gone ? {textDecoration: 'line-through', borderColor: 'var(--vbad)', opacity: 0.6} : null);
        })}
        {skipped(o.stop, '불용어')}
      </div>
    );
  } else if (step === 4) {
    body = (
      <table className={s.grid}>
        <thead><tr><th>토큰</th>{vocab.map((v) => <th key={v}>{v}</th>)}</tr></thead>
        <tbody>
          {cur.kept.map((t, r) => (
            <tr key={r}><td>{t}</td>{vocab.map((v) => <td key={v} className={v === t ? s.cellOn : undefined}>{v === t ? 1 : 0}</td>)}</tr>
          ))}
        </tbody>
      </table>
    );
  } else if (step === 5) {
    body = (
      <table className={s.grid}>
        <thead><tr>{vocab.map((v) => <th key={v}>{v}</th>)}</tr></thead>
        <tbody><tr>{bag.map((c, i) => <td key={i} className={c ? s.cellOn : undefined}>{c}</td>)}</tr></tbody>
      </table>
    );
  } else {
    body = (
      <table className={s.grid}>
        <thead><tr><th />{vocab.map((v) => <th key={v}>{v}</th>)}</tr></thead>
        <tbody>
          <tr><td>tf (횟수/단어 수)</td>{tf.map((c, i) => <td key={i}>{fmt(c, 3)}</td>)}</tr>
          <tr><td>문서 빈도 df</td>{df.map((c, i) => <td key={i}>{c}</td>)}</tr>
          <tr><td>idf = ln(4/df)</td>{idf.map((c, i) => <td key={i}>{fmt(c, 3)}</td>)}</tr>
          <tr><td>tf × idf</td>{tfidf.map((c, i) => <td key={i} className={c > 0 ? s.cellOn : undefined}>{fmt(c, 3)}</td>)}</tr>
        </tbody>
      </table>
    );
  }

  return (
    <Viz
      title="글이 수로 바뀌는 여섯 단계"
      caption="문장 하나를 골라 단계를 넘겨 보세요. 2번과 3번은 문제에 따라 건너뛰는 단계라 끌 수 있습니다. 사전과 문서 빈도는 아래 네 문장을 코퍼스로 삼은 설명용 계산입니다. 자르기와 어간 규칙도 설명용 간단한 규칙입니다."
    >
      <Controls>
        {SENTS.map((x, i) => (
          <Btn key={x} on={si === i} onClick={() => setSi(i)}>{x}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={o.cut} onClick={() => flip('cut')}>조사를 따로 자르기</Btn>
        <Btn on={o.stem} onClick={() => flip('stem')}>어간 추출 (끝 았다·아요·다 떼기)</Btn>
        <Btn on={o.stop} onClick={() => flip('stop')}>불용어 지우기 (은 는 이 가 을 를)</Btn>
      </Controls>
      <Controls>
        <Btn onClick={() => setStep(Math.max(0, step - 1))}>이전</Btn>
        {STEPS.map((x, i) => (
          <Btn key={x} on={step === i} onClick={() => setStep(i)}>{i === 0 ? x : `${i}. ${x}`}</Btn>
        ))}
        <Btn onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}>다음</Btn>
      </Controls>
      <div style={{minHeight: 96, overflowX: 'auto'}}>{body}</div>
      <Stats>
        <Stat label="사전 크기 (행·칸 수)" value={String(vocab.length)} />
        <Stat label="이 문장의 토큰 수" value={String(cur.kept.length)} />
        <Stat label="사전" value={vocab.join(' ')} />
      </Stats>
      <Note>
        조사를 따로 자르지 않으면 불용어 목록이 날씨는을 알아보지 못합니다. 어간 추출을 켜면 좋았다, 좋아요, 좋다가 한 칸으로 모여 사전이 줄어듭니다. 모든 문서에 있는 날씨와 는은 idf가 0이라 TF-IDF에서 0이 됩니다.
      </Note>
    </Viz>
  );
}
