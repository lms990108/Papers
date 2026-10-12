---
title: 개체명 인식 (named entity recognition)
sidebar_position: 36
---

[자연어 처리](./nlp.md)에서 단어마다 레이블을 붙이는 일 중, 사람·장소·기관처럼 이름이 가리키는 대상을 찾는 것을 개체명 인식이라고 한다. named entity recognition, NER과 같은 말이다. 이 레이블을 표지라고 한다. 문장 전체의 긍정·부정과 달리 출력이 토큰 수만큼 있다.

:::tip[한눈에 보기]
개체명 인식은 토큰마다 "어떤 이름의 시작/속/바깥인가"를 맞히는 토큰별 분류이고, 평가는 이름 하나를 단위로 정밀도, 재현율, F1을 센다.

- 표지는 BIO로 쓴다. B는 이름의 시작, I는 그 이름의 속, O는 이름이 아닌 칸이다. 종류(PER, LOC, ORG 등)는 B와 I 뒤에 붙인다.
- 어긋난 표지 열(O 바로 뒤의 I 같은 것)은 규칙으로 걸러 낸다. 경로를 고르는 계산은 [비터비](./viterbi.md)와 같은 종류다.
- 평가는 토큰이 아니라 개체 단위다. 종류와 경계가 모두 맞아야 맞은 것으로 센다.

먼저 읽을 것: [자연어 처리](./nlp.md), [토큰화](./tokenization.md), [다음 토큰](./next-token.md). 비슷한 모양: [버트](./bert.md)의 토큰별 파인튜닝.
:::

## 문제 정의

“서울 날씨 좋다”에서 서울은 장소이고, 날씨와 좋다는 이름이 아니다. 표지는 서울만 LOC이고 나머지는 O다. O는 개체명이 아니라는 칸이다. 문장 하나에서 이름이 가리키는 구간을 찾고 그 종류를 붙이는 일이므로, 토큰마다 하나씩 표지를 내는 분류로 바꿔 쓴다. 장소, 사람, 기관의 영어 약자는 LOC, PER, ORG다. 영어 NER의 대표 데이터인 CoNLL-2003은 PER, LOC, ORG와 기타(MISC) 네 종류를 쓴다.

## BIO 표기

이름이 토큰 둘 이상이면 시작과 속을 나눈다. 이 표기를 BIO라고 한다. Beginning, Inside, Outside와 같은 말이다. “서울 특별시”를 장소 하나로 보면 서울은 B-LOC, 특별시는 I-LOC이다. 서울만 장소로 두고 특별시를 O로 두면, 특별시는 그 이름 밖이 된다. I-LOC은 앞 토큰과 같은 이름의 속이다. 특별시가 I-LOC인데 서울이 O이면 시작이 없는 속이 되어, 그 표지 열은 규칙에 어긋난다.

| 토큰 | 표지 |
| --- | --- |
| 서울 | B-LOC |
| 특별시 | I-LOC |
| 날씨 | O |
| 좋다 | O |

B가 없이 I만으로도 구간을 나타낼 수 있을 것 같지만, 이름이 붙어 있는 두 개체(예: 이웃한 두 장소)를 가르려면 두 번째 이름의 시작을 표시할 B가 있어야 한다. 시작을 B로 표시하고 끝을 E, 한 토큰짜리를 S로 따로 표시하는 BIOES도 쓰인다.

<figure>

<svg viewBox="0 0 680 130" role="img" aria-label="서울은 B-LOC, 특별시는 I-LOC, 날씨와 좋다는 O다." style="width:100%;max-width:680px;height:auto;display:block">
  <g fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="24" y="24" width="100" height="36" stroke="#c2410c"/>
    <rect x="140" y="24" width="110" height="36" stroke="#c2410c"/>
    <rect x="266" y="24" width="90" height="36"/>
    <rect x="372" y="24" width="90" height="36"/>
  </g>
  <g fill="currentColor" font-size="14" text-anchor="middle">
    <text x="74" y="47">서울</text>
    <text x="195" y="47">특별시</text>
    <text x="311" y="47">날씨</text>
    <text x="417" y="47">좋다</text>
    <text x="74" y="92">B-LOC</text>
    <text x="195" y="92">I-LOC</text>
    <text x="311" y="92">O</text>
    <text x="417" y="92">O</text>
  </g>
</svg>

<figcaption>주황 두 칸이 장소 이름 하나다. B가 시작이고 I가 그 안의 다음 토큰이다.</figcaption>

</figure>

## 모델과 손실

