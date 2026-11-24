---
title: Continuous batching
sidebar_position: 58
mdx:
  format: mdx
---

import SlotSchedule from '@site/src/components/viz/dl/d4/SlotSchedule';
import PageAlloc from '@site/src/components/viz/dl/d4/PageAlloc';
import Quiz from '@site/src/components/viz/Quiz';

continuous batching은 매 회전(모델을 한 번 통과하는 계산 한 번)마다 끝난 요청을 빼고, decode 중인 요청(token을 하나씩 이어 쓰는 중)과 새 요청의 prefill 조각(prompt를 읽는 일의 일부)을 같은 가중치 읽기에 같이 넣는 서빙 방식입니다.

에이전트를 만들 때는 자체 서빙이나 서빙 엔진 설정에서 만납니다.

- **서빙 엔진**: vLLM, SGLang, TGI 같은 엔진이 기본으로 씁니다. 동시 요청 수를 늘리면 처리량은 오르고 요청 하나의 지연은 그대로이거나 늘 수 있습니다.
- **prefix cache**: 에이전트는 시스템 prompt와 도구 정의가 매 호출 앞에 똑같이 붙습니다. 앞부분이 같으면 그 키와 값은 다시 계산하지 않습니다.
- **KV cache 메모리**: 동시에 받을 수 있는 요청 수의 한도를 정합니다.
- **첫 token 시간**: 긴 prompt가 다른 요청의 decode를 막지 않도록 prefill을 잘라 넣습니다.

## 계산

[Prefill, decode](../nlp/prefill-decode.md)와 같이 가중치가 \(4 \times 4\) 행렬 하나뿐인 모델로 단순화합니다. 가중치 16개, 하나에 2바이트라 회전마다 읽기는 32바이트이고, token \(M\)개를 곱하면 연산은 \(2 \times M \times 16\)입니다. 요청 A는 캐시(앞 token마다 어텐션이 쓰는 키와 값을 남겨 둔 KV cache)를 갖고 다음 token 하나를 기다리고, 요청 B의 prompt는 8 token입니다.

B의 8 token을 한 회전에 모두 넣으면 A의 1칸을 더해 \(M = 9\), 연산은 \(2 \times 9 \times 16 = 288\)입니다. 이 연산이 끝나야 A의 다음 token이 나옵니다. A만 있었다면 32면 끝났습니다. 8 token을 4칸씩 나누면 이렇습니다.

```text
회전   A            B              M    연산
1      decode 1칸   prefill 1-4    5    160
2      decode 1칸   prefill 5-8    5    160
3      decode 1칸   decode 1칸     2    64
```

A는 첫 회전이 끝나는 연산 160에서 token을 받습니다. 연산 합은 \(160 + 160 = 320\)으로 한 번에 넣은 288보다 크지만 A는 288을 기다리지 않습니다. 긴 prompt를 이렇게 잘라 넣는 것이 chunked prefill입니다. 3회전부터 B도 decode이고, 같은 읽기 32바이트로 token 두 개를 처리합니다.

아래 그림에서 요청 길이와 자리 수를 바꿔, 미리 정한 batch와 continuous batching에서 빈 자리가 어떻게 채워지는지 보세요.

<SlotSchedule />

이제 캐시 메모리를 봅니다. 요청이 얼마나 길어질지 미리 모르니 최대 길이만큼 연속으로 예약하는 것이 쉬운 방법이지만 낭비가 큽니다. 그래서 4 token짜리 page를 필요한 만큼 붙입니다(PagedAttention). 최대 길이를 16 token으로 예약하면 token 3개인 A는 13칸이, 8개인 B는 8칸이 비어 32칸 중 실제 캐시는 11칸입니다. page로 붙이면 A는 page 1개(마지막에 1칸 빔), B는 page 2개입니다. 아래 그림에서 두 방식의 빈 칸을 비교해 보세요.

<PageAlloc />

## 기억할 것 세 가지

### batch가 크다고 요청 하나가 빨라지지는 않습니다

A가 token을 받는 시점은 회전이 끝나는 때입니다. \(M = 9\)인 회전은 연산 288이 끝나야, \(M = 5\)인 회전은 160이 끝나야 받습니다. 처리량(같은 읽기로 처리하는 token 수)과 요청 하나의 지연은 다른 값입니다.

### 앞부분이 같아야 캐시를 재사용합니다

