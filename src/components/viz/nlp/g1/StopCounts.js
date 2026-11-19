import React, {useState} from 'react';
import {Viz, Controls, Btn, Slider, Stats, Stat, Note, Bar, fmt, styles as s} from '../../Viz';

const DOCS = ['날씨 는 좋다', '날씨 는 나쁘다', '오늘 날씨 는 좋다', '오늘 날씨 좋다'];
const N = DOCS.length;
const SORTED = DOCS.reduce((acc, d) => acc.concat(d.split(' ')), []).filter((t, i, a) => a.indexOf(t) === i).sort();
const df = (v) => DOCS.filter((d) => d.split(' ').indexOf(v) >= 0).length;
const SIGNAL = ['좋다', '나쁘다'];
const BASIC = ['는', '가', '은', '이'];

const byThreshold = (t) => SORTED.filter((v) => df(v) / N >= t);

export default function StopCounts() {
  const [stop, setStop] = useState(BASIC);
  const [th, setTh] = useState(1.25);

  const set = (list) => setStop(list);
  const toggle = (v) => setStop(stop.indexOf(v) >= 0 ? stop.filter((x) => x !== v) : stop.concat([v]));
  const kept = SORTED.filter((v) => stop.indexOf(v) < 0);
  const docs = DOCS.map((d) => d.split(' ').filter((t) => stop.indexOf(t) < 0));
  const nTok = docs.reduce((a, d) => a + d.length, 0);
  const lostSignal = SIGNAL.filter((v) => stop.indexOf(v) >= 0);

  return (
    <Viz
      title="불용어 목록을 정하고 남는 칸 보기"
      caption="단어를 눌러 불용어로 넣거나 빼고, 슬라이더로 문서 빈도 임계값을 정해 자동으로 목록을 만들어 보세요. 문서 네 개는 원문의 예입니다."
    >
      <Controls>
        <Btn on={stop.length === 0} onClick={() => set([])}>
          목록 없음
        </Btn>
        <Btn on={stop.slice().sort().join() === BASIC.slice().sort().join()} onClick={() => set(BASIC)}>
          조사 목록(는, 가, 은, 이)
        </Btn>
        <Slider
          label="문서 빈도 ≥"
          min={0.25}
          max={1.25}
          step={0.25}
          value={th}
          onChange={(v) => {
            setTh(v);
            set(byThreshold(v));
          }}
          format={(v) => (v > 1 ? '끄기' : fmt(v, 2))}
        />
      </Controls>
      <div className={s.title}>단어를 눌러 불용어로 지정 (문서 빈도 = 그 단어가 있는 문서 수 / 4)</div>
      {SORTED.map((v) => {
        const off = stop.indexOf(v) >= 0;
        return (
          <div key={v} style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr)'}}>
            <button
              type="button"
              onClick={() => toggle(v)}
              style={{all: 'unset', cursor: 'pointer', display: 'block', textDecoration: off ? 'line-through' : 'none', opacity: off ? 0.7 : 1}}
              aria-pressed={off}
            >
              <Bar
                label={`${v}${off ? ' (지움)' : ''}`}
                value={df(v)}
                max={N}
                color={off ? 'var(--vbad)' : 'var(--va)'}
                text={`${df(v)}/${N} = ${fmt(df(v) / N, 2)}`}
              />
            </button>
          </div>
        );
      })}
      <table className={s.grid}>
        <thead>
          <tr>
            <th>문서</th>
            {kept.map((v) => (
              <th key={v}>{v}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DOCS.map((d, i) => (
            <tr key={d}>
              <td>{d}</td>
              {kept.map((v) => (
                <td key={v}>{docs[i].indexOf(v) >= 0 ? 1 : 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="남은 칸 수" value={`${kept.length} / ${SORTED.length}`} />
        <Stat label="남은 토큰 수" value={`${nTok} / 13`} />
        <Stat label="신호 단어(좋다, 나쁘다)" value={lostSignal.length ? `${lostSignal.join(', ')} 지워짐` : '모두 남음'} tone={lostSignal.length ? 'bad' : 'good'} />
      </Stats>
      <Note>
        {lostSignal.length
          ? '레이블을 가르는 신호 단어까지 지워졌습니다. 문서 빈도만으로 정한 목록은 이처럼 신호 단어를 같이 지울 수 있습니다.'
          : stop.length
            ? '남은 칸이 줄었고, 좋다와 나쁘다는 그대로입니다.'
            : '목록이 없으면 칸 5개가 모두 남습니다.'}
      </Note>
    </Viz>
  );
}
