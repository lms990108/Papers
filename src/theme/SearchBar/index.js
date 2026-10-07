import React, {useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

const LIMIT = 8;

function snippet(body, query) {
  const at = body.toLowerCase().indexOf(query);
  if (at < 0) {
    return '';
  }
  const start = Math.max(0, at - 24);
  const end = Math.min(body.length, at + query.length + 48);
  const piece = body.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${piece}${end < body.length ? '…' : ''}`;
}

export default function SearchBar() {
  const {pages} = usePluginData('papers-search');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const needle = query.trim().toLowerCase();

  const hits = useMemo(() => {
    if (!needle) {
      return [];
    }
    const titleHits = [];
    const bodyHits = [];
    for (const page of pages) {
      const title = page.title.toLowerCase();
      if (title.includes(needle)) {
        titleHits.push(page);
      } else if (page.body.toLowerCase().includes(needle)) {
        bodyHits.push(page);
      }
    }
    return [...titleHits, ...bodyHits].slice(0, LIMIT);
  }, [pages, needle]);

  useEffect(() => {
    setActive(0);
  }, [needle]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || hits.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % hits.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + hits.length) % hits.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      window.location.assign(hits[active].url);
    }
  }

  return (
    <div className={styles.search} ref={rootRef}>
      <input
        className={styles.input}
        type="search"
        placeholder="검색"
        aria-label="제목과 본문 검색"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && needle && (
        <ul className={styles.results}>
          {hits.length === 0 ? (
            <li className={styles.empty}>없음</li>
          ) : (
            hits.map((page, index) => (
              <li key={page.url}>
                <Link
                  className={index === active ? `${styles.hit} ${styles.hitActive}` : styles.hit}
                  to={page.url}
                  onClick={() => setOpen(false)}>
                  <div className={styles.title}>{page.title}</div>
                  <div className={styles.snippet}>{snippet(page.body, needle)}</div>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
