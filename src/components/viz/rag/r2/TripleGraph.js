import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note} from '../../Viz';
import GraphView from './GraphView';
import {TRIPLE_TEXT, KG_WIDE, parseTriples, buildGraph} from './kgToy';

const EXTRA = '이서연, 소속, 인사팀';
const MESSY = '"15일", 연차일수, 연차 규정\n김민수, 이끈다\n박지영, 이끈다, 재무팀\n인사팀, 관리한다, 연차 규정';

export default function TripleGraph() {
  const [text, setText] = useState(TRIPLE_TEXT);
  const [sel, setSel] = useState(null);
  const {triples, bad, dup} = useMemo(() => parseTriples(text), [text]);
  const {nodes, edges} = useMemo(() => buildGraph(triples), [triples]);
  const lits = nodes.filter((n) => n.lit).length;
  const cur = nodes.filter((n) => n.id === sel)[0];
  const outs = cur ? edges.filter((e) => e.s === cur.id) : [];
  const ins = cur ? edges.filter((e) => e.o === cur.id) : [];
  const name = (id) => nodes.filter((n) => n.id === id)[0].label;
  const hlEdges = {};
  outs.concat(ins).forEach((e) => {
    hlEdges[e.key] = true;
  });
  const addLine = (line) => setText((t) => (t.trim() ? `${t.replace(/\s+$/, '')}\n${line}` : line));

  return (
    <Viz
      title="세 쌍을 쓰면 그래프가 됩니다"
      caption="한 줄이 세 쌍 하나입니다. 주어, 관계, 목적어를 쉼표로 나눠 쓰고, 목적어를 따옴표로 감싸면 개체가 아니라 값이 됩니다. 노드는 끌어 옮길 수 있고, 눌러서 그 노드에 닿은 간선을 볼 수 있습니다. 이름과 값은 모두 설명용 값이고, 이 그림은 글자가 같으면 같은 노드로 칩니다."
    >
      <Controls>
        <Btn onClick={() => setText(TRIPLE_TEXT)}>사내 규정 예(6줄)</Btn>
        <Btn onClick={() => addLine(EXTRA)}>한 줄 더 붙이기</Btn>
        <Btn onClick={() => addLine(TRIPLE_TEXT.split('\n')[3])}>같은 줄 한 번 더</Btn>
        <Btn onClick={() => setText(MESSY)}>잘못된 줄 섞기</Btn>
        <Btn onClick={() => setText('')}>지우기</Btn>
      </Controls>
      <textarea
        value={text}
        rows={7}
        spellCheck={false}
        aria-label="세 쌍 입력"
        onChange={(e) => setText(e.target.value)}
        style={{width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontFamily: 'var(--ifm-font-family-monospace)', fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--ifm-font-color-base)', background: 'var(--ifm-background-color)', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8}}
      />
      {nodes.length === 0 ? (
        <Note>읽은 세 쌍이 없습니다. 위에 한 줄에 하나씩 주어, 관계, 목적어를 써 보세요.</Note>
      ) : (
        <GraphView nodes={nodes} edges={edges} uid="tg" fixed={KG_WIDE} sel={sel} onSelect={setSel} hlEdges={hlEdges} label="세 쌍으로 그린 지식 그래프" />
      )}
      <Stats>
        <Stat label="세 쌍(간선)" value={edges.length} />
        <Stat label="개체 노드" value={nodes.length - lits} />
        <Stat label="값 노드(점선)" value={lits} />
        <Stat label="읽지 못한 줄" value={bad.length} tone={bad.length ? 'bad' : undefined} />
        <Stat label="겹쳐서 뺀 줄" value={dup} />
      </Stats>
      {cur ? (
        <Note>
          {cur.label}: 나가는 간선 {outs.length}개{outs.length ? ` (${outs.map((e) => `${e.p} → ${name(e.o)}`).join(', ')})` : ''}, 들어오는 간선 {ins.length}개
          {ins.length ? ` (${ins.map((e) => `${name(e.s)} → ${e.p}`).join(', ')})` : ''}.
        </Note>
      ) : null}
      {bad.map((b) => (
        <Note key={b.n}>
          {b.n}번째 줄 읽지 못함: {b.text} ({b.why})
        </Note>
      ))}
      {dup > 0 ? <Note>같은 세 쌍을 두 번 써도 한 번만 셉니다. 세 쌍의 모음은 집합이기 때문입니다.</Note> : null}
    </Viz>
  );
}
