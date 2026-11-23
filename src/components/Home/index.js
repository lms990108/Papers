import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const PAPERS = [
  {
    to: '/paper/qwen3-vl',
    title: 'Qwen3-VL Technical Report',
    meta: 'Qwen Team · arXiv 2025',
    note: '비전-언어 모델 기술 보고서',
    pdf: 'https://arxiv.org/pdf/2511.21631',
  },
  {
    to: '/paper/llava',
    title: 'Visual Instruction Tuning (LLaVA)',
    meta: 'Haotian Liu 외 · NeurIPS 2023',
    note: '이미지 지시 데이터로 VLM을 튜닝',
    pdf: 'https://arxiv.org/pdf/2304.08485',
  },
  {
    to: '/paper/matryoshka-representation-learning',
    title: 'Matryoshka Representation Learning',
    meta: 'Aditya Kusupati 외 · NeurIPS 2022',
    note: '앞쪽 차원만 잘라 써도 되는 임베딩',
    pdf: 'https://arxiv.org/pdf/2205.13147',
  },
  {
    to: '/paper/clip',
    title: 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)',
    meta: 'Alec Radford 외 · arXiv 2021',
    note: '이미지와 문장을 같은 공간에 맞추는 대조 학습',
    pdf: 'https://arxiv.org/pdf/2103.00020',
  },
  {
    to: '/paper/attention-is-all-you-need',
    title: 'Attention Is All You Need',
    meta: 'Ashish Vaswani 외 · NeurIPS 2017',
    note: '어텐션만으로 만든 트랜스포머',
    pdf: 'https://arxiv.org/pdf/1706.03762',
  },
  {
    to: '/paper/lecun-1998',
    title: 'Gradient-Based Learning Applied to Document Recognition',
    meta: 'Yann LeCun 외 · Proc. IEEE 1998',
    note: 'LeNet-5와 합성곱 신경망',
    pdf: 'http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf',
  },
];

const AREAS = [
  {to: '/learn/ai/machine-learning/', title: '머신러닝', note: '회귀와 분류, softmax, HMM'},
  {to: '/learn/ai/deep-learning/', title: '딥러닝', note: '신경망, CNN, VLM, 서빙'},
  {to: '/learn/ai/nlp/', title: '자연어 처리', note: 'token, 임베딩, 트랜스포머, LLM'},
  {to: '/learn/ai/rag/', title: 'RAG', note: 'chunking, 검색, grounding'},
  {to: '/learn/ai/trends/', title: '최신 동향', note: '추론 모델, MoE, 에이전트, 효율적 추론'},
];

function Card({to, label, title, children}) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.cardLabel}>{label}</span>
      <span className={styles.cardTitle}>{title}</span>
      <span className={styles.cardBody}>{children}</span>
      <span className={styles.cardArrow} aria-hidden="true">→</span>
    </Link>
  );
}

export default function Home() {
  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Dustin's Papers</h1>
        <p className={styles.heroLead}>
          백엔드 개발 경력, 논문 리뷰, 그리고 LLM과 에이전트를 만들 때 필요한 개념을 모았습니다.
        </p>
      </header>

      <div className={styles.cards}>
        <Card to="/work" label="01" title="경력기술서">
          포티투마루, 위지온, 잇잇. 회사별 역할과 성과를 한 페이지로 정리했습니다.
        </Card>
        <Card to="/paper" label="02" title="논문 리뷰">
          {PAPERS.length}편. 요약과 손으로 따라가는 계산, 퀴즈로 읽습니다.
        </Card>
        <Card to="/learn" label="03" title="학습공간">
          에이전트 개발자를 위한 개념 노트를 {AREAS.length}개 영역으로 나눴습니다.
        </Card>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>논문 리뷰</h2>
          <Link to="/paper" className={styles.more}>전체 보기</Link>
        </div>
        <ul className={styles.papers}>
          {PAPERS.map((p) => (
            <li key={p.to} className={styles.paper}>
              <div className={styles.paperMain}>
                <Link to={p.to} className={styles.paperTitle}>{p.title}</Link>
                <span className={styles.paperNote}>{p.note}</span>
              </div>
              <div className={styles.paperSide}>
                <span className={styles.paperMeta}>{p.meta}</span>
                <a href={p.pdf} className={styles.pdf} target="_blank" rel="noreferrer noopener">원문 PDF ↗</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>학습공간</h2>
          <Link to="/learn" className={styles.more}>전체 보기</Link>
        </div>
        <div className={styles.areas}>
          {AREAS.map((a) => (
            <Link key={a.to} to={a.to} className={styles.area}>
              <span className={styles.areaTitle}>{a.title}</span>
              <span className={styles.areaNote}>{a.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.foot}>
        오른쪽 아래 질문 창은 회사 안의 모델로 질문을 보내서, 공개 주소에서는 동작하지 않습니다.
      </p>
    </div>
  );
}
