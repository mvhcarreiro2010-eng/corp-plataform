'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Eye, ChevronRight, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type WikiArticle = {
  id: string
  title: string
  content: string
  views: number
  updatedAt: Date
  category: { id: string; name: string; icon: string | null; color: string | null }
}

export default function WikiArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [article, setArticle] = useState<WikiArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/wiki/${params.slug}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return }
        const data = await r.json()
        setArticle(data)
      })
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  if (notFound) return (
    <div className="text-center py-16">
      <p className="text-4xl mb-3">🔍</p>
      <h2 className="text-xl font-semibold text-gray-900">Artigo não encontrado</h2>
      <p className="text-gray-500 mt-2">Esta página não existe ou foi removida.</p>
      <Button className="mt-6" onClick={() => router.push('/wiki')}>Voltar à Wiki</Button>
    </div>
  )

  if (!article) return null

  const canEdit = ['ADMIN', 'HR', 'MANAGER'].includes(session?.user?.role ?? '')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/wiki')} className="gap-1 h-auto p-1">
          <ArrowLeft className="w-4 h-4" />
          Wiki
        </Button>
        <ChevronRight className="w-3 h-3" />
        <span>{article.category.icon} {article.category.name}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium truncate">{article.title}</span>
      </div>

      {/* Artigo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header colorido da categoria */}
        <div
          className="h-2"
          style={{ backgroundColor: article.category.color ?? '#6366f1' }}
        />
        <div className="p-8">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: article.category.color ?? '#6366f1' }}
            >
              {article.category.icon} {article.category.name}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-4">{article.title}</h1>

          <div className="flex items-center gap-4 text-xs text-gray-400 pb-6 border-b border-gray-100 mb-6">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Atualizado {timeAgo(article.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views} visualizações
            </span>
          </div>

          {/* Conteúdo */}
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push('/wiki')}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        {canEdit && (
          <Button size="sm" onClick={() => router.push(`/wiki/${params.slug}/editar`)}>
            <Pencil className="w-4 h-4" />
            Editar artigo
          </Button>
        )}
      </div>
    </div>
  )
}
