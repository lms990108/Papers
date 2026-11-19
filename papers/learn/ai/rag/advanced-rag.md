---
title: 고급 RAG (hybrid search, reranking, agentic RAG)
sidebar_position: 7
mdx:
  format: mdx
---

import HybridFuse from '@site/src/components/viz/rag/r4/HybridFuse';
import Bm25Explorer from '@site/src/components/viz/rag/r4/Bm25Explorer';
import RerankFunnel from '@site/src/components/viz/rag/r4/RerankFunnel';
import QueryRewrite from '@site/src/components/viz/rag/r4/QueryRewrite';
import AgentLoop from '@site/src/components/viz/rag/r4/AgentLoop';
import RetrievalEval from '@site/src/components/viz/rag/r4/RetrievalEval';

[청킹](./chunking.md), [임베딩 검색](./retrieval.md), [그라운딩](./grounding.md)으로 만든 기본 RAG는 한 번 검색하고 한 번 답하는 구조입니다. 실제로 쓰면 곧 한계가 보입니다. 같은 글자가 꼭 필요한 질문을 놓치고, 후보 안에서 순서가 틀리고, 질문 자체가 검색하기 어렵고, 한 번 찾아서는 부족한 질문이 나옵니다.

이 글은 그 한계마다 나온 대응을 하나씩 만져 봅니다. 먼저 키워드 검색과 임베딩 검색의 순위를 합치는 그림입니다. 순위를 ▲▼로 바꾸고 상수 k를 움직여 보세요.

<HybridFuse />

:::tip[한눈에 보기]
고급 RAG는 기본 RAG의 각 단계가 틀리는 자리마다 붙이는 보강입니다. 어느 것도 항상 더 좋은 것은 아니고, 대가가 있습니다.

- **하이브리드 검색**은 키워드 검색(BM25)과 임베딩 검색의 순위를 합칩니다. 순위만 쓰는 reciprocal rank fusion(RRF)은 점수의 단위가 달라도 합칠 수 있습니다.
- **재정렬**은 검색으로 후보를 넉넉히 뽑고, 질문과 청크를 함께 읽는 모델로 후보 안에서만 순서를 다시 매깁니다. 후보에 없는 정답은 살리지 못합니다.
- **질의 재작성과 HyDE**는 검색에 넣는 글을 바꿉니다. 모델 호출이 하나 늘고, 질문의 뜻이 어긋나면 검색도 어긋납니다.
- **에이전트형 RAG**는 모델이 검색 횟수와 검색어를 스스로 정하는 반복 구조입니다. 정의는 문헌마다 다르고, 지연과 비용이 늘어납니다.
- 검색 단계(recall@k 등)와 생성 단계는 **따로 재야** 합니다.

선수 지식은 [RAG](./index.md), [검색](./retrieval.md), [벡터 인덱스](./vector-index.md), [그라운딩](./grounding.md)입니다. 지식 그래프를 따라가는 검색은 [지식 그래프](./knowledge-graph.md)와 [GraphRAG](./graph-rag.md)에서 따로 다룹니다.
:::

## 배경

기본 RAG의 단계마다 틀리는 방식이 다릅니다. 각 줄이 이 글의 한 절에 해당합니다.

| 부딪히는 한계 | 대응 흐름 |
| --- | --- |
| 질문과 청크의 말이 다르거나, 반대로 같은 글자가 꼭 필요한데 임베딩이 놓침 | 하이브리드 검색 |
| 후보에는 정답이 있는데 순서가 밀림 | 재정렬 |
| 질문이 짧거나 맥락에 기대어 검색어로 약함 | 질의 재작성, HyDE |
| 한 번 검색으로는 답에 필요한 청크가 다 안 모임 | 에이전트형 RAG |
| 틀린 답이 검색 탓인지 생성 탓인지 모름 | 검색과 생성을 따로 평가 |

이 글의 작은 예는 사이트의 RAG 글들과 같은 휴가 규정입니다. 청크 8개(c1 연차는 15일, c2 병가는 연차와 별도, c3 연차 이월 등)와 질문 몇 개를 계속 씁니다. 청크의 단어 나누기와 임베딩 코사인, 재정렬 점수는 **설명용 값**이고, BM25 점수와 RRF 점수는 아래 함수로 실제로 계산한 값입니다.

## 하이브리드 검색

### 두 검색이 강한 질문

