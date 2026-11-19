import React, {useState} from 'react';
import {Viz, Controls, Btn, Stats, Stat, Note, fmt, styles as s} from '../../Viz';
import {PEN0, errorStats, arcText} from './util';

const TARGETS = ['11', '41', '111'];

function GradBar({g}) {
  const w = Math.min(100, Math.abs(g) * 100) / 2;
  const pos = g > 0;
  return (
    <div style={{position: 'relative', height: 14, minWidth: 120, background: 'var(--ifm-color-emphasis-100)', borderRadius: 4}}>
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--ifm-color-emphasis-500)'}} />
      <div
        style={{
          position: 'absolute', top: 0, bottom: 0,
          left: pos ? '50%' : `${50 - w}%`,
          width: `${w}%`,
          background: pos ? 'var(--va)' : 'var(--vb)',
          borderRadius: 3,
        }}
      />
    </div>
  );
}

export default function TwoCostGradient() {
  const [target, setTarget] = useState('11');
  const [fwd, setFwd] = useState(false);
  const st = errorStats(PEN0, target);
  const grad = fwd ? st.gradF : st.gradV;
  const cc = fwd ? st.fwdC : st.vitC;
  const cu = fwd ? st.fwdU : st.vitU;
  const stats = TARGETS.map((t) => errorStats(PEN0, t));

  return (
    <Viz
      title="두 비용의 차 E = Cc − Cu 와 호별 기울기"
      caption="정답 라벨을 고르고, 비용을 비터비(최소 경로)로 읽을지 전방(logadd)으로 읽을지 정하세요. 기울기가 양수인 호는 벌점이 내려가고, 음수인 호는 올라갑니다. 양쪽에서 똑같이 쓰인 호는 0입니다."
    >
      <Controls>
        {TARGETS.map((t) => (
          <Btn key={t} on={t === target} onClick={() => setTarget(t)}>정답 “{t}”</Btn>
        ))}
        <Btn on={!fwd} onClick={() => setFwd(false)}>비터비로 읽기</Btn>
        <Btn on={fwd} onClick={() => setFwd(true)}>전방으로 읽기</Btn>
      </Controls>
      <Stats>
        <Stat label="Cc (정답 제약 그래프)" value={fmt(cc, 3)} />
        <Stat label="Cu (제약 없는 그래프)" value={fmt(cu, 3)} />
        <Stat label="오차 E = Cc − Cu" value={fmt(cc - cu, 3)} tone={cc - cu < 1e-9 ? 'good' : 'bad'} />
      </Stats>
      <table className={s.grid}>
        <thead>
          <tr>
            <th>호</th><th>벌점</th>
            <th>{fwd ? '정답 쪽 쓰일 확률' : '정답 쪽 최소 경로'}</th>
            <th>{fwd ? '제약 없는 쪽 쓰일 확률' : '제약 없는 쪽 최소 경로'}</th>
            <th>기울기</th><th>왼쪽: 올림 / 오른쪽: 내림</th>
          </tr>
        </thead>
        <tbody>
          {st.ids.map((id) => {
            const [k, l] = id.split(':');
            const g = grad[id];
            const zero = Math.abs(g) < 0.0005;
            const used = (p) => (fwd ? fmt((p[id] || 0) * 100, 0) + '%' : p[id] ? '쓰임' : '안 쓰임');
            const pcv = fwd ? st.pc : {[id]: st.bc.arcs.some((a) => a[0] === k && a[1] === l)};
            const puv = fwd ? st.pu : {[id]: st.bu.arcs.some((a) => a[0] === k && a[1] === l)};
            return (
              <tr key={id} style={zero && !fwd ? {opacity: 0.55} : undefined}>
                <td>{arcText(k, l)}</td>
                <td>{PEN0[k][l]}</td>
                <td>{used(pcv)}</td>
                <td>{used(puv)}</td>
                <td className={!zero && Math.abs(g) > (fwd ? 0.1 : 0.5) ? s.cellOn : undefined}>{g > 0 ? '+' : ''}{fmt(g, fwd ? 3 : 0)}</td>
                <td><GradBar g={g} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className={s.grid}>
        <thead>
          <tr><th>정답 라벨</th><th>정답 경로 수</th><th>비터비 오차</th><th>전방 오차</th></tr>
        </thead>
        <tbody>
          {TARGETS.map((t, i) => (
            <tr key={t}>
              <td className={t === target ? s.cellOn : undefined}>“{t}”</td>
              <td className={t === target ? s.cellOn : undefined}>{stats[i].right.length}</td>
              <td className={t === target ? s.cellOn : undefined}>{fmt(stats[i].ev, 3)}</td>
              <td className={t === target ? s.cellOn : undefined}>{fmt(stats[i].ef, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Note>
        {target === '41'
          ? '정답이 이미 가장 싼 경로입니다. 비터비 오차는 0이고 기울기도 모두 0이어서 학습이 멈춥니다. 전방 오차는 0.104로 남아 계속 기울기를 줍니다.'
          : fwd
            ? '전방에서는 모든 호가 기울기를 받되, 쓰일 확률에 비례합니다. 최소 경로 밖의 호도 조금씩 받습니다.'
            : '비터비에서는 두 최소 경로에 든 호만 기울기를 받습니다. 양쪽에 든 2→3의 1은 상쇄되어 0입니다.'}
      </Note>
    </Viz>
  );
}
