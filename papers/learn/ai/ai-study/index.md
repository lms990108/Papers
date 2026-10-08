---
title: AI Study
---

위에서부터 읽으면 된다. 신경망이 뭔지부터 보고, 비워 둔 수를 어떻게 채우는지 본 다음, 문장을 어떻게 자르고 세는지와 같은 기계로 다음 단어를 맞히는 법을 본다. 숫자 그림에 맞춘 배선과, 길이가 매번 다른 입력을 그래프로 다루는 방법은 그 다음이다. 사람이 고른 답으로 다시 맞추는 계산은 아직 없다.

## 1. 신경망

넣는 것은 밝기 같은 수 목록이고, 나오는 것도 수 목록이다. 기계를 짧은 단계로 나눈 것이 층이고, 어느 수가 어느 수에 곱해지는지가 구조다.

- [신경망 (neural network)](./neural-network.md)
- [층 (layer)](./layer.md)
- [신경망의 구조 (neural network)](./structure.md)

## 2. 빈칸을 채우는 방법

맞히고 싶은 출력과 실제 출력의 차이를 하나의 수로 만들고, 가중치를 고쳐 그 수를 줄인다. 기울기는 그 수가 어느 방향으로 커지는지다. 데이터를 전부 평균하기 전에 갱신할 수도 있고, 학습에 넣은 쌍에서만 좋아지는 문제도 따로 있다.

- [경사하강법 (gradient descent)](./gradient-descent.md)
- [확률적 경사하강법 (SGD)](./sgd.md)
- [역전파 (backpropagation)](./backpropagation.md)
- [용량과 정칙화 (capacity, regularization)](./capacity.md)
- [판별 학습 (discriminative learning)](./discriminative-learning.md)

## 3. 자연어

글은 길이가 문장마다 다르고, 밝기 같은 수가 아니다. 문장에 표지를 붙이거나, 다음 단어를 맞히는 일부터 본다. 횟수로 시작한 뒤, 단어를 수 목록으로 바꿔 신경망에 넣는다. 점수는 합이 1인 비율로 바꾸고, 각 단어는 자기보다 앞만 본다. 그 계산을 블록으로 쌓아, 다음에 있던 단어의 비율로 손실을 만든다.

- [자연어 처리 (natural language processing, NLP)](./nlp.md)
- [토큰화 (tokenization)](./tokenization.md)
- [단어 주머니 (bag of words)](./bag-of-words.md)
- [엔그램 (n-gram)](./ngram.md)
- [소프트맥스 (softmax)](./softmax.md)
- [임베딩 (embedding)](./embedding.md)
- [어텐션 (attention)](./attention.md)
- [트랜스포머 (transformer)](./transformer.md)
- [다음 토큰 (next-token prediction)](./next-token.md)

## 4. 그림의 배선

픽셀을 번호 매긴 목록으로만 보면, 같은 획을 위치마다 다시 배운다. 가까운 칸만 보고 같은 검출기를 여러 위치에 쓰면, 그 반복을 배선이 맡는다. 먼저 볼 예는 작은 합성곱망이다.

- [합성곱 신경망 (convolutional neural network, CNN)](./cnn.md)
- [가중치 공유 (weight sharing)](./weight-sharing.md)
- [서브샘플링 (subsampling)](./subsampling.md)
- [LeNet-5](./lenet-5.md)
- [RBF (radial basis function)](./rbf.md)

## 5. 다른 방법과 비교

같은 시험 집합이 있어야 오류 차이를 방법의 차이로 읽을 수 있다. 오류만 보지 않고, 인식할 때 계산량과 메모리도 같이 본다. 신경망만 답이 되는 것은 아니다.

- [MNIST](./mnist.md)
- [부스팅 (boosting)](./boosting.md)
- [서포트 벡터 머신 (support vector machine, SVM)](./svm.md)

## 6. 길이가 정해지지 않은 입력

숫자 그림 한 장과 달리 말과 문장은 길이가 매번 다르다. 후보 해석을 그래프로 나타내고, 경로 하나의 비용과 경로를 전부 더한 비용을 구분한다. 경계를 먼저 하나로 확정하지 않은 채, 문자열 전체의 손실로 앞 모듈까지 같이 학습한다.

- [은닉 마르코프 모델 (hidden Markov model, HMM)](./hmm.md)
- [비터비 (Viterbi)](./viterbi.md)
- [전방 알고리즘 (forward algorithm)](./forward-algorithm.md)
- [휴리스틱 과분할 (heuristic over-segmentation)](./over-segmentation.md)
- [그래프 변환 신경망 (graph transformer network, GTN)](./gtn.md)
- [공간 이동 신경망 (space displacement neural network, SDNN)](./sdnn.md)
