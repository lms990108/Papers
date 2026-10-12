import React, {useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function pageText() {
  const article = document.querySelector('article');
  return (article?.innerText || document.title || '').slice(0, 12000);
}

const ROOM_KEY = 'ask-rooms';

function pageHeading() {
  if (typeof document === 'undefined') return '대화';
  const raw = document.querySelector('article h1')?.textContent || '';
  const text = raw.replace(/[\u200B\u200C\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  return text || '대화';
}

function nextTitle(rooms = []) {
  const base = pageHeading();
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_(\\d+)$`);
  let max = 0;
  for (const room of rooms) {
    const match = room.title.match(re);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${base}_${max + 1}`;
}

function newRoom(rooms) {
  return {id: crypto.randomUUID(), title: nextTitle(rooms), messages: []};
}

function readRooms() {
  try {
    const data = JSON.parse(localStorage.getItem(ROOM_KEY) || '');
    if (!Array.isArray(data.rooms) || !data.rooms.length) return null;
    if (!data.rooms.some((room) => room.id === data.current)) return null;
    return data;
  } catch {
    return null;
  }
}

function selectionInArticle() {
  const sel = window.getSelection();
  const text = sel?.toString().trim() || '';
  if (!text || !sel.rangeCount) return null;
  const node = sel.anchorNode;
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  if (!el?.closest('article')) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  return {
    text: text.slice(0, 2000),
    top: Math.min(rect.bottom + 8, window.innerHeight - 48),
    left: Math.min(Math.max(rect.left, 8), window.innerWidth - 48),
  };
}

export default function Root({children}) {
  const {siteConfig} = useDocusaurusContext();
  const logRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [quote, setQuote] = useState('');
  const [pick, setPick] = useState(null);
  const [rooms, setRooms] = useState(() => [newRoom()]);
  const [currentId, setCurrentId] = useState(() => rooms[0].id);
  const [hydrated, setHydrated] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [level, setLevel] = useState(3);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [panelHeight, setPanelHeight] = useState(null);
  const levelName = ['한두 문장', '짧게', '보통', '자세히', '충분히'][level - 1];
  const room = rooms.find((item) => item.id === currentId) || rooms[0];
  const messages = room.messages;

  useEffect(() => {
    function onUp(event) {
      if (event.target.closest?.('.ask, .ask-pick')) return;
      setPick(selectionInArticle());
    }
    document.addEventListener('mouseup', onUp);
    return () => document.removeEventListener('mouseup', onUp);
  }, []);

  useEffect(() => {
    const saved = readRooms();
    if (saved) {
      setRooms(saved.rooms);
      setCurrentId(saved.current);
    } else {
      setRooms((list) => [{...list[0], title: nextTitle([])}]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(ROOM_KEY, JSON.stringify({rooms, current: currentId}));
  }, [rooms, currentId, hydrated]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, busyId, open]);

  function appendMessage(roomId, message) {
    setRooms((list) =>
      list.map((item) => (item.id === roomId ? {...item, messages: [...item.messages, message]} : item)),
    );
  }

  async function submit(event) {
    event.preventDefault();
    const q = question.trim() || (quote ? '이 부분을 설명해 줘' : '');
    if (!q || busyId) return;
    const selection = quote;
    const roomId = currentId;
    appendMessage(roomId, {role: 'user', text: selection ? `“${selection}”\n${q}` : q});
    setQuestion('');
    setQuote('');
    setBusyId(roomId);
    try {
      const res = await fetch(`${siteConfig.baseUrl}api/ask`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({question: q, page: pageText(), selection, level}),
      });
      const data = await res.json();
      appendMessage(roomId, {role: 'bot', text: data.answer || data.error || '답이 비었습니다'});
    } catch (err) {
      appendMessage(roomId, {role: 'bot', text: String(err.message || err)});
    } finally {
      setBusyId(null);
    }
  }

  function addRoom() {
    const next = newRoom(rooms);
    setRooms((list) => [...list, next]);
    setCurrentId(next.id);
  }

  function commitTitle() {
    const title = draft.replace(/\s+/g, ' ').trim();
    if (title) {
      setRooms((list) => list.map((item) => (item.id === room.id ? {...item, title} : item)));
    }
    setEditing(false);
  }

  function deleteRoom() {
    const index = rooms.findIndex((item) => item.id === currentId);
    const next = rooms.filter((item) => item.id !== currentId);
    if (!next.length) {
      const empty = newRoom([]);
      setRooms([empty]);
      setCurrentId(empty.id);
      return;
    }
    setRooms(next);
    setCurrentId(next[Math.min(index, next.length - 1)].id);
  }

  function startResize(event) {
    event.preventDefault();
    const startY = event.clientY;
    const startH = panelRef.current.getBoundingClientRect().height;
    function move(ev) {
      const max = window.innerHeight - 112;
      setPanelHeight(Math.min(max, Math.max(220, startH + startY - ev.clientY)));
    }
    function stop() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  function askSelection() {
    if (!pick) return;
    setQuote(pick.text);
    setOpen(true);
    setPick(null);
  }

  return (
    <>
      {children}
      {pick ? (
        <button
          type="button"
          className="ask-pick"
          style={{top: pick.top, left: pick.left}}
          aria-label="이 부분 질문"
          onMouseDown={(event) => event.preventDefault()}
          onClick={askSelection}
        >
          ?
        </button>
      ) : null}
      <div className="ask">
        {open ? (
          <section
            className="ask__panel"
            aria-label="챗봇"
            ref={panelRef}
            style={panelHeight ? {height: panelHeight} : undefined}
          >
            <button type="button" className="ask__resize" aria-label="높이 조절" onPointerDown={startResize} />
            <div className="ask__bar">
              <span>이 페이지에 질문</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="닫기">
                닫기
              </button>
            </div>
            <div className="ask__rooms">
              {editing ? (
                <input
                  className="ask__title"
                  value={draft}
                  aria-label="대화 제목"
                  autoFocus
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                    if (event.key === 'Escape') setEditing(false);
                  }}
                />
              ) : (
                <button type="button" className="ask__title" onClick={() => { setDraft(room.title); setEditing(true); }}>
                  {room.title}
                </button>
              )}
              <select
                aria-label="대화 바꾸기"
                value={room.id}
                onChange={(event) => setCurrentId(event.target.value)}
              >
                {rooms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addRoom}>
                새 대화
              </button>
              <button type="button" onClick={deleteRoom} aria-label="이 대화 삭제">
                삭제
              </button>
            </div>
            {messages.length || busyId === room.id || panelHeight ? (
              <div className="ask__log" ref={logRef}>
                {messages.map((message, index) => (
                  <p key={index} className={message.role === 'user' ? 'ask__mine' : 'ask__bot'}>
                    {message.text}
                  </p>
                ))}
                {busyId === room.id ? <p className="ask__bot">묻는 중</p> : null}
              </div>
            ) : null}
            <form className="ask__form" onSubmit={submit}>
              <label className="ask__level">
                답 길이
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={level}
                  aria-valuetext={levelName}
                  onChange={(event) => setLevel(Number(event.target.value))}
                />
                <span>{levelName}</span>
              </label>
              {quote ? <p className="ask__quote">{quote}</p> : null}
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                  event.preventDefault();
                  if (busyId || (!question.trim() && !quote)) return;
                  event.currentTarget.form.requestSubmit();
                }}
                placeholder="질문"
                rows={3}
              />
              <button type="submit" disabled={!!busyId || (!question.trim() && !quote)}>
                보내기
              </button>
            </form>
          </section>
        ) : null}
        <button
          type="button"
          className="ask__bubble"
          aria-label={open ? '챗봇 닫기' : '챗봇 열기'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '×' : '?'}
        </button>
      </div>
    </>
  );
}
