import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, Bar} from '../../Viz';

const NS = [1, 10, 100, 1000, 10000, 1000000];
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function GradCost() {
  const [n, setN] = useState(1000);

  const num = 2 * n;
  const bp = 2;
  const maxv = Math.max(num, bp);

  return (
    <Viz
      title="파라미터가 N개일 때 계산 횟수"
      caption="가운데 차분은 파라미터마다 +d와 −d 두 번의 순방향이 필요합니다. 역전파는 순방향 한 번과 역방향 한 번입니다. 역방향의 계산량은 순방향과 같은 차수입니다."
    >
      <Controls>
        {NS.map((v) => (
          <Btn key={v} on={n === v} onClick={() => setN(v)}>
            N = {comma(v)}
          </Btn>
        ))}
      </Controls>
      <Bar label="수치 미분: 순방향" value={num} max={maxv} color="var(--vb)" text={`${comma(num)}번`} />
      <Bar label="역전파: 순방향" value={1} max={maxv} color="var(--va)" text="1번" />
      <Bar label="역전파: 역방향" value={1} max={maxv} color="var(--vc)" text="1번 (순방향과 같은 차수)" />
      <Stats>
        <Stat label="수치 미분 순방향 횟수 2N" value={`${comma(num)}번`} />
        <Stat label="역전파" value="순방향 1번 + 역방향 1번" />
      </Stats>
      <Note>
        {n === 1000
          ? 'N이 1,000이면 갱신 한 번에 수치 미분은 순방향이 2,000번 필요합니다.'
          : '막대가 너무 짧아 보이는 쪽이 역전파입니다. 파라미터가 많을수록 이 차이가 커집니다.'}
        {' '}막대는 순방향 계산 횟수를 같은 눈금으로 그린 것입니다.
      </Note>
    </Viz>
  );
}
