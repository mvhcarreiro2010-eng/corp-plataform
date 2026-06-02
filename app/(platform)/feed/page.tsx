'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePost } from '@/components/feed/CreatePost'
import { Button } from '@/components/ui/button'

type Post = {
  id: string
  content: string
  mediaUrl: string | null
  mediaType: string | null
  pinned: boolean
  createdAt: Date
  author: { id: string; name: string; avatar: string | null; jobTitle: string | null; role: string }
  _count: { likes: number; comments: number }
  likes: { userId: string }[]
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchPosts = useCallback(async (cursor?: string) => {
    const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts'
    const res = await fetch(url)
    const data = await res.json()
    return data
  }, [])

  useEffect(() => {
    fetchPosts().then((data) => {
      setPosts(data.posts)
      setNextCursor(data.nextCursor)
      setLoading(false)
      // Track views for all loaded posts
      const ids = (data.posts as Post[]).map((p) => p.id)
      if (ids.length > 0) fetch('/api/feed/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postIds: ids }) }).catch(() => {})
    })
  }, [fetchPosts])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetchPosts(nextCursor)
    setPosts((prev) => [...prev, ...data.posts])
    setNextCursor(data.nextCursor)
    setLoadingMore(false)
    const ids = (data.posts as Post[]).map((p) => p.id)
    if (ids.length > 0) fetch('/api/feed/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postIds: ids }) }).catch(() => {})
  }

  const handleLike = async (postId: string) => {
    await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        const alreadyLiked = post.likes.some((l) => l.userId === 'me')
        return {
          ...post,
          likes: alreadyLiked
            ? post.likes.filter((l) => l.userId !== 'me')
            : [...post.likes, { userId: 'me' }],
          _count: {
            ...post._count,
            likes: alreadyLiked ? post._count.likes - 1 : post._count.likes + 1,
          },
        }
      })
    )
    // Recarrega para ter o estado correto
    const data = await fetchPosts()
    setPosts(data.posts)
    setNextCursor(data.nextCursor)
  }

  const handleCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Feed</h1>
          <p className="text-sm text-gray-500">Comunicados e novidades da empresa</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchPosts().then((d) => { setPosts(d.posts); setNextCursor(d.nextCursor) })}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Criar post */}
      <CreatePost onCreated={handleCreated} />

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📢</p>
          <p className="font-medium">Nenhum comunicado ainda</p>
          <p className="text-sm">Seja o primeiro a publicar!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}

          {nextCursor && (
            <div className="flex justify-center pb-8">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
                ) : (
                  'Ver mais'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