키워드 검색은 질문의 글자가 청크에 있는지를 봅니다. 임베딩 검색은 뜻이 가까운지를 봅니다. [검색](./retrieval.md)에서 본 대로, 말이 달라도 뜻이 가까우면 임베딩이 올리고, 고유한 번호는 같은 글자가 필요합니다.

논문들이 보고한 모습도 한쪽이 항상 이기지 않습니다.

- DPR(Karpukhin 등, 2020)은 소량의 질문과 문단 쌍으로 학습한 임베딩 검색이 Lucene BM25보다 top-20 검색 정확도에서 9~19%p(절대값) 높다고 보고했습니다.
- EntityQuestions(Sciavolino 등, 2021)는 위키데이터 사실로 만든 개체 중심의 단순한 질문 모음입니다. 이 질문들에서 임베딩 검색이 희소(키워드) 방법보다 크게 나빴고, 학습에 질문 패턴이 없으면 흔한 개체에만 일반화했다고 보고했습니다.
- BEIR(Thakur 등, 2021)는 서로 다른 검색 과제를 모은 벤치마크입니다. 논문은 BM25를 튼튼한 기준선이라고 부르고, 재정렬과 late-interaction 모델이 평균 성능은 가장 좋지만 계산 비용이 크다고 보고했습니다.

그래서 어느 쪽이 나은지는 질문 유형과 데이터에 따라 갈립니다. 둘을 합치는 이유가 여기에 있습니다.

### BM25

BM25는 [TF-IDF](../nlp/tf-idf.md)처럼 단어 빈도와 idf를 함께 쓰는 점수로, 질문 단어마다 점수를 더해 청크를 매깁니다. 대표 형태는 아래와 같습니다(Robertson과 Zaragoza, 2009의 확률적 관련성 틀에서 나온 함수입니다).

\[
\mathrm{score}(D, Q) = \sum_{t \in Q} \mathrm{idf}(t) \cdot \frac{f(t, D)\,(k_1 + 1)}{f(t, D) + k_1\left(1 - b + b\,\frac{|D|}{\mathrm{avgdl}}\right)}
\]

- \(f(t, D)\): 청크 \(D\) 안에서 단어 \(t\)가 나온 횟수입니다.
- \(|D|\): 청크의 길이이고, \(\mathrm{avgdl}\)은 평균 길이입니다.
- \(\mathrm{idf}(t)\): 이 글에서는 Lucene이 쓰는 \(\ln\!\left(1 + \frac{N - n + 0.5}{n + 0.5}\right)\)입니다. \(N\)은 청크 수, \(n\)은 \(t\)가 든 청크 수입니다. 책과 도구마다 idf의 꼴이 조금씩 다릅니다.
- \(k_1\)은 횟수가 늘 때 점수가 포화하는 정도, \(b\)는 길이 보정의 세기입니다. Lucene과 Elasticsearch의 기본값은 \(k_1 = 1.2\), \(b = 0.75\)입니다.

분자의 \((k_1 + 1)\)은 모든 청크에 같은 상수배라서 순위를 바꾸지 않습니다. Lucene의 현재 소스 코드에는 이 인자가 없고 계산식의 나머지는 같습니다. 이 글의 그림은 위 함수 그대로 \((k_1 + 1)\)을 넣어 계산합니다.

아래 그림에서 질문을 바꾸고 \(k_1\), \(b\)를 움직여 보세요. “휴가 일수”는 정답 청크 c1에 두 단어가 모두 없어서 점수가 0이고, 키워드 목록에 오르지 못합니다.

<Bm25Explorer />

<details>
<summary>파이썬으로 확인</summary>

```python
import math

chunks = {
    "c1": ["연차", "15일", "입사", "첫해", "11일"],
    "c2": ["병가", "연차", "별도"],
    "c3": ["미사용", "연차", "다음", "해", "이월", "최대", "5일"],
    "c4": ["휴가", "신청", "사흘", "전", "시스템", "등록"],
    "c5": ["출장비", "출장", "종료", "정산"],
    "c6": ["경조사", "휴가", "결혼", "5일", "부고", "3일", "지급"],
    "c7": ["ERR-4021", "연차", "신청", "시스템", "오류", "인사팀", "문의"],
    "c8": ["ERR-4012", "급여", "명세서", "조회", "오류"],
}
N = len(chunks)
avgdl = sum(len(t) for t in chunks.values()) / N
k1, b = 1.2, 0.75

def bm25(query):
    out = {}
    for cid, toks in chunks.items():
        score = 0.0
        for q in query:
            df = sum(q in t for t in chunks.values())
            idf = math.log(1 + (N - df + 0.5) / (df + 0.5))
            tf = toks.count(q)
            if tf:
                score += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(toks) / avgdl))
        if score > 0:
            out[cid] = score
    return sorted(out, key=lambda c: (-out[c], c)), out

kw, sc = bm25(["휴가", "일수"])
print(kw, {c: round(v, 3) for c, v in sc.items()})
```

