import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, styles as s} from '../../Viz';
import {comma} from './dlmath';

// 원문: 사전 4개, 목록 길이 2, 블록은 2x2 가중치 + 바이어스 2
const V = 4;
const D = 2;
const BLOCK = D * D + D;
const SHOW = 8;

export default function SentenceBlocks() {
  const [len, setLen] = useState(3);
  const [blocks, setBlocks] = useState(2);
  const [shared, setShared] = useState(true);
  const embed = V * D;
  const score = V * D;
  const blockParams = shared ? blocks * BLOCK : blocks * BLOCK * len;
  const total = embed + blockParams + score;
  const mults = blocks * len * D * D;
  const shown = Math.min(len, SHOW);

  return (
    <Viz
      title="문장이 길어지면 무엇이 늘고 무엇이 그대로인가"
      caption="사전 4개, 목록 길이 2, 블록 하나는 2×2 가중치와 바이어스 2개로 둔 원문의 단순한 모델입니다. 기본값(토큰 3개, 블록 2개)에서 임베딩 8 + 블록 12 + 점수 표 8 = 28이고, 토큰 300개에서 곱셈은 2,400번입니다."
    >
      <Controls>
        <Slider label="토큰 수" min={1} max={300} value={len} onChange={setLen} />
        <Slider label="블록 수" min={1} max={6} value={blocks} onChange={setBlocks} />
        <Btn on={len === 3} onClick={() => setLen(3)}>
          3개
        </Btn>
        <Btn on={len === 300} onClick={() => setLen(300)}>
          300개
        </Btn>
      </Controls>
      <Controls>
        <Btn on={shared} onClick={() => setShared(true)}>
          자리가 빈칸을 같이 씀 (원문)
        </Btn>
        <Btn on={!shared} onClick={() => setShared(false)}>
          자리마다 따로 빈칸 (비교용)
        </Btn>
      </Controls>
      <svg className={s.svg} viewBox="0 0 560 230" role="img" aria-label={`토큰 ${len}개가 블록 ${blocks}개를 지나는 그림. ${shared ? '블록마다 빈칸 한 벌을 모든 자리가 공유' : '자리마다 따로 빈칸'}`}>
        {Array.from({length: shown}, (_, i) => {
          const bw = (500 - 8 * (shown - 1)) / shown;
          return (
            <g key={i}>
              <rect x={30 + i * (bw + 8)} y={8} width={bw} height={24} rx={4} fill="var(--ifm-color-emphasis-100)" stroke="var(--ifm-color-emphasis-400)" />
              <text x={30 + i * (bw + 8) + bw / 2} y={24} textAnchor="middle" className={s.ts}>
                {`토큰 ${i + 1}`}
              </text>
            </g>
          );
        })}
        {len > SHOW ? (
          <text x={530} y={24} textAnchor="end" className={s.ts}>
            … 외 {len - SHOW}개
          </text>
        ) : null}
        {Array.from({length: blocks}, (_, b) => {
          const y = 46 + b * 30;
          if (shared) {
            return (
              <g key={b}>
                <rect x={30} y={y} width={500} height={24} rx={6} fill="var(--vb)" fillOpacity={0.22} stroke="var(--vb)" />
                <text x={280} y={y + 16} textAnchor="middle" className={s.t}>
                  블록 {b + 1} · 빈칸 {BLOCK}개를 모든 자리가 같이 씀
                </text>
              </g>
            );
          }
          const bw = (500 - 8 * (shown - 1)) / shown;
          return (
            <g key={b}>
              {Array.from({length: shown}, (_, i) => (
                <rect key={i} x={30 + i * (bw + 8)} y={y} width={bw} height={24} rx={4} fill="var(--vbad)" fillOpacity={0.18} stroke="var(--vbad)" />
              ))}
              <text x={280} y={y + 16} textAnchor="middle" className={s.t}>
                블록 {b + 1} · 자리마다 빈칸 {BLOCK}개씩
              </text>
            </g>
          );
        })}
      </svg>
      <Stats>
        <Stat label="임베딩 표 (4×2)" value={embed} />
        <Stat label="블록 파라미터" value={comma(blockParams)} tone={shared ? 'good' : 'bad'} />
        <Stat label="점수 표 (4×2)" value={score} />
        <Stat label="파라미터 합" value={comma(total)} />
        <Stat label="블록 곱셈 횟수" value={comma(mults)} />
      </Stats>
      <Note>
        {shared
          ? '토큰 수를 올리면 곱셈 횟수만 늘고 블록 파라미터는 그대로입니다. 한 블록 안에서 자리가 달라도 같은 빈칸을 쓰기 때문입니다.'
          : '자리마다 따로 두면 블록 파라미터가 자리 수만큼 곱해집니다(이 비교는 같은 블록을 자리 수만큼 따로 둔다는 단순한 가정입니다). 문장이 준비한 자리보다 길면 받을 수도 없습니다.'}
      </Note>
    </Viz>
  );
}