품사 태깅도 같은 모양이다. 토큰마다 명사, 동사 같은 칸을 붙인다. part-of-speech tagging과 같은 말이다. 손실은 자리마다의 분류 손실을 평균한 것이고, [다음 토큰](./next-token.md)이 다음 단어의 비율을 평균하는 것과 같다. 정답이 다음 단어가 아니라 그 자리의 표지다. 구조로는 [순환 신경망](./rnn.md)이나 [트랜스포머](./transformer.md)로 토큰마다 목록을 만들고, 그 목록에 가중치를 곱해 표지마다의 점수를 낸 뒤 [소프트맥스](./softmax.md)를 쓴다. [버트](./bert.md)를 파인튜닝한다면 마지막 층의 토큰별 목록을 그대로 표지 분류에 쓴다. 토큰화가 단어를 조각으로 쪼개면 보통 첫 조각의 표지만 정답으로 두고 나머지는 손실에서 뺀다.

## 어긋난 열 걸러 내기

앞뒤 표지가 서로 제약한다. 자리마다 점수를 낸 뒤, 시작이 없는 I-LOC처럼 어긋난 열에는 비용을 더한다. 남는 열 가운데 비용이 가장 작은 것을 고른다. 경로를 고르는 계산은 [비터비](./viterbi.md)와 같은 종류다.

토큰 둘로 확인한다. 점수가 클수록 좋다. 서울은 B-LOC 2, I-LOC 0, O 3이고, 특별시는 B-LOC 0, I-LOC 5, O 0이라고 하자. 자리마다 가장 높은 표지를 고르면 서울은 O(3), 특별시는 I-LOC(5)이고 점수 합이 8, 비용은 \(-8\)이다. 그러나 O 바로 뒤의 I-LOC은 시작이 없는 속이라 규칙에 어긋난다. 이런 열에 비용 5를 더하면 \(-8 + 5 = -3\)이 된다. 맞는 열 B-LOC, I-LOC은 점수 합이 \(2 + 5 = 7\), 비용이 \(-7\)이다. \(-7\)이 \(-3\)보다 작으므로 맞는 열이 이긴다. 비용이 없으면 \(-8\)이 \(-7\)보다 작아서 어긋난 열이 이긴다.

```python
from itertools import product

tags = ["B-LOC", "I-LOC", "O"]
score = {"서울":   {"B-LOC": 2, "I-LOC": 0, "O": 3},
         "특별시": {"B-LOC": 0, "I-LOC": 5, "O": 0}}   # 점수가 클수록 좋다
words = ["서울", "특별시"]
PENALTY = 5                                            # 시작이 없는 I 에 더하는 비용

def total(path):
    return sum(score[w][t] for w, t in zip(words, path))

def cost(path):
    c = -total(path)
    prev = "O"                                         # 문장 앞은 O 로 본다
    for t in path:
        if t == "I-LOC" and prev == "O":               # O 뒤에 바로 I
            c += PENALTY
        prev = t
    return c

paths = list(product(tags, repeat=2))
raw = max(paths, key=total)
print("점수만 보면:", raw, "점수 합", total(raw), "비용", -total(raw))
print("규칙을 넣으면:", min(paths, key=cost), "비용", cost(min(paths, key=cost)))
print("탈락한 열의 비용:", cost(raw))
```

```text
점수만 보면: ('O', 'I-LOC') 점수 합 8 비용 -8
규칙을 넣으면: ('B-LOC', 'I-LOC') 비용 -7
탈락한 열의 비용: -3
```

자리마다 손실을 따로 평균하면 이 5가 없다. 서울이 O여도 그 자리 손실만 보고, 특별시의 I-LOC은 자기 정답과만 비교한다. 두 자리가 맞는 열을 고르려면 손실 평균 뒤에 경로 비용이 한 번 더 필요하다. 날씨와 좋다의 O는 앞 표지가 무엇이든 규칙에 맞아서, 그 자리에는 추가 비용이 없다. 문장이 길어 표지가 세 개일 때 경로 수가 \(3^n\)으로 늘면 위 코드처럼 모두 세지 않고, 앞에서부터 자리마다 가장 나은 경로만 남기는 비터비로 푼다.

## 평가: 정밀도, 재현율, F1

개체명 인식은 O가 대부분이라 토큰 정확도로 재면 후하게 나온다. 그래서 개체 하나를 단위로 센다. 종류와 경계(시작과 끝)가 모두 정답과 같을 때만 맞은 개체다. 맞은 개체 수를 TP(true positive), 맞다고 낸 것 중 틀린 수를 FP(false positive), 정답인데 못 낸 수를 FN(false negative)이라고 하자.

