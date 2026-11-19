// 설명용 장난감 데이터와 계산: 지식 그래프 그림들이 함께 쓴다.
// 모든 이름, 청크, 벡터는 설명용으로 만든 가상 값이다(실제 회사나 모델의 값이 아니다).

// 청크 i와 세 쌍 i가 짝이다.
export const TRIPLES = [
  ['연차 규정', '연차일수', '"15일"'],
  ['인사팀', '관리한다', '연차 규정'],
  ['박지영', '이끈다', '재무팀'],
  ['김민수', '이끈다', '인사팀'],
  ['병가 규정', '별도다', '연차 규정'],
  ['재무팀', '관리한다', '출장비 정산'],
];
export const TRIPLE_TEXT = TRIPLES.map((t) => t.join(', ')).join('\n');

// 설명용 벡터의 차원 이름
export const DIMS = ['연차', '병가', '인사팀', '재무팀', '팀장', '관리'];
export const CHUNKS = [
  {id: 1, text: '연차는 15일입니다.', vec: [1, 0, 0, 0, 0, 0]},
  {id: 2, text: '연차 규정은 인사팀이 관리합니다.', vec: [1, 0, 1, 0, 0, 1]},
  {id: 3, text: '재무팀의 팀장은 박지영입니다.', vec: [0, 0, 0, 1, 1, 0]},
  {id: 4, text: '인사팀의 팀장은 김민수입니다.', vec: [0, 0, 1, 0, 1, 0]},
  {id: 5, text: '병가는 연차와 별도입니다.', vec: [0.4, 1, 0, 0, 0, 0]},
  {id: 6, text: '출장비 정산은 재무팀이 관리합니다.', vec: [0, 0, 0, 1, 0, 1]},
];

// need: 답에 필요한 청크 번호, walk: 그래프에서 따라가는 길
export const QUESTIONS = [
  {id: 'A', text: '연차는 며칠인가요?', vec: [1, 0, 0, 0, 0, 0], need: [1], start: '연차 규정', link: '연차', walk: [{p: '연차일수', dir: 'out'}]},
  {id: 'D', text: '인사팀 팀장은 누구인가요?', vec: [0, 0, 1, 0, 1, 0], need: [4], start: '인사팀', link: '인사팀', walk: [{p: '이끈다', dir: 'in'}]},
  {
    id: 'B',
    text: '연차 규정을 관리하는 팀의 팀장은 누구인가요?',
    vec: [1, 0, 0, 0, 1, 1],
    need: [2, 4],
    start: '연차 규정',
    link: '연차 규정',
    walk: [{p: '관리한다', dir: 'in'}, {p: '이끈다', dir: 'in'}],
  },
  {id: 'C', text: '팀이 관리하는 규정은 모두 몇 개인가요?', vec: [0, 0, 0, 0, 0, 1], need: [2, 6], count: '관리한다'},
];

export const cosine = (a, b) => {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const na = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  const nb = Math.sqrt(b.reduce((s, x) => s + x * x, 0));
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
};

// 점수 큰 순. 소수점 9자리까지 같으면 동점으로 보고 번호 순으로 둔다.
export function rank(qvec) {
  const rows = CHUNKS.map((c) => ({...c, score: cosine(qvec, c.vec)}));
  const key = (r) => Math.round(r.score * 1e9);
  rows.sort((a, b) => key(b) - key(a) || a.id - b.id);
  return rows.map((r) => ({...r, tie: rows.filter((o) => key(o) === key(r)).length > 1}));
}

// 그래프에서 따라가기. dropped는 추출되지 않았다고 치는 세 쌍의 번호(없으면 -1).
export function graphWalk(q, dropped) {
  const tri = TRIPLES.map((t, i) => ({s: t[0], p: t[1], o: t[2].replace(/^"|"$/g, ''), i})).filter((t) => t.i !== dropped);
  if (q.count) {
    const hit = tri.filter((t) => t.p === q.count);
    return {hops: [{label: `${q.count} 간선을 모두 찾습니다`, edges: hit.map((t) => t.i)}], answer: `${hit.length}개`, ok: hit.length > 0};
  }
  let frontier = [q.start];
  const hops = [{label: `질문의 "${q.link}"를 노드 ${q.start}에 연결합니다`, edges: []}];
  let broke = false;
  q.walk.forEach((w) => {
    if (broke) return;
    const hit = tri.filter((t) => t.p === w.p && frontier.indexOf(w.dir === 'in' ? t.o : t.s) >= 0);
    hops.push({label: `${w.p} 간선을 ${w.dir === 'in' ? '거꾸로' : '그대로'} 따라갑니다`, edges: hit.map((t) => t.i)});
    frontier = hit.map((t) => (w.dir === 'in' ? t.s : t.o));
    if (hit.length === 0) broke = true;
  });
  return {hops, answer: broke || frontier.length === 0 ? '찾지 못함' : frontier.join(', '), ok: !broke && frontier.length > 0};
}

