// 설명용 장난감 데이터: GraphRAG 그림들이 함께 쓰는 작은 코퍼스.
// 회사·사람·프로젝트로 만든 가상 청크 6개이고, 개체와 관계, 커뮤니티, 요약은 모두 설명용 값이다.
// 실제 LLM이 추출한 결과도, Leiden이 계산한 결과도 아니다.

export const CHUNKS = [
  {
    id: 1,
    text: '민수는 플랫폼팀 소속이며 알파 프로젝트를 이끕니다. 알파는 결제 시스템을 새로 만듭니다.',
    kw: ['민수', '플랫폼팀', '팀', '알파', '프로젝트', '이끈다', '결제', '시스템', '만든다'],
    ents: ['민수', '플랫폼팀', '알파', '결제 시스템'],
    rels: [['민수', '소속', '플랫폼팀'], ['민수', '이끈다', '알파'], ['알파', '만든다', '결제 시스템']],
  },
  {
    id: 2,
    text: '지은은 플랫폼팀에서 알파의 보안 심사를 맡습니다.',
    kw: ['지은', '플랫폼팀', '팀', '알파', '보안', '심사'],
    ents: ['지은', '플랫폼팀', '알파'],
    rels: [['지은', '소속', '플랫폼팀'], ['지은', '보안 심사', '알파']],
  },
  {
    id: 3,
    text: '지은은 베타 프로젝트도 이끕니다. 베타는 고객 앱을 만듭니다.',
    kw: ['지은', '베타', '프로젝트', '이끈다', '고객', '앱', '만든다'],
    ents: ['지은', '베타', '고객 앱'],
    rels: [['지은', '이끈다', '베타'], ['베타', '만든다', '고객 앱']],
  },
  {
    id: 4,
    text: '도윤은 모바일팀 소속이며 베타에서 앱 개발을 맡습니다.',
    kw: ['도윤', '모바일팀', '팀', '베타', '앱', '개발'],
    ents: ['도윤', '모바일팀', '베타'],
    rels: [['도윤', '소속', '모바일팀'], ['도윤', '개발', '베타']],
  },
  {
    id: 5,
    text: '고객 앱은 알파가 만든 결제 시스템으로 결제를 처리합니다.',
    kw: ['고객', '앱', '알파', '만든다', '결제', '시스템'],
    ents: ['고객 앱', '알파', '결제 시스템'],
    rels: [['고객 앱', '사용한다', '결제 시스템'], ['알파', '만든다', '결제 시스템']],
  },
  {
    id: 6,
    text: '하린은 모바일팀 소속이며 고객 앱의 디자인을 맡습니다.',
    kw: ['하린', '모바일팀', '팀', '고객', '앱', '디자인'],
    ents: ['하린', '모바일팀', '고객 앱'],
    rels: [['하린', '소속', '모바일팀'], ['하린', '디자인', '고객 앱']],
  },
];

// 노드 위치(viewBox 560 x 290)
export const POS = {
  민수: [55, 62],
  알파: [175, 40],
  '결제 시스템': [285, 92],
  플랫폼팀: [100, 160],
  지은: [190, 240],
  '고객 앱': [385, 120],
  베타: [395, 235],
  도윤: [505, 255],
  모바일팀: [520, 160],
  하린: [490, 55],
};
export const ALL_NODES = Object.keys(POS);

const pairKey = (a, b) => [a, b].sort().join('|') + '';

// 앞의 n개 청크에서 개체와 관계를 모아 그래프를 만든다. 같은 관계가 또 나오면 가중치만 올린다.
export function buildGraph(n) {
  const nodes = [];
  const edges = [];
  const byKey = {};
  CHUNKS.slice(0, n).forEach((c) => {
    c.ents.forEach((e) => {
      if (nodes.indexOf(e) < 0) nodes.push(e);
    });
    c.rels.forEach((r) => {
      const key = pairKey(r[0], r[2]) + '|' + r[1];
      if (byKey[key] == null) {
        byKey[key] = edges.length;
        edges.push({id: edges.length + 1, a: r[0], b: r[2], rel: r[1], chunks: [c.id], w: 1});
      } else {
        const ed = edges[byKey[key]];
        ed.chunks.push(c.id);
        ed.w += 1;
      }
    });
  });
  return {nodes, edges};
}
export const FULL = buildGraph(CHUNKS.length);