```text
['c4', 'c6'] {'c4': 1.235, 'c6': 1.152}
```

</details>

### 순위 합치기: RRF

두 검색의 점수는 단위가 다릅니다. BM25 점수는 위로 한계가 없는 양수이고, 코사인은 \(-1\)과 \(1\) 사이입니다. 그대로 더하면 한쪽이 다른 쪽을 덮습니다. **reciprocal rank fusion**(RRF)은 점수를 버리고 **순위만** 씁니다. Cormack, Clarke, Büttcher(2009)가 이렇게 정의했습니다. 문서 집합 \(D\)와, 각각 \(D\)의 순열인 순위 집합 \(R\)이 있을 때 문서 \(d\)의 점수는 아래와 같습니다.

\[
\mathrm{RRFscore}(d) = \sum_{r \in R} \frac{1}{k + r(d)}
\]

\(r(d)\)는 순위 \(r\)에서 \(d\)의 등수입니다. 논문은 \(k = 60\)을 예비 조사에서 정했고 이후 검증에서 바꾸지 않았다고 씁니다. 순위가 높은 문서가 더 중요하되 낮은 순위의 중요도가 지수 함수처럼 사라지지는 않게 하려는 의도이고, 상수 \(k\)가 한 시스템이 유난히 높게 매긴 순위의 영향을 누그러뜨린다고 설명합니다.

계산은 맨 위 그림에서 그대로 확인할 수 있습니다. 질문 “ERR-4021”을 보세요. 키워드 목록에는 c7만 있고(1등), 임베딩 목록에는 c8이 1등, c7이 2등입니다. \(k = 60\)이면 다음과 같습니다.

\[
\mathrm{RRF}(c7) = \frac{1}{60 + 1} + \frac{1}{60 + 2} = 0.01639 + 0.01613 = 0.03252, \qquad \mathrm{RRF}(c8) = \frac{1}{60 + 1} = 0.01639
\]

c7이 1등이 됩니다. c8은 키워드 목록에 없어서 그 목록의 항이 없습니다. 목록에 없는 문서는 그 목록의 항을 받지 않는 것이 Elasticsearch 문서의 설명이고, 논문 쪽은 모든 순위가 \(D\) 전체의 순열이라고 가정합니다. 구현에 따라 목록을 상위 몇 개로 자르는데(Elasticsearch의 `rank_window_size`), 그림의 “창” 슬라이더가 그 역할입니다. Elasticsearch의 기본 상수도 60입니다.

그림에서 다음을 해 보세요.

- **k 움직이기.** k가 작으면 1등과 2등의 차이가 크고, k가 크면 순위 차이가 평평해집니다. 두 목록에 모두 오른 문서가 한쪽에서만 높은 문서를 앞서기 쉬워집니다.
- **질문 “휴가 일수”.** 임베딩만으로는 정답 c1이 1등인데, 합치면 3등으로 내려갑니다. 키워드 목록에 오른 c4와 c6이 두 목록에 모두 들어 있어서 앞섭니다. k를 1에서 200까지 움직여도 c1은 3등입니다. 키워드 쪽이 틀린 후보를 올린 이 경우에는 합치는 것이 손해입니다. 이 질문은 일부러 만든 설명용 반례입니다.
- **직접 순위 바꾸기.** c4를 임베딩 목록에서 내리거나 c1을 올려 보며 어떤 순위가 합친 결과를 뒤집는지 보세요.

Cormack 등이 보고한 것은 여러 TREC 실험의 결과를 합칠 때 개별 시스템보다, 그리고 Condorcet Fuse보다 대체로 좋았다는 점입니다. 그 실험은 문서 검색 순위 합치기였고, 이 글의 청크 검색에 그대로 옮겨지는지는 데이터에 달려 있습니다. Anthropic은 자사 블로그에서 임베딩에 BM25를 더해 순위를 합치면 임베딩만 쓸 때보다 나았다고 밝혔지만 구체 수치는 따로 주지 않았습니다.

