'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, BookOpen, GraduationCap, ClipboardList, Tag, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface WikiResult  { id: string; title: string; slug: string; excerpt: string | null; tags: string[]; category: { name: string; icon: string | null } }
interface CourseResult { id: string; title: string; tags: string[] }
interface AvalResult  { id: string; title: string; tags: string[] }

interface SearchResults {
  wiki: WikiResult[]
  courses: CourseResult[]
  avaliacoes: AvalResult[]
  tagSuggestions: string[]
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function SearchBar({ autoFocus, onClose }: { autoFocus?: boolean; onClose?: () => void } = {}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debouncedQ = useDebounce(query, 300)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // Fetch on debounced query change
  useEffect(() => {
    if (debouncedQ.length < 2) { setResults(null); setOpen(false); return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setResults(data)
        setOpen(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedQ])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults = results && (results.wiki.length + results.courses.length + results.avaliacoes.length) > 0
  const isEmpty = results && !hasResults && !results.tagSuggestions.length

  const clear = () => { setQuery(''); setResults(null); setOpen(false); onClose?.() }

  const handleTagClick = (tag: string) => {
    setQuery(tag)
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value.length >= 2) setOpen(true) }}
          onFocus={() => results && setOpen(true)}
          placeholder="Buscar na wiki, cursos, avaliações..."
          className="w-full pl-9 pr-8 h-9 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        {query && (
          <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
          )}

          {!loading && isEmpty && (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">
              Nenhum resultado para &quot;{query}&quot;
            </div>
          )}

          {!loading && results && (
            <div className="max-h-[420px] overflow-y-auto">
              {/* Tag suggestions */}
              {results.tagSuggestions.length > 0 && (
                <div className="px-3 pt-3 pb-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags relacionadas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.tagSuggestions.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-xs font-medium transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wiki results */}
              {results.wiki.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Wiki
                  </p>
                  {results.wiki.map(p => (
                    <Link
                      key={p.id}
                      href={`/wiki/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base mt-0.5 shrink-0">{p.category.icon ?? '📄'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.category.name}</p>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {p.tags.slice(0, 3).map(t => (
                              <span key={t} className="text-[10px] text-blue-500">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Courses */}
              {results.courses.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Cursos
                  </p>
                  {results.courses.map(c => (
                    <Link
                      key={c.id}
                      href={`/aprendizado/${c.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <GraduationCap className="w-4 h-4 text-green-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                        {c.tags.length > 0 && (
                          <div className="flex gap-1">
                            {c.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] text-blue-500">#{t}</span>)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Avaliações */}
              {results.avaliacoes.length > 0 && (
                <div className="pb-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1 flex items-center gap-1">
                    <ClipboardList className="w-3 h-3" /> Avaliações
                  </p>
                  {results.avaliacoes.map(a => (
                    <Link
                      key={a.id}
                      href={`/avaliacoes/${a.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                        {a.tags.length > 0 && (
                          <div className="flex gap-1">
                            {a.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] text-blue-500">#{t}</span>)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