// ---------- 세 쌍 읽기 ----------
const QUOTED = /^["“”'].*["“”']$/;
export function parseTriples(text, maxLines = 40) {
  const triples = [];
  const bad = [];
  const seen = {};
  let dup = 0;
  let used = 0;
  String(text == null ? '' : text)
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      used += 1;
      if (used > maxLines) {
        if (used === maxLines + 1) bad.push({n: i + 1, text: line, why: `${maxLines}줄까지만 읽습니다`});
        return;
      }
      const m = line.match(/^([^,，\t]*)[,，\t]([^,，\t]*)[,，\t](.*)$/);
      if (!m) return bad.push({n: i + 1, text: line, why: '쉼표로 나눈 세 칸(주어, 관계, 목적어)이 아닙니다'});
      const [s, p, o] = [m[1].trim(), m[2].trim(), m[3].trim()];
      if (!s || !p || !o) return bad.push({n: i + 1, text: line, why: '빈 칸이 있습니다'});
      if (QUOTED.test(s)) return bad.push({n: i + 1, text: line, why: '값(따옴표)은 주어가 될 수 없습니다'});
      if (QUOTED.test(p)) return bad.push({n: i + 1, text: line, why: '관계는 이름이어야 합니다'});
      const lit = o.length >= 2 && QUOTED.test(o);
      const obj = lit ? o.slice(1, -1).trim() : o;
      if (!obj) return bad.push({n: i + 1, text: line, why: '목적어가 비었습니다'});
      const key = `${s}|${p}|${lit ? 'L' : 'E'}${obj}`;
      if (seen[key]) {
        dup += 1;
        return;
      }
      seen[key] = true;
      triples.push({s, p, o: obj, lit});
    });
  return {triples, bad, dup};
}

export function buildGraph(triples) {
  const nodes = [];
  const idx = {};
  const add = (label, lit) => {
    const id = (lit ? 'L:' : 'E:') + label;
    if (!(id in idx)) {
      idx[id] = nodes.length;
      nodes.push({id, label, lit});
    }
    return id;
  };
  const edges = triples.map((t, i) => ({key: `e${i}`, s: add(t.s, false), p: t.p, o: add(t.o, t.lit)}));
  return {nodes, edges};
}

// ---------- 온톨로지 ----------
export const PARENT = {'휴가 규정': '규정', '정산 규정': '규정'};
export const ENT_CLASS = {
  김민수: '사람',
  박지영: '사람',
  인사팀: '팀',
  재무팀: '팀',
  '연차 규정': '휴가 규정',
  '병가 규정': '휴가 규정',
  '출장비 정산': '정산 규정',
};
export const RELS = {
  이끈다: {dom: '사람', ran: '팀'},
  관리한다: {dom: '팀', ran: '규정'},
  연차일수: {dom: '규정', ran: '값'},
  별도다: {dom: '규정', ran: '규정'},
};
export const ancestors = (c) => {
  const out = [];
  let cur = c;
  while (cur && out.length < 8) {
    out.push(cur);
    cur = PARENT[cur];
  }
  return out;
};
export const isA = (c, target) => ancestors(c).indexOf(target) >= 0;

// 세 쌍 하나의 검사. o가 값이면 olit true.
export function checkTriple(s, p, o, olit) {
  const rel = RELS[p];
  const sc = ENT_CLASS[s];
  const oc = olit ? '값' : ENT_CLASS[o];
  const domOk = isA(sc, rel.dom);
  const ranOk = olit ? rel.ran === '값' : rel.ran !== '값' && isA(oc, rel.ran);
  return {rel, sc, oc, domOk, ranOk};
}

// ---------- 개체 연결 ----------
// 한 번 읽은 글에서 뽑힌 이름(멘션)들. gold는 사람이 정한 정답 개체, ctx는 같은 청크에 함께 나온 팀(설명용).
export const EXTRACTED = [
  {id: 'x1', s: '인사팀', p: '관리한다', o: '연차 규정'},
  {id: 'x2', s: '김 팀장', p: '이끈다', o: '인사 팀'},
  {id: 'x3', s: '민수 님', p: '소속', o: 'HR팀'},
  {id: 'x4', s: '김민수', p: '소속', o: '개발팀'},
  {id: 'x5', s: '김민수', p: '이끈다', o: '인사팀'},
  {id: 'x6', s: '연차 규정', p: '연차일수', o: '15일', olit: true},
];
const GOLD = ['HR', '연차', 'P1', 'HR', 'P1', 'HR', 'P2', 'DEV', 'P1', 'HR', '연차', 'V15'];
const CTX = ['', '', '인사팀', '', '인사팀', '', '개발팀', '', '인사팀', '', '', ''];
export const MENTIONS = (() => {
  const out = [];
  EXTRACTED.forEach((x) => {
    out.push({raw: x.s, tid: x.id, pos: 's', lit: false});
    out.push({raw: x.o, tid: x.id, pos: 'o', lit: !!x.olit});
  });
  return out.map((m, i) => ({...m, i, gold: GOLD[i], ctx: CTX[i]}));
})();
const ALIAS = {'hr팀': '인사팀', 김팀장: '김민수', 민수님: '김민수'};
export const ALIAS_TEXT = 'HR팀 = 인사팀, 김 팀장 = 김민수, 민수 님 = 김민수';
const norm = (t) => t.replace(/\s+/g, '').toLowerCase();