<details>
<summary>파이썬으로 확인</summary>

위 BM25 코드에 이어서 실행합니다. 임베딩 코사인은 설명용 값입니다.

```python
dense = [0.82, 0.55, 0.71, 0.58, 0.12, 0.66, 0.2, 0.1]   # 설명용 코사인
ids = list(chunks)
de = sorted(ids, key=lambda c: (-dense[ids.index(c)], c))
print(de)

def rrf(lists, k=60):
    score = {}
    for lst in lists:
        for rank, d in enumerate(lst, start=1):
            score[d] = score.get(d, 0) + 1 / (k + rank)
    return sorted(score, key=lambda d: (-score[d], d)), score

order, score = rrf([kw, de])
print(order[:4], {d: round(score[d], 5) for d in order[:4]})
```

```text
['c1', 'c3', 'c6', 'c4', 'c2', 'c7', 'c5', 'c8']
['c4', 'c6', 'c1', 'c3'] {'c4': 0.03202, 'c6': 0.032, 'c1': 0.01639, 'c3': 0.01613}
```

</details>

## 재정렬

### 두 단계 구조

검색의 임베딩은 질문과 청크를 **따로** 수 목록으로 만듭니다. 청크 쪽은 미리 만들어 둘 수 있어서 수백만 개에서도 빠릅니다. 대신 둘이 서로를 보지 못합니다. **재정렬**(reranking)에 쓰는 **cross-encoder**는 질문과 청크를 한 입력으로 함께 읽고 관련도 점수를 냅니다. 서로를 보므로 더 정확하지만, 질문과 청크 **쌍마다** 모델을 한 번 돌려야 합니다. [BERT](../nlp/bert.md) 같은 트랜스포머를 이런 용도로 쓸 수 있습니다.

그래서 두 단계로 나눕니다. 1단계에서 값싼 검색이 후보를 넉넉히 뽑고, 2단계에서 비싼 모델이 그 후보만 다시 매깁니다. Sentence-Transformers 문서도 이 구조를 retrieve and re-rank라고 설명하며 후보 100개를 예로 듭니다.

논문이 보고한 값도 있습니다. Nogueira와 Cho(2019)는 BM25가 가져온 상위 1,000개를 BERT로 다시 매겼고, MS MARCO 개발 세트의 MRR@10이 BM25 16.7에서 BERT Large 36.5로 올랐다고 보고했습니다. 이 수치는 그 데이터셋과 설정에서의 값입니다. BEIR(2021)는 재정렬 모델이 평균 성능은 가장 좋지만 계산 비용이 높다고 같이 말합니다.

### 후보 안에서만

아래 그림은 질문 “휴가 일수”의 1단계 결과(위 RRF 결과)를 받아 후보 수 n개만 재정렬합니다. n을 1에서 8까지 움직여 보세요.

<RerankFunnel />

n이 1이나 2이면 정답 c1이 후보 밖입니다. 재정렬 모델은 후보만 보므로 c1을 점수 매길 기회조차 없습니다. n이 3이 되면 c1이 후보에 들어오고 재정렬이 1등으로 올립니다. [벡터 인덱스](./vector-index.md)의 말로는, 후보에 못 들어온 것이 **누락**이고 후보 안에서 순서가 밀린 것이 **순서 오류**입니다. refine이 순서 오류만 줄이듯이, 재정렬도 순서 오류만 줄입니다. 누락을 줄이려면 후보를 넓혀야 하고, 그러면 재정렬 호출이 n에 비례해서 늘어납니다.

Anthropic의 Contextual Retrieval 글은 같은 구조의 수치를 보고합니다. 청크에 맥락을 덧붙인 임베딩과 BM25를 합친 구성에서, 상위 20개에서 정답을 못 찾은 비율(1에서 recall@20을 뺀 값)이 2.9%였습니다. 여기에 처음 150개 청크를 가져와 재정렬로 20개로 줄이자 1.9%가 되었다고 합니다. 이것은 논문이 아니라 한 회사의 자체 평가이고, 여러 지식 영역을 평균한 값이며 그 글이 쓴 임베딩 모델과 재정렬 모델 설정에서 나온 값입니다.

