import {useEffect, useState} from 'react';

// 문서마다 책갈피를 하나 둔다. 브라우저 localStorage에만 저장한다.
const KEY = 'bookmarks';
const EVENT = 'bookmarks-change';

export function pathKey(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

export function loadBookmarks() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '');
    if (data && typeof data.pages === 'object') return data;
  } catch {}
  return {pages: {}, last: null};
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function clean(text) {
  return (text || '').replace(/[​‌‍﻿]/g, '').replace(/\s+/g, ' ').trim();
}

// 같은 소제목을 다시 누르면 책갈피를 뺀다.
export function toggleBookmark(path, heading) {
  const data = loadBookmarks();
  if (data.pages[path]?.id === heading.id) {
    delete data.pages[path];
    if (data.last === path) data.last = null;
  } else {
    data.pages[path] = {...heading, ts: Date.now()};
    data.last = path;
  }
  write(data);
}

export function useBookmark(path) {
  const [mark, setMark] = useState(null);
  useEffect(() => {
    const read = () => setMark(loadBookmarks().pages[path] || null);
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, [path]);
  return mark;
}

export const BOOKMARK_EVENT = EVENT;
