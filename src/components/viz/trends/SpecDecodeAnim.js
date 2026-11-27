import React, {useEffect, useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../Viz';

// speculative decoding 한 step을 일반 디코드와 같은 시간 축에 나란히 놓고 자동 재생한다.
// 시간 단위: 큰 모델 한 번 = 1.0, draft 한 번 = 0.1 (본문 '더 깊이'의 c = 0.1), k = 4.
// 어느 경우든 얻는 token 수 = 수락한 개수 + 1 (거절 자리의 교정 token, 또는 전부 수락했을 때의 덤).

const K = 4;
const C = 0.1;
const r1 = (x) => Math.round(x * 10) / 10;
const T_DRAFT = r1(K * C); // 0.4: draft가 k번 돈 시각
const T_MID = r1(T_DRAFT + 0.6); // 1.0: 검증 진행 중
const T_VERIFY = r1(T_DRAFT + 1); // 1.4: 큰 모델 검증 끝

const CASES = [
  {id: 'partial', btn: '3개 수락 (4번째 거절)', proposals: ['on', 'the', 'soft', 'rug'], accepted: 3, extra: 'mat'},
  {id: 'full', btn: '4개 모두 수락', proposals: ['on', 'the', 'soft', 'mat'], accepted: 4, extra: 'and'},
  {id: 'none', btn: '첫 제안부터 거절', proposals: ['in', 'the', 'soft', 'mat'], accepted: 0, extra: 'on'},
];

function plan(kase) {
  const final = kase.proposals.slice(0, kase.accepted).concat(kase.extra);
  const total = final.length;
  const times = [0, T_DRAFT, T_MID, T_VERIFY];
  for (let j = 2; j <= total; j += 1) times.push(j);
  return {final, total, times};
}

function caption(kase, p, i) {
  const {final, total, times} = p;
  const props = kase.proposals.join(' ');
  const last = i === times.length - 1;
  const ratio = r1(total / T_VERIFY);
  const verdict = () => {
    if (kase.accepted === 0) {
      return `큰 모델 검증이 끝났습니다. 첫 제안(${kase.proposals[0]})부터 큰 모델이 뽑을 token과 달라 거절(빨강)입니다. 앞에서부터 차례로 받으므로 그 뒤 제안은 맞아 보여도 모두 버립니다(흐린 칩). 거절된 자리에는 큰 모델이 직접 뽑은 token(${kase.extra})을 받습니다(주황). 큰 모델 호출 1번에 token 1개입니다.`;
    }
    if (kase.accepted === K) {
      return `큰 모델 검증이 끝났습니다. 제안 ${K}개가 모두 큰 모델이 뽑을 token과 같아 전부 수락(초록)입니다. 같은 호출에서 큰 모델이 다음 token(${kase.extra})도 하나 더 뽑습니다(주황). 큰 모델 호출 1번에 token ${total}개입니다.`;
    }
    return `큰 모델 검증이 끝났습니다. 앞의 ${kase.accepted}개(${kase.proposals.slice(0, kase.accepted).join(', ')})는 큰 모델이 뽑을 token과 같아 수락(초록)입니다. ${kase.accepted + 1}번째 제안(${kase.proposals[kase.accepted]})은 달라서 거절(빨강)하고, 그 자리에 큰 모델이 직접 뽑은 token(${kase.extra})을 받습니다(주황). 큰 모델 호출 1번에 token ${total}개(수락 ${kase.accepted} + 교정 1)입니다.`;
  };
  const summary = () => {
    const v = kase.accepted === 0 ? `${ratio.toFixed(1)}배로 오히려 느립니다(일반 디코드 ${total}.0, speculative ${T_VERIFY.toFixed(1)}).` : `약 ${ratio.toFixed(1)}배 빠릅니다(일반 디코드 ${total}.0, speculative ${T_VERIFY.toFixed(1)}).`;
    return `정리: 두 줄이 얻은 token은 같습니다(${final.join(' ')}). 큰 모델 호출은 일반 디코드 ${total}회, speculative decoding 1회이고, 시간은 draft 0.4까지 더해도 ${v}`;
  };
  if (i === 0) {
    return `준비: prompt "The cat sat" 뒤를 이어 쓰는 상황입니다. 위 줄은 큰 모델만 쓰는 일반 디코드, 아래 줄은 speculative decoding입니다. 시간 축의 1칸이 큰 모델이 한 번 도는 시간입니다. 파란 칸이 큰 모델이 도는 구간이고, 보라 칸이 draft 모델이 도는 구간입니다.`;
  }
  if (i === 1) {
    return `시간 ${T_DRAFT.toFixed(1)}: draft 모델이 가볍게 ${K}번 돌아(1번에 ${C}, 합 ${T_DRAFT.toFixed(1)}) token ${K}개(${props})를 제안했습니다. 아직 검증 전이라 점선 칩입니다. 일반 디코드는 같은 시간에 큰 모델 첫 호출의 40%를 지났을 뿐입니다.`;
  }
  if (i === 2) {
    return `시간 ${T_MID.toFixed(1)}: 큰 모델이 제안 ${K}개를 한 번에 계산하는 중입니다. prefill처럼 여러 token을 한꺼번에 넣기 때문에 가중치를 한 번만 읽고, 걸리는 시간은 큰 모델 1번 분량입니다. 일반 디코드는 첫 호출을 막 끝내 첫 token(${final[0]})을 얻었습니다.`;
  }
  if (i === 3) {
    const normal = total > 1 ? '일반 디코드는 이 시각에 두 번째 호출을 40% 진행했고 token은 1개입니다.' : '일반 디코드는 시간 1.0에 호출 1번으로 token 1개를 얻고 이미 끝났습니다.';
    return `시간 ${T_VERIFY.toFixed(1)}: ${verdict()} ${normal}${last ? ` ${summary()}` : ''}`;
  }
  const j = times[i];
  if (last) {
    return `시간 ${j}.0: 일반 디코드도 ${j}번째 호출을 끝내 token ${total}개를 모두 얻었습니다. ${summary()} 이 값은 제안이 이렇게 맞았을 때 한 step의 결과이고, 평균은 본문의 식으로 구합니다.`;
  }
  return `시간 ${j}.0: 일반 디코드가 큰 모델을 ${j}번째 호출해 ${j}번째 token(${final[j - 1]})을 얻었습니다. speculative decoding은 시간 ${T_VERIFY.toFixed(1)}에 이미 ${total}개를 얻었고 다음 step을 시작했을 것입니다(그림에서는 생략).`;
}

const W = 560;
const H = 276;
const X0 = 30;
const U = 100; // 시간 1.0의 가로 길이
const SLOT = 62;
const CHIP_W = 56;
const Y_N_BAR = 70;
const Y_N_CHIP = 100;
const Y_S_BAR = 160;
const Y_S_CHIP1 = 204;
const Y_S_CHIP2 = 236;
const BAR_H = 22;
const CHIP_H = 24;

function Chip({x, y, label, state, show, still}) {
  const color = {
    plain: 'var(--va)',
    prop: 'var(--ifm-color-emphasis-600)',
    ok: 'var(--vok)',
    bad: 'var(--vbad)',
    drop: 'var(--ifm-color-emphasis-500)',
    fresh: 'var(--vb)',
  }[state];
  const mark = state === 'ok' ? ' ✓' : state === 'bad' ? ' ✗' : '';
  const fill = state === 'prop' || state === 'drop' ? 'var(--ifm-background-surface-color)' : `color-mix(in srgb, ${color} 20%, var(--ifm-background-surface-color))`;
  return (
    <g style={{transform: `translate(${x}px, ${y}px)`, opacity: show ? (state === 'drop' ? 0.4 : 1) : 0, transition: still ? 'none' : 'opacity 500ms ease'}}>
      <rect width={CHIP_W} height={CHIP_H} rx={6} fill={fill} stroke={color} strokeWidth={2} strokeDasharray={state === 'prop' ? '4 3' : 'none'} />
      <text x={CHIP_W / 2} y={CHIP_H / 2 + 4.5} textAnchor="middle" className={s.t} style={{fontWeight: 700, textDecoration: state === 'drop' ? 'line-through' : 'none'}}>{label + mark}</text>
    </g>
  );
}

function Bar({x, y, w, progress, color, label, still}) {
  const fw = Math.max(0, Math.min(1, progress)) * w;
  return (
    <g>
      <rect x={x} y={y} width={w} height={BAR_H} rx={3} fill="none" stroke="var(--ifm-color-emphasis-400)" strokeDasharray="4 3" />
      <rect x={x} y={y} width={fw} height={BAR_H} rx={3} fill={`color-mix(in srgb, ${color} 35%, var(--ifm-background-surface-color))`} stroke={fw > 0 ? color : 'none'} strokeWidth={1.5} style={{width: fw, transition: still ? 'none' : 'width 1000ms ease'}} />
      {label ? <text x={x + w / 2} y={y + BAR_H / 2 + 4.5} textAnchor="middle" className={s.ts}>{label}</text> : null}
    </g>
  );
}

const STEP_MS = 2800;

export default function SpecDecodeAnim() {
  const [ci, setCi] = useState(0);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [still, setStill] = useState(false);

  const kase = CASES[ci];
  const p = plan(kase);
  const last = p.times.length - 1;
  const idx = Math.min(i, last);
  const t = p.times[idx];

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

  const choose = (n) => {
    setCi(n);
    setI(0);
  };

  const eps = 1e-9;
  const nDone = Math.min(p.total, Math.floor(t + eps));
  const specDone = t + eps >= T_VERIFY;
  const showProp = idx >= 1;
  const showVerdict = idx >= 3;
  const cursorX = X0 + t * U;
  const axisEnd = X0 + 5 * U;

  const propState = (k) => {
    if (!showVerdict) return 'prop';
    if (k < kase.accepted) return 'ok';
    if (k === kase.accepted) return 'bad';
    return 'drop';
  };

  return (
    <Viz
      title="speculative decoding 한 step: 일반 디코드와 시간 축으로 비교"
      caption="두 줄이 같은 시간 축을 씁니다. 큰 모델 한 번이 도는 시간이 1이고 draft 한 번은 0.1입니다. 같은 token을 얻는 데 큰 모델을 몇 번 부르는지, 시간이 얼마나 걸리는지를 보세요."
    >
      <Controls>
        <span className={s.ts}>draft 제안 결과</span>
        {CASES.map((c, n) => (
          <Btn key={c.id} on={ci === n} onClick={() => choose(n)}>{c.btn}</Btn>
        ))}
      </Controls>
      <Controls>
        <Btn on={playing} onClick={() => setPlaying(!playing)}>{playing ? '일시정지' : '재생'}</Btn>
        <Btn onClick={() => setI(0)}>처음으로</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.max(0, idx - 1)); }}>이전</Btn>
        <Btn onClick={() => { setPlaying(false); setI(Math.min(last, idx + 1)); }}>다음</Btn>
        <span className={s.ts}>{idx + 1} / {p.times.length}</span>
      </Controls>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label="일반 디코드는 큰 모델을 token마다 한 번씩 호출하고, speculative decoding은 draft 모델이 제안한 token을 큰 모델이 한 번에 검증해 같은 시간 축에서 더 적은 호출로 같은 token을 얻는 모습">
        <text x={X0} y={14} className={s.ts}>prompt: &quot;The cat sat&quot;</text>
        <text x={axisEnd} y={14} textAnchor="end" className={s.ts}>시간 (큰 모델 1번 = 1)</text>
        <line x1={X0} y1={26} x2={axisEnd} y2={26} stroke="var(--ifm-color-emphasis-500)" />
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={`tick${v}`}>
            <line x1={X0 + v * U} y1={26} x2={X0 + v * U} y2={31} stroke="var(--ifm-color-emphasis-500)" />
            <text x={X0 + v * U} y={43} textAnchor="middle" className={s.ts}>{v}</text>
          </g>
        ))}

        <text x={X0} y={Y_N_BAR - 6} className={s.ts} style={{fill: 'var(--va)', fontWeight: 700}}>일반 디코드: 큰 모델을 token마다 호출</text>
        {Array.from({length: p.total}, (_, k) => (
          <Bar key={`nb${k}`} x={X0 + k * U + 1} y={Y_N_BAR} w={U - 2} progress={t - k} color="var(--va)" label={`큰 모델 ${k + 1}번`} still={still} />
        ))}
        {p.final.map((tok, k) => (
          <Chip key={`nc${k}`} x={X0 + k * SLOT} y={Y_N_CHIP} label={tok} state="plain" show={t + eps >= k + 1} still={still} />
        ))}
        <text x={X0 + 5 * SLOT + 8} y={Y_N_CHIP + 16} className={s.ts}>← 얻은 token</text>

        <text x={X0} y={Y_S_BAR - 6} className={s.ts} style={{fill: 'var(--vc)', fontWeight: 700}}>speculative decoding: draft가 제안, 큰 모델이 한 번에 검증</text>
        {Array.from({length: K}, (_, k) => (
          <Bar key={`sd${k}`} x={X0 + k * C * U} y={Y_S_BAR} w={C * U - 1} progress={(t - k * C) / C} color="var(--vc)" label="" still={still} />
        ))}
        <Bar x={X0 + T_DRAFT * U + 1} y={Y_S_BAR} w={U - 2} progress={t - T_DRAFT} color="var(--va)" label="큰 모델 검증" still={still} />
        <text x={X0} y={Y_S_BAR + BAR_H + 13} className={s.ts} style={{fill: 'var(--vc)'}}>draft {K}번</text>
        {specDone ? <text x={X0 + T_VERIFY * U + 8} y={Y_S_BAR + BAR_H / 2 + 4.5} className={s.ts}>이후는 다음 step…</text> : null}
        {kase.proposals.map((tok, k) => (
          <Chip key={`sp${k}`} x={X0 + k * SLOT} y={Y_S_CHIP1} label={tok} state={propState(k)} show={showProp} still={still} />
        ))}
        <text x={X0 + 5 * SLOT + 8} y={Y_S_CHIP1 + 16} className={s.ts}>← draft가 제안한 token</text>
        <Chip key="sx" x={X0 + kase.accepted * SLOT} y={Y_S_CHIP2} label={kase.extra} state="fresh" show={showVerdict} still={still} />
        <text x={X0 + 5 * SLOT + 8} y={Y_S_CHIP2 + 16} className={s.ts}>← 큰 모델이 뽑은 token</text>

        <g style={{transform: `translate(${cursorX}px, 0px)`, transition: still ? 'none' : 'transform 1000ms ease'}}>
          <line x1={0} y1={26} x2={0} y2={H - 6} stroke="var(--vbad)" strokeWidth={1.5} strokeDasharray="3 3" />
          <polygon points="0,30 -5,22 5,22" fill="var(--vbad)" />
        </g>
      </svg>
      <Stats>
        <Stat label="지금 시간" value={t.toFixed(1)} />
        <Stat label="일반 디코드" value={`token ${nDone}개 · 큰 모델 ${nDone}회`} />
        <Stat label="speculative" value={`token ${specDone ? p.total : 0}개 · 큰 모델 ${specDone ? 1 : 0}회`} tone={specDone ? 'good' : undefined} />
      </Stats>
      <Note>{caption(kase, p, idx)}</Note>
    </Viz>
  );
}
