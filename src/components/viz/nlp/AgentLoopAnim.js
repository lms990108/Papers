import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../Viz';

// 에이전트 루프를 자동으로 재생한다.
// 사용자 목표 -> 모델 호출(도구 호출을 출력) -> harness가 도구 실행 -> 결과가 context에 쌓임 -> 다음 호출 -> 최종 답.
// context(메시지 목록)가 매 턴 늘어나고, 모델을 부를 때마다 도구 정의 + 메시지 전부가 입력 token이 된다.
// token 수는 설명용으로 정한 값이다. 도구 정의 3,000 token은 본문 계산의 값과 같다.

const TOOL_DEF = 3000;

const SCENARIOS = [
  {
    id: 'leave',
    button: '연차 질문',
    rows: [
      {role: 'user', text: '이번 달 연차 며칠 남았어?', tok: 20},
      {role: 'model', text: 'get_leave_balance(user="me")', tok: 25, tool: 'get_leave_balance'},
      {role: 'result', text: '{"remaining": 7}', tok: 10},
      {role: 'model', text: '"7일 남았습니다"', tok: 10, final: true},
    ],
  },
  {
    id: 'tests',
    button: '테스트 고치기',
    rows: [
      {role: 'user', text: '실패하는 테스트를 고쳐 줘', tok: 20},
      {role: 'model', text: 'run_tests()', tok: 15, tool: 'run_tests'},
      {role: 'result', text: '1개 실패 + 오류 로그', tok: 400},
      {role: 'model', text: 'read_file("parser.py")', tok: 20, tool: 'read_file'},
      {role: 'result', text: 'parser.py 전체 내용', tok: 600},
      {role: 'model', text: 'edit_file("parser.py", 수정)', tok: 80, tool: 'edit_file'},
      {role: 'result', text: '수정 완료', tok: 10},
      {role: 'model', text: 'run_tests()', tok: 15, tool: 'run_tests'},
      {role: 'result', text: '12개 모두 통과', tok: 20},
      {role: 'model', text: '"고쳤고 테스트가 통과합니다"', tok: 25, final: true},
    ],
  },
];

const ROLE = {
  user: {name: '사용자', color: 'var(--vc)'},
  model: {name: '모델', color: 'var(--va)'},
  result: {name: '도구 결과', color: 'var(--vb)'},
};

const ACTORS = [
  {id: 'user', name: '사용자', sub: '목표를 줌', color: 'var(--vc)'},
  {id: 'model', name: '모델', sub: '호출을 출력', color: 'var(--va)'},
  {id: 'harness', name: 'harness', sub: '도구를 실행', color: 'var(--vok)'},
  {id: 'tool', name: '도구', sub: '함수·API', color: 'var(--vb)'},
];

const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const sumTo = (rows, n) => rows.slice(0, n).reduce((a, r) => a + r.tok, 0);

function build(sc) {
  const rows = sc.rows;
  const phases = [];
  let calls = 0;
  let lastInput = null;
  let total = 0;
  phases.push({
    n: 1, newIdx: 0, active: ['user'], calls, lastInput, total,
    label: '사용자가 목표를 줍니다',
    cap: `사용자가 목표를 말합니다. context에는 이 질문 한 줄(${rows[0].tok} token)만 들어 있고, 모델은 아직 한 번도 불리지 않았습니다.`,
  });
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i];
    if (r.role === 'model') {
      calls += 1;
      lastInput = TOOL_DEF + sumTo(rows, i);
      total += lastInput;
      const before = sumTo(rows, i);
      if (r.final) {
        phases.push({
          n: i + 1, newIdx: i, active: ['model'], calls, lastInput, total,
          label: `${calls}번째 모델 호출: 최종 답을 출력`,
          cap: `${calls}번째 모델 호출입니다. harness가 도구 정의 ${comma(TOOL_DEF)} token과 지금까지의 메시지 ${comma(before)} token을 통째로 보내므로 입력은 ${comma(lastInput)} token입니다. 이번에는 모델이 도구 호출 없이 답합니다: ${r.text} (${r.tok} token). 도구 호출이 없으므로 루프가 끝납니다. 입력으로 보낸 token은 모두 ${comma(total)} token입니다.`,
        });
      } else {
        phases.push({
          n: i + 1, newIdx: i, active: ['model'], calls, lastInput, total,
          label: `${calls}번째 모델 호출: 도구 호출을 출력`,
          cap: `${calls}번째 모델 호출입니다. harness가 도구 정의 ${comma(TOOL_DEF)} token과 지금까지의 메시지 ${comma(before)} token을 통째로 보내므로 입력은 ${comma(lastInput)} token입니다. 모델이 다음 글을 출력합니다: ${r.text} (${r.tok} token). 실행한 것이 아니라 호출을 적었을 뿐이고, 이 출력도 context에 붙습니다.`,
        });
        phases.push({
          n: i + 1, newIdx: -1, active: ['harness', 'tool'], calls, lastInput, total,
          label: 'harness가 도구를 실행',
          cap: `harness가 이 호출을 읽고 도구(${r.tool})를 실제로 실행합니다. 이 동안 모델은 아무것도 하지 않고 기다립니다.`,
        });
        const res = rows[i + 1];
        phases.push({
          n: i + 2, newIdx: i + 1, active: ['harness'], calls, lastInput, total,
          label: '결과가 context에 쌓임',
          cap: `도구 결과가 나왔습니다: ${res.text} (${comma(res.tok)} token). harness가 이것을 context 맨 아래에 붙입니다. 메시지가 ${comma(sumTo(rows, i + 2))} token이 되었고, 다음 모델 호출은 이 전체를 다시 입력으로 받습니다.`,
        });
        i += 1;
      }
    }
  }
  return phases;
}

