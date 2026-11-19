// 파이썬 random.seed(n) 뒤의 random.random()과 같은 값을 내는 메르센 트위스터(MT19937).
export function pyRandom(seed) {
  const N = 624;
  const M = 397;
  const mt = new Array(N);
  const initGenrand = (s) => {
    mt[0] = s >>> 0;
    for (let i = 1; i < N; i += 1) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
  };
  const key = [Math.abs(seed) >>> 0];
  initGenrand(19650218);
  let i = 1;
  let j = 0;
  for (let k = Math.max(N, key.length); k > 0; k -= 1) {
    const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
    mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
    i += 1;
    j += 1;
    if (i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
    if (j >= key.length) j = 0;
  }
  for (let k = N - 1; k > 0; k -= 1) {
    const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
    mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
    i += 1;
    if (i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
  }
  mt[0] = 0x80000000;

  let idx = N;
  const next32 = () => {
    if (idx >= N) {
      for (let kk = 0; kk < N; kk += 1) {
        const y = (mt[kk] & 0x80000000) | (mt[(kk + 1) % N] & 0x7fffffff);
        let v = mt[(kk + M) % N] ^ (y >>> 1);
        if (y & 1) v ^= 0x9908b0df;
        mt[kk] = v >>> 0;
      }
      idx = 0;
    }
    let y = mt[idx];
    idx += 1;
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  };
  return () => {
    const a = next32() >>> 5;
    const b = next32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  };
}