\[
\text{정밀도} = \frac{TP}{TP + FP}, \quad \text{재현율} = \frac{TP}{TP + FN}, \quad F_1 = \frac{2 \times \text{정밀도} \times \text{재현율}}{\text{정밀도} + \text{재현율}}
\]

정밀도는 모델이 이름이라고 한 것 중 실제로 맞은 비율이고, 재현율은 실제 이름 중 모델이 찾은 비율이다. F1은 둘의 조화평균이다.

문장 셋으로 계산한다. 정답의 이름은 다섯 개다.

| 문장 | 정답 | 모델 | 판정 |
| --- | --- | --- | --- |
| 이민섭 은 서울 특별시 에 산다 | PER 이민섭, LOC 서울 특별시 | PER 이민섭, LOC 서울 | PER은 맞음. LOC은 경계가 달라 FP 1, FN 1 |
| 삼성 전자 는 수원 에 있다 | ORG 삼성 전자, LOC 수원 | 같음 | TP 2 |
| 오늘 부산 날씨 좋다 | LOC 부산 | 없음 | FN 1 |

TP는 PER 이민섭, ORG 삼성 전자, LOC 수원으로 3이다. FP는 경계가 틀린 LOC 서울 하나로 1이다. FN은 LOC 서울 특별시와 LOC 부산으로 2이다. 정밀도는 \(3/(3+1) = 0.75\), 재현율은 \(3/(3+2) = 0.6\)이다.

\[
F_1 = \frac{2 \times 0.75 \times 0.6}{0.75 + 0.6} = \frac{0.9}{1.35} \approx 0.667
\]

같은 결과의 토큰 정확도는 열여섯 토큰 중 열네 개가 맞아 0.875다. 개체 F1 0.667보다 높다. 경계 하나가 틀린 서울 특별시도 서울은 B-LOC으로 맞았으므로 토큰 단위로는 대부분 맞게 센다.

```python
def spans(tags):
    """BIO 표지 열 -> {(종류, 시작, 끝)}. 끝은 포함하지 않는다."""
    out, start, kind = set(), None, None
    for i, t in enumerate(tags + ["O"]):          # 끝에 O 를 붙여 마지막 개체를 닫는다
        if t == "O" or t.startswith("B-") or (t.startswith("I-") and t[2:] != kind):
            if kind is not None:
                out.add((kind, start, i))
            start, kind = (i, t[2:]) if t != "O" else (None, None)
    return out

gold = [["B-PER", "O", "B-LOC", "I-LOC", "O", "O"],     # 이민섭 은 서울 특별시 에 산다
        ["B-ORG", "I-ORG", "O", "B-LOC", "O", "O"],     # 삼성 전자 는 수원 에 있다
        ["O", "B-LOC", "O", "O"]]                       # 오늘 부산 날씨 좋다
pred = [["B-PER", "O", "B-LOC", "O", "O", "O"],
        ["B-ORG", "I-ORG", "O", "B-LOC", "O", "O"],
        ["O", "O", "O", "O"]]

tp = fp = fn = 0
by = {}                                                 # 종류별 [tp, fp, fn]
for g, p in zip(gold, pred):
    G, P = spans(g), spans(p)
    for s in G & P: by.setdefault(s[0], [0, 0, 0])[0] += 1
    for s in P - G: by.setdefault(s[0], [0, 0, 0])[1] += 1
    for s in G - P: by.setdefault(s[0], [0, 0, 0])[2] += 1
    tp, fp, fn = tp + len(G & P), fp + len(P - G), fn + len(G - P)

def prf(tp, fp, fn):
    P = tp / (tp + fp) if tp + fp else 0.0
    R = tp / (tp + fn) if tp + fn else 0.0
    return P, R, (2 * P * R / (P + R) if P + R else 0.0)

print("TP, FP, FN =", tp, fp, fn)
print("정밀도, 재현율, F1 =", [round(v, 4) for v in prf(tp, fp, fn)])
for k, v in sorted(by.items()):
    print(k, v, [round(x, 4) for x in prf(*v)])
macro = sum(prf(*v)[2] for v in by.values()) / len(by)
acc = sum(a == b for g, p in zip(gold, pred) for a, b in zip(g, p)) / sum(len(g) for g in gold)
print("매크로 F1 =", round(macro, 4), " 토큰 정확도 =", round(acc, 4))
```

