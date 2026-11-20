import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Bar, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {comma} from './util';

const DS = [64, 512, 4096];
const MAXLOG = Math.log10(4096 * 4096 * 4096);

export default function SelfAttentionCostN() {
  const [e, setE] = useState(6);
  const [d, setD] = useState(512);
  const n = 2 ** e;

  const cells = n * n;
  const att = n * n * d; // 셀프 어텐션: n^2 * d
  const rnn = n * d * d; // 순환: n * d^2
  const ratio = att / rnn; // = n / d
  const attWins = n < d;
  const tie = n === d;

  return (
    <Viz
      title="문장 길이 n에 따른 층당 비용"
      caption="n은 토큰 수, d는 토큰 목록의 길이입니다. 막대는 복잡도 식의 값이고, 상수 배는 무시했으며 로그 눈금입니다. 셀프 어텐션은 n²·d, 순환 신경망은 n·d²입니다(Vaswani 외, 2017의 표 1). n과 d는 설명용 값이고 실제 모델의 수치가 아닙니다."
    >
      <Controls>
        <Slider label="토큰 수 n" min={0} max={12} step={1} value={e} onChange={setE} format={(v) => comma(2 ** v)} />
        {DS.map((v) => (
          <Btn key={v} on={d === v} onClick={() => setD(v)}>
            d = {comma(v)}
          </Btn>
        ))}
      </Controls>

      <div className={s.title}>토큰 수 n = {comma(n)}, 목록 길이 d = {comma(d)}</div>
      <Bar label="셀프 어텐션 n²·d" value={Math.log10(att)} max={MAXLOG} color="var(--va)" text={comma(att)} />
      <Bar label="순환 신경망 n·d²" value={Math.log10(rnn)} max={MAXLOG} color="var(--vb)" text={comma(rnn)} />

      <Stats>
        <Stat label="어텐션 행렬의 칸 수 n²" value={comma(cells)} />
        <Stat label="n을 두 배로 하면 칸 수" value={`${comma(4 * cells)} (4배)`} tone="bad" />
        <Stat label="어텐션 ÷ 순환 (= n ÷ d)" value={fmt(ratio, 3)} tone={attWins ? 'good' : tie ? undefined : 'bad'} />
        <Stat label="순서대로 밟아야 하는 단계" value={`어텐션 1, 순환 ${comma(n)}`} />
      </Stats>
      <Note>
        {attWins
          ? 'n이 d보다 작아서 식의 값은 셀프 어텐션이 더 작습니다. 논문은 문장 표현에서 n이 d보다 작은 경우가 흔하다고 씁니다.'
          : tie
          ? 'n과 d가 같아서 두 식의 값이 같습니다.'
          : 'n이 d보다 커서 n²·d가 n·d²를 넘습니다. 아주 긴 입력에서는 n²이 비용을 좌우합니다.'}
        {' '}식의 값이 작다고 순서대로 밟는 단계가 줄어드는 것은 아닙니다. 순환 신경망은 n단계를 차례로 밟고, 셀프 어텐션은 모든 칸을 한꺼번에 계산합니다.
      </Note>
    </Viz>
  );
}