const W = 440;
const ROW_H = 24;
const CTX_TOP = 84;
const DEF_Y = 114;
const ROWS_Y = 138;
const STEP_MS = 3200;

export default function AgentLoopAnim() {
  const [scnId, setScnId] = useState('leave');
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

  const sc = SCENARIOS.find((x) => x.id === scnId) || SCENARIOS[0];
  const rows = sc.rows;
  const phases = build(sc);
  const last = phases.length - 1;
  const ph = phases[Math.min(i, last)];

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      reduce = false;
    }
    setStill(reduce);
    setPlaying(!reduce);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setI((k) => (k >= last ? 0 : k + 1)), STEP_MS);
    return () => clearInterval(id);
  }, [playing, last]);

  const pick = (id) => {
    setScnId(id);
    setI(0);
  };

  const rowsEnd = ROWS_Y + ROW_H * rows.length;
  const barY = rowsEnd + 28;
  const height = barY + 48;
  const grandTotal = sumTo(rows, rows.length);
  const barW = W - 28;
  const ctxNow = sumTo(rows, ph.n);
  const tr = still ? 'none' : 'opacity 500ms ease';
  const trBox = still ? 'none' : 'fill 400ms ease, stroke 400ms ease, stroke-width 400ms ease';

  let acc = 0;
  const segs = rows.map((r) => {
    const x = 14 + (acc / grandTotal) * barW;
    const w = (r.tok / grandTotal) * barW;
    acc += r.tok;
    return {x, w};
  });

  return (
    <Viz
      title="에이전트 루프: context가 매 턴 늘어나는 과정"
      caption="같은 과정을 자동으로 되풀이해 보여 줍니다. token 수는 설명용으로 정한 값이고, 도구 정의 3,000 token은 본문 계산과 같은 값입니다."
    >
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => { setI(0); }}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(last, i + 1)); }}>다음</Btn>
        <span className={s.ts}>{Math.min(i, last) + 1} / {phases.length}</span>
      </Controls>
      <Controls>
        {SCENARIOS.map((x) => (
          <Btn key={x.id} on={x.id === scnId} onClick={() => pick(x.id)}>{x.button}</Btn>
        ))}
      </Controls>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className={s.svg}
        style={{maxWidth: 560, margin: '0 auto', display: 'block'}}
        role="img"
        aria-label="사용자 목표, 모델 호출, harness의 도구 실행, 결과가 context에 쌓이는 순서로 에이전트 루프가 돌며 context와 입력 token이 늘어나는 과정"
      >
        {ACTORS.map((a, k) => {
          const on = ph.active.includes(a.id);
          return (
            <g key={a.id} transform={`translate(${6 + k * 110}, 8)`}>
              <rect
                width={98}
                height={46}
                rx={8}
                style={{
                  fill: on ? `color-mix(in srgb, ${a.color} 22%, var(--ifm-background-surface-color))` : 'var(--ifm-background-surface-color)',
                  stroke: on ? a.color : 'var(--ifm-color-emphasis-300)',
                  strokeWidth: on ? 2.5 : 1,
                  transition: trBox,
                }}
              />
              <text x={49} y={21} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{a.name}</text>
              <text x={49} y={37} textAnchor="middle" className={s.ts}>{a.sub}</text>
            </g>
          );
        })}
        <text x={W / 2} y={73} textAnchor="middle" className={s.t} style={{fontWeight: 700}}>{ph.label}</text>

        <rect
          x={4}
          y={CTX_TOP}
          width={W - 8}
          height={rowsEnd - CTX_TOP + 6}
          rx={8}
          style={{fill: 'var(--ifm-background-surface-color)', stroke: 'var(--ifm-color-emphasis-300)', strokeWidth: 1}}
        />
        <text x={14} y={CTX_TOP + 15} className={s.ts}>context: 모델을 부를 때마다 통째로 보내는 목록</text>

        <g>
          <rect x={10} y={DEF_Y - 10} width={W - 20} height={ROW_H - 2} rx={5} style={{fill: 'var(--ifm-color-emphasis-100)', stroke: 'var(--ifm-color-emphasis-300)', strokeWidth: 1}} />
          <text x={16} y={DEF_Y + 4} className={s.ts} style={{fontWeight: 700}}>도구 정의</text>
          <text x={84} y={DEF_Y + 4} className={s.ts}>이름·설명·인자 규격 (매 호출에 붙음)</text>
          <text x={W - 16} y={DEF_Y + 4} textAnchor="end" className={s.ts} style={{fontWeight: 700}}>{comma(TOOL_DEF)}</text>
        </g>

        {rows.map((r, k) => {
          const y = ROWS_Y + k * ROW_H;
          const vis = k < ph.n;
          const isNew = k === ph.newIdx;
          const role = ROLE[r.role];
          return (
            <g key={`row-${scnId}-${k}`} style={{opacity: vis ? 1 : 0, transition: tr}}>
              <rect
                x={10}
                y={y - 10}
                width={W - 20}
                height={ROW_H - 2}
                rx={5}
                style={{
                  fill: `color-mix(in srgb, ${role.color} 14%, var(--ifm-background-surface-color))`,
                  stroke: isNew ? role.color : 'var(--ifm-color-emphasis-300)',
                  strokeWidth: isNew ? 2 : 1,
                  transition: trBox,
                }}
              />
              <text x={16} y={y + 4} className={s.ts} style={{fontWeight: 700, fill: role.color}}>{role.name}</text>
              <text x={84} y={y + 4} className={s.t} style={{fontSize: 12}}>{r.text}</text>
              <text x={W - 16} y={y + 4} textAnchor="end" className={s.ts} style={{fontWeight: 700}}>{comma(r.tok)}</text>
            </g>
          );
        })}

        <text x={14} y={barY - 8} className={s.ts}>메시지가 차지한 token (막대 전체 = 이 예의 마지막 context, {comma(grandTotal)} token)</text>
        <rect x={14} y={barY} width={barW} height={16} rx={3} style={{fill: 'var(--ifm-color-emphasis-100)', stroke: 'none', strokeWidth: 0}} />
        {rows.map((r, k) => (
          <rect
            key={`seg-${scnId}-${k}`}
            x={segs[k].x}
            y={barY}
            width={segs[k].w}
            height={16}
            style={{fill: ROLE[r.role].color, stroke: 'var(--ifm-background-surface-color)', strokeWidth: 0.5, opacity: k < ph.n ? 1 : 0, transition: tr}}
          />
        ))}
        <text x={14} y={barY + 34} className={s.ts}>보라: 사용자 · 파랑: 모델 출력 · 주황: 도구 결과</text>
      </svg>
      <Stats>
        <Stat label="모델 호출" value={`${ph.calls}번`} />
        <Stat label="context 메시지" value={`${comma(ctxNow)} token`} />
        <Stat label="마지막 호출의 입력" value={ph.lastInput === null ? '-' : `${comma(ph.lastInput)} token`} />
        <Stat label="입력 누적 합계" value={ph.calls === 0 ? '-' : `${comma(ph.total)} token`} tone="bad" />
      </Stats>
      <Note>{ph.cap}</Note>
    </Viz>
  );
}
