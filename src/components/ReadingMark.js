import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {BOOKMARK_EVENT, loadBookmarks, pathKey} from './bookmarks';

const MIN_Y = 300;

// 책갈피 소제목으로 이동한다.
function jump(id) {
  document.getElementById(id)?.scrollIntoView({block: 'start'});
}

// 오른쪽 목차에서 책갈피 앞쪽은 흐리게, 책갈피 항목은 강조한다.
function markToc(id) {
  const links = Array.from(document.querySelectorAll('a.table-of-contents__link[href*="#"]'));
  let passed = !id;
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    let target = href.slice(href.indexOf('#') + 1);
    try {
      target = decodeURIComponent(target);
    } catch {}
    const same = !!id && target === id;
    link.classList.toggle('toc-bookmark', same);
    link.classList.toggle('toc-read', !!id && !passed && !same);
    if (same) passed = true;
  }
  // 책갈피가 목차에 없으면 아무것도 흐리게 하지 않는다.
  if (id && !passed) links.forEach((link) => link.classList.remove('toc-read'));
}

export default function ReadingMark() {
  const {pathname, hash} = useLocation();
  const {siteConfig} = useDocusaurusContext();
  const [offer, setOffer] = useState(null);
  const path = pathKey(pathname);
  const isHome = path === pathKey(siteConfig.baseUrl);

  useEffect(() => {
    let timer = null;
    function refresh() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const data = loadBookmarks();
        markToc(isHome ? null : data.pages[path]?.id);
        if (isHome) {
          const last = data.last && data.pages[data.last];
          setOffer(last ? {to: data.last, mark: last, home: true} : null);
          return;
        }
        const mark = data.pages[path];
        setOffer(mark && !hash && window.scrollY < MIN_Y ? {to: path, mark} : null);
      }, 400);
    }
    refresh();
    window.addEventListener(BOOKMARK_EVENT, refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(BOOKMARK_EVENT, refresh);
    };
  }, [path, hash, isHome]);

  // 책갈피를 두고 직접 스크롤해 내려가면 이어 읽기 카드를 접는다.
  useEffect(() => {
    if (!offer || offer.home) return undefined;
    function onScroll() {
      if (window.scrollY >= MIN_Y) setOffer(null);
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [offer]);

  if (!offer) return null;
  const {mark, home, to} = offer;
  const where = mark.text || mark.title;

  return (
    <div className="resume" role="status">
      {home ? (
        <Link className="resume__go" to={to}>
          <span className="resume__label">이어 읽기</span>
          <span className="resume__where">
            {mark.title} · {where}
          </span>
        </Link>
      ) : (
        <button
          type="button"
          className="resume__go"
          onClick={() => {
            jump(mark.id);
            setOffer(null);
          }}
        >
          <span className="resume__label">책갈피로 이동</span>
          <span className="resume__where">{where}</span>
        </button>
      )}
      <button type="button" className="resume__close" aria-label="닫기" onClick={() => setOffer(null)}>
        ×
      </button>
    </div>
  );
}