// level 0 합치지 않음, 1 글자가 같으면, 2 공백 정리, 3 별칭 표. guard가 true면 문맥(팀)이 다른 이름은 합치지 않는다.
export function mergeMentions(level, guard) {
  const keyOf = (m) => (level === 0 ? `#${m.i}` : level === 1 ? m.raw : level === 2 ? norm(m.raw) : ALIAS[norm(m.raw)] || norm(m.raw));
  const parent = MENTIONS.map((_, i) => i);
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    return r;
  };
  MENTIONS.forEach((a) =>
    MENTIONS.forEach((b) => {
      if (b.i <= a.i || keyOf(a) !== keyOf(b)) return;
      if (a.lit !== b.lit) return;
      if (guard && a.ctx && b.ctx && a.ctx !== b.ctx) return;
      parent[find(b.i)] = find(a.i);
    }),
  );
  const root = MENTIONS.map((m) => find(m.i));
  let good = 0;
  let wrong = 0;
  let goldPairs = 0;
  MENTIONS.forEach((a) =>
    MENTIONS.forEach((b) => {
      if (b.i <= a.i) return;
      const same = a.gold === b.gold;
      const merged = root[a.i] === root[b.i];
      if (same) goldPairs += 1;
      if (same && merged) good += 1;
      if (!same && merged) wrong += 1;
    }),
  );
  const groups = {};
  MENTIONS.forEach((m) => {
    (groups[root[m.i]] = groups[root[m.i]] || []).push(m);
  });
  const nodes = Object.keys(groups).map((r) => {
    const g = groups[r];
    const golds = {};
    g.forEach((m) => {
      golds[m.gold] = true;
    });
    return {id: `${g[0].lit ? 'L' : 'E'}:c${r}`, label: level === 3 && ALIAS[norm(g[0].raw)] ? ALIAS[norm(g[0].raw)] : g[0].raw, lit: g[0].lit, root: Number(r), members: g, mixed: Object.keys(golds).length > 1};
  });
  const nodeOf = {};
  nodes.forEach((n) => n.members.forEach((m) => (nodeOf[m.i] = n.id)));
  const edges = EXTRACTED.map((x, k) => ({key: x.id, s: nodeOf[2 * k], p: x.p, o: nodeOf[2 * k + 1]}));
  // 질문: 연차 규정을 관리하는 팀의 팀장
  const start = nodes.filter((n) => n.members.some((m) => m.raw === '연차 규정' && m.pos === 's' && m.tid === 'x6'))[0];
  const teams = start ? edges.filter((e) => e.p === '관리한다' && e.o === start.id) : [];
  const pe = edges.filter((e) => e.p === '이끈다' && teams.some((t) => t.s === e.o));
  const lab = (id) => nodes.filter((n) => n.id === id)[0].label;
  return {nodes, edges, good, wrong, goldPairs, pathEdges: teams.concat(pe).map((e) => e.key), people: pe.map((e) => lab(e.s)).filter((x, i, a) => a.indexOf(x) === i)};
}

// 그림 배치용 자리(0~1 비율). 넓은 그림과 좁은 그림 두 가지.
export const KG_WIDE = {
  'E:김민수': [0.1, 0.12],
  'E:인사팀': [0.45, 0.12],
  'E:연차 규정': [0.84, 0.12],
  'E:병가 규정': [0.45, 0.52],
  'L:15일': [0.84, 0.55],
  'E:박지영': [0.1, 0.92],
  'E:재무팀': [0.45, 0.92],
  'E:출장비 정산': [0.84, 0.92],
  'E:이서연': [0.1, 0.52],
};
export const KG_TALL = {
  'E:김민수': [0.2, 0.06],
  'E:인사팀': [0.2, 0.36],
  'E:연차 규정': [0.2, 0.66],
  'L:15일': [0.2, 0.96],
  'E:박지영': [0.8, 0.06],
  'E:재무팀': [0.8, 0.36],
  'E:출장비 정산': [0.8, 0.66],
  'E:병가 규정': [0.78, 0.96],
  'E:이서연': [0.5, 0.2],
};
// 개체 연결 그림: 이름(멘션) 12개의 자리(0~1 비율). 같은 개체의 이름들은 한 줄에 모여 있다.
const SPOTS = [
  [0.7, 0.45], // m0 인사팀
  [0.9, 0.45], // m1 연차 규정
  [0.14, 0.12], // m2 김 팀장
  [0.48, 0.12], // m3 인사 팀
  [0.14, 0.34], // m4 민수 님
  [0.46, 0.34], // m5 HR팀
  [0.14, 0.9], // m6 김민수(개발)
  [0.48, 0.9], // m7 개발팀
  [0.14, 0.56], // m8 김민수(인사)
  [0.48, 0.56], // m9 인사팀
  [0.9, 0.72], // m10 연차 규정
  [0.9, 0.95], // m11 15일
];
export function mentionSpots() {
  const spot = {};
  MENTIONS.forEach((m) => {
    spot[m.i] = SPOTS[m.i];
  });
  return spot;
}
