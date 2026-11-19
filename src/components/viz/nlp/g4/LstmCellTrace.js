import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const ACTIONS = [
  {id: 'keep', t: '그대로 유지 (f=1, i=0)', f: 1, i: 0, g: 0},
  {id: 'half', t: '절반만 남기기 (f=0.5, i=0)', f: 0.5, i: 0, g: 0},
  {id: 'write', t: '지우고 1 쓰기 (f=0, i=1, g=1)', f: 0, i: 1, g: 1},
  {id: 'add', t: '0.5 더하기 (f=1, i=1, g=0.5)', f: 1, i: 1, g: 0.5},
];
const N = 4;
const W = 520;
const H = 230;
const MID = 112;
const SC = 24;

const selStyle = {
  maxWidth: '100%',
  padding: '2px 4px',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 6,
  background: 'var(--ifm-background-color)',
  color: 'var(--ifm-font-color-base)',
  fontSize: '0.8rem',
};

export default function LstmCellTrace() {
  const [c0, setC0] = useState(2);
  const [acts, setActs] = useState(['keep', 'keep', 'keep', 'keep']);
  const [open, setOpen] = useState([false, false, true, false]);

  const rows = [];
  let c = c0;
  acts.forEach((id, k) => {
    const a = ACTIONS.filter((x) => x.id === id)[0];
    c = a.f * c + a.i * a.g;
    rows.push({c, h: open[k] ? Math.tanh(c) : 0});
  });

  const setAct = (k, v) => setActs(acts.map((a, j) => (j === k ? v : a)));
  const toggle = (k) => setOpen(open.map((a, j) => (j === k ? !a : a)));
  const y = (v) => MID - Math.max(-4, Math.min(4, v)) * SC;

  return (
    <Viz
      title="스텝을 넘기며 통로에 남은 값 보기"
      caption="스텝마다 통로를 어떻게 다룰지 고르고, 내보내는 문을 열지 닫을지 정해 보세요. 파랑 막대가 통로 c, 보라 막대가 밖으로 나가는 h입니다. 기본값은 c = 2를 유지하다가 셋째 자리에서만 문을 여는 경우입니다."
    >
      <Controls>
        <Slider label="처음 통로 c" min={-3} max={3} step={0.5} value={c0} onChange={setC0} format={(v) => fmt(v, 1)} />
        <Btn onClick={() => { setActs(['keep', 'keep', 'keep', 'keep']); setOpen([false, false, true, false]); setC0(2); }}>
          기본값으로
        </Btn>
      </Controls>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>스텝</th>
            {acts.map((a, k) => (
              <th key={k}>{k + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>통로 동작</td>
            {acts.map((a, k) => (
              <td key={k}>
                <select aria-label={`스텝 ${k + 1} 통로 동작`} value={a} onChange={(e) => setAct(k, e.target.value)} style={selStyle}>
                  {ACTIONS.map((x) => (
                    <option key={x.id} value={x.id}>{x.t}</option>
                  ))}
                </select>
              </td>
            ))}
          </tr>
          <tr>
            <td>내보내는 문 o</td>
            {open.map((b, k) => (
              <td key={k}>
                <Btn on={b} onClick={() => toggle(k)}>{b ? '열림 (o=1)' : '닫힘 (o=0)'}</Btn>
              </td>
            ))}
          </tr>
          <tr>
            <td>통로 c</td>
            {rows.map((r, k) => (
              <td key={k}>{fmt(r.c, 3)}</td>
            ))}
          </tr>
          <tr>
            <td>숨은 상태 h</td>
            {rows.map((r, k) => (
              <td key={k} className={open[k] ? s.cellOn : undefined}>{fmt(r.h, 3)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="스텝마다 통로 c와 숨은 상태 h의 크기를 보여 주는 막대 그림">
        <line x1={20} y1={MID} x2={W - 10} y2={MID} stroke="var(--ifm-color-emphasis-500)" />
        {[0, 1, 2, 3, 4].map((k) => {
          const v = k === 0 ? c0 : rows[k - 1].c;
          const x = 30 + k * 98;
          const top = Math.min(MID, y(v));
          return (
            <g key={k}>
              <rect x={x} y={top} width={26} height={Math.max(1, Math.abs(y(v) - MID))} fill="var(--va)" fillOpacity="0.75" />
              <text x={x + 13} y={v >= 0 ? top - 5 : top + Math.abs(y(v) - MID) + 14} className={s.ts} textAnchor="middle">
                {fmt(v, 2)}
              </text>
              <text x={x + 26} y={H - 8} className={s.ts} textAnchor="middle">
                {k === 0 ? '처음' : `스텝 ${k}`}
              </text>
              {k > 0 ? (
                <rect x={x + 30} y={Math.min(MID, y(rows[k - 1].h))} width={26} height={Math.max(1, Math.abs(y(rows[k - 1].h) - MID))} fill="var(--vc)" fillOpacity="0.75" />
              ) : null}
            </g>
          );
        })}
        <text x={W - 12} y={16} className={s.ts} textAnchor="end" style={{fill: 'var(--va)'}}>파랑: 통로 c</text>
        <text x={W - 12} y={32} className={s.ts} textAnchor="end" style={{fill: 'var(--vc)'}}>보라: 내보낸 h</text>
      </svg>
      <Stats>
        <Stat label="마지막 통로 c" value={fmt(rows[N - 1].c, 3)} />
        <Stat label="마지막 h" value={fmt(rows[N - 1].h, 3)} />
      </Stats>
      {acts.slice(0, 3).join() === 'keep,keep,keep' && c0 === 2 && !open[0] && !open[1] && open[2] ? (
        <Note>통로는 세 자리 내내 2이지만, 앞 두 자리의 h는 0이고 셋째 자리에서 문을 열면 tanh(2)가 나갑니다.</Note>
      ) : null}
    </Viz>
  );
}
