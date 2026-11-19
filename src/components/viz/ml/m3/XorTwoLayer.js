import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {makeFrame, num} from './geom';

const PTS = [[0, 0], [1, 0], [0, 1], [1, 1]];
const XOR = [0, 1, 1, 0];
const st = (v) => (v > 0 ? 1 : 0);
const W = 240;
const H = 200;
const F = makeFrame(W, H, [-0.5, 1.5], [-0.5, 1.5], {l: 24, r: 10, t: 10, b: 22});

function Plane({pts, sel, label, line}) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} style={{maxWidth: 340}} role="img" aria-label={label}>
      <line x1={F.X(-0.5)} y1={F.Y(0)} x2={F.X(1.5)} y2={F.Y(0)} stroke="var(--vgrid)" />
      <line x1={F.X(0)} y1={F.Y(-0.5)} x2={F.X(0)} y2={F.Y(1.5)} stroke="var(--vgrid)" />
      {line !== undefined ? <line x1={F.X(-0.5)} y1={F.Y(-0.5 + line)} x2={F.X(1.5)} y2={F.Y(1.5 + line)} stroke="var(--ifm-font-color-base)" strokeWidth="2" /> : null}
      {pts.map((p, i) => {
        const x = F.X(p[0]);
        const y = F.Y(p[1]);
        return (
          <g key={i}>
            {i === sel ? <circle cx={x} cy={y} r={19} fill="none" stroke="var(--vok)" strokeWidth="2.5" /> : null}
            <circle cx={x} cy={y} r={13 - (pts.filter((q, k) => k < i && q[0] === p[0] && q[1] === p[1]).length ? 4 : 0)} fill={XOR[i] === 1 ? 'var(--vb)' : 'var(--va)'} />
            <text x={x} y={y + 5} textAnchor="middle" className={s.t} style={{fill: '#fff', fontWeight: 700}}>{XOR[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function XorTwoLayer() {
  const [sel, setSel] = useState(1);
  const [c1, setC1] = useState(-0.5);
  const [c2, setC2] = useState(-1.5);
  const [c3, setC3] = useState(-0.5);
  const rows = PTS.map((p) => {
    const h1 = st(p[0] + p[1] + c1);
    const h2 = st(p[0] + p[1] + c2);
    const z = h1 - h2 + c3;
    return {h1, h2, z, y: st(z)};
  });
  const ok = rows.filter((r, i) => r.y === XOR[i]).length;
  const r = rows[sel];
  const same = rows[1].h1 === rows[2].h1 && rows[1].h2 === rows[2].h2;
  // h1 - h2 + c3 = 0 직선: h2 = h1 + c3
  return (
    <Viz
      title="칸을 두 단계로 쌓으면 배타적 논리합이 풀립니다"
      caption="입력을 하나 고르고 세 문턱을 움직여 보세요. 첫 단계(h₁, h₂)가 네 점을 새 평면으로 옮기고, 둘째 단계가 그 평면에서 직선 하나로 가릅니다. 기본값은 본문과 같은 −0.5, −1.5, −0.5입니다."
    >
      <Controls>
        {PTS.map((p, i) => (
          <Btn key={i} on={sel === i} onClick={() => setSel(i)}>입력 ({p[0]}, {p[1]})</Btn>
        ))}
      </Controls>
      <Controls>
        <Slider label="h₁ 문턱: x₁+x₂+" min={-2.5} max={0.5} step={0.25} value={c1} onChange={setC1} format={(v) => num(v, 2)} />
        <Slider label="h₂ 문턱: x₁+x₂+" min={-2.5} max={0.5} step={0.25} value={c2} onChange={setC2} format={(v) => num(v, 2)} />
        <Slider label="출력: h₁−h₂+" min={-1.5} max={1.5} step={0.25} value={c3} onChange={setC3} format={(v) => num(v, 2)} />
        <Btn onClick={() => { setC1(-0.5); setC2(-1.5); setC3(-0.5); }}>본문 값</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.ts}>입력 평면 (x₁, x₂)</div>
          <Plane pts={PTS} sel={sel} label="입력 평면의 네 점: 대각선의 두 점이 같은 답" />
        </div>
        <div>
          <div className={s.ts}>첫 단계가 옮긴 평면 (h₁, h₂)와 둘째 단계의 직선</div>
          <Plane pts={rows.map((q) => [q.h1, q.h2])} sel={sel} line={c3} label="옮긴 평면의 점과 직선 h1 - h2 + 상수 = 0" />
        </div>
      </div>
      <table className={s.grid}>
        <thead>
          <tr><th>x₁</th><th>x₂</th><th>h₁</th><th>h₂</th><th>h₁ − h₂ {c3 < 0 ? '−' : '+'} {num(Math.abs(c3), 2)}</th><th>y</th><th>XOR</th></tr>
        </thead>
        <tbody>
          {PTS.map((p, i) => (
            <tr key={i} className={sel === i ? s.cellOn : undefined}>
              <td>{p[0]}</td><td>{p[1]}</td><td>{rows[i].h1}</td><td>{rows[i].h2}</td>
              <td>{num(rows[i].z, 2)}</td><td>{rows[i].y}</td><td>{XOR[i]}{rows[i].y === XOR[i] ? '' : ' (틀림)'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Stats>
        <Stat label="맞힌 점" value={`${ok} / 4`} tone={ok === 4 ? 'good' : 'bad'} />
        <Stat label="고른 입력의 (h₁, h₂)" value={`(${r.h1}, ${r.h2})`} />
        <Stat label="(1,0)과 (0,1)이 같은 점으로 모임" value={same ? '예' : '아니오'} />
      </Stats>
      {ok === 4 ? <Note>(1,0)과 (0,1)은 같은 점 (1, 0)으로 모이고, 옮긴 평면에서는 답이 1인 점이 그 하나뿐이라 직선 하나로 갈립니다.</Note> : <Note>문턱이 어긋나 네 점이 다 맞지 않습니다. 본문 값 버튼으로 돌아가 보세요.</Note>}
    </Viz>
  );
}