재정렬 뒤에는 상위 m개만 [그라운딩](./grounding.md)에 붙입니다. m을 줄이면 prefill이 읽는 칸이 줄지만, 정답이 m 밖으로 밀리면 그 정답은 생성에 닿지 못합니다.

## 질의 재작성과 확장

검색은 질문의 글을 그대로 넣습니다. 그 글이 검색에 불리하면 검색기를 고치는 대신 **질문을 바꾸는** 흐름이 있습니다.

- **질의 재작성**(query rewriting). Ma 등(2023)은 검색 질의가 필요한 지식과 어긋나는 일이 흔하다고 보고, 검색과 읽기 사이에 재작성 단계를 넣은 rewrite-retrieve-read를 제안했습니다. LLM이 질의를 재작성하면 웹 검색 엔진에서 문맥을 가져오고, 작은 언어 모델을 학습 가능한 재작성기로 두어 읽는 LLM의 피드백으로 강화학습시켰습니다. 오픈 도메인 질의응답과 객관식 질의응답에서 성능이 오른다고 보고했습니다.
- **HyDE**(Hypothetical Document Embeddings, Gao 등, 2022). 지시를 따르는 LLM이 질문에 대한 **가상의 문서**를 쓰게 하고, 그 가상 문서를 비지도로 학습한 인코더 \(f\)로 임베딩해 질의 벡터로 씁니다. 가상 문서를 \(N\)개 뽑으면 질의 벡터는 아래와 같고, 이 벡터와 가까운 실제 문서를 찾습니다.

\[
\hat{v}_q = \frac{1}{N} \sum_{k=1}^{N} f(\hat{d}_k)
\]

가상 문서는 틀린 사실을 담을 수 있습니다. 논문은 인코더가 그런 세부를 걸러 주고 말뭉치의 실제 문서에 닿게 한다고 설명합니다. 논문이 보고한 TREC DL19/DL20의 nDCG@10은 BM25 50.6/48.0, Contriever 44.5/42.1, HyDE 61.3/57.9입니다. 같은 표에서 관련도 정답으로 학습한 DPR(62.2/65.3)과 ANCE(64.5/64.6)는 HyDE보다 높습니다. 그래서 HyDE는 관련도 정답이 없을 때 쓸 수 있는 방법이지, 학습한 검색기보다 낫다는 결과는 아닙니다. 논문은 한계로, 모호한 질문을 다루지 못하고, FiQA와 DBPedia에서는 학습한 검색기가 더 낫고, 다국어에서는 학습한 다국어 검색기에 뒤진다고 적습니다.

아래 그림에서 두 경우의 질의 변형을 눌러 정답 c1의 순위가 어떻게 달라지는지 보세요. 엇나간 경우도 같이 있습니다.

<QueryRewrite />

대화 속 “그건 며칠이에요?”는 글자만으로는 무엇을 묻는지 알 수 없어서 맥락을 채운 재작성이 도움이 되는 모양입니다. 재작성이 병가로 엇나가면 검색은 병가를 정확히 찾아 옵니다. 질문의 뜻을 바꾼 것을 검색이 바로잡아 주지 않습니다. HyDE도 가상 문서가 엉뚱한 주제를 쓰면 그쪽으로 갑니다. 두 방법 모두 검색 전에 LLM 호출이 하나 늘어서 지연과 비용이 더해집니다. 그림의 변형 문장과 코사인은 설명용 값입니다.

## 에이전트형 RAG

기본 RAG는 검색을 정해진 순서로 한 번 합니다. **에이전트형 RAG**(agentic RAG)는 모델이 **검색을 몇 번 할지, 무엇으로 할지, 이미 충분한지를 스스로 정하는** 반복 구조입니다. 다만 이 말의 정의는 문헌마다 다릅니다.

