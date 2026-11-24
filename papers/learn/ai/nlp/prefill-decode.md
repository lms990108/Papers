---
title: Prefill, decode
sidebar_position: 40
mdx:
  format: mdx
---

import KvCacheGrowth from '@site/src/components/viz/nlp/g6/KvCacheGrowth';
import Quiz from '@site/src/components/viz/Quiz';

LLM 서빙은 두 구간으로 나뉩니다. prompt의 token을 한꺼번에 읽는 구간이 prefill이고, 그다음부터 token을 하나씩 이어 쓰는 구간이 decode입니다. 에이전트 개발에서 지연 시간과 비용을 직접 좌우하는 개념입니다.

- **지연 시간**: 첫 token이 나오기까지의 시간(TTFT)은 prefill이, token 사이의 간격(TPOT)은 decode가 정합니다.
- **입력과 출력의 단가 차이**: 입력 token과 출력 token의 요금이 다른 데에는 두 구간의 계산 방식 차이가 있습니다.
- **prompt caching**: 앞부분이 같으면 prefill을 건너뜁니다. 에이전트 루프에서 효과가 큰 최적화입니다.
- **KV cache 메모리**: 긴 context와 동시 요청이 많을수록 GPU 메모리를 먹습니다. → [Continuous batching](../deep-learning/serving.md)

## 왜 필요한가

LLM은 token을 하나씩 이어 쓰고([다음 token](./next-token.md)), 새 token 하나를 만들려면 그 앞의 모든 token을 읽어야 합니다. 그래서 서빙에는 성격이 다른 일이 둘 생깁니다. 하나는 사용자가 보낸 prompt를 읽는 일입니다. prompt의 token은 이미 다 주어져 있어서 한꺼번에 처리할 수 있습니다. 다른 하나는 답을 쓰는 일입니다. 다음 token은 앞 token을 고른 뒤에야 알 수 있어서 하나씩 순서대로 만들 수밖에 없습니다. 앞의 일이 prefill, 뒤의 일이 decode입니다. 시간이 걸리는 이유와 병목이 달라서 따로 봐야 합니다.

가장 단순한 구현은 token을 하나 만들 때마다 prompt와 지금까지의 출력 전체를 처음부터 다시 계산하는 것입니다. prompt가 4,000 token이고 출력이 500 token이라고 합시다. token 하나를 처리하는 일을 1로 세면(어텐션이 길이에 따라 커지는 효과는 뺀 단순화입니다), 매번 다시 계산할 때는 \(4{,}000 + 4{,}001 + \dots + 4{,}499 = 2{,}124{,}750\)입니다. 이전 계산을 남겨 두면 prompt 4,000에 새 token 500을 더한 4,500 안팎입니다. 약 470배 차이입니다.

남겨 둘 것은 앞 token의 key와 value([셀프 어텐션](./self-attention.md)에서 어텐션 점수와 출력을 만드는 데 쓰는 값)입니다. 생성용 모델의 어텐션은 각 token이 자기와 앞만 읽으므로 앞 token의 key와 value는 뒤에 무엇이 붙어도 바뀌지 않습니다. 한 번 계산해 저장하면 되고, 이 저장이 KV cache입니다. 대가는 GPU 메모리입니다. key와 value는 층([Decoder block](./block.md))마다 token마다 있어서 길이와 동시 요청 수에 따라 크게 늡니다. 이 문서는 두 구간의 시간과 KV cache의 메모리를 숫자로 따라갑니다.

## 계산

TTFT(time to first token)는 요청을 보낸 뒤 첫 token이 나올 때까지의 시간이고, TPOT(time per output token)는 그 뒤 출력 token 하나당 걸리는 시간입니다. 응답 시간은 대략 이렇게 나뉩니다.

\[
\text{응답 시간} \approx \mathrm{TTFT} + (\text{출력 token 수}) \times \mathrm{TPOT}
\]

예시 값으로 TTFT 0.8초, TPOT 25ms(초당 40 token)에 출력이 500 token이면 \(0.8 + 500 \times 0.025 = 13.3\)초입니다. 이 중 12.5초가 decode입니다. 입력을 두 배로 늘리면 TTFT가 늘고, 출력을 두 배로 늘리면 decode 시간이 거의 두 배가 됩니다.

