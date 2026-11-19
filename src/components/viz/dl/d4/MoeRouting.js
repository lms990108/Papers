import React, {useState} from 'react';
import {Viz, Controls, Slider, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';

const TOKENS = ['토큰 1', '토큰 2', '토큰 3', '토큰 4'];
const EXP = ['expert 1', 'expert 2'];

export default function MoeRouting() {
  const [route, setRoute] = useState([0, 0, 1, 1]);
  const [factor, setFactor] = useState(1);

  const avg = 4 / 2; // 토큰 4개, expert 2개, 토큰마다 1개 선택
  const cap = Math.round(factor * avg);
  const taken = [0, 0];
  const status = route.map((e) => {
    if (taken[e] < cap) {
      taken[e] += 1;
      return 'ok';
    }
    return 'over';
  });
  const counts = [0, 1].map((e) => route.filter((r) => r === e).length);
  const over = status.filter((x) => x === 'over').length;
  const idle = counts.filter((c) => c === 0).length;

  return (
    <Viz
      title="MoE: router가 토큰을 expert에 보낼 때 몰림과 넘침"
      caption="토큰 4개, expert 2개이고 토큰마다 expert 하나를 고릅니다. 토큰 버튼을 눌러 보낼 expert를 바꾸세요. 평균은 expert당 2토큰이고, 상한은 평균 × capacity factor입니다. 앞 토큰부터 상한까지 받고, 넘친 토큰은 처리되지 않습니다(설명용 규칙)."
    >
      <Controls>
        <Btn on={route.join() === '0,0,1,1'} onClick={() => setRoute([0, 0, 1, 1])}>고르게 (2, 2)</Btn>
        <Btn on={route.join() === '0,0,0,0'} onClick={() => setRoute([0, 0, 0, 0])}>모두 expert 1로 (4, 0)</Btn>
        <Slider label="capacity factor" min={0.5} max={2} step={0.5} value={factor} onChange={setFactor} format={(v) => fmt(v, 1)} />
      </Controls>
      <div className={s.two}>
        {EXP.map((nm, e) => (
          <div key={nm} style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: '8px 10px', minHeight: 110}}>
            <b style={{fontSize: '0.85rem'}}>{nm}</b>
            <span style={{fontSize: '0.78rem', marginLeft: 8}}>받은 토큰 {counts[e]}개, 상한 {cap}</span>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8}}>
              {route.map((r, i) =>
                r === e ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRoute(route.map((x, j) => (j === i ? 1 - x : x)))}
                    aria-label={`${TOKENS[i]}, ${nm}로 보냄${status[i] === 'over' ? ', 넘침' : ''}. 누르면 다른 expert로 바꿈`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1.5px solid ${status[i] === 'over' ? 'var(--vbad)' : 'var(--vok)'}`,
                      background: `color-mix(in srgb, ${status[i] === 'over' ? 'var(--vbad)' : 'var(--vok)'} 16%, transparent)`,
                      color: 'var(--ifm-font-color-base)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    {TOKENS[i]} {status[i] === 'over' ? '(넘침)' : '(처리)'}
                  </button>
                ) : null,
              )}
              {counts[e] === 0 ? <span style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-700)'}}>토큰 없음: 쉽니다</span> : null}
            </div>
          </div>
        ))}
      </div>
      <Stats>
        <Stat label="한 expert의 상한" value={`${cap}토큰`} />
        <Stat label="넘친 토큰" value={`${over}개`} tone={over > 0 ? 'bad' : 'good'} />
        <Stat label="쉬는 expert" value={`${idle}개`} tone={idle > 0 ? 'bad' : 'good'} />
      </Stats>
      <Note>
        고르게 가면 expert마다 2토큰입니다. 4토큰이 모두 첫째 expert로 가면 둘째는 0이라 반이 쉽니다. 평균이 2이고 factor가 1이면 상한은 2라서, 셋째 토큰부터는 넘칩니다. 일을 고르게 하려고, router 비율과 실제 배정 비율이 한쪽으로 몰릴수록 커지는 오차를 더하는 것이 load-balancing loss입니다.
      </Note>
    </Viz>
  );
}