- Anthropic은 일반 글에서 워크플로(미리 정한 코드 경로로 LLM과 도구를 엮음)와 에이전트(LLM이 스스로 과정과 도구 사용을 정함)를 구분합니다. 이 구분을 RAG에 옮기면, 검색 횟수와 검색어를 모델이 정하는 쪽이 에이전트 쪽입니다.
- Singh 등(2025)의 서베이는 RAG 파이프라인에 자율 에이전트를 넣어 검색 전략을 관리하고 문맥을 다듬게 하는 것으로 정의하고, 반성, 계획, 도구 사용, 다중 에이전트 협업을 요소로 듭니다.
- 개별 연구는 이름과 구조가 각각입니다. ReAct(Yao 등, 2022)는 추론과 행동(위키피디아 API 호출 등)을 번갈아 합니다. IRCoT(Trivedi 등, 2022)는 연쇄 추론의 문장마다 검색을 끼워 넣어, 직전 추론이 다음 검색을 이끌게 합니다. FLARE(Jiang 등, 2023)는 다음 문장을 미리 예측하다가 확신이 낮은 토큰이 있을 때 그 문장을 질의로 검색합니다. Self-RAG(Asai 등, 2023)는 한 모델이 반성 토큰(reflection token)으로 필요할 때만 검색하고 가져온 글과 자기 생성을 스스로 평가하도록 학습합니다.

이처럼 어디까지를 “에이전트형”으로 부르는지는 글마다 다릅니다. 위 개별 연구를 이 이름으로 묶은 것은 이 글의 편의입니다. 이 글은 모델의 출력이 다음 검색의 횟수나 내용을 정하는 반복 구조를 넓게 가리킵니다.

아래 그림은 두 청크가 필요한 질문(“입사 첫해 연차는 며칠이고, 병가는 연차에서 빠지나요?”)으로 루프를 따라갑니다. 검색 횟수 t를 늘리며 지연, 읽는 토큰, 정상 확률이 어떻게 변하는지 보세요.

<AgentLoop />

이 그림의 계산은 단순한 모델입니다. 검색 t번이면 모델 호출은 t + 1번이고, i번째 호출은 앞서 붙은 검색 결과 \(i - 1\)개를 다시 읽습니다. 그래서 지연은 \((t + 1)L + tS\)로 t에 비례하고, 읽은 입력 토큰의 합은 \((t + 1)P + r \cdot t(t + 1)/2\)로 t의 제곱에 가깝게 늡니다. 여기서 \(L\)은 모델 호출 시간, \(S\)는 검색 시간, \(P\)는 지시와 질문의 토큰, \(r\)은 검색 결과 한 번의 토큰입니다. 실제로는 앞 내용을 캐시하거나 검색을 병렬로 부를 수 있어서 이 수치와 다릅니다.

대가는 지연과 비용만이 아닙니다. Anthropic의 글은 에이전트가 성능을 높일 수 있지만 지연과 비용을 늘리고, 단계가 이어질수록 오류가 쌓일 수 있다고 경고합니다. 그림의 “모든 단계가 정상일 확률”은 단계마다 독립이라는 가정에서 곱한 값으로, 쌓이는 모양만 보여 주는 설명용입니다. 또 Anthropic은 많은 응용에서는 검색과 예시를 붙인 단일 호출을 다듬는 것으로 충분하다고 말합니다. IRCoT가 겨냥한 것도 한 번의 검색으로 부족한 다단계 질문입니다. 서베이도 평가, 조율, 메모리, 효율, 거버넌스를 아직 풀리지 않은 문제로 꼽습니다.

## 평가

위 기법들은 효과가 데이터에 따라 달라서, 도입 전후를 같은 질문 모음으로 재야 합니다. 이때 검색과 생성을 따로 봅니다.

검색 단계는 정답 청크가 상위 \(k\)개에 들어왔는지를 셉니다. 질문 \(q\)의 정답 청크 집합을 \(G_q\), 검색의 상위 \(k\)개를 \(T_q^k\)라고 하면 아래와 같습니다.

\[
\mathrm{recall@}k = \frac{1}{|Q|} \sum_{q \in Q} \frac{|G_q \cap T_q^k|}{|G_q|}
\]

정답 청크가 하나뿐이면 질문마다 0 아니면 1입니다. 정답이 둘 이상이면 하나라도 들어왔는지(hit@k)와 전부 들어왔는지가 다르므로, 어떤 정의로 쟀는지 밝혀야 합니다. 생성 단계는 검색이 정답을 올린 질문에서 답이 근거를 따르는지를 봅니다. Ragas(Es 등, 2023)는 사람이 단 정답 없이도 검색 품질, 모델이 가져온 글에 충실한 정도, 생성 품질을 재는 지표 모음을 제안했습니다.

아래 그림에서 k를 바꿔 recall@k가 오르는 것과, 생성 정답 여부를 직접 눌러 두 단계가 섞이는 모양을 보세요. [그라운딩](./grounding.md)의 두 층 평가를 질문 5개로 확장한 것입니다.

