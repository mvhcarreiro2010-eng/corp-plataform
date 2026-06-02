'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, ChevronRight, ChevronDown, BookOpen, Plus, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type WikiPage = { id: string; title: string; slug: string; updatedAt: Date }
type Category = {
  id: string; name: string; slug: string; icon: string | null; color: string | null
  pages: WikiPage[]
  children?: (Omit<Category, 'children'>)[]
}

function WikiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openCats, setOpenCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/wiki').then((r) => r.json()).then((d) => {
      setCategories(d.categories)
      setOpenCats(new Set(d.categories.map((c: Category) => c.id)))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setSearch(q); doSearch(q) }
  }, [searchParams])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/wiki?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSearchResults(data.pages)
    setSearching(false)
  }

  const toggleCat = (id: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const canEdit = ['ADMIN', 'HR', 'MANAGER'].includes(session?.user?.role ?? '')

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Wiki de Conhecimento
          </h1>
          <p className="text-sm text-gray-500">Processos, políticas e materiais da empresa</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => router.push('/wiki/novo')}>
            <Plus className="w-4 h-4" />
            Novo artigo
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value) }}
          placeholder="Buscar artigos, processos, políticas..."
          className="pl-9"
        />
      </div>

      {/* Resultados de busca */}
      {search && (
        <div className="space-y-2">
          {searching ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum resultado para &quot;{search}&quot;</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">{searchResults.length} resultado(s)</p>
              {searchResults.map((page) => (
                <Link
                  key={page.id}
                  href={`/wiki/${page.slug}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <span className="text-lg">{page.category?.icon ?? '📄'}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{page.title}</p>
                    <p className="text-xs text-gray-500">{page.category?.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* Árvore de categorias */}
      {!search && (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">{cat.icon ?? '📁'}</span>
                <span className="font-semibold text-gray-900 flex-1 text-left">{cat.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {cat.pages.length + (cat.children?.reduce((s, c) => s + c.pages.length, 0) ?? 0)} artigos
                </Badge>
                {openCats.has(cat.id) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {openCats.has(cat.id) && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {cat.pages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/wiki/${page.slug}`}
                      className="flex items-center gap-2 px-6 py-2.5 hover:bg-gray-50 transition-colors group"
                    >
                      <span className="text-gray-400 group-hover:text-blue-600 transition-colors">📄</span>
                      <span className="text-sm text-gray-700 group-hover:text-blue-700 flex-1">{page.title}</span>
                      <span className="text-xs text-gray-400">{timeAgo(page.updatedAt)}</span>
                    </Link>
                  ))}

                  {cat.children?.map((child) => (
                    <div key={child.id}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50">
                        <span className="text-sm">{child.icon ?? '📂'}</span>
                        <span className="text-sm font-medium text-gray-600">{child.name}</span>
                      </div>
                      {child.pages.map((page) => (
                        <Link
                          key={page.id}
                          href={`/wiki/${page.slug}`}
                          className="flex items-center gap-2 px-8 py-2 hover:bg-gray-50 transition-colors group"
                        >
                          <span className="text-gray-400">📄</span>
                          <span className="text-sm text-gray-700 group-hover:text-blue-700 flex-1">{page.title}</span>
                        </Link>
                      ))}
                    </div>
                  ))}

                  {cat.pages.length === 0 && !cat.children?.length && (
                    <p className="text-sm text-gray-400 px-6 py-3">Nenhum artigo nesta categoria ainda.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WikiPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <WikiPage />
    </Suspense>
  )
}
