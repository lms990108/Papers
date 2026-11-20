import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, Stats, Stat, styles as s} from '../../Viz';

const WORDS = ['오늘', '날씨', '좋다', '나쁘다'];
const PRESETS = ['날씨 좋다', '좋다 날씨', '정말 날씨 좋다', '날씨 나쁘다 날씨', '오늘 날씨 오늘 날씨'];
const inputStyle = {
  padding: '4px 10px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
  background: 'var(--ifm-background-color)',
  color: 'var(--ifm-font-color-base)',
  fontSize: '0.9rem',
  minWidth: 220,
};

export default function BagBuilder() {
  const [text, setText] = useState('정말 날씨 좋다');
  const [unk, setUnk] = useState(false);

  const toks = text.split(/\s+/).filter(Boolean);
  const counts = WORDS.map(() => 0);
  let unkCount = 0;
  const rows = toks.map((t) => {
    const id = WORDS.indexOf(t);
    if (id >= 0) counts[id] += 1;
    else if (unk) unkCount += 1;
    return {t, id};
  });
  const dropped = rows.filter((r) => r.id < 0).length;
  const vec = unk ? counts.concat([unkCount]) : counts;

  return (
    <Viz
      title="문장을 횟수 목록으로 바꾸기"
      caption="사전은 오늘 0, 날씨 1, 좋다 2, 나쁘다 3입니다. 문장을 고르거나 직접 입력해 보세요. 띄어쓰기로 나눈 토큰마다 해당 번호의 칸에 1을 더합니다."
    >
      <Controls>
        {PRESETS.map((p) => (
          <Btn key={p} on={p === text} onClick={() => setText(p)}>
            {p}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <input
          type="text"
          value={text}
          aria-label="문장 입력"
          style={inputStyle}
          onChange={(e) => setText(e.target.value)}
        />
        <Btn on={unk} onClick={() => setUnk(!unk)}>
          사전에 없는 말을 따로 한 칸([UNK])에 세기
        </Btn>
      </Controls>

      {toks.length ? (
        <table className={s.grid}>
          <thead>
            <tr>
              <th>자리</th>
              <th>토큰</th>
              <th>사전 번호</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.t}</td>
                <td>{r.id >= 0 ? r.id : '없음'}</td>
                <td className={r.id < 0 ? s.cellOn : undefined}>
                  {r.id >= 0 ? `${WORDS[r.id]} 칸에 +1` : unk ? '[UNK] 칸에 +1' : '버려짐'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Note>문장이 비어 있습니다. 목록은 전부 0입니다.</Note>
      )}

      <table className={s.grid}>
        <thead>
          <tr>
            <th>칸</th>
            {WORDS.map((w) => (
              <th key={w}>{w}</th>
            ))}
            {unk ? <th>[UNK]</th> : null}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>횟수</td>
            {vec.map((c, i) => (
              <td key={i} className={c > 0 ? s.cellOn : undefined}>
                {c}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="횟수 목록" value={`[${vec.join(', ')}]`} />
        <Stat label="토큰 수" value={toks.length} />
        <Stat label={unk ? '[UNK]로 센 토큰' : '버려진 토큰'} value={unk ? unkCount : dropped} tone={dropped > 0 ? 'bad' : undefined} />
      </Stats>
      {dropped > 0 && !unk ? (
        <Note>사전에 없는 토큰은 칸이 없어서 목록에 흔적이 남지 않습니다. 이 목록만 보고는 그 말이 있었는지 알 수 없습니다.</Note>
      ) : null}
    </Viz>
  );
}