<RetrievalEval />

recall@k가 1이어도 답이 틀릴 수 있습니다. 검색이 정답을 올렸는데 생성이 따르지 않은 경우입니다. 반대로 recall이 낮은데 답이 맞았다면 근거 없이 우연히 일치했을 수 있으므로 끝에서 끝 정확도만 보면 검색 실패가 가려집니다. 그림의 질문, 순위, 정답 여부는 설명용 값입니다.

## 헷갈리기 쉬운 점

- **하이브리드가 항상 더 좋지는 않습니다.** 위 “휴가 일수”처럼 한쪽이 틀린 후보를 올리면 합친 결과가 임베딩만보다 나빠질 수 있습니다. 같은 질문 모음으로 재서 결정합니다.
- **RRF의 k는 후보 개수가 아닙니다.** 순위 \(r\)에 더하는 상수입니다. 후보를 몇 개 쓸지는 창(rank window)이 정합니다.
- **재정렬은 후보를 늘려 주지 않습니다.** 후보 밖의 정답은 그대로 못 찾습니다. 순서 오류를 고치는 단계입니다.
- **cross-encoder와 임베딩은 입력 방식이 다릅니다.** 임베딩은 질문과 청크를 따로 수로 만들고, cross-encoder는 한 입력으로 함께 읽습니다.
- **HyDE의 가상 문서는 답이 아닙니다.** 사실이 틀릴 수 있고, 검색 질의로만 씁니다. 생성에 붙이는 근거는 실제로 찾은 청크입니다.
- **에이전트형 RAG라는 이름이 구조 하나를 가리키지는 않습니다.** 어떤 글이 어떤 구조를 말하는지 먼저 확인합니다.
- **검색을 더 해도 답이 더 맞는다는 보장이 없습니다.** 위 루프 그림의 추가 검색처럼 새 근거 없이 비용만 늘 수 있습니다.

## 연습 문제

1. \(k = 60\)에서 문서 A는 키워드 1위, 임베딩 3위이고, 문서 B는 키워드 2위, 임베딩 1위입니다. RRF 점수와 합친 순서를 구하세요.
2. 문서 X는 키워드 1위이고 임베딩 목록에는 없습니다. 문서 Y는 키워드 5위, 임베딩 5위입니다. \(k = 60\)에서 누가 앞서나요?
3. 후보 수 \(n = 100\)으로 재정렬합니다. 정답이 1단계 120위입니다. 재정렬로 올릴 수 있나요? 청크가 1,000,000개일 때 전부 재정렬하는 것과 비교해 모델 호출은 몇 배 차이인가요?
4. 에이전트 루프에서 검색 \(t = 3\), 모델 호출 시간 \(L = 2000\)ms, 검색 시간 \(S = 100\)ms입니다. 모델 호출 수와 지연은? 기본 RAG의 지연과 비교하세요.
5. 위 평가 그림에서 \(k = 2\)일 때 질문 “입사 첫해 연차는 며칠이고 병가는 연차에서 빠지나요?”의 recall과 hit은 얼마인가요? (정답 청크 c1, c2. 순위는 c2, c3, c1, ...)

<details>
<summary>정답</summary>

1. A는 \(1/61 + 1/63 \approx 0.01639 + 0.01587 \approx 0.03227\), B는 \(1/62 + 1/61 = 0.01613 + 0.01639 = 0.03252\)입니다. B가 앞섭니다. A는 키워드 1위이지만 임베딩 3위이고, B는 키워드 2위이면서 임베딩 1위여서 합이 더 큽니다.
2. X는 \(1/61 = 0.01639\), Y는 \(2/65 = 0.03077\)입니다. Y가 앞섭니다. 한 목록에서 1위여도 다른 목록에 없으면, 두 목록 모두에서 중간쯤인 문서에 질 수 있습니다.
3. 올릴 수 없습니다. 정답이 후보 밖이어서 재정렬 모델이 보지 못합니다. 호출 수는 100번과 1,000,000번이라 10,000배 차이입니다.
4. 모델 호출은 \(t + 1 = 4\)번, 지연은 \(4 \times 2000 + 3 \times 100 = 8300\)ms입니다. 기본 RAG는 \(2000 + 100 = 2100\)ms이므로 약 3.95배입니다.
5. 상위 2개는 c2, c3이므로 c2만 들어옵니다. recall은 \(1/2 = 0.5\), hit은 1(하나라도 들어옴)입니다.

