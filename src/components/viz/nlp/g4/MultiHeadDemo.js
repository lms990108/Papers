import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {softmax, trim, heat} from './util';

const TOK = [
  {t: '오늘', x: [1, 0]},
  {t: '날씨', x: [0, 1]},
  {t: '좋다', x: [1, 1]},
];
const COLORS = ['var(--vb)', 'var(--va)', 'var(--vc)'];

export default function MultiHeadDemo() {
  const [qi, setQi] = useState(2);
  const [wo, setWo] = useState([1, 0, 1, 1]);
  const [v2, setV2] = useState(2);
  const [on, setOn] = useState([true, true]);

  // 헤드 하나의 길이 d_k = 1 이라 √d = 1. 헤드 1은 첫 칸, 헤드 2는 둘째 칸을 질문·열쇠로 쓴다.
  const col = [0, 1];
  const heads = col.map((c) => {
    const q = TOK[qi].x[c];
    const scores = TOK.map((tk) => q * tk.x[c]);
    const a = softmax(scores);
    const vals = TOK.map((tk) => tk.x[c] * (c === 1 ? v2 : 1));
    const out = a.reduce((acc, p, j) => acc + p * vals[j], 0);
    return {scores, a, vals, out};
  });
  const outs = heads.map((h, k) => (on[k] ? h.out : 0));
  const y = [outs[0] * wo[0] + outs[1] * wo[2], outs[0] * wo[1] + outs[1] * wo[3]];
  const setW = (k) => (v) => setWo(wo.map((a, j) => (j === k ? v : a)));

  return (
    <Viz
      title="멀티헤드: 두 헤드가 같은 토큰을 다르게 읽습니다"
      caption="질문 토큰을 고르고 헤드를 켜고 꺼 보세요. 헤드 1은 입력의 첫 칸, 헤드 2는 둘째 칸으로 질문과 열쇠를 만들고 헤드 하나의 길이는 1입니다. 헤드의 출력을 이어 붙여 W_O로 섞습니다. 기본값이 본문의 좋다 자리 계산입니다."
    >
      <Controls>
        {TOK.map((tk, j) => (
          <Btn key={tk.t} on={qi === j} onClick={() => setQi(j)}>
            질문: {tk.t}
          </Btn>
        ))}
        <Btn on={on[0]} onClick={() => setOn([!on[0], on[1]])}>헤드 1 {on[0] ? '켜짐' : '꺼짐'}</Btn>
        <Btn on={on[1]} onClick={() => setOn([on[0], !on[1]])}>헤드 2 {on[1] ? '켜짐' : '꺼짐'}</Btn>
      </Controls>
      <Controls>
        <Slider label="헤드 2 값 배율" min={0} max={3} step={0.5} value={v2} onChange={setV2} format={(v) => fmt(v, 1)} />
        <Slider label="W_O 1행 1열" min={-2} max={2} step={0.5} value={wo[0]} onChange={setW(0)} format={(v) => fmt(v, 1)} />
        <Slider label="W_O 1행 2열" min={-2} max={2} step={0.5} value={wo[1]} onChange={setW(1)} format={(v) => fmt(v, 1)} />
        <Slider label="W_O 2행 1열" min={-2} max={2} step={0.5} value={wo[2]} onChange={setW(2)} format={(v) => fmt(v, 1)} />
        <Slider label="W_O 2행 2열" min={-2} max={2} step={0.5} value={wo[3]} onChange={setW(3)} format={(v) => fmt(v, 1)} />
      </Controls>
      <div className={s.two}>
        {heads.map((h, k) => (
          <div key={k} style={{opacity: on[k] ? 1 : 0.4}}>
            <div className={s.title}>헤드 {k + 1} ({k === 0 ? '첫 칸' : '둘째 칸'}을 봄)</div>
            <p className={s.note} style={{marginTop: 0}}>
              점수 [{h.scores.map((v) => trim(v)).join(', ')}], 값 [{h.vals.map((v) => trim(v)).join(', ')}]
            </p>
            {TOK.map((tk, j) => (
              <Bar key={tk.t} label={tk.t} value={h.a[j]} max={1} color={COLORS[j]} text={fmt(h.a[j], 3)} />
            ))}
            <Stats>
              <Stat label="헤드 출력" value={fmt(on[k] ? h.out : 0, 3)} />
            </Stats>
          </div>
        ))}
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>이어 붙임 [헤드 1, 헤드 2]</th>
            <th>× W_O</th>
            <th>멀티헤드 출력</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>[{outs.map((v) => fmt(v, 3)).join(', ')}]</td>
            <td>[[{wo[0]}, {wo[1]}], [{wo[2]}, {wo[3]}]]</td>
            <td style={{background: heat(0.35)}}>
              <b>[{y.map((v) => fmt(v, 3)).join(', ')}]</b>
            </td>
          </tr>
        </tbody>
      </table>
      {qi === 2 && on[0] && on[1] && v2 === 2 && wo.join() === '1,0,1,1' ? (
        <Note>본문의 값입니다. 0.845 + 1.689 = 2.534이므로 첫 칸이 2.534, 둘째 칸이 1.689입니다.</Note>
      ) : (
        <Note>헤드마다 비율이 다릅니다. 헤드 1은 첫 칸이 큰 토큰을, 헤드 2는 둘째 칸이 큰 토큰을 더 봅니다.</Note>
      )}
    </Viz>
  );
}
