import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Bar, Note} from '../../Viz';

const f = (n) => Math.round(n).toLocaleString('en-US');
const PROMPT = 800; // 설명용: 추출 지시문 토큰
const SUM_IN = 2000; // 설명용: 요약 호출 한 번의 입력 토큰

export const chunkCount = (tokens, size, overlap) => {
  if (tokens <= 0) return 0;
  const stride = Math.max(1, size - overlap);
  return tokens <= size ? 1 : 1 + Math.ceil((tokens - size) / stride);
};

export default function IndexCost() {
  const [tokens, setTokens] = useState(1000000);
  const [size, setSize] = useState(600);
  const [glean, setGlean] = useState(0);
  const [ratio, setRatio] = useState(0.5);
  const [par, setPar] = useState(8);
  const [sec, setSec] = useState(10);
  const overlap = Math.min(100, size - 100);
  const chunks = chunkCount(tokens, size, overlap);
  const extract = chunks * (1 + glean);
  const summary = Math.round(chunks * ratio);
  const calls = extract + summary;
  const readTok = extract * (size + PROMPT) + summary * SUM_IN;
  const minutes = (calls * sec) / par / 60;

  return (
    <Viz
      title="색인 비용 계산기: 청크 수와 LLM 호출 수"
      caption="아주 단순한 설명용 모델입니다. 호출 수 = 청크 수 × (1 + 추가 추출 횟수) + 커뮤니티 요약 호출 수이고, 추출 지시문 800토큰, 요약 호출 입력 2,000토큰, 호출 시간은 모두 설명용 값입니다. 실제 시간과 비용은 모델, 프롬프트, 요금제, 병렬 한도에 따라 크게 달라지며, 논문이 보고한 값(팟캐스트 인덱싱 281분)을 재현하려는 계산이 아닙니다."
    >
      <Controls>
        <Slider label="코퍼스 토큰 수" min={100000} max={3000000} step={50000} value={tokens} onChange={setTokens} format={f} />
        <Slider label="청크 크기" min={200} max={2400} step={100} value={size} onChange={setSize} />
        <Slider label="추가 추출 횟수" min={0} max={3} value={glean} onChange={setGlean} />
      </Controls>
      <Controls>
        <Slider label="요약 호출/청크" min={0} max={2} step={0.1} value={ratio} onChange={setRatio} format={(v) => v.toFixed(1)} />
        <Slider label="병렬 호출 수" min={1} max={64} value={par} onChange={setPar} />
        <Slider label="호출 1회(초)" min={1} max={60} value={sec} onChange={setSec} />
      </Controls>
      <Bar label="벡터 RAG: 생성 LLM 호출" value={0} max={Math.max(1, calls)} color="var(--va)" text="0회 (임베딩 호출만 청크 수만큼)" />
      <Bar label="GraphRAG: 개체 추출 호출" value={extract} max={Math.max(1, calls)} color="var(--vb)" text={`${f(extract)}회`} />
      <Bar label="GraphRAG: 요약 호출" value={summary} max={Math.max(1, calls)} color="var(--vc)" text={`${f(summary)}회`} />
      <Stats>
        <Stat label="청크 수" value={`${f(chunks)}개`} />
        <Stat label="LLM 호출 합계" value={`${f(calls)}회`} tone={calls > 5000 ? 'bad' : undefined} />
        <Stat label="LLM 입력 합계" value={`약 ${(Math.round(readTok / 100000) / 10).toFixed(1)}M 토큰`} />
        <Stat label="예상 시간" value={minutes >= 120 ? `${(minutes / 60).toFixed(1)}시간` : `${f(minutes)}분`} />
      </Stats>
      <Note>
        {size >= 1200
          ? '청크를 키우면 호출 수는 줄지만, 논문(부록 A.2)은 같은 코퍼스에서 청크를 600에서 2,400토큰으로 키우면 추출된 개체 언급이 거의 절반이 된다고 보고했습니다(HotPotQA, GPT-4). 호출을 아끼는 대신 그래프가 성글어집니다.'
          : glean > 0
            ? '추가 추출은 청크마다 LLM에게 놓친 개체가 없는지 되묻는 단계입니다. 그래프는 촘촘해지지만 호출이 그만큼 늘어납니다.'
            : '청크 수와 추가 추출 횟수를 올려 보세요. 벡터 RAG는 같은 코퍼스에 LLM 호출 없이 임베딩만 만듭니다.'}
      </Note>
    </Viz>
  );
}