</details>

## 정리

고급 RAG는 기본 RAG의 각 단계가 틀리는 자리에 붙이는 보강입니다. 하이브리드 검색은 BM25와 임베딩의 순위를 합치고, RRF는 \(\sum 1/(k + r(d))\)로 순위만 써서 점수 단위를 맞출 필요가 없습니다. 재정렬은 후보 안에서만 순서를 고치므로 누락은 못 살리고, 후보 수 n만큼 비싼 모델을 돌립니다. 질의 재작성과 HyDE는 검색에 넣는 글을 바꾸며 LLM 호출이 하나 늘고, 뜻이 어긋나면 검색도 어긋납니다. 에이전트형 RAG는 검색 횟수와 검색어를 모델이 정하는 반복이고, 정의가 문헌마다 다르며 지연, 비용, 오류 누적이 대가입니다. 어느 것도 항상 더 낫지 않으므로 검색(recall@k)과 생성을 따로 재서 도입 전후를 비교합니다.

## 참고 자료

- G. V. Cormack, C. L. A. Clarke, S. Büttcher, “Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods”, SIGIR 2009. [링크](http://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf)
- S. Robertson, H. Zaragoza, “The Probabilistic Relevance Framework: BM25 and Beyond”, Foundations and Trends in Information Retrieval, 2009. [링크](https://doi.org/10.1561/1500000019)
- Apache Lucene, BM25Similarity 문서(idf 정의, 기본값 k1 = 1.2, b = 0.75). [링크](https://lucene.apache.org/core/9_9_0/core/org/apache/lucene/search/similarities/BM25Similarity.html)
- Okapi BM25, Wikipedia(함수 형태 확인용). [링크](https://en.wikipedia.org/wiki/Okapi_BM25)
- Elasticsearch 문서, Reciprocal rank fusion(상수 60, rank_window_size, 목록에 없는 문서의 처리). [링크](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion)
- V. Karpukhin 외, “Dense Passage Retrieval for Open-Domain Question Answering”, EMNLP 2020. [링크](https://arxiv.org/abs/2004.04906)
- C. Sciavolino 외, “Simple Entity-Centric Questions Challenge Dense Retrievers”, EMNLP 2021. [링크](https://arxiv.org/abs/2109.08535)
- N. Thakur 외, “BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models”, NeurIPS 2021 Datasets and Benchmarks. [링크](https://arxiv.org/abs/2104.08663)
- R. Nogueira, K. Cho, “Passage Re-ranking with BERT”, 2019. [링크](https://arxiv.org/abs/1901.04085)
- Sentence-Transformers 문서, Retrieve & Re-Rank. [링크](https://www.sbert.net/examples/applications/retrieve_rerank/README.html)
- Anthropic, “Introducing Contextual Retrieval”, 2024(자체 평가 수치). [링크](https://www.anthropic.com/news/contextual-retrieval)
- X. Ma 외, “Query Rewriting for Retrieval-Augmented Large Language Models”, EMNLP 2023. [링크](https://arxiv.org/abs/2305.14283)
- L. Gao 외, “Precise Zero-Shot Dense Retrieval without Relevance Labels”(HyDE), 2022. [링크](https://arxiv.org/abs/2212.10496)
- Anthropic, “Building effective agents”, 2024. [링크](https://www.anthropic.com/engineering/building-effective-agents)
- A. Singh 외, “Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG”, 2025. [링크](https://arxiv.org/abs/2501.09136)
- S. Yao 외, “ReAct: Synergizing Reasoning and Acting in Language Models”, ICLR 2023. [링크](https://arxiv.org/abs/2210.03629)
- H. Trivedi 외, “Interleaving Retrieval with Chain-of-Thought Reasoning for Knowledge-Intensive Multi-Step Questions”(IRCoT), ACL 2023. [링크](https://arxiv.org/abs/2212.10509)
- Z. Jiang 외, “Active Retrieval Augmented Generation”(FLARE), EMNLP 2023. [링크](https://arxiv.org/abs/2305.06983)
- A. Asai 외, “Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection”, 2023. [링크](https://arxiv.org/abs/2310.11511)
- S. Es 외, “Ragas: Automated Evaluation of Retrieval Augmented Generation”, 2023. [링크](https://arxiv.org/abs/2309.15217)
