import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note} from '../../Viz';
import GraphCanvas from './GraphCanvas';
import {FULL, ALL_NODES, LEVELS, GROUP_COLORS, insideEdges} from './graphToy';

const LETTERS = 'ABCDEFGHIJ';
const example = () => {
  const a = {};
  LEVELS[1].comms.forEach((c, i) => c.nodes.forEach((n) => (a[n] = i)));
  return a;
};
const allOne = () => {
  const a = {};
  ALL_NODES.forEach((n) => (a[n] = 0));
  return a;
};
const singles = () => {
  const a = {};
  ALL_NODES.forEach((n, i) => (a[n] = i));
  return a;
};

export default function CommunityGroups() {
  const [assign, setAssign] = useState(example);
  const inside = insideEdges(assign);
  const cross = FULL.edges.length - inside.length;
  const sizes = {};
  ALL_NODES.forEach((n) => {
    sizes[assign[n]] = (sizes[assign[n]] || 0) + 1;
  });
  const groups = Object.keys(sizes).length;
  const biggest = Math.max.apply(null, Object.keys(sizes).map((k) => sizes[k]));
  const toggle = (node) => {
    const next = {...assign};
    const keys = Object.keys(sizes);
    const cur = assign[node];
    const idx = keys.indexOf(String(cur));
    next[node] = keys.length === 1 ? (cur + 1) % LETTERS.length : Number(keys[(idx + 1) % keys.length]);
    setAssign(next);
  };
  const msg =
    groups === 1
      ? '전부 한 그룹이면 안쪽 관계가 12개로 최대지만, 요약 하나가 개체 10개를 모두 뭉뚱그립니다. 나눈 의미가 없습니다.'
      : groups === ALL_NODES.length
        ? '개체마다 한 그룹이면 안쪽 관계가 0개입니다. 요약이 이웃 관계를 하나도 담지 못합니다.'
        : cross === 0
          ? '가로지르는 관계가 없습니다.'
          : `가로지르는 관계가 ${cross}개입니다. 그룹 사이를 잇는 이 관계들은 같은 커뮤니티 요약 안에 들어가지 않습니다.`;

  return (
    <Viz
      title="커뮤니티 나누기: 안쪽 관계와 가로지르는 관계"
      caption="노드를 누르면 그룹이 바뀝니다. 개체, 관계, 예시 분할(A, B)은 설명용 값입니다. 안쪽 관계는 양 끝이 같은 그룹인 관계, 가로지르는 관계는 양 끝이 다른 그룹인 관계이고, 가로지르는 관계는 점선으로 그려집니다. 안쪽 관계 수는 이 그림의 이해를 돕는 단순한 숫자이고, 실제 Leiden 알고리즘이 최적화하는 값은 아닙니다."
    >
      <Controls>
        <Btn onClick={() => setAssign(example())}>예시 분할(A, B)</Btn>
        <Btn onClick={() => setAssign(allOne())}>전부 한 그룹</Btn>
        <Btn onClick={() => setAssign(singles())}>개체마다 한 그룹</Btn>
      </Controls>
      <GraphCanvas
        color={(n) => GROUP_COLORS[assign[n] % GROUP_COLORS.length]}
        tag={(n) => LETTERS[assign[n]]}
        edgeOn={(e) => assign[e.a] === assign[e.b]}
        onNode={toggle}
        label="노드를 눌러 그룹을 바꾸는 그래프"
      />
      <Stats>
        <Stat label="그룹 수" value={`${groups}개`} />
        <Stat label="안쪽 관계" value={`${inside.length} / ${FULL.edges.length}`} tone={inside.length >= 10 && groups > 1 ? 'good' : undefined} />
        <Stat label="가로지르는 관계" value={`${cross}개`} tone={cross > 0 ? 'bad' : undefined} />
        <Stat label="가장 큰 그룹" value={`${biggest}개`} />
      </Stats>
      <Note>{msg}</Note>
    </Viz>
  );
}
