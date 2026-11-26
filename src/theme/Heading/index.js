import React from 'react';
import clsx from 'clsx';
import Heading from '@theme-original/Heading';
import {useLocation} from '@docusaurus/router';
import {clean, pathKey, toggleBookmark, useBookmark} from '../../components/bookmarks';

function BookmarkHeading(props) {
  const {pathname} = useLocation();
  const path = pathKey(pathname);
  const mark = useBookmark(path);
  const marked = mark?.id === props.id;

  function onClick(event) {
    const article = event.currentTarget.closest('article');
    toggleBookmark(path, {
      id: props.id,
      text: clean(event.currentTarget.parentElement.textContent),
      title: clean(article?.querySelector('h1')?.textContent) || clean(document.title),
    });
  }

  return (
    <Heading {...props} className={clsx(props.className, marked && 'is-bookmarked')}>
      {props.children}
      <button
        type="button"
        className="bookmark-btn"
        aria-pressed={marked}
        aria-label={marked ? '책갈피 빼기' : '여기까지 읽음으로 표시'}
        title={marked ? '책갈피 빼기' : '여기까지 읽음'}
        onClick={onClick}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"
            fill={marked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </Heading>
  );
}

export default function HeadingWrapper(props) {
  if ((props.as !== 'h2' && props.as !== 'h3') || !props.id) return <Heading {...props} />;
  return <BookmarkHeading {...props} />;
}