token 하나당 걸리는 시간은 prefill이 decode보다 훨씬 짧습니다. 하는 일이 다르기 때문입니다. prefill은 token 여러 개가 가중치를 한 번 읽는 동안 함께 곱해져서 계산이 빽빽합니다(계산 속도가 시간을 정하는 compute-bound). decode는 token 하나를 만들 때마다 가중치 전체를 다시 읽습니다. 70억 파라미터 모델을 bfloat16으로 두면 14GB입니다. 메모리 대역폭이 초당 2TB인 GPU는 이것을 읽는 데만 7ms가 듭니다(메모리에서 읽는 속도가 시간을 정하는 memory-bound). token 하나에 최소 7ms이므로 요청 하나의 속도는 이론상 초당 140 token 안팎이 상한입니다.

decode의 한 걸음에서 KV cache는 이렇게 쓰입니다. 새 token은 자기 key와 value만 새로 계산해 cache에 덧붙이고, 앞 token의 값은 cache에서 읽습니다. query는 한 번 쓰고 버립니다. 과거 token의 query는 다시 쓰이지 않아서 저장하지 않습니다. 아래 그림에서 prefill 뒤에 token이 하나씩 붙을 때 캐시가 쌓이는 모습과, 캐시가 없을 때 다시 계산해야 하는 양을 비교해 보세요.

<KvCacheGrowth />

## 기억할 것 네 가지

### 지연 시간은 대부분 출력 길이가 정합니다

입력 수천 token을 읽는 prefill은 한 번에 끝나지만, 출력은 token마다 한 번씩 모델이 돕니다. 응답을 빠르게 하려면 출력을 줄이는 것이 효과가 큽니다. 간결하게 답하라는 지시, `max_tokens` 상한, JSON의 불필요한 필드 제거가 그 방법입니다. 스트리밍은 총 시간을 줄이지 않고 첫 token이 보이는 시간만 앞당깁니다.

### 앞부분이 같으면 캐시를 재사용합니다

prompt caching은 요청의 앞부분이 이전과 정확히 같으면 그 구간의 KV cache를 다시 쓰고 prefill을 건너뜁니다. TTFT가 줄고, 캐시된 입력은 보통 훨씬 싸게 과금됩니다. KV cache가 요청 하나 안에서 decode가 쓰는 저장이라면, prompt caching은 그 저장을 요청 사이에서 다시 쓰는 기능입니다. 적용됐는지는 API 응답의 usage에서 확인합니다. 입력 token, 출력 token, 캐시에서 읽은 입력 token이 따로 나오고 필드 이름은 제공사마다 다릅니다. 캐시는 앞에서부터 이어지는 구간 단위이므로 앞부분이 한 글자라도 바뀌면 그 뒤는 전부 다시 계산합니다.

지키면 좋은 순서가 있습니다. system prompt, 도구 정의, 긴 문서처럼 변하지 않는 것은 앞에 두고, 현재 시각이나 사용자 이름처럼 바뀌는 값은 뒤에 둡니다. 에이전트 루프는 단계마다 이전 대화 전체가 앞부분으로 반복되므로 캐시 효과가 큽니다. [LLM](./llm.md)의 예(요청 \(k\)의 입력이 \(2{,}000 \times k\) token)에서는 요청 \(k\)의 앞 \(2{,}000 \times (k-1)\) token이 직전 요청과 같습니다. 캐시가 유지된다면 새로 읽을 것은 요청마다 2,000 token뿐이라, 10번의 prefill이 110,000 token에서 20,000 token으로 줄어듭니다. 캐시에는 유효 시간이 있어서 요청이 오래 끊기면 사라집니다.

### KV cache는 가중치만큼 메모리를 먹습니다

token 하나의 캐시 크기는 다음과 같습니다.

\[
\text{token당 KV cache} = 2 \times \text{층 수} \times \text{KV 헤드 수} \times \text{헤드 크기} \times \text{바이트}
\]

앞의 2는 key와 value 두 벡터를 저장한다는 뜻이고, KV 헤드 수는 key와 value를 따로 두는 헤드의 수입니다.

층 32, KV 헤드 8, 헤드 크기 128, bfloat16(2바이트)이면 \(2 \times 32 \times 8 \times 128 \times 2 = 131{,}072\)바이트, 곧 128KiB입니다. 8,000 token의 요청 하나가 약 1GB이고, 동시에 32개를 처리하면 약 34GB입니다. 이 구성은 파라미터가 80억 개쯤인 모델에 해당하고(앞의 70억 개 예보다 조금 큽니다) bfloat16 가중치는 약 16GB입니다. 그래서 긴 context를 많은 사용자에게 서비스할 때는 캐시가 가중치보다 큰 비용이 됩니다. 메모리가 모자라면 캐시를 지우고 그 요청의 prefill부터 다시 하거나 요청을 대기시킵니다.

