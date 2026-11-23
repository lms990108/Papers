---
title: 고급 RAG (hybrid search, reranking, agentic RAG)
sidebar_position: 7
mdx:
  format: mdx
---

import HybridFuse from '@site/src/components/viz/rag/r4/HybridFuse';
import RerankFunnel from '@site/src/components/viz/rag/r4/RerankFunnel';
import Quiz from '@site/src/components/viz/Quiz';

고급 RAG는 한 번 검색하고 한 번 답하는 기본 RAG가 틀리는 자리마다 붙이는 보강입니다. 어느 것도 항상 더 좋은 것은 아니고 대가가 있어서, 기본 RAG를 먼저 재 본 뒤에 문제가 보이는 곳에만 붙입니다.

| 부딪히는 문제 | 보강 | 대가 |
| --- | --- | --- |
| 오류 번호나 고유명사를 임베딩이 놓침 | hybrid search | 검색기 둘을 운영 |
| 후보에 정답이 있는데 순서가 밀림 | reranking | 후보 수만큼 모델 호출 |
| 질문이 짧거나 앞 대화에 기대서 검색어로 쓰기 약함 | query rewriting, HyDE | 검색 전 LLM 호출 하나 |
| 한 번 검색으로 근거가 다 안 모임 | agentic RAG | 지연, 비용, 오류 누적 |

에이전트 개발에서는 마지막 줄이 가장 가깝습니다. 모델에게 search tool을 주고 몇 번 호출할지 맡기는 구조가 agentic RAG입니다.

## hybrid search

키워드 검색(BM25)은 질문의 글자가 청크에 있는지 보고, 임베딩 검색은 뜻이 가까운지 봅니다. 두 점수는 단위가 달라 그대로 더할 수 없어서 순위만 쓰는 reciprocal rank fusion(RRF)으로 합칩니다.

\[
\mathrm{RRF}(d) = \sum_{r} \frac{1}{k + r(d)}
\]

\(r(d)\)는 목록 \(r\)에서 문서 \(d\)의 순위이고, \(k\)는 상수로 60을 흔히 씁니다. 검색에서 고르는 청크 수 k와는 다른 값입니다. 질문 "ERR-4021"에서 청크 c7은 키워드 1위, 임베딩 2위이고 c8은 임베딩 1위입니다.

\[
\mathrm{RRF}(c7) = \tfrac{1}{61} + \tfrac{1}{62} = 0.0325, \qquad \mathrm{RRF}(c8) = \tfrac{1}{61} = 0.0164
\]

c7이 1등이 됩니다. 아래 그림에서 질문 "휴가 일수"를 보세요. 임베딩만으로는 정답 c1이 1등인데 키워드 목록이 틀린 c4와 c6을 올려 합치면 c1이 3등으로 내려갑니다. 순위를 ▲▼로 바꿔 어떤 순위가 결과를 뒤집는지 확인해 보세요. 점수와 순위는 설명용입니다.

<HybridFuse />

## reranking

임베딩 검색은 질문과 청크를 따로 벡터로 만들어 둘이 서로를 보지 못합니다. reranking은 cross-encoder가 질문과 청크를 한 입력으로 함께 읽고 점수를 매깁니다. 더 정확하지만 질문과 청크 쌍마다 모델을 돌려야 합니다. 그래서 값싼 검색이 후보 n개를 넉넉히 뽑고, 그 후보 안에서만 순서를 다시 매겨 상위 m개를 prompt에 붙입니다.

아래 그림에서 후보 수 n을 1에서 8로 움직여 보세요. n이 작으면 정답 c1이 후보 밖이라 reranking이 한 번도 보지 못하고, n이 3이 되면 후보에 들어와 1등으로 올라옵니다. 쌍당 시간 10ms는 설명용 값입니다.

<RerankFunnel />

## 기억할 것 네 가지

### 새 기법은 같은 질문 모음으로 전후를 잽니다

hybrid가 임베딩만 쓸 때보다 나빠지는 경우가 있습니다. 위 "휴가 일수"가 그 예입니다. DPR 논문은 학습한 임베딩 검색이 BM25보다 정확했다고, EntityQuestions 논문은 개체 중심 질문에서 임베딩이 크게 나빴다고 보고합니다. 어느 쪽이 나은지는 질문과 데이터에 달려 있으니 내 질문 모음으로 재서 정합니다.

