'use client'

import PostEditor from '@/components/admin/PostEditor'
import { useParams } from 'next/navigation'

export default function EditarPostPage() {
  const { id } = useParams<{ id: string }>()
  return <PostEditor mode="edit" postId={id} />
}
