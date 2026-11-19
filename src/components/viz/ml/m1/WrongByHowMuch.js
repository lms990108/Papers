import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const STARS = [1, 2, 3, 4, 5];
const TRUE_D = 7;
const TRUE_S = 5;
const W = 440;
const H = 150;

function Bars({items, trueV, errOf, sel, onPick, maxErr, name}) {
  const gap = (W - 20) / items.length;
  return (
    <svg viewBox={'0 0 ' + W + ' ' + H} className={s.svg} role="img" aria-label={name}>
      <line x1={10} y1={H - 30} x2={W - 10} y2={H - 30} stroke="var(--ifm-color-emphasis-400)" />
      {items.map((v, k) => {
        const e = errOf(v);
        const h = (e / maxErr) * (H - 56);
        const x = 10 + k * gap + gap * 0.18;
        const bw = gap * 0.64;
        return (
          <g key={v} role="button" tabIndex={0} aria-label={name + ' ' + v + ' 선택'} onClick={() => onPick(v)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(v); } }} style={{cursor: 'pointer'}}>
            <rect x={10 + k * gap} y={4} width={gap} height={H - 8} fill="transparent" />
            {e > 0 ? (
              <rect x={x} y={H - 30 - h} width={bw} height={h} fill={sel === v ? 'var(--vb)' : 'var(--va)'} fillOpacity={sel === v ? 1 : 0.55} />
            ) : (
              <circle cx={x + bw / 2} cy={H - 34} r={4} fill="var(--vok)" />
            )}
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" className={s.t} style={{fontWeight: sel === v ? 700 : 400}}>{v}</text>
            {e > 0 ? <text x={x + bw / 2} y={H - 34 - h - 4} textAnchor="middle" className={s.ts}>{e}</text> : null}
          </g>
        );
      })}
      <text x={W - 10} y={14} textAnchor="end" className={s.ts}>정답 {trueV} (초록 점 = 맞힘)</text>
    </svg>
  );
}

export default function WrongByHowMuch() {
  const [digit, setDigit] = useState(3);
  const [star, setStar] = useState(1);
  const [asBoxes, setAsBoxes] = useState(false);

  const dErr = (v) => (v === TRUE_D ? 0 : 1);
  const sErr = (v) => (asBoxes ? (v === TRUE_S ? 0 : 1) : Math.abs(TRUE_S - v));

  return (
    <Viz
      title="틀렸을 때 얼마나 틀렸는지를 셀 수 있을까요"
      caption="막대를 눌러 예측을 골라 보세요. 막대 높이는 그 예측의 오차입니다. 숫자 칸은 틀리면 모두 같은 높이이고, 별점은 정답에서 멀수록 높아집니다."
    >
      <Controls>
        <Btn on={!asBoxes} onClick={() => setAsBoxes(false)}>별점을 수로 보기 (회귀)</Btn>
        <Btn on={asBoxes} onClick={() => setAsBoxes(true)}>별점을 다섯 칸으로 보기 (분류)</Btn>
      </Controls>
      <div className={s.two}>
        <div>
          <div className={s.ts}>손으로 쓴 숫자 0부터 9 (칸 열 개)</div>
          <Bars items={DIGITS} trueV={TRUE_D} errOf={dErr} sel={digit} onPick={setDigit} maxErr={1.2} name="숫자 예측별 오차 막대" />
        </div>
        <div>
          <div className={s.ts}>별점 1부터 5 ({asBoxes ? '칸으로 셈' : '거리로 셈'})</div>
          <Bars items={STARS} trueV={TRUE_S} errOf={sErr} sel={star} onPick={setStar} maxErr={asBoxes ? 1.2 : 4.8} name="별점 예측별 오차 막대" />
        </div>
      </div>
      <Stats>
        <Stat label={'숫자 ' + TRUE_D + '를 ' + digit + '로 예측'} value={digit === TRUE_D ? '맞음' : '틀림 (오차 1)'} tone={digit === TRUE_D ? 'good' : 'bad'} />
        <Stat label={'별점 ' + TRUE_S + '를 ' + star + '로 예측'} value={sErr(star) === 0 ? '맞음' : asBoxes ? '틀림 (오차 1)' : '차이 ' + sErr(star)} tone={sErr(star) === 0 ? 'good' : 'bad'} />
      </Stats>
      <Note>
        7을 3으로 틀린 것과 8로 틀린 것은 똑같이 틀린 것입니다. 별점은 5를 1로 틀린 것이 4로 틀린 것보다 크게 틀렸습니다.
        별점이 정수라고 분류인 것은 아닙니다. 위 두 버튼처럼 어떻게 세느냐가 문제의 종류를 정합니다.
      </Note>
    </Viz>
  );
}
