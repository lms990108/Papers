import React, {useMemo, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {makeFrame, clipHalfPlane, clipLine, num} from './geom';
import {DATASETS, trainTrace} from './perceptronCore';

const W = 380;
const H = 280;
const XR = [-1, 2.2];
const YR = [-1, 2.2];
const {X, Y} = makeFrame(W, H, XR, YR);
const wtxt = (w) => `(${num(w[0], 1)}, ${num(w[1], 1)})`;

export default function PerceptronTrain() {
  const [kind, setKind] = useState('review');
  const [lr, setLr] = useState(1);
  const [cur, setCur] = useState(0);
  const ds = DATASETS[kind].data;
  const n = ds.length;
  const trace = useMemo(() => trainTrace(ds, lr, 1000), [kind, lr]);
  const total = trace.steps.length;
  const c = Math.min(cur, total);
  const last = c > 0 ? trace.steps[c - 1] : null;
  const w = last ? last.w : [0, 0];
  const b = last ? last.b : 0;
  const ep = Math.floor((Math.max(c, 1) - 1) / n) + 1;
  const epStart = (ep - 1) * n;
  const inEp = trace.steps.slice(epStart, c);
  const mistakes = inEp.filter((r) => r.err !== 0).length;
  const finished = c >= total;
  const nextI = c % n;
  const nextX = ds[nextI][0];
  const nextS = w[0] * nextX[0] + w[1] * nextX[1] + b;

  const choose = (k) => { setKind(k); setCur(0); };
  const toEpochEnd = () => setCur(Math.min(total, c % n === 0 ? c + n : c + (n - (c % n))));
  const rect = [[XR[0], YR[0]], [XR[1], YR[0]], [XR[1], YR[1]], [XR[0], YR[1]]];
  const pos = clipHalfPlane(rect, w[0], w[1], b);
  const line = clipLine(w[0], w[1], b, XR[0], XR[1], YR[0], YR[1]);
  const rows = trace.steps.slice(Math.max(0, c - 6), c);

  let status = `${ep}번째 에포크 진행 중`;
  if (c === 0) status = '시작 전 (w = 0, b = 0)';
  if (finished && trace.done) status = `멈춤: ${trace.done}번째 에포크에 모두 맞힘`;
  if (finished && !trace.done) status = '1000번을 돌아도 멈추지 않음 (None)';

  return (
    <Viz
      title="퍼셉트론 학습 규칙을 한 건씩 따라가 봅니다"
      caption="w = (0, 0), b = 0에서 시작합니다. 틀린 건이 나올 때만 w ← w + η(t − y)x, b ← b + η(t − y)로 고칩니다. 리뷰 두 건은 본문 표와 같은 값으로 2 에포크에 멈추고, 논리곱은 6 에포크, 배타적 논리합은 멈추지 않습니다."
    >
      <Controls>
        {Object.keys(DATASETS).map((k) => (
          <Btn key={k} on={kind === k} onClick={() => choose(k)}>{DATASETS[k].name}</Btn>
        ))}
        <span className={s.ts}>학습률 η</span>
        {[0.5, 1, 2].map((v) => (
          <Btn key={v} on={lr === v} onClick={() => { setLr(v); setCur(0); }}>{v}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn onClick={() => setCur(Math.min(total, c + 1))}>한 건 진행</Btn>
        <Btn onClick={toEpochEnd}>한 바퀴(에포크)</Btn>
        <Btn onClick={() => setCur(total)}>끝까지</Btn>
        <Btn onClick={() => setCur(0)}>처음으로</Btn>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 460, margin: '0 auto'}} role="img" aria-label={`현재 가중치 ${wtxt(w)}, 바이어스 ${num(b, 1)}의 경계 직선과 학습 점`}>
        {pos.length > 2 ? <polygon points={pos.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill="var(--vb)" fillOpacity="0.13" /> : null}
        <line x1={X(XR[0])} y1={Y(0)} x2={X(XR[1])} y2={Y(0)} stroke="var(--vgrid)" />
        <line x1={X(0)} y1={Y(YR[0])} x2={X(0)} y2={Y(YR[1])} stroke="var(--vgrid)" />
        {line ? <line x1={X(line[0][0])} y1={Y(line[0][1])} x2={X(line[1][0])} y2={Y(line[1][1])} stroke="var(--ifm-font-color-base)" strokeWidth="2.5" /> : null}
        {ds.map((d, i) => {
          const isLast = last && last.i === i && !finished;
          const isNext = !finished && i === nextI;
          return (
            <g key={i}>
              {isNext ? <circle cx={X(d[0][0])} cy={Y(d[0][1])} r={20} fill="none" stroke="var(--vok)" strokeWidth="2" strokeDasharray="4 3" /> : null}
              {isLast && last.err !== 0 ? <circle cx={X(d[0][0])} cy={Y(d[0][1])} r={17} fill="none" stroke="var(--vbad)" strokeWidth="2" /> : null}
              <circle cx={X(d[0][0])} cy={Y(d[0][1])} r={12} fill={d[1] === 1 ? 'var(--vb)' : 'var(--va)'} />
              <text x={X(d[0][0])} y={Y(d[0][1]) + 5} textAnchor="middle" className={s.t} style={{fill: '#fff', fontWeight: 700}}>{d[1]}</text>
              <text x={X(d[0][0]) + 17} y={Y(d[0][1]) + (d[0][1] === 0 ? 20 : -14)} className={s.ts}>({d[0][0]}, {d[0][1]})</text>
            </g>
          );
        })}
        <text x={W - 8} y={H - 8} textAnchor="end" className={s.ts}>초록 점선: 다음에 볼 건 · 빨간 고리: 방금 고친 건</text>
        {!line ? <text x={W / 2} y={22} textAnchor="middle" className={s.ts}>w = (0, 0)이라 아직 경계가 없습니다</text> : null}
      </svg>
      <Stats>
        <Stat label="상태" value={status} tone={finished ? (trace.done ? 'good' : 'bad') : undefined} />
        <Stat label="가중치 w" value={wtxt(w)} />
        <Stat label="바이어스 b" value={num(b, 1)} />
        <Stat label="이번 에포크에 틀린 건" value={`${mistakes}`} />
      </Stats>
      {!finished ? (
        <Note>다음에 볼 건: 입력 ({nextX[0]}, {nextX[1]}), 정답 {ds[nextI][1]}. 지금 점수는 {num(nextS, 1)}이라 예측은 {nextS > 0 ? 1 : 0}입니다.{(nextS > 0 ? 1 : 0) === ds[nextI][1] ? ' 맞으므로 그대로 둡니다.' : ' 틀렸으므로 고칩니다.'}</Note>
      ) : null}
      {rows.length ? (
        <table className={s.grid}>
          <thead>
            <tr><th>순서</th><th>에포크</th><th>입력</th><th>정답</th><th>s</th><th>예측 y</th><th>t − y</th><th>새 w</th><th>새 b</th></tr>
          </thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={c - rows.length + k} className={r.err !== 0 ? s.cellOn : undefined}>
                <td>{c - rows.length + k + 1}</td><td>{r.ep}</td><td>({r.x[0]}, {r.x[1]})</td><td>{r.t}</td>
                <td>{num(r.s, 1)}</td><td>{r.y}</td><td>{r.err}</td><td>{r.err === 0 ? '그대로' : wtxt(r.w)}</td><td>{r.err === 0 ? '그대로' : num(r.b, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {lr !== 1 ? <Note>η를 바꿔도 같은 건에서 틀리고, w와 b는 η배가 될 뿐입니다. 점수의 부호가 같아서 예측도 같습니다.</Note> : null}
    </Viz>
  );
}
