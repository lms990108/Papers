---
title: Attention Is All You Need
sidebar_position: 2
---

Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin. *NeurIPS*, 2017. [원문 PDF](https://arxiv.org/pdf/1706.03762)

## 요약

순환 신경망이나 합성곱 없이, 어텐션만으로 문장을 읽고 쓰는 모델 트랜스포머(Transformer)를 제안한 논문이다. 기계 번역으로 실험했다.

- **셀프 어텐션만 사용**: 순환 신경망은 앞 token을 처리해야 다음 token을 처리할 수 있어서 병렬화가 어렵다. 트랜스포머는 모든 token 쌍의 관계를 한 번에 계산해서 학습을 병렬로 돌린다. → [어텐션](../learn/ai/nlp/attention.md), [셀프 어텐션](../learn/ai/nlp/self-attention.md)
- **멀티 헤드 어텐션**: 어텐션을 여러 벌(논문에서는 8개) 두고 결과를 이어 붙인다. 헤드마다 다른 관계를 볼 수 있다.
- **위치 정보를 따로 더함**: 어텐션은 순서를 모르기 때문에, 위치마다 만든 벡터를 입력에 더한다. → [트랜스포머](../learn/ai/nlp/transformer.md)

### 결과

| 실험 | 결과 |
| --- | --- |
| WMT 2014 영어-독일어 번역 | BLEU 28.4, 기존 최고(앙상블 포함)보다 2 이상 높음 |
| WMT 2014 영어-프랑스어 번역 | BLEU 41.8, 8개 GPU로 3.5일 학습 |

기존 최고 모델들보다 학습 비용이 훨씬 적다는 점도 강조한다.

## 리뷰

지금 LLM의 뼈대가 된 논문이다. 번역용 구조(encoder-decoder)로 쓰였지만 이후 decoder만 쓰는 모델과 encoder만 쓰는 모델로 갈라져 GPT와 BERT가 되었다. 어텐션 계산량이 입력 길이의 제곱으로 늘어난다는 한계도 이 논문부터 있었다.
