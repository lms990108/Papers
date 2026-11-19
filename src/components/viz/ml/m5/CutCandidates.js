import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import LatticeSvg from './LatticeSvg';
import {PEN0, ARC_KEYS, SPAN_NAME, listPaths, bestPath} from './util';

const X = (n) => 80 + 160 * n;

export default function CutCandidates() {
  const [has, setHas] = useState({1: true, 2: true});
  const nodes = [0].concat(has[1] ? [1] : [], has[2] ? [2] : [], [3]);

  const arcs = ARC_KEYS.filter((k) => {
    const [a, b] = k.split('-').map(Number);
    return nodes.indexOf(a) >= 0 && nodes.indexOf(b) >= 0;
  });
  const all = listPaths(PEN0, nodes, ['1', '4']);
  const segs = listPaths(PEN0, nodes, ['1']).length;
  const best = bestPath(all);
  const onKeys = best ? best.arcs.map((a) => a[0]) : [];
  const onLab = {};
  if (best) best.arcs.forEach((a) => { onLab[a[0]] = a[1]; });

  const latticeArcs = arcs.map((k) => ({
    key: k,
    on: onKeys.indexOf(k) >= 0,
    lines: [
      {text: SPAN_NAME[k]},
      {text: `1 · ${PEN0[k]['1']}`, on: onLab[k] === '1'},
      {text: `4 · ${PEN0[k]['4']}`, on: onLab[k] === '4'},
    ],
  }));

  const toggle = (n) => setHas({...has, [n]: !has[n]});
  const missing = (n) => !has[n];

  return (
    <Viz
      title="후보 절단점을 켜고 꺼 보기"
      caption="'41'이 붙은 영상에 후보 절단점이 네 개(0, 1, 2, 3) 있습니다. 가운데 두 절단점을 끄면 그 자리로는 자를 수 없게 됩니다. 호 옆의 숫자는 인식기의 벌점입니다(원본 표의 값)."
    >
      <Controls>
        <Btn on={has[1]} onClick={() => toggle(1)}>절단점 1 {has[1] ? '켬' : '끔'}</Btn>
        <Btn on={has[2]} onClick={() => toggle(2)}>절단점 2 {has[2] ? '켬' : '끔'}</Btn>
        <Btn onClick={() => setHas({1: true, 2: true})}>모두 켜기</Btn>
      </Controls>
      <svg viewBox="0 0 640 80" className={s.svg} role="img" aria-label="붙여 쓴 잉크를 세 조각으로 나눈 그림. 세로 점선이 후보 절단점입니다.">
        <rect x={X(0)} y={26} width={X(3) - X(0)} height={24} fill="var(--ifm-color-emphasis-200)" stroke="var(--ifm-color-emphasis-600)" />
        {[0, 1, 2].map((i) => (
          <text key={i} x={(X(i) + X(i + 1)) / 2} y={43} textAnchor="middle" className={s.ts}>
            {['조각 1 (4의 왼쪽 획)', '조각 2 (4의 나머지)', '조각 3 (1)'][i]}
          </text>
        ))}
        {[0, 1, 2, 3].map((n) => {
          const on = nodes.indexOf(n) >= 0;
          return (
            <g key={n}>
              <line x1={X(n)} y1={14} x2={X(n)} y2={62} stroke={on ? 'var(--ifm-font-color-base)' : 'var(--ifm-color-emphasis-400)'} strokeDasharray="4 3" strokeWidth={on ? 1.8 : 1} />
              <text x={X(n)} y={76} textAnchor="middle" className={s.ts} opacity={on ? 1 : 0.5}>{on ? `절단 ${n}` : `절단 ${n} (없음)`}</text>
            </g>
          );
        })}
      </svg>
      <LatticeSvg nodes={nodes} arcs={latticeArcs} label="후보 절단점에서 만든 격자. 굵은 호가 숫자만 읽을 때 가장 싼 경로입니다." />
      <Stats>
        <Stat label="호 수" value={arcs.length} />
        <Stat label="분할 수" value={segs} />
        <Stat label="숫자 경로 수(라벨 포함)" value={all.length} />
        <Stat
          label="숫자만 읽을 때 최적"
          value={best ? `“${best.label}” ${fmt(best.cost, 1)}` : '경로 없음'}
          tone={best ? (best.label === '41' ? 'good' : 'bad') : 'bad'}
        />
      </Stats>
      <Note>
        {best
          ? missing(2)
            ? '4와 1 사이의 경계인 절단점 2가 없으니 “41”이 나올 길이 없습니다. 점수가 아무리 좋아도 후보에 없는 분할은 고를 수 없습니다.'
            : missing(1)
              ? '절단점 1이 없어도 맞는 경계(절단점 2)가 있으니 “41”이 그대로 나옵니다. 틀린 후보는 줄었을 뿐입니다.'
              : '후보를 넉넉하게 두면 맞는 경계가 그 안에 들어 있습니다. 어느 호를 쓸지는 점수가 정합니다.'
          : '두 절단점이 모두 없으면 0에서 3까지 가는 호가 없습니다. 후보가 너무 적어 읽을 수 없는 경우입니다.'}
      </Note>
    </Viz>
  );
}
