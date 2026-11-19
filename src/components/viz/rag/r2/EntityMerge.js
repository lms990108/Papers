import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import GraphView from './GraphView';
import {ALIAS_TEXT, EXTRACTED, mergeMentions, mentionSpots} from './kgToy';

const LEVELS = [
  {label: '합치지 않음', d: '이름 하나하나가 모두 다른 노드입니다.'},
  {label: '글자가 같으면', d: '글자가 똑같은 이름만 한 노드로 합칩니다.'},
  {label: '공백을 정리해서', d: '공백과 대소문자를 무시하고 비교합니다.'},
  {label: '별칭 표까지', d: `별칭 표를 더합니다: ${ALIAS_TEXT}.`},
];

export default function EntityMerge() {
  const [level, setLevel] = useState(0);
  const [guard, setGuard] = useState(false);
  const r = useMemo(() => mergeMentions(level, guard), [level, guard]);
  const spots = useMemo(() => mentionSpots(), []);
  const fixed = {};
  r.nodes.forEach((n) => {
    const m = n.members.length;
    fixed[n.id] = [n.members.reduce((a, x) => a + spots[x.i][0], 0) / m, n.members.reduce((a, x) => a + spots[x.i][1], 0) / m];
  });
  const nodes = r.nodes.map((n) => ({...n, tag: n.mixed ? '동명이인 섞임' : n.members.length > 1 ? `이름 ${n.members.length}개` : ''}));
  const hlEdges = {};
  r.pathEdges.forEach((k) => {
    hlEdges[k] = true;
  });
  const found = r.people.length > 0;

  return (
    <Viz
      title="같은 개체를 한 노드로 합치기"
      caption="표의 세 쌍 6개는 서로 다른 청크에서 뽑았다고 가정한 설명용 값입니다. 정답은 인사팀을 가리키는 이름 4개가 한 개체이고, 인사팀 팀장을 가리키는 이름 3개가 한 사람이며, 개발팀의 김민수는 다른 사람입니다. 주황색 간선이 질문 연차 규정을 관리하는 팀의 팀장은 누구인가요에 답하는 길입니다."
    >
      <Controls>
        {LEVELS.map((l, i) => (
          <Btn key={l.label} on={i === level} onClick={() => setLevel(i)}>
            {l.label}
          </Btn>
        ))}
        <label className={s.ctl}>
          <input type="checkbox" checked={guard} onChange={(e) => setGuard(e.target.checked)} />
          <span>같은 청크의 팀이 다르면 합치지 않기(문맥)</span>
        </label>
      </Controls>
      <div className={s.two}>
        <table className={s.grid}>
          <thead>
            <tr>
              <th>청크</th>
              <th>뽑힌 세 쌍</th>
            </tr>
          </thead>
          <tbody>
            {EXTRACTED.map((x) => (
              <tr key={x.id}>
                <td>{x.id}</td>
                <td style={{textAlign: 'left'}}>
                  ({x.s}, {x.p}, {x.olit ? `"${x.o}"` : x.o})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <GraphView nodes={nodes} edges={r.edges} uid="em" W={420} H={340} fixed={fixed} hlEdges={hlEdges} label="이름을 합친 뒤의 그래프" />
      </div>
      <Stats>
        <Stat label="노드 수" value={r.nodes.length} />
        <Stat label="맞게 합친 쌍" value={`${r.good} / ${r.goldPairs}`} tone={r.good === r.goldPairs ? 'good' : undefined} />
        <Stat label="잘못 합친 쌍" value={r.wrong} tone={r.wrong ? 'bad' : 'good'} />
        <Stat label="질문의 답" value={found ? r.people.join(', ') : '길이 끊김'} tone={found ? 'good' : 'bad'} />
      </Stats>
      <Note>
        {LEVELS[level].d}{' '}
        {!found ? '연차 규정에서 인사팀으로, 인사팀에서 팀장으로 가는 길이 서로 다른 이름의 노드에서 끊겼습니다.' : ''}
        {r.wrong > 0 ? ' 김민수라는 같은 글자가 서로 다른 두 사람을 한 노드로 묶었습니다. 이런 오류는 그래프에 틀린 간선으로 남습니다.' : ''}
        {level === 3 && guard && r.wrong === 0 ? ' 이 작은 예에서는 모두 맞게 합쳐졌지만, 실제 데이터에서는 이름 규칙과 문맥만으로 완벽하게 가려내기가 어렵습니다.' : ''}
      </Note>
    </Viz>
  );
}