### reranking은 후보 밖 정답을 살리지 못합니다

[벡터 인덱스](./vector-index.md)에서 본 구분으로는 후보에 정답이 없는 누락은 reranking이 고치지 못하고, 순서 오류만 고칩니다. 정답이 1단계 120위인데 후보를 100개만 받으면 그 정답은 끝까지 못 찾습니다. n은 recall@n으로 정하고, 호출 수가 n에 비례해 늘어난다는 점을 지연 예산에 넣습니다. m을 줄이면 prompt가 짧아지지만 정답이 m 밖으로 밀리면 생성에 닿지 못합니다.

### 검색 횟수를 모델에 맡기면 지연이 빠르게 늡니다

검색 t번이면 모델 호출은 t+1번입니다. 모델 호출 시간 2,000ms, 검색 100ms, t=3이면 \(4 \times 2000 + 3 \times 100 = 8{,}300\)ms로, 기본 RAG의 \(2000 + 100 = 2{,}100\)ms의 약 4배입니다. 매 호출이 앞서 붙은 검색 결과를 다시 읽어서 입력 token은 t의 제곱에 가깝게 늡니다(prompt caching이 있으면 달라집니다). Anthropic의 에이전트 글도 에이전트는 지연과 비용을 늘리고 단계마다 오류가 쌓일 수 있다고 경고합니다. 단일 호출에 검색과 예시를 붙여 다듬는 것으로 충분한 경우가 많고, 필요하면 검색 횟수 상한을 둡니다.

### 검색과 생성을 따로 평가합니다

검색은 정답 청크가 상위 k에 들어왔는지(recall@k), 생성은 그 청크가 있을 때 답이 근거를 따랐는지로 잽니다. recall@k가 1이어도 답이 틀릴 수 있고, recall이 낮은데 답이 맞았다면 우연일 수 있습니다. 끝에서 끝 정확도만 보면 검색 실패가 가려집니다. 정답 없이 재는 지표는 Ragas 같은 도구가 제안합니다.

## 퀴즈

<Quiz items={[
  {ask: 'RRF(k=60)에서 문서 X는 키워드 1위이고 임베딩 목록에는 없습니다. 문서 Y는 키워드 5위, 임베딩 5위입니다. 어느 쪽이 앞섭니까?', opts: ['X. 한 목록에서 1위이기 때문이다', 'Y. 두 목록에서 모두 점수를 받기 때문이다', '동점이다'], ans: 1, why: 'X는 1/61 = 0.0164이고 Y는 1/65 + 1/65 = 0.0308입니다. 한쪽에서만 높은 문서보다 두 목록에 모두 오른 문서가 앞서기 쉽습니다.'},
  {ask: '후보 100개를 reranking합니다. 정답 청크가 1단계 검색에서 120위였다면 어떻게 됩니까?', opts: ['reranking이 1등으로 올려 준다', '후보 밖이라 reranking이 보지 못한다', '후보를 160개로 늘리면 반드시 1등이 된다'], ans: 1, why: 'reranking은 후보 안의 순서만 바로잡습니다. 후보를 120 넘게 넓히면 정답이 후보에 들어오지만 1등이 된다는 보장은 없고, 호출 수만 늘어납니다.'},
  {ask: '검색 시간 100ms, 모델 호출 2,000ms인 에이전트가 검색을 3번 부르면 지연은 기본 RAG(한 번 검색, 한 번 호출)의 몇 배에 가깝습니까?', opts: ['약 1.5배', '약 4배', '약 10배'], ans: 1, why: '모델 호출이 4번이라 4 × 2000 + 3 × 100 = 8,300ms이고 기본 RAG는 2,100ms입니다. 검색 시간보다 모델 호출 횟수가 지연을 좌우합니다.'},
]} />

<details>
<summary>더 깊이: BM25, query rewriting, HyDE, agentic RAG 정의</summary>

