import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, styles as s} from '../../Viz';

const STAGES = [
  {name: '나누지 않음 (복제)', cut: [false, false, false]},
  {name: 'ZeRO 1단계', cut: [false, false, true]},
  {name: 'ZeRO 2단계', cut: [false, true, true]},
  {name: 'ZeRO 3단계 (FSDP)', cut: [true, true, true]},
];
const ITEMS = [
  {name: '가중치', color: 'var(--va)'},
  {name: '기울기', color: 'var(--vb)'},
  {name: 'optimizer state', color: 'var(--vc)'},
];

export default function ZeroStages() {
  const [st, setSt] = useState(0);
  const [mm, setMm] = useState(false);

  const cut = STAGES[st].cut;
  const gathered = st === 3 && mm;

  return (
    <Viz
      title="FSDP와 ZeRO: 무엇을 장마다 복제하고 무엇을 나눠 갖는가"
      caption="막대 길이가 한 장이 가진 몫입니다. 꽉 찬 막대는 한 벌 전체, 짧은 막대는 네 조각 중 하나입니다. 세 가지의 실제 크기 비는 본문에 없어서 막대 길이를 같게 그렸습니다."
    >
      <Controls>
        {STAGES.map((x, i) => (
          <Btn key={x.name} on={st === i} onClick={() => setSt(i)}>
            {x.name}
          </Btn>
        ))}
        <Btn on={mm} onClick={() => setMm(!mm)}>행렬 곱 직전 보기</Btn>
      </Controls>
      <div className={s.two}>
        {[1, 2, 3, 4].map((g) => (
          <div key={g} style={{border: '1px solid var(--ifm-color-emphasis-300)', borderRadius: 8, padding: '6px 10px'}}>
            <b style={{fontSize: '0.85rem'}}>GPU {g}</b>
            {ITEMS.map((it, k) => {
              const split = cut[k] && !(k === 0 && gathered);
              return (
                <div key={it.name} style={{display: 'grid', gridTemplateColumns: '7.5em 1fr', gap: 6, alignItems: 'center', margin: '4px 0', fontSize: '0.78rem'}}>
                  <span>{it.name}</span>
                  <div style={{height: 14, background: 'var(--ifm-color-emphasis-100)', borderRadius: 4}}>
                    <div style={{width: split ? '25%' : '100%', height: '100%', background: it.color, borderRadius: 4, opacity: split ? 1 : 0.55}} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Stats>
        {ITEMS.map((it, k) => (
          <Stat
            key={it.name}
            label={`${it.name}: 네 장에 있는 양`}
            value={cut[k] && !(k === 0 && gathered) ? '한 벌 (1/4 조각 × 4)' : '네 벌 (복제)'}
            tone={cut[k] && !(k === 0 && gathered) ? 'good' : undefined}
          />
        ))}
      </Stats>
      <Note>
        optimizer state만 나누면 1단계, 기울기까지 나누면 2단계, 가중치까지 나누면 3단계입니다.
        {st === 3 ? ' 3단계에서는 행렬 곱 직전에 그 층의 가중치 조각을 all-gather로 모았다가, 곱이 끝나면 자기 조각만 남깁니다. “행렬 곱 직전 보기”를 눌러 보세요.' : ''}
      </Note>
    </Viz>
  );
}