// 커뮤니티 수준. C0이 가장 위(뿌리), 숫자가 커질수록 잘게 나뉩니다.
export const LEVELS = [
  {
    name: 'C0',
    comms: [
      {
        id: 'C0',
        tag: '전체',
        nodes: ALL_NODES,
        summary: '알파(플랫폼팀)와 베타(모바일팀) 두 프로젝트가 있고, 베타의 고객 앱은 알파의 결제 시스템을 씁니다. 지은은 두 프로젝트에 모두 관여합니다.',
      },
    ],
  },
  {
    name: 'C1',
    comms: [
      {
        id: 'A',
        tag: 'A',
        nodes: ['민수', '알파', '결제 시스템', '플랫폼팀', '지은'],
        summary: '민수가 이끄는 알파 프로젝트가 결제 시스템을 만들고, 지은이 보안 심사를 맡습니다. 민수와 지은은 플랫폼팀 소속입니다.',
      },
      {
        id: 'B',
        tag: 'B',
        nodes: ['베타', '고객 앱', '도윤', '모바일팀', '하린'],
        summary: '모바일팀의 도윤과 하린이 베타 프로젝트의 고객 앱을 만듭니다. 도윤은 개발, 하린은 디자인을 맡습니다.',
      },
    ],
  },
  {
    name: 'C2',
    comms: [
      {id: 'a1', tag: 'a1', nodes: ['민수', '알파', '결제 시스템'], summary: '민수가 알파 프로젝트를 이끌고, 알파가 결제 시스템을 만듭니다.'},
      {id: 'a2', tag: 'a2', nodes: ['플랫폼팀', '지은'], summary: '지은은 플랫폼팀 소속입니다.'},
      {id: 'b1', tag: 'b1', nodes: ['베타', '고객 앱'], summary: '베타 프로젝트가 고객 앱을 만듭니다.'},
      {id: 'b2', tag: 'b2', nodes: ['도윤', '모바일팀', '하린'], summary: '도윤과 하린은 모바일팀 소속입니다.'},
    ],
  },
];

export const commOf = (level, node) => {
  const L = LEVELS[level];
  for (let i = 0; i < L.comms.length; i += 1) if (L.comms[i].nodes.indexOf(node) >= 0) return L.comms[i];
  return null;
};

// 커뮤니티 안쪽 관계 수(두 끝이 같은 커뮤니티에 있는 관계)
export const insideEdges = (assign, edges = FULL.edges) => edges.filter((e) => assign[e.a] != null && assign[e.a] === assign[e.b]);

export const GROUP_COLORS = ['var(--va)', 'var(--vb)', 'var(--vc)', 'var(--vok)', 'var(--vbad)'];

// 질문. kw는 벡터 검색용 핵심어(설명용), seeds는 로컬 검색의 시작 개체, need는 답에 필요한 근거의 종류.
export const QUESTIONS = [
  {text: '지은은 어떤 일을 하나요?', kw: ['지은'], seeds: ['지은'], need: 'star', needText: '지은과 이어진 관계 3개(플랫폼팀, 알파, 베타)가 모두 근거에 있어야 합니다.'},
  {text: '민수와 도윤은 어떻게 이어지나요?', kw: ['민수', '도윤'], seeds: ['민수', '도윤'], need: 'path', needText: '민수에서 도윤까지 이어지는 관계의 연결 경로가 근거 안에 있어야 합니다.'},
  {text: '프로젝트와 팀을 전체적으로 정리해 주세요.', kw: ['프로젝트', '팀'], seeds: [], need: 'cover', needText: '코퍼스의 개체 10개가 모두 근거에 있어야 합니다.'},
];

export const cosBin = (a, b) => {
  if (!a.length || !b.length) return 0;
  const shared = a.filter((x) => b.indexOf(x) >= 0).length;
  return shared / Math.sqrt(a.length * b.length);
};