BM25는 단어 빈도와 희귀도(idf)를 쓰는 점수입니다. 질문 단어 \(t\)마다 청크 \(D\)에서 아래를 더합니다. Lucene과 Elasticsearch의 기본값은 \(k_1 = 1.2\), \(b = 0.75\)입니다.

\[
\mathrm{score}(D, Q) = \sum_{t \in Q} \mathrm{idf}(t) \cdot \frac{f(t, D)\,(k_1 + 1)}{f(t, D) + k_1\left(1 - b + b\,\frac{|D|}{\mathrm{avgdl}}\right)}
\]

- **query rewriting**: 검색 질의가 필요한 지식과 어긋나는 일이 흔해서 LLM이 질의를 다시 쓰게 합니다(Ma 외, 2023). 대화 속 "그건 며칠이에요?"처럼 맥락에 기댄 질문에 효과가 있고, 재작성이 뜻을 바꾸면 검색도 엇나갑니다.
- **HyDE**: LLM이 질문에 대한 가상의 문서를 쓰게 하고 그 임베딩으로 실제 문서를 찾습니다(Gao 외, 2022). 가상 문서는 틀린 사실을 담을 수 있어 검색 질의로만 쓰고 근거로는 쓰지 않습니다. 논문 표에서 HyDE는 관련도 정답 없이 BM25보다 높았지만 정답으로 학습한 DPR와 ANCE보다는 낮았습니다.
- **agentic RAG**: 정의가 문헌마다 다릅니다. ReAct는 추론과 행동을 번갈아 하고, IRCoT는 추론 문장마다 검색을 끼우며, FLARE는 확신이 낮을 때 검색하고, Self-RAG는 반성 token으로 검색 여부를 정합니다. 이 글은 모델의 출력이 다음 검색의 횟수나 내용을 정하는 반복 구조를 넓게 가리킵니다.
- Anthropic의 Contextual Retrieval 글은 자체 평가에서 contextual embedding과 contextual BM25를 합친 설정은 상위 20개에서 정답을 놓친 비율이 2.9%였고, 150개를 가져와 reranking으로 20개로 줄이면 1.9%였다고 밝혔습니다. 한 회사의 설정에서 나온 값입니다.

앞 단계는 [검색](./retrieval.md), [그라운딩](./grounding.md)입니다. 지식 그래프를 따라가는 검색은 [지식 그래프](./knowledge-graph.md)와 [GraphRAG](./graph-rag.md)에서 다룹니다. BM25는 [TF-IDF](../nlp/tf-idf.md)와 같은 계열이고, 재정렬에 쓰는 cross-encoder는 [BERT](../nlp/bert.md)와 이어집니다.

참고 자료

- Cormack, Clarke, Büttcher, Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods, SIGIR 2009. http://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf
- Robertson, Zaragoza, The Probabilistic Relevance Framework: BM25 and Beyond, 2009. https://doi.org/10.1561/1500000019
- Karpukhin 외, Dense Passage Retrieval, EMNLP 2020. https://arxiv.org/abs/2004.04906
- Sciavolino 외, Simple Entity-Centric Questions Challenge Dense Retrievers, EMNLP 2021. https://arxiv.org/abs/2109.08535
- Nogueira, Cho, Passage Re-ranking with BERT, 2019. https://arxiv.org/abs/1901.04085
- Anthropic, Introducing Contextual Retrieval, 2024. https://www.anthropic.com/news/contextual-retrieval
- Ma 외, Query Rewriting for Retrieval-Augmented Large Language Models, EMNLP 2023. https://arxiv.org/abs/2305.14283
- Gao 외, Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE), 2022. https://arxiv.org/abs/2212.10496
- Anthropic, Building effective agents, 2024. https://www.anthropic.com/engineering/building-effective-agents
- Singh 외, Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG, 2025. https://arxiv.org/abs/2501.09136
- Yao 외, ReAct, ICLR 2023. https://arxiv.org/abs/2210.03629
- Trivedi 외, IRCoT, ACL 2023. https://arxiv.org/abs/2212.10509
- Jiang 외, FLARE, EMNLP 2023. https://arxiv.org/abs/2305.06983
- Asai 외, Self-RAG, 2023. https://arxiv.org/abs/2310.11511
- Es 외, Ragas, 2023. https://arxiv.org/abs/2309.15217

</details>