같은 prompt 앞부분을 요청들이 공유하면 그 page는 한 번만 둡니다(prefix cache). 다른 요청이 B의 앞 4 token과 같은 앞부분으로 시작하면, 그 4 token의 키와 값은 다시 계산하지 않고 뒷부분만 prefill합니다. 시스템 prompt나 도구 목록 중간에 매번 바뀌는 값(시각 등)을 넣으면 그 뒤가 모두 다시 계산됩니다. 바뀌는 내용은 prompt 끝쪽에 둡니다.

### page도 빈 칸을 모두 없애지는 않습니다

마지막 page의 남은 칸은 빕니다. 없어지는 것은 최대 길이 전체를 미리 잡아 두던 낭비입니다. 메모리가 부족하면 진행 중인 요청을 멈추고 page를 반납하며(preemption), 다시 돌릴 때는 prefill부터 키와 값을 새로 만듭니다. 그 요청의 첫 token 시간이 늘어납니다.

## 퀴즈

<Quiz items={[
  {ask: '요청 A는 decode 1칸을 기다리고, 요청 B의 8 token prompt를 한 회전에 통째로 prefill합니다. A는 언제 다음 token을 받나요?', opts: ['B와 무관하게 바로 받습니다', 'B의 prefill까지 포함한 그 회전이 끝날 때 받습니다', 'B의 prefill이 끝난 다음 회전에 받습니다'], ans: 1, why: '한 회전의 연산은 같은 가중치 읽기에 모두 얹혀 있어서 회전 전체가 끝나야 결과가 나옵니다. 긴 prompt 하나가 짧은 decode를 붙잡는 것을 막으려고 chunked prefill로 잘라 넣습니다.'},
  {ask: 'page 크기가 4 token이고 요청의 token이 9개입니다. 마지막 page에서 비는 칸은 몇 칸인가요?', opts: ['0칸', '1칸', '3칸'], ans: 2, why: '9 token은 page 2개(8 token)가 차고 1 token이 세 번째 page에 들어갑니다. 세 번째 page는 4칸 중 1칸만 쓰므로 3칸이 빕니다.'},
  {ask: '시스템 prompt 맨 앞에 요청마다 바뀌는 현재 시각을 넣었습니다. prefix cache는 어떻게 되나요?', opts: ['시각 뒷부분은 여전히 재사용됩니다', '앞부분이 달라져 그 뒤가 모두 다시 계산됩니다', '캐시는 시각과 무관합니다'], ans: 1, why: 'prefix cache는 처음부터 이어서 같은 token열만 재사용합니다. 맨 앞이 달라지면 그 뒤의 키와 값도 모두 달라지므로 재사용할 수 없습니다.'},
]} />

<details>
<summary>더 깊이: disaggregation, speculative decoding</summary>

- prefill은 token이 많아 계산량이 시간을 정하는 compute-bound이고, decode는 token 하나라 가중치 읽기가 시간을 정하는 memory-bound입니다. prefill 전용 기계가 캐시를 만들어 decode 전용 기계로 넘기면 decode 줄이 prefill의 행렬 곱을 기다리지 않습니다(prefill-decode disaggregation). 넘기는 것은 가중치가 아니라 키와 값입니다.
- 앞부분을 token 열의 나무에서 찾아 재사용하는 구현을 radix cache라고 합니다.
- speculative decoding은 작은 모델이 초안으로 3 token을 뽑고 큰 모델이 한 번의 prefill처럼 검사해, 큰 모델의 읽기 1번으로 여러 token을 얻으려는 방법입니다. 초안 비율 \(q\), 큰 모델 비율 \(p\)이면 그 token을 \(\min(1, p/q)\)의 확률로 남깁니다. 초안 0.8에 큰 모델 0.9이면 \(0.9/0.8 = 1.125\)라 1로 잘려 남고, 초안 0.8에 큰 모델 0.2이면 0.25의 확률로 남습니다. 거절한 token의 뒤는 버립니다. 초안이 자주 맞으면 한 읽기에 남는 token이 늘고, 자주 틀리면 버린 초안을 계산한 시간만 듭니다.
- 이 페이지의 연산과 바이트 수는 계산이 보이게 고른 수입니다. 가중치를 GPU 여러 장에 나누는 방법은 [Parallelism](./parallel.md)에 있습니다.

</details>
