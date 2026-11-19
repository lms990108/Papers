import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import LatticeSvg from './LatticeSvg';
import {PEN0, ARC_KEYS, SPAN_NAME, listPaths, bestPath, arcId} from './util';

const TARGETS = ['41', '11', '111'];

export default function ForcedAlignment() {
  const [target, setTarget] = useState('41');
  const nodes = [0, 1, 2, 3];
  const every = listPaths(PEN0, nodes, ['1', '4']);
  const right = every.filter((p) => p.label === target).sort((a, b) => a.cost - b.cost);
  const best = bestPath(right);
  const free = bestPath(every);
  const usedIds = {};
  right.forEach((p) =>
    p.arcs.forEach((a) => {
      usedIds[arcId(a[0], a[1])] = true;
    }),
  );
  const bestIds = {};
  best.arcs.forEach((a) => {
    bestIds[arcId(a[0], a[1])] = true;
  });

  const arcs = ARC_KEYS.filter((k) => usedIds[arcId(k, '1')] || usedIds[arcId(k, '4')]).map((k) => ({
    key: k,
    on: !!(bestIds[arcId(k, '1')] || bestIds[arcId(k, '4')]),
    lines: [{text: SPAN_NAME[k]}].concat(
      ['1', '4']
        .filter((l) => usedIds[arcId(k, l)])
        .map((l) => ({text: `${l} · ${PEN0[k][l]}`, on: !!bestIds[arcId(k, l)]})),
    ),
  }));

  return (
    <Viz
      title="정답 문자열만 알 때: 강제 정렬"
      caption="정답 라벨을 고르면 그 라벨을 내는 호만 남깁니다. 남은 경로 중 가장 싼 것이 강제 정렬이고, 사람이 경계를 알려 주지 않아도 어디서 잘렸는지가 나옵니다. 문법 뒤(숫자만) 격자이고 값은 원본 표입니다."
    >
      <Controls>
        {TARGETS.map((t) => (
          <Btn key={t} on={t === target} onClick={() => setTarget(t)}>
            정답 “{t}”
          </Btn>
        ))}
      </Controls>
      <LatticeSvg arcs={arcs} label="정답 라벨과 맞는 호만 남긴 격자. 굵은 호가 가장 싼 경로입니다." />
      <table className={s.grid}>
        <thead>
          <tr>
            <th>정답과 맞는 경로</th>
            <th>비용</th>
          </tr>
        </thead>
        <tbody>
          {right.map((p, i) => (
            <tr key={i}>
              <td className={i === 0 ? s.cellOn : undefined}>{p.arcs.map((a) => `${a[0].replace('-', '→')}의 ${a[1]}`).join(', ')}</td>
              <td className={i === 0 ? s.cellOn : undefined}>
                {p.arcs.map((a) => PEN0[a[0]][a[1]]).join(' + ')} = {fmt(p.cost, 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="정답 경로 수" value={right.length} />
        <Stat label="정답 쪽 최소 비용" value={fmt(best.cost, 1)} />
        <Stat label="제약 없는 최소 비용" value={`${fmt(free.cost, 1)} (“${free.label}”)`} />
      </Stats>
      <Note>
        {best.label === free.label && Math.abs(best.cost - free.cost) < 1e-9
          ? '정답 쪽 최소 경로가 제약 없는 최소 경로와 같습니다. 같은 문자열을 내는 경로가 둘인 것이 보입니다. 이 정답 경로의 비용이 오차의 한 항이 됩니다.'
          : '정답 쪽 최소 경로가 제약 없는 최소 경로보다 비쌉니다. 이 둘의 차이가 GTN이 말하는 오차이고, 다음 글에서 같은 격자로 계산합니다.'}
      </Note>
    </Viz>
  );
}
