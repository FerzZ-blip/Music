import { MagnifyingGlass, XCircle } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { searchSuggestions } from '../api/verome';

export default function SearchBar({ onSearch, onSearchAcross }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !focused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused]);

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(value) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchSuggestions(value);
        setSuggestions(data?.suggestions || null);
      } catch {
        setSuggestions(null);
      }
    }, 200);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      onSearchAcross?.(query.trim());
      setShowResults(false);
    }
  }

  function handleClear() {
    setQuery('');
    setSuggestions(null);
    onSearch('');
  }

  function pickSuggestion(s) {
    setQuery(s);
    onSearch(s);
    onSearchAcross?.(s);
    setShowResults(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={`relative transition-all duration-300 ${
            focused ? 'w-[280px] md:w-[360px]' : 'w-[200px] md:w-[260px]'
          }`}
        >
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { setFocused(true); setShowResults(true); }}
            onBlur={() => setFocused(false)}
            placeholder="search tracks, albums..."
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-warm-100 border border-warm-200/80 text-warm-800 placeholder:text-warm-400 outline-none focus:bg-warm-50 focus:border-rose-200 transition-all duration-300 text-sm dark:bg-warm-900 dark:border-warm-800/80 dark:text-warm-200 dark:placeholder:text-warm-600 dark:focus:bg-warm-900 dark:focus:border-rose-700"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-colors"
            >
              <XCircle size={14} weight="fill" />
            </button>
          )}
        </div>
      </form>

      {showResults && suggestions && suggestions.length > 0 && query.trim().length >= 2 && (
      <div className="absolute top-full mt-1.5 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-warm-200/80 overflow-hidden z-50 dark:bg-warm-900/90 dark:border-warm-800/80">
          {suggestions.slice(0, 6).map((s, i) => (
            <button key={s} onClick={() => pickSuggestion(s)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-warm-700 hover:bg-warm-100 transition-colors text-left dark:text-warm-300 dark:hover:bg-warm-800/50">
              <MagnifyingGlass size={14} className="text-warm-400 dark:text-warm-500 shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
