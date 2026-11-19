import React, {useState} from 'react';
import {Viz, Controls, Btn, Note, styles as s} from '../../Viz';

const STAGES = [
  {
    id: '사전 학습',
    sub: '다음 토큰',
    see: '글의 모든 자리에서 다음 토큰을 맞힙니다.',
    err: '모든 자리의 -log p 평균 (LLM 페이지)',
    ex: '“오늘 날씨” 다음에 “좋다”가 오는 비율은 맞추지만, “연기가 좋다”의 별점 질문 형식은 학습한 적이 없습니다.',
  },
  {
    id: 'SFT',
    sub: '답 구간만',
    see: '질문에 이어지는 답을 학습합니다.',
    err: '답 구간의 -log p만 합에 넣습니다.',
    ex: '질문 “별점은”과 답 “4”를 이어 붙이고, 오차는 답 “4”의 칸에만 둡니다.',
  },
  {
    id: 'DPO',
    sub: '고른 답과 버린 답',
    see: '같은 질문의 답 두 개에서 사람이 고른 답과 버린 답을 봅니다.',
    err: '기준 모델 대비 logprob 차이의 간격을 키우는 쪽으로 오차를 줄입니다.',
    ex: 'RLHF는 보상 모델의 점수로 정책을 갱신합니다. RLAIF는 사람 대신 다른 모델의 선호로 쌍을 만듭니다.',
  },
  {
    id: 'GRPO',
    sub: '보상과 평균의 차이',
    see: '답을 여러 개 뽑아 점수로 순위를 매깁니다.',
    err: '평균 보상과의 차이(우위)가 양수인 답의 확률을 올립니다.',
    ex: 'RLVR은 맞다·틀리다처럼 검산이 되는 정답만 보상으로 씁니다. PRM은 문장 중간마다 보상을 줍니다.',
  },
];
const TOOLS = ['LoRA·PEFT·QLoRA: 일부 칸만 학습', 'distillation: 큰 모델의 분포를 작은 모델이 따라 함', 'rejection sampling: 보상이 높은 후보만 SFT의 답으로'];

export default function PostTrainingStages() {
  const [i, setI] = useState(1);
  const st = STAGES[i];
  const bw = 100;
  return (
    <Viz
      title="사전 학습에서 후속 학습까지"
      caption="단계를 눌러 보세요. 각 단계에서 무엇을 보고 어디에 오차를 두는지가 바뀝니다. 화살표 순서는 원본의 서술(다음 토큰 학습이 끝난 뒤, SFT가 끝난 기준 모델)을 따랐습니다."
    >
      <Controls>
        {STAGES.map((x, j) => (
          <Btn key={x.id} on={i === j} onClick={() => setI(j)}>
            {j + 1}. {x.id}
          </Btn>
        ))}
      </Controls>
      <svg viewBox="0 0 480 90" className={s.svg} role="img" aria-label="사전 학습, SFT, DPO, GRPO가 화살표로 이어진다">
        {STAGES.map((x, j) => {
          const xx = 12 + j * 118;
          return (
            <g key={x.id} onClick={() => setI(j)} style={{cursor: 'pointer'}}>
              <rect x={xx} y={18} width={bw} height={52} rx={8} fill={j === i ? 'var(--va)' : 'none'} fillOpacity={j === i ? 0.18 : 0} stroke={j === i ? 'var(--va)' : 'var(--ifm-color-emphasis-500)'} strokeWidth={j === i ? 2.5 : 1} />
              <text x={xx + 50} y={40} textAnchor="middle" className={s.t} style={{fontWeight: 600}}>{x.id}</text>
              <text x={xx + 50} y={58} textAnchor="middle" className={s.ts}>{x.sub}</text>
              {j < 3 ? (
                <g>
                  <line x1={xx + bw + 2} y1={44} x2={xx + 114} y2={44} stroke="var(--ifm-color-emphasis-600)" strokeWidth="1.5" />
                  <polygon points={`${xx + 117},44 ${xx + 110},40 ${xx + 110},48`} fill="var(--ifm-color-emphasis-600)" />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      <table className={s.grid}>
        <tbody>
          <tr>
            <th>보는 것</th>
            <td style={{textAlign: 'left'}}>{st.see}</td>
          </tr>
          <tr>
            <th>오차를 두는 곳</th>
            <td style={{textAlign: 'left'}}>{st.err}</td>
          </tr>
          <tr>
            <th>이 단계의 예</th>
            <td style={{textAlign: 'left'}}>{st.ex}</td>
          </tr>
        </tbody>
      </table>
      <Note>
        어느 단계에서나 곁들일 수 있는 도구도 있습니다. {TOOLS.join(' / ')}.
      </Note>
    </Viz>
  );
}
