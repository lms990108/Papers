---
title: 자연어 처리 (natural language processing, NLP)
sidebar_position: 1
mdx:
  format: mdx
---

자연어 처리(NLP)는 입력이 글인 문제를 부르는 이름입니다. 학습 방법의 이름이 아니라서, 쓰는 도구는 [머신러닝](../machine-learning/)과 같습니다. 글은 길이가 문장마다 다르고 더하거나 곱할 수 없는 기호의 열이라, 수로 바꾸는 단계가 먼저 필요합니다.

LLM 에이전트의 입력과 출력은 거의 다 글이어서, 이 영역의 개념이 곧 LLM과 RAG의 바탕입니다.

- **prompt와 응답**: 글을 token으로 자르고 번호로 바꿔 모델에 넣습니다. 비용과 context window가 token 수로 정해집니다. → [tokenization](./tokenization.md)
- **검색(RAG)**: 글을 벡터로 바꿔 가까운 것을 찾고, 키워드 검색과 섞어 씁니다. → [임베딩](./embedding.md), [코사인 유사도](./cosine-similarity.md), [TF-IDF](./tf-idf.md)
- **생성**: 다음 token의 확률을 만들어 하나씩 고릅니다. → [다음 token](./next-token.md), [언어 모델](./language-model.md)
- **서빙과 비용**: prompt를 읽는 구간과 token을 이어 쓰는 구간의 성격이 다릅니다. → [prefill, decode](./prefill-decode.md)

## 읽는 순서

LLM을 쓰는 데 바로 필요한 쪽부터 읽습니다.

| 주제 | 에이전트 개발에서 만나는 곳 |
| --- | --- |
| [tokenization](./tokenization.md) | token 수, 비용, context window |
| [임베딩](./embedding.md) | 벡터 검색, 의미 비교 |
| [코사인 유사도](./cosine-similarity.md) | 임베딩 검색의 거리 |
| [언어 모델](./language-model.md) | logprobs, 퍼플렉서티, n-gram(BLEU, ROUGE, 반복 억제) |
| [다음 token](./next-token.md) | 생성, 학습 목표 |
| [어텐션](./attention.md), [셀프 어텐션](./self-attention.md), [트랜스포머](./transformer.md), [Decoder block](./block.md) | LLM의 내부 구조 |
| [LLM](./llm.md), [post-training](./post-training.md), [prefill, decode](./prefill-decode.md) | 모델 종류, 정렬, 서빙 |

아래는 LLM 이전의 방법들입니다. 직접 쓰는 일은 드물고, 키워드 검색과 평가 지표를 이해하는 정도로 필요합니다.

| 주제 | 남아 있는 접점 |
| --- | --- |
| [단어 주머니](./bag-of-words.md) | 임베딩이 왜 필요한지, 키워드 검색의 바탕 |
| [TF-IDF](./tf-idf.md) | BM25와 hybrid search |
| [텍스트 전처리](./text-preprocessing.md) | 검색 엔진의 분석기 설정(불용어, 어간 추출) |
| [워드투벡터](./word2vec.md), [패딩](./padding.md), [순환 신경망](./rnn.md), [LSTM](./lstm.md), [BERT](./bert.md), [개체명 인식](./ner.md) | 임베딩과 트랜스포머가 나오기까지의 흐름, 분류·추출 모델 |

## 한국어에서 조심할 것

한국어는 조사와 어미가 단어에 붙습니다. `날씨가`는 `날씨`에 조사 `가`가 붙은 한 어절입니다. 띄어쓰기로만 자르면 `날씨`, `날씨가`, `날씨는`이 서로 다른 조각이 되어 키워드 검색과 횟수 기반 방법이 흩어집니다.

LLM의 tokenizer는 이 문제를 학습한 조각으로 풀지만, 같은 뜻의 영어보다 token을 더 쓰는 경향이 있어서 비용과 context window에 영향을 줍니다. 키워드 검색에서는 형태소 분석기로 조사를 떼는 설정을 따로 확인합니다.

선수 지식은 [머신러닝](../machine-learning/)과 [신경망](../deep-learning/neural-network.md)의 기초입니다. 첫 페이지는 [tokenization](./tokenization.md)입니다.