// 벡터 검색: 핵심어 코사인(이진 목록)이 큰 순. 점수가 0인 청크는 뽑지 않는다.
export const vectorRank = (q) =>
  CHUNKS.map((c) => ({id: c.id, score: cosBin(q.kw, c.kw)})).sort((x, y) => y.score - x.score || x.id - y.id);

export const vectorSearch = (q, k) => {
  const picked = vectorRank(q).filter((r) => r.score > 0).slice(0, k).map((r) => r.id);
  return contextOfChunks(picked);
};

export function contextOfChunks(ids) {
  const nodes = [];
  CHUNKS.filter((c) => ids.indexOf(c.id) >= 0).forEach((c) => c.ents.forEach((e) => nodes.indexOf(e) < 0 && nodes.push(e)));
  const edges = FULL.edges.filter((e) => e.chunks.some((c) => ids.indexOf(c) >= 0)).map((e) => e.id);
  return {chunks: ids.slice().sort((a, b) => a - b), nodes, edges};
}

// 로컬 검색(장난감): 시작 개체에서 h칸까지 이웃을 따라가고, 따라간 관계가 나온 청크를 모은다.
export function localSearch(seeds, h) {
  const dist = {};
  seeds.forEach((s) => {
    dist[s] = 0;
  });
  let frontier = seeds.slice();
  for (let d = 1; d <= h; d += 1) {
    const next = [];
    frontier.forEach((u) => {
      FULL.edges.forEach((e) => {
        const v = e.a === u ? e.b : e.b === u ? e.a : null;
        if (v != null && dist[v] == null) {
          dist[v] = d;
          next.push(v);
        }
      });
    });
    frontier = next;
  }
  const nodes = Object.keys(dist);
  const edges = FULL.edges.filter((e) => Math.min(dist[e.a] == null ? 99 : dist[e.a], dist[e.b] == null ? 99 : dist[e.b]) < h);
  const chunks = [];
  edges.forEach((e) => e.chunks.forEach((c) => chunks.indexOf(c) < 0 && chunks.push(c)));
  return {chunks: chunks.sort((a, b) => a - b), nodes, edges: edges.map((e) => e.id), dist};
}

// 하이브리드(장난감): 벡터 검색으로 고른 청크의 개체를 시작점으로 삼아 그래프를 넓힌다.
export function hybridSearch(q, k, h) {
  const v = vectorSearch(q, k);
  const g = localSearch(v.nodes, h);
  const chunks = v.chunks.slice();
  g.chunks.forEach((c) => chunks.indexOf(c) < 0 && chunks.push(c));
  return {chunks: chunks.sort((a, b) => a - b), nodes: g.nodes, edges: g.edges, dist: g.dist};
}

// 글로벌 검색(장난감): 선택한 수준의 커뮤니티 요약을 모두 모은다. 요약이 다루는 관계는 커뮤니티 안쪽 관계로 센다.
export function globalSearch(level) {
  const L = LEVELS[level];
  const assign = {};
  L.comms.forEach((c) => c.nodes.forEach((n) => (assign[n] = c.id)));
  return {summaries: L.comms.length, nodes: ALL_NODES.slice(), edges: insideEdges(assign).map((e) => e.id), assign};
}

const connected = (edgeIds, a, b) => {
  const seen = [a];
  let grew = true;
  while (grew) {
    grew = false;
    FULL.edges.forEach((e) => {
      if (edgeIds.indexOf(e.id) < 0) return;
      const ha = seen.indexOf(e.a) >= 0;
      const hb = seen.indexOf(e.b) >= 0;
      if (ha !== hb) {
        seen.push(ha ? e.b : e.a);
        grew = true;
      }
    });
  }
  return seen.indexOf(b) >= 0;
};

// 질문이 요구하는 근거가 문맥에 들어 있는지
export function enough(q, ctx) {
  if (q.need === 'star') {
    const inc = FULL.edges.filter((e) => e.a === '지은' || e.b === '지은').map((e) => e.id);
    return inc.every((id) => ctx.edges.indexOf(id) >= 0);
  }
  if (q.need === 'path') return connected(ctx.edges, '민수', '도윤');
  return ALL_NODES.every((n) => ctx.nodes.indexOf(n) >= 0);
}