### TTFT와 TPOT를 따로 봅니다

화면에 글이 흘러나오는 챗 UI는 TTFT가 체감을 정하고, 긴 답을 받아 처리하는 에이전트는 TPOT가 총 시간을 정합니다. 느리다는 증상이 어느 쪽인지 나눠야 고칠 곳이 보입니다. 입력이 길어서 첫 token이 늦은 것인지, 출력이 길어서 끝이 늦은 것인지 구분합니다.

## 퀴즈

<Quiz items={[
  {ask: '긴 system prompt 맨 앞에 "현재 시각: 14:03:22"를 넣었습니다. 매 요청마다 시각이 바뀝니다. prompt caching은 어떻게 되나요?', opts: ['시각이 바뀌어도 그 뒤의 긴 system prompt는 캐시된다', '앞부분이 바뀌므로 그 뒤 전체가 매번 다시 계산된다', '시각 부분만 다시 계산된다'], ans: 1, why: '캐시는 앞에서부터 이어서 같은 구간에만 적용됩니다. 맨 앞이 바뀌면 그 뒤가 같아도 캐시를 쓰지 못합니다. 바뀌는 값은 prompt 뒤쪽으로 옮겨야 합니다.'},
  {ask: '응답이 너무 느려서 줄이려 합니다. 입력을 1,000 token 줄이는 것과 출력을 100 token 줄이는 것 중 보통 어느 쪽이 시간을 더 줄이나요?', opts: ['입력 1,000 token 줄이기', '출력 100 token 줄이기', '거의 같다'], ans: 1, why: '출력은 token마다 한 번씩 모델이 돌아 100 token이면 TPOT 25ms 기준 2.5초입니다. 입력 1,000 token은 prefill에서 한꺼번에 처리되어 보통 그보다 짧게 걸립니다. 서빙 환경에 따라 달라지지만 token당 시간은 출력이 훨씬 큽니다.'},
]} />

<details>
<summary>더 깊이: 바이트당 연산, KV recomputation, 디코딩 방법</summary>

- 연산 횟수를 읽은 바이트로 나눈 값이 arithmetic intensity입니다. \(4 \times 4\) 가중치(bfloat16, 32바이트)에 token \(M\)개를 곱하면 연산이 \(2 \times M \times 16\)번입니다. prefill 4 token은 128번 연산에 32바이트 읽기라 바이트당 4번이고, decode 1 token은 32번에 32바이트라 바이트당 1번입니다. 행렬이 커져도 이 값은 한 번에 곱하는 token 수가 정합니다. 여러 요청을 묶어 decode에 token을 늘리는 것이 continuous batching의 원리입니다.
- 캐시가 없으면 다섯째 token을 만들 때 앞 4 token의 곱을 다시 합니다. 이 예에서 연산이 32번 대신 160번입니다. 캐시가 모자라 지우고 prefill을 처음부터 다시 하는 것을 KV recomputation이라고 합니다.
- 모델은 token마다 점수(logit)를 내고, 소프트맥스를 거쳐 비율이 되며, 그 로그가 logprob입니다. 점수 2, 1, 0의 비율은 0.665, 0.245, 0.090입니다.
- greedy는 가장 큰 비율을 고릅니다. top-k는 상위 k개만 남깁니다. top-p는 큰 비율부터 더해 합이 p가 되는 곳에서 끊습니다. p가 0.9면 0.665와 0.245가 남습니다. min-p는 1등 비율에 정한 값을 곱한 것보다 작은 후보를 버립니다.
- EOS는 문장이 끝났다는 특수 token으로, 이것이 뽑히면 decode를 멈춥니다. beam search는 후보 문장을 여러 개 유지하며 logprob 합이 큰 길을 남깁니다.
- 요청 하나의 TPOT를 줄이려면 모델을 작게 하거나 양자화해 읽는 바이트를 줄이는 방법이 있습니다. 처리량을 올리려면 여러 요청을 묶습니다. → [Continuous batching](../deep-learning/serving.md)

</details>
