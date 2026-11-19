export const step = (s) => (s > 0 ? 1 : 0);
export const score = (w, b, x) => w[0] * x[0] + w[1] * x[1] + b;
export const predict = (w, b, x) => step(score(w, b, x));

export const DATASETS = {
  review: {name: '리뷰 두 건', data: [[[1, 0], 1], [[0, 1], 0]]},
  and: {name: '논리곱', data: [[[0, 0], 0], [[1, 0], 0], [[0, 1], 0], [[1, 1], 1]]},
  xor: {name: '배타적 논리합', data: [[[0, 0], 0], [[1, 0], 1], [[0, 1], 1], [[1, 1], 0]]},
};

// 파이썬 train()과 같은 순서로 모든 단계를 기록한다.
export function trainTrace(data, lr = 1, maxEpochs = 1000) {
  let w = [0, 0];
  let b = 0;
  const steps = [];
  let done = null;
  for (let ep = 1; ep <= maxEpochs; ep++) {
    let mistakes = 0;
    for (let i = 0; i < data.length; i++) {
      const x = data[i][0];
      const t = data[i][1];
      const s = score(w, b, x);
      const y = step(s);
      const err = t - y;
      if (err !== 0) {
        mistakes++;
        w = [w[0] + lr * err * x[0], w[1] + lr * err * x[1]];
        b = b + lr * err;
      }
      steps.push({ep, i, x, t, s, y, err, w, b});
    }
    if (mistakes === 0) {
      done = ep;
      break;
    }
  }
  return {steps, done};
}
