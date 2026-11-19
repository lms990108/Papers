import React, {useState} from 'react';
import {Viz, Controls, Slider, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

// 설명용 질문: "입사 첫해 연차는 며칠이고, 병가는 연차에서 빠지나요?" (필요한 청크: c1, c2)
const STEPS = [
  {q: '입사 첫해 연차 일수', got: 'c1 연차는 15일입니다. 입사 첫해는 11일입니다.', more: '병가 이야기가 아직 없음. 한 번 더 찾기', stop: '병가 이야기가 없는 채로 답하기(t = 1이라 멈춤)'},
  {q: '병가는 연차에서 빠지는지', got: 'c2 병가는 연차와 별도입니다.', more: '필요한 두 청크가 모였지만 한 번 더 찾기', stop: '두 가지가 다 모임. 답하기'},
];
const EXTRA = {q: '이미 한 질의와 비슷한 질의(설명용)', got: '새로운 청크 없음. 이미 본 청크만 돌아옴', more: '그래도 한 번 더 찾기', stop: '더 찾지 않고 답하기'};

const f = (n) => Math.round(n).toLocaleString('en-US');

export default function AgentLoop() {
  const [t, setT] = useState(2);
  const [S, setS] = useState(100);
  const [L, setL] = useState(2000);
  const [pt, setPt] = useState(300);
  const [r, setR] = useState(400);
  const [pp, setPp] = useState(95);

  // 에이전트형: 검색 t번이면 모델 호출은 t+1번. i번째 호출은 질문 + 앞서 붙은 검색 결과 (i-1)개를 읽는다.
  const calls = t + 1;
  const lat = calls * L + t * S;
  const tok = calls * pt + r * ((t * (t + 1)) / 2);
  // 기본 RAG: 검색 1번, 모델 1번, 청크 묶음 하나.
  const baseLat = L + S;
  const baseTok = pt + r;
  const ok = Math.pow(pp / 100, t);

  const steps = [];
  for (let i = 0; i < t; i += 1) steps.push(i < STEPS.length ? STEPS[i] : EXTRA);

  return (
    <Viz
      title="에이전트 루프의 호출 수와 대가"
      caption="검색 횟수 t를 바꿔 보세요. 한 번 검색할 때마다 모델이 다음 행동을 정하는 호출이 하나 더 필요하다고 단순하게 가정했습니다. 시간, 토큰, 정상 확률 p는 모두 설명용 값이고, 캐시와 병렬 호출은 무시했으며, 단계들이 서로 독립이라고 가정했습니다."
    >
      <Controls>
        <Slider label="검색 횟수 t" min={1} max={8} value={t} onChange={setT} />
        <Slider label="검색 1번(ms)" min={10} max={1000} step={10} value={S} onChange={setS} format={f} />
        <Slider label="모델 호출 1번(ms)" min={500} max={5000} step={100} value={L} onChange={setL} format={f} />
      </Controls>
      <Controls>
        <Slider label="지시+질문(토큰)" min={100} max={1000} step={50} value={pt} onChange={setPt} />
        <Slider label="검색 결과 1번(토큰)" min={100} max={1000} step={50} value={r} onChange={setR} />
        <Slider label="단계당 정상 확률(%)" min={50} max={100} step={1} value={pp} onChange={setPp} />
      </Controls>
      <div className={s.note} style={{margin: '0 0 6px'}}>질문: 입사 첫해 연차는 며칠이고, 병가는 연차에서 빠지나요?</div>
      {steps.map((st, i) => (
        <div
          key={i}
          style={{
            padding: '5px 10px',
            marginBottom: 4,
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: 8,
            fontSize: '0.84rem',
            lineHeight: 1.5,
          }}
        >
          <b>{i + 1}번째.</b> 모델: 검색어 “{st.q}” → 돌아온 것: {st.got} → 모델: {i === t - 1 ? st.stop : st.more}
        </div>
      ))}
      <div
        style={{
          padding: '5px 10px',
          marginBottom: 6,
          border: '1px solid var(--vok)',
          borderRadius: 8,
          fontSize: '0.84rem',
        }}
      >
        <b>{t + 1}번째 모델 호출.</b> 지금까지 붙은 검색 결과 {t}개를 읽고 답을 씁니다.
      </div>
      <table className={s.grid}>
        <thead>
          <tr>
            <th />
            <th>기본 RAG(검색 1번, 모델 1번)</th>
            <th>에이전트 루프(검색 {t}번)</th>
            <th>배수</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>모델 호출</td>
            <td>1번</td>
            <td>{calls}번</td>
            <td>{fmt(calls, 1)}배</td>
          </tr>
          <tr>
            <td>지연(순차)</td>
            <td>{f(baseLat)}ms</td>
            <td>{f(lat)}ms</td>
            <td>{fmt(lat / baseLat, 1)}배</td>
          </tr>
          <tr>
            <td>모델이 읽은 입력 토큰 합</td>
            <td>{f(baseTok)}</td>
            <td>{f(tok)}</td>
            <td>{fmt(tok / baseTok, 1)}배</td>
          </tr>
        </tbody>
      </table>
      <Stats>
        <Stat label="모든 단계가 정상일 확률" value={`${fmt(ok * 100, 1)}%`} tone={ok >= 0.9 ? 'good' : 'bad'} />
        <Stat label="단계 수(검색 + 답)" value={`${t + 1}`} />
      </Stats>
      <Note>
        t = 1이면 병가 이야기가 빠진 채 답하게 됩니다. 기본 RAG보다 모델 호출이 한 번 많은 것은 검색할지 정하는 호출이 따로 있기 때문입니다. t가 늘면 지연은 직선으로, 읽는 토큰은 제곱에 가깝게 늘어납니다. 검색 결과가 계속 붙어 앞의 내용을 매번 다시 읽기 때문입니다. t가 2를 넘으면 위 예에서는 새 청크가 없는데도 대가만 커집니다.
      </Note>
    </Viz>
  );
}
