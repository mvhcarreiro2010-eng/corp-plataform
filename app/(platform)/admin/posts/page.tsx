'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, Pencil, Trash2, Pin, Loader2, Image, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { timeAgo } from '@/lib/utils'

type Post = {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: string
  author: { name: string; role: string }
  _count: { likes: number; comments: number }
}

export default function AdminPostsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const isAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')

  useEffect(() => {
    if (!isAdmin) return
    loadPosts()
  }, [isAdmin])

  const loadPosts = async () => {
    setLoading(true)
    const res = await fetch('/api/posts?limit=50')
    const data = await res.json()
    setPosts(data.posts ?? [])
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Excluir este post? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
  }

  const togglePin = async (post: Post) => {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: post.content, mediaUrl: post.mediaUrl, mediaType: post.mediaType, pinned: !post.pinned }),
    })
    if (res.ok) setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, pinned: !p.pinned } : p))
  }

  if (!isAdmin) return (
    <div className="py-20 text-center text-gray-500">
      <p>Sem permissão para acessar esta área.</p>
    </div>
  )

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gerenciar Posts</h1>
          <p className="text-sm text-gray-500">{posts.length} publicações no feed</p>
        </div>
        <Button onClick={() => router.push('/admin/posts/novo')} size="sm">
          <Plus className="w-4 h-4" />
          Novo post
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {post.pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">📌 Fixado</span>}
                {post.mediaType === 'image' && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Image className="w-3 h-3" />Imagem</span>}
                {post.mediaType === 'video' && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Video className="w-3 h-3" />Vídeo</span>}
                <span className="text-xs text-gray-400">{timeAgo(new Date(post.createdAt))}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                <span dangerouslySetInnerHTML={{ __html: post.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 200) }} />
              </p>
              <p className="text-xs text-gray-400 mt-1">{post._count.likes} curtidas · {post._count.comments} comentários</p>
            </div>
            <div className="flex items-start gap-1 flex-shrink-0">
              <button
                onClick={() => togglePin(post)}
                title={post.pinned ? 'Desafixar' : 'Fixar no topo'}
                className={`p-1.5 rounded-lg transition-colors ${post.pinned ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/admin/posts/${post.id}`)}
                title="Editar"
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => deletePost(post.id)}
                disabled={deleting === post.id}
                title="Excluir"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                {deleting === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p>Nenhum post criado ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