```text
TP, FP, FN = 3 1 2
정밀도, 재현율, F1 = [0.75, 0.6, 0.6667]
LOC [1, 1, 2] [0.5, 0.3333, 0.4]
ORG [1, 0, 0] [1.0, 1.0, 1.0]
PER [1, 0, 0] [1.0, 1.0, 1.0]
매크로 F1 = 0.8  토큰 정확도 = 0.875
```

종류별로 보면 LOC만 약하다. LOC의 TP는 수원 하나, FP는 서울, FN은 서울 특별시와 부산이라 정밀도 0.5, 재현율 0.333, F1 0.4다. PER과 ORG는 1이다. 개체 전체를 한꺼번에 세어 구한 0.667을 마이크로 F1이라고 하고, 종류별 F1을 평균한 \((1 + 1 + 0.4)/3 = 0.8\)을 매크로 F1이라고 한다. 개체 수가 적은 종류도 같은 무게로 반영하는 점이 다르다.

## 자주 헷갈리는 점

토큰 정확도가 높으면 개체를 잘 찾는다고 생각하기 쉽지만, O가 대부분이라 모델이 전부 O로 내도 높게 나온다. 위 열여섯 토큰에서 이름 토큰은 일곱 개뿐이고 O가 아홉 개다. 전부 O로 내면 정확도가 9/16 \(\approx\) 0.563인데 개체 F1은 0이다. 문장이 길수록 O의 비중이 커져 이 격차가 더 벌어진다.

경계가 조금 틀렸으니 부분 점수를 받는다고 생각하기 쉽지만, 정확히 맞춘 평가에서는 정답 하나를 놓친 FN과 틀린 것을 낸 FP가 동시에 하나씩 생긴다. 서울 특별시를 서울로 낸 위 예가 그렇다. 경계가 느슨하게 겹치면 맞다고 세는 평가도 있어서, 논문의 점수를 비교할 때는 어느 쪽인지 확인한다.

F1이 정밀도와 재현율의 평균이라고 생각하기 쉽지만 조화평균이다. 정밀도 1, 재현율 0.1이면 산술평균은 0.55이지만 F1은 \(2 \times 1 \times 0.1 / 1.1 \approx 0.182\)다. 한쪽이 낮으면 F1도 낮게 끌려간다.

B-LOC와 I-LOC가 서로 다른 종류라고 생각하기 쉽지만, 둘 다 LOC이고 위치만 다르다. 종류가 다른 B-PER 뒤에 I-LOC이 오는 것은 어긋난 열이다.

## 직접 풀어 보기

1. 정답 개체가 10개, 모델이 8개를 내서 그중 6개가 맞았다. 정밀도, 재현율, F1은?

2. 정답이 B-ORG I-ORG O이고 모델이 B-ORG O O이면, 개체 단위로 TP, FP, FN은? 토큰 정확도는?

3. 점수만 보면 열 \((O,\ I\text{-}LOC)\)의 합이 8, 맞는 열 \((B\text{-}LOC,\ I\text{-}LOC)\)의 합이 7이다. 어긋난 열에 비용을 최소 얼마 이상 더해야 맞는 열이 이기는가?

<details>
<summary>정답</summary>

1. 정밀도 \(6/8 = 0.75\), 재현율 \(6/10 = 0.6\), F1은 \(2 \times 0.75 \times 0.6 / 1.35 \approx 0.667\)이다.

2. 모델의 ORG 구간은 첫 토큰 하나이고 정답은 두 토큰이라 경계가 다르다. TP 0, FP 1, FN 1이다. 토큰은 세 개 중 두 개(B-ORG와 마지막 O)가 맞아 2/3 \(\approx 0.667\)이다.

3. 비용으로 보면 어긋난 열은 \(-8 + c\), 맞는 열은 \(-7\)이다. 맞는 열이 이기려면 \(-7 < -8 + c\), 곧 \(c > 1\)이다. 위 예에서 5를 쓴 것은 충분히 큰 값이다.

</details>

## 정리

개체명 인식은 토큰마다 BIO 표지를 맞히는 분류다. 학습은 자리별 교차 엔트로피 평균이고, 어긋난 열은 경로 비용이나 [비터비](./viterbi.md)로 걸러 낸다. 평가는 개체 하나를 단위로 정밀도, 재현율, F1을 세며, 토큰 정확도는 O 때문에 후하게 나온다. 이 토큰별 분류에 문장 전체를 앞뒤로 읽은 목록을 쓰는 것이 [버트](./bert.md)의 파인튜닝이다.
