import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {ENT_CLASS, PARENT, RELS, ancestors, checkTriple} from './kgToy';

const SUBJ = Object.keys(ENT_CLASS);
const OBJ = SUBJ.concat(['"15일"']);
const PRESETS = [
  {label: '맞는 세 쌍', t: ['김민수', '이끈다', '인사팀']},
  {label: '주어 종류가 틀림', t: ['연차 규정', '이끈다', '인사팀']},
  {label: '목적어 종류가 틀림', t: ['인사팀', '관리한다', '김민수']},
  {label: '하위 클래스는 통과', t: ['병가 규정', '별도다', '연차 규정']},
  {label: '종류는 맞지만 사실이 틀림', t: ['인사팀', '관리한다', '출장비 정산']},
];

const sel = {padding: '3px 6px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 6, background: 'var(--ifm-background-color)', color: 'var(--ifm-font-color-base)', fontSize: '0.85rem'};
const row = (ok) => ({
  padding: '6px 10px',
  borderLeft: `5px solid ${ok ? 'var(--vok)' : 'var(--vbad)'}`,
  background: 'var(--ifm-color-emphasis-100)',
  borderRadius: 6,
  fontSize: '0.85rem',
  lineHeight: 1.55,
});

export default function OntologyCheck() {
  const [t, setT] = useState(PRESETS[1].t);
  const [mode, setMode] = useState('check');
  const [disjoint, setDisjoint] = useState(false);
  const [s0, p0, o0] = t;
  const olit = o0 === '"15일"';
  const r = checkTriple(s0, p0, olit ? '15일' : o0, olit);
  const set = (i) => (e) => setT(t.map((x, k) => (k === i ? e.target.value : x)));
  const bad = (r.domOk ? 0 : 1) + (r.ranOk ? 0 : 1);

  // 추론 모드: 정의역(domain)과 치역(range)에서 종류를 추가로 끌어낸다. 값에는 클래스를 붙이지 않는다.
  const infer = [{who: s0, known: r.sc, cls: r.rel.dom}];
  if (!olit && r.rel.ran !== '값') infer.push({who: o0, known: r.oc, cls: r.rel.ran});
  const rootOf = (c) => ancestors(c).slice(-1)[0];
  const rows = infer.map((x) => {
    const already = ancestors(x.known).indexOf(x.cls) >= 0;
    const conflict = disjoint && !already && rootOf(x.known) !== rootOf(x.cls);
    return {...x, already, conflict};
  });
  const conflicts = rows.filter((x) => x.conflict).length;

  return (
    <Viz
      title="온톨로지 제약 검사"
      caption="아래 표가 이 그림의 온톨로지입니다. 클래스와 관계는 설명용으로 만든 값입니다. 세 쌍을 고르거나 바꿔 보고, 검사 방식과 추론 방식에서 같은 세 쌍이 어떻게 다르게 다뤄지는지 보세요."
    >
      <div className={s.two}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>관계</th>
              <th>주어 종류</th>
              <th>목적어 종류</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(RELS).map((k) => (
              <tr key={k} className={k === p0 ? s.cellOn : undefined}>
                <td>{k}</td>
                <td>{RELS[k].dom}</td>
                <td>{RELS[k].ran}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>개체</th>
              <th>종류</th>
              <th>상위 클래스</th>
            </tr>
          </thead>
          <tbody>
            {SUBJ.map((k) => (
              <tr key={k} className={k === s0 || k === o0 ? s.cellOn : undefined}>
                <td>{k}</td>
                <td>{ENT_CLASS[k]}</td>
                <td>{PARENT[ENT_CLASS[k]] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Controls>
        {PRESETS.map((x) => (
          <Btn key={x.label} on={x.t.join() === t.join()} onClick={() => setT(x.t)}>
            {x.label}
          </Btn>
        ))}
      </Controls>
      <Controls>
        <label className={s.ctl}>
          <span>주어</span>
          <select style={sel} value={s0} onChange={set(0)} aria-label="주어">
            {SUBJ.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className={s.ctl}>
          <span>관계</span>
          <select style={sel} value={p0} onChange={set(1)} aria-label="관계">
            {Object.keys(RELS).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className={s.ctl}>
          <span>목적어</span>
          <select style={sel} value={o0} onChange={set(2)} aria-label="목적어">
            {OBJ.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </Controls>
      <Controls>
        <Btn on={mode === 'check'} onClick={() => setMode('check')}>검사(SHACL처럼)</Btn>
        <Btn on={mode === 'infer'} onClick={() => setMode('infer')}>추론(RDFS처럼)</Btn>
        {mode === 'infer' ? (
          <label className={s.ctl}>
            <input type="checkbox" checked={disjoint} onChange={(e) => setDisjoint(e.target.checked)} />
            <span>사람, 팀, 규정은 겹칠 수 없다고 선언(OWL)</span>
          </label>
        ) : null}
      </Controls>
      <div style={{display: 'grid', gap: 6}}>
        {mode === 'check' ? (
          <>
            <div style={row(r.domOk)}>
              주어 {s0}의 종류는 {r.sc}{ancestors(r.sc).length > 1 ? ` (상위: ${ancestors(r.sc).slice(1).join(', ')})` : ''}. 관계 {p0}가 요구하는 주어 종류는 {r.rel.dom}. {r.domOk ? '맞습니다.' : '어긋납니다.'}
            </div>
            <div style={row(r.ranOk)}>
              목적어 {olit ? '15일' : o0}의 종류는 {r.oc}{!olit && ancestors(r.oc).length > 1 ? ` (상위: ${ancestors(r.oc).slice(1).join(', ')})` : ''}. 관계 {p0}가 요구하는 목적어 종류는 {r.rel.ran}. {r.ranOk ? '맞습니다.' : '어긋납니다.'}
            </div>
          </>
        ) : (
          rows.map((x, i) => (
            <div key={i} style={row(!x.conflict)}>
              {x.already
                ? `${x.who}는 이미 ${x.cls}의 한 종류이므로 새로 알게 되는 것이 없습니다.`
                : `${p0}의 정의에 따라 ${x.who}는 ${x.cls}라고 추론됩니다. 이미 알려진 종류는 ${x.known}이지만, 추론은 두 종류를 함께 가질 수 있다고 봅니다.${x.conflict ? ' 겹칠 수 없다는 선언과 부딪혀 모순이 됩니다.' : ''}`}
            </div>
          ))
        )}
        {mode === 'infer' && olit ? <div style={row(true)}>목적어 15일은 값이라 추론할 종류가 없습니다(이 그림은 값의 형식 검사를 다루지 않습니다).</div> : null}
      </div>
      <Stats>
        <Stat label="검사 결과" value={mode === 'check' ? (bad ? `위반 ${bad}건` : '통과') : '해당 없음'} tone={mode === 'check' ? (bad ? 'bad' : 'good') : undefined} />
        <Stat label="추론 방식 결과" value={mode === 'infer' ? (conflicts ? `모순 ${conflicts}건` : '오류로 보지 않음') : '해당 없음'} tone={mode === 'infer' && conflicts ? 'bad' : undefined} />
      </Stats>
      {mode === 'check' && bad === 0 && p0 === '관리한다' && s0 === '인사팀' && o0 === '출장비 정산' ? (
        <Note>종류가 맞아서 통과했지만, 출장비 정산은 재무팀이 관리한다는 앞의 사실과 다릅니다. 제약은 종류를 볼 뿐 사실 여부는 모릅니다.</Note>
      ) : null}
      {mode === 'infer' && !disjoint && rows.some((x) => !x.already) ? (
        <Note>정의역과 치역은 오류를 찾는 규칙이 아니라 종류를 더 알아내는 규칙입니다. 오류로 드러나려면 겹칠 수 없다는 선언을 더하거나, 검사 방식을 따로 써야 합니다.</Note>
      ) : null}
    </Viz>
  );
}
