---
title: AI Study
---

언어 모델을 보려면 그 앞에 있는 개념부터 보는 편이 낫다. 아래는 각 단계에서 먼저 답해야 하는 질문이다. 링크가 있는 항목만 지금 읽을 수 있고, 5번은 아직 페이지가 없다.

## 1. 손실을 줄이는 방법

맞히고 싶은 출력과 실제 출력의 차이를 하나의 수로 만들고, 파라미터를 고쳐 그 수를 줄인다. 기울기는 그 수가 어느 방향으로 커지는지다. 데이터를 전부 평균하기 전에 갱신할 수도 있고, 학습에 넣은 쌍에서만 좋아지는 문제도 따로 있다.

- [경사하강법 (gradient descent)](./gradient-descent.md)
- [확률적 경사하강법 (SGD)](./sgd.md)
- [역전파 (backpropagation)](./backpropagation.md)
- [용량과 정칙화 (capacity, regularization)](./capacity.md)
- [판별 학습 (discriminative learning)](./discriminative-learning.md)

## 2. 입력의 구조를 망에 넣기

픽셀을 번호 매긴 목록으로만 보면, 같은 획을 위치마다 다시 배운다. 가까운 칸만 보고 같은 검출기를 여러 위치에 쓰면, 그 반복을 구조가 맡는다. 먼저 볼 예는 작은 합성곱망이다. 언어 모델에서 모든 토큰에 같은 블록을 쓰는 것도, 자리마다 다른 파라미터를 두지 않겠다는 같은 종류의 선택이다.

- [합성곱 신경망 (convolutional neural network, CNN)](./cnn.md)
- [가중치 공유 (weight sharing)](./weight-sharing.md)
- [서브샘플링 (subsampling)](./subsampling.md)
- [LeNet-5](./lenet-5.md)
- [RBF (radial basis function)](./rbf.md)

## 3. 다른 방법과 비교

같은 시험 집합이 있어야 오류 차이를 방법의 차이로 읽을 수 있다. 오류만 보지 않고, 인식할 때 계산량과 메모리도 같이 본다. 신경망만 답이 되는 것은 아니다.

- [MNIST](./mnist.md)
- [부스팅 (boosting)](./boosting.md)
- [서포트 벡터 머신 (support vector machine, SVM)](./svm.md)

## 4. 길이가 정해지지 않은 입력

숫자 그림 한 장과 달리 말과 문장은 길이가 매번 다르다. 후보 해석을 그래프로 나타내고, 경로 하나의 비용과 경로를 전부 더한 비용을 구분한다. 경계를 먼저 하나로 확정하지 않은 채, 문자열 전체의 손실로 앞 모듈까지 같이 학습한다.

- [은닉 마르코프 모델 (hidden Markov model, HMM)](./hmm.md)
- [비터비 (Viterbi)](./viterbi.md)
- [전방 알고리즘 (forward algorithm)](./forward-algorithm.md)
- [휴리스틱 과분할 (heuristic over-segmentation)](./over-segmentation.md)
- [그래프 변환 신경망 (graph transformer network, GTN)](./gtn.md)
- [공간 이동 신경망 (space displacement neural network, SDNN)](./sdnn.md)

## 5. 다음 토큰

페이지는 아직 없다. 격자로 해석을 고르던 일을, 앞 토큰이 주어졌을 때 다음 토큰을 맞추는 일로 바꾼다. 그 다음이 어텐션과 트랜스포머이고, 큰 말뭉치로 그 손실을 먼저 학습한 뒤 선호를 맞추는 일이다.
