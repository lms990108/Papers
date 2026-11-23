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

## 계산

응답 시간은 대략 이렇게 나뉩니다.

\[
\text{응답 시간} \approx \mathrm{TTFT} + (\text{출력 token 수}) \times \mathrm{TPOT}
\]

예시 값으로 TTFT 0.8초, TPOT 25ms(초당 40 token)에 출력이 500 token이면 \(0.8 + 500 \times 0.025 = 13.3\)초입니다. 이 중 12.5초가 decode입니다. 입력을 두 배로 늘리면 TTFT가 늘고, 출력을 두 배로 늘리면 decode 시간이 거의 두 배가 됩니다.

prefill과 decode의 속도 차이는 하는 일이 달라서 생깁니다. prefill은 token 여러 개가 가중치를 한 번 읽는 동안 함께 곱해져서 계산이 빽빽합니다(compute-bound). decode는 token 하나를 만들 때마다 가중치 전체를 다시 읽습니다. 70억 파라미터 모델을 bfloat16으로 두면 14GB입니다. 메모리 대역폭이 초당 2TB인 GPU는 이것을 읽는 데만 7ms가 듭니다(memory-bound). token 하나에 최소 7ms이므로 요청 하나의 속도는 이론상 초당 140 token 안팎이 상한입니다.

decode가 매번 앞 token을 다시 계산하지 않도록 남겨 두는 것이 KV cache입니다. 아래 그림에서 prefill 뒤에 token이 하나씩 붙을 때 캐시가 쌓이는 모습과, 캐시가 없을 때 다시 계산해야 하는 양을 비교해 보세요.

<KvCacheGrowth />

## 기억할 것 네 가지

### 지연 시간은 대부분 출력 길이가 정합니다

입력 수천 token을 읽는 prefill은 한 번에 끝나지만, 출력은 token마다 한 번씩 모델이 돕니다. 응답을 빠르게 하려면 출력을 줄이는 것이 효과가 큽니다. 간결하게 답하라는 지시, `max_tokens` 상한, JSON의 불필요한 필드 제거가 그 방법입니다. 스트리밍은 총 시간을 줄이지 않고 첫 token이 보이는 시간만 앞당깁니다.

### 앞부분이 같으면 캐시를 재사용합니다

prompt caching은 요청의 앞부분이 이전과 정확히 같으면 그 구간의 KV cache를 다시 쓰고 prefill을 건너뜁니다. TTFT가 줄고, 캐시된 입력은 보통 훨씬 싸게 과금됩니다. 캐시는 앞에서부터 이어지는 구간 단위이므로 앞부분이 한 글자라도 바뀌면 그 뒤는 전부 다시 계산합니다.

지키면 좋은 순서가 있습니다. system prompt, 도구 정의, 긴 문서처럼 변하지 않는 것은 앞에 두고, 현재 시각이나 사용자 이름처럼 바뀌는 값은 뒤에 둡니다. 에이전트 루프는 단계마다 이전 대화 전체가 앞부분으로 반복되므로 캐시 효과가 큽니다. 캐시에는 유효 시간이 있어서 요청이 오래 끊기면 사라집니다.

### KV cache는 가중치만큼 메모리를 먹습니다

token 하나의 캐시 크기는 다음과 같습니다.

\[
\text{token당 KV cache} = 2 \times \text{층 수} \times \text{KV 헤드 수} \times \text{헤드 크기} \times \text{바이트}
\]

층 32, KV 헤드 8, 헤드 크기 128, bfloat16(2바이트)이면 \(2 \times 32 \times 8 \times 128 \times 2 = 131{,}072\)바이트, 곧 128KiB입니다. 8,000 token의 요청 하나가 약 1GB이고, 동시에 32개를 처리하면 약 34GB입니다. 이 구성의 모델 가중치는 약 16GB라, 긴 context를 많은 사용자에게 서비스할 때는 캐시가 가중치보다 큰 비용이 됩니다. 메모리가 모자라면 캐시를 지우고 그 요청의 prefill부터 다시 하거나 요청을 대기시킵니다.

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
