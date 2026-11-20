import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, fmt, styles as s} from '../../Viz';
import LatticeSvg from './LatticeSvg';
import {PEN0, ARC_KEYS, LABELS, LABEL_NAME, SPAN_NAME, listPaths, arcId} from './util';

const STAGES = [
  {name: '분할 그래프', allowed: ['1']},
  {name: '인식 그래프', allowed: LABELS},
  {name: '문법 뒤(제약 없음)', allowed: ['1', '4']},
  {name: '정답만 남김(제약)', allowed: ['1', '4']},
];
const BOX = ['분할 그래프', '문자 벌점', '문법', '정답 라벨만 남김'];
const TARGETS = ['11', '41', '111'];

function stageInfo(i, target) {
  const nodes = [0, 1, 2, 3];
  let paths = listPaths(PEN0, nodes, STAGES[i].allowed);
  if (i === 3) paths = paths.filter((p) => p.label === target);
  const used = {};
  paths.forEach((p) =>
    p.arcs.forEach((a) => {
      used[arcId(a[0], a[1])] = true;
    }),
  );
  let arcs;
  if (i === 0) arcs = ARC_KEYS.length;
  else if (i === 3) arcs = Object.keys(used).length;
  else arcs = ARC_KEYS.length * STAGES[i].allowed.length;
  return {arcs, paths: paths.length, used};
}

export default function ModuleChain() {
  const [stage, setStage] = useState(1);
  const [target, setTarget] = useState('11');
  const info = STAGES.map((_, i) => stageInfo(i, target));
  const cur = info[stage];

  const arcs = ARC_KEYS.map((k) => {
    let labs = STAGES[stage].allowed;
    if (stage === 3) labs = labs.filter((l) => cur.used[arcId(k, l)]);
    if (stage === 0) return {key: k, lines: [{text: SPAN_NAME[k]}]};
    if (!labs.length) return null;
    return {
      key: k,
      lines: [{text: SPAN_NAME[k]}].concat(labs.map((l) => ({text: `${LABEL_NAME[l]} · ${PEN0[k][l]}`}))),
      on: stage === 3,
    };
  }).filter(Boolean);

  return (
    <Viz
      title="그래프가 모듈을 지나며 바뀌는 모양"
      caption="단계를 눌러 보세요. 모듈 사이로 오가는 것은 벡터가 아니라 그래프입니다. 단계마다 호와 경로의 수가 달라집니다. 동그라미 0~3은 절단 위치이고, 호 옆의 ‘라벨 · 숫자’에서 숫자는 그 라벨의 벌점(작을수록 그럴듯함)입니다. 값은 과분할 페이지의 “41” 격자(조각 3개)입니다."
    >
      <svg viewBox="0 0 640 72" className={s.svg} role="img" aria-label="분할 그래프, 문자 벌점, 문법, 정답 라벨만 남김 상자가 차례로 이어진 모듈 사슬">
        {BOX.map((b, i) => {
          const x = 8 + i * 158;
          const on = i === stage || (i === 2 && stage === 3);
          return (
            <g key={b}>
              <rect
                x={x} y={14} width={120} height={44} rx={6}
                fill={i === stage ? 'color-mix(in srgb, var(--vb) 22%, transparent)' : 'var(--ifm-background-color)'}
                stroke={on ? 'var(--vb)' : 'var(--ifm-color-emphasis-500)'}
                strokeWidth={i === stage ? 2.5 : 1.3}
                strokeDasharray={i === 3 ? '5 3' : undefined}
              />
              <text x={x + 60} y={41} textAnchor="middle" className={s.t}>{b}</text>
              {i < 3 ? <path d={`M ${x + 122},36 L ${x + 154},36 m -7,-5 l 7,5 l -7,5`} fill="none" stroke="var(--ifm-font-color-base)" strokeWidth={1.5} /> : null}
            </g>
          );
        })}
      </svg>
      <Controls>
        {STAGES.map((st, i) => (
          <Btn key={st.name} on={i === stage} onClick={() => setStage(i)}>{i + 1}. {st.name}</Btn>
        ))}
      </Controls>
      {stage === 3 ? (
        <Controls>
          {TARGETS.map((t) => (
            <Btn key={t} on={t === target} onClick={() => setTarget(t)}>정답 “{t}”</Btn>
          ))}
        </Controls>
      ) : null}
      <LatticeSvg arcs={arcs} label={`${STAGES[stage].name} 단계의 격자. 호 ${cur.arcs}개, 경로 ${cur.paths}개.`} />
      <table className={s.grid}>
        <thead>
          <tr><th>단계</th><th>호 수</th><th>경로 수</th><th>내용</th></tr>
        </thead>
        <tbody>
          {STAGES.map((st, i) => (
            <tr key={st.name}>
              <td className={i === stage ? s.cellOn : undefined}>{st.name.replace('(', ' (')}{i === 3 ? ` “${target}”` : ''}</td>
              <td className={i === stage ? s.cellOn : undefined}>{info[i].arcs}</td>
              <td className={i === stage ? s.cellOn : undefined}>{info[i].paths}</td>
              <td className={i === stage ? s.cellOn : undefined}>
                {['조각 단위 분할 3가지', '호마다 클래스 3개의 벌점', '쓰레기 호 제거', `라벨이 ${target.split('').join(', ')}인 경로만`][i]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        {stage === 3
          ? `정답이 “${target}”이면 그 라벨을 내는 호만 남습니다. 정답 그래프의 경로는 제약 없는 그래프(${info[2].paths}개)의 부분집합입니다.`
          : `지금 단계: 호 ${cur.arcs}개, 경로 ${cur.paths}개. 입력마다 그래프 모양이 달라도 됩니다. 글자 수가 다르면 노드 수가 달라지는 것이 고정 길이 벡터와 다릅니다.`}
      </Note>
    </Viz>
  );
}
