---
title: Attention Is All You Need
sidebar_position: 2
mdx:
  format: mdx
---

import Quiz from '@site/src/components/viz/Quiz';

Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin. *NeurIPS*, 2017. [원문 PDF](https://arxiv.org/pdf/1706.03762)

## 세 줄 요약

1. 순환 신경망과 합성곱 없이, 어텐션만으로 만든 모델 트랜스포머(Transformer)를 제안한다.
2. 모든 token 쌍의 관계를 한 번에 계산해서 학습을 병렬로 돌릴 수 있다.
3. 기계 번역에서 기존 최고 성능을 넘으면서 학습 비용은 훨씬 적었다.

## 내용

### 풀려던 문제

당시 번역 같은 시퀀스 모델의 표준은 LSTM 같은 순환 신경망으로 만든 encoder-decoder였다. 순환 신경망은 앞 token을 처리해야 다음 token을 처리할 수 있다. 한 문장 안에서 병렬화가 안 되고, 문장이 길수록 학습이 느려진다. 먼 token끼리 정보가 오가려면 그 사이 단계를 모두 거쳐야 하는 것도 문제였다. 어텐션은 이미 쓰이고 있었지만 순환 신경망 위의 보조 장치였다. 이 논문은 보조 장치만으로 모델을 만들 수 있는지 묻는다. → [순환 신경망](../learn/ai/nlp/rnn.md)

### 구조

트랜스포머는 encoder와 decoder를 각각 6층씩 쌓는다. encoder의 한 층은 셀프 어텐션과 작은 신경망(feed-forward)으로 되어 있고, decoder의 한 층에는 앞 token만 보는 셀프 어텐션, encoder 출력을 읽는 어텐션, feed-forward가 있다. → [트랜스포머](../learn/ai/nlp/transformer.md)

- **scaled dot-product attention**: query와 key의 곱을 차원 수의 제곱근으로 나눠 소프트맥스를 거치고, value를 그 비율로 섞는다. → [어텐션](../learn/ai/nlp/attention.md)
- **멀티 헤드**: 어텐션을 8벌 두고 결과를 이어 붙인다. 헤드마다 다른 관계를 볼 수 있다.
- **위치 인코딩**: 어텐션은 순서를 모르므로, 위치마다 만든 벡터(sin과 cos 함수)를 입력에 더한다.

### 순환과 어텐션을 비교하면

길이 \(n\)인 입력에서 층 하나의 비교는 이렇다.

```text
                  순서대로 해야 하는 단계    두 token 사이 거리     계산량
순환 신경망          n                          n                n·d²
셀프 어텐션          1                          1                n²·d
```

\(n = 1{,}000\)이면 순환 신경망은 1,000단계를 차례로 밟아야 하지만, 어텐션은 한 단계에 \(10^6\)칸의 점수 표를 한꺼번에 계산한다. GPU는 한꺼번에 계산하는 일에 강하므로 어텐션이 훨씬 빨리 학습된다. 대신 표가 길이의 제곱으로 커진다.

### 결과

| 실험 | 결과 |
| --- | --- |
| WMT 2014 영어-독일어 | BLEU 28.4, 기존 최고(앙상블 포함)보다 2 이상 높음 |
| WMT 2014 영어-프랑스어 | BLEU 41.8, 8개 GPU로 3.5일 학습 |

기본 모델(base)은 8개 GPU로 12시간, 큰 모델(big)은 3.5일 학습했다. 번역이 아닌 영어 구문 분석에서도 잘 작동했고, 이미지, 오디오, 영상으로 확장하겠다는 계획도 밝혔다.

## 기억할 것

### 어텐션은 순서를 모릅니다

token 순서를 섞어도 각 token의 어텐션 결과는 같다. 그래서 위치 정보를 입력에 따로 더해야 한다. 이 논문은 고정된 sin, cos 함수를 썼고, 이후 모델들은 학습하는 방식이나 회전 방식으로 바꿨다.

### decoder에는 가림이 필요합니다

번역문을 한 token씩 생성할 때 아직 생성하지 않은 뒤 token은 볼 수 없다. 학습 때는 정답이 이미 입력에 있으므로 뒤 token을 점수에서 가려야 학습과 생성이 같아진다. 이 가림이 지금 LLM이 앞 token만 보는 이유다. → [셀프 어텐션](../learn/ai/nlp/self-attention.md)

### 비용은 길이의 제곱입니다

표가 \(n \times n\)이라 입력이 두 배가 되면 표는 네 배가 된다. 지금 context window와 프롬프트 비용의 바탕에 이 성질이 있다. → [Prefill, decode](../learn/ai/nlp/prefill-decode.md)

## 퀴즈

<Quiz items={[
  {ask: '순환 신경망 대신 셀프 어텐션을 쓰면 학습이 빨라지는 가장 큰 이유는 무엇인가요?', opts: ['계산량이 항상 적어서', '한 문장 안의 모든 token을 동시에 계산할 수 있어서', '파라미터가 훨씬 적어서'], ans: 1, why: '어텐션은 계산량이 길이의 제곱이라 오히려 더 클 수 있습니다. 하지만 앞 token을 기다릴 필요가 없어 GPU에서 병렬로 돌릴 수 있습니다.'},
  {ask: '위치 인코딩을 빼면 "개가 사람을 문다"와 "사람이 개를 문다"의 각 token 어텐션 결과는 어떻게 되나요?', opts: ['구분된다', '같은 token끼리는 순서와 무관하게 같은 결과가 나온다', '오류가 난다'], ans: 1, why: '어텐션은 token 집합에 대한 연산이라 순서를 알 수 없습니다. 순서는 위치 정보를 더해야 구분됩니다.'},
]} />

<details>
<summary>더 깊이: 모델 크기</summary>

- 기본 모델은 층 6개, 은닉 크기 512, feed-forward 2048, 헤드 8개이고 약 6,500만 파라미터다.
- 큰 모델은 은닉 크기 1024, 헤드 16개이고 약 2억 1,300만 파라미터다.
- 학습 중 dropout과 label smoothing으로 과적합을 막았다.

</details>

## 리뷰

지금 LLM의 뼈대가 된 논문이다. 번역용 구조(encoder-decoder)로 쓰였지만 이후 decoder만 쓰는 모델과 encoder만 쓰는 모델로 갈라져 GPT와 BERT가 되었다. 어텐션 계산량이 입력 길이의 제곱으로 늘어난다는 한계도 이 논문부터 있었다.
