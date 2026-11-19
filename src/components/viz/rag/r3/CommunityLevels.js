import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Bar, Note, styles as s} from '../../Viz';
import GraphCanvas from './GraphCanvas';
import {LEVELS, FULL, GROUP_COLORS, ALL_NODES, globalSearch} from './graphToy';

const f = (n) => n.toLocaleString('en-US');
// 논문 Table 2(arXiv 2404.16130v2): 수준별 커뮤니티 요약 수(units)와 컨텍스트 토큰
const PAPER = {
  podcast: {
    name: '팟캐스트 대본',
    rows: [
      ['C0', 34, 26657],
      ['C1', 367, 225756],
      ['C2', 969, 565720],
      ['C3', 1310, 746100],
      ['TS(원문 청크)', 1669, 1014611],
    ],
  },
  news: {
    name: '뉴스 기사',
    rows: [
      ['C0', 55, 39770],
      ['C1', 555, 352641],
      ['C2', 1797, 980898],
      ['C3', 2142, 1140266],
      ['TS(원문 청크)', 3197, 1707694],
    ],
  },
};
const box = {padding: '8px 12px', border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, background: 'var(--ifm-background-color)', fontSize: '0.88rem', lineHeight: 1.55};

export default function CommunityLevels() {
  const [view, setView] = useState('toy');
  const [lv, setLv] = useState(1);
  const [ds, setDs] = useState('podcast');
  const L = LEVELS[lv];
  const G = globalSearch(lv);
  const colorOf = (n) => {
    const i = L.comms.findIndex((c) => c.nodes.indexOf(n) >= 0);
    return GROUP_COLORS[Math.max(0, i) % GROUP_COLORS.length];
  };
  const tagOf = (n) => {
    const c = L.comms.find((x) => x.nodes.indexOf(n) >= 0);
    return c && L.comms.length > 1 ? c.tag : '';
  };
  const P = PAPER[ds];
  const src = P.rows[P.rows.length - 1][2];

  return (
    <Viz
      title="커뮤니티 수준에 따라 요약의 범위가 달라집니다"
      caption="위쪽 버튼으로 작은 예와 논문 표를 오갑니다. 작은 예의 나눔과 요약문은 설명용 값입니다. 논문 표의 수는 Edge 외(2024, 2025년 v2) 논문 Table 2가 보고한 값입니다. C0이 가장 위 수준이고 숫자가 커질수록 잘게 나뉩니다."
    >
      <Controls>
        <Btn on={view === 'toy'} onClick={() => setView('toy')}>작은 예</Btn>
        <Btn on={view === 'paper'} onClick={() => setView('paper')}>논문 Table 2</Btn>
      </Controls>

      {view === 'toy' ? (
        <div>
          <Controls>
            {LEVELS.map((l, i) => (
              <Btn key={l.name} on={i === lv} onClick={() => setLv(i)}>
                {l.name} ({l.comms.length}개)
              </Btn>
            ))}
          </Controls>
          <GraphCanvas color={colorOf} tag={tagOf} edgeOn={(e) => G.edges.indexOf(e.id) >= 0} label={`${L.name} 수준의 커뮤니티`} />
          <div className={s.two} style={{marginTop: 8}}>
            {L.comms.map((c) => (
              <div key={c.id} style={{...box, borderColor: colorOf(c.nodes[0])}}>
                <b>{c.tag} · 개체 {c.nodes.length}개</b>
                <div>{c.summary}</div>
              </div>
            ))}
          </div>
          <Stats>
            <Stat label="요약 수" value={`${G.summaries}개`} />
            <Stat label="한 요약이 덮는 개체" value={`평균 ${(ALL_NODES.length / G.summaries).toFixed(1)}개`} />
            <Stat label="요약 안에 든 관계" value={`${G.edges.length} / ${FULL.edges.length}`} />
          </Stats>
          <Note>
            {lv === 0
              ? '요약이 하나라 전체를 훑기에는 싸지만 세부는 거의 없습니다. 이 장난감 규칙에서 점선인 관계는 하나도 없습니다.'
              : lv === 1
                ? '요약이 둘로 늘고 세부가 생깁니다. 두 커뮤니티를 가로지르는 관계(점선)는 어느 요약에도 안쪽 관계로 들지 않습니다.'
                : '요약이 넷이라 가장 세부적이지만 개수가 많아 모으는 비용도 큽니다. 점선으로 남은 관계가 더 많아졌습니다.'}
          </Note>
        </div>
      ) : (
        <div>
          <Controls>
            {Object.keys(PAPER).map((k) => (
              <Btn key={k} on={k === ds} onClick={() => setDs(k)}>{PAPER[k].name}</Btn>
            ))}
          </Controls>
          {P.rows.map((r, i) => (
            <Bar
              key={r[0]}
              label={r[0]}
              value={r[2]}
              max={src}
              color={i === P.rows.length - 1 ? 'var(--ifm-color-emphasis-500)' : GROUP_COLORS[0]}
              text={`요약 ${f(r[1])}개 · ${f(r[2])} 토큰 (${((r[2] / src) * 100).toFixed(1)}%)`}
            />
          ))}
          <Stats>
            <Stat label="C0 토큰 / 원문 토큰" value={`${((P.rows[0][2] / src) * 100).toFixed(1)}%`} tone="good" />
            <Stat label="원문은 C0의 몇 배" value={`${(src / P.rows[0][2]).toFixed(1)}배`} />
            <Stat label="C3 토큰 / 원문 토큰" value={`${((P.rows[3][2] / src) * 100).toFixed(1)}%`} />
          </Stats>
          <Note>논문이 보고한 값입니다. 막대는 원문 청크 전체를 100%로 둔 컨텍스트 토큰입니다. 수준이 낮을수록(C3) 요약이 많고 토큰이 늘어납니다.</Note>
        </div>
      )}
    </Viz>
  );
}
