'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, Save, X, BookOpen, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
  parentId: string | null
  slug: string
}

const PRESET_ICONS = ['📁', '📂', '📚', '📋', '📝', '🏢', '⚙️', '🎯', '💡', '🔧', '🌟', '🚀', '💼', '📊', '🎓', '🔒', '📣', '🤝']

function CategoryForm({
  initial, categories, onSave, onCancel
}: {
  initial?: Partial<Category>
  categories: Category[]
  onSave: (data: Partial<Category>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📁')
  const [color, setColor] = useState(initial?.color ?? '#6366f1')
  const [parentId, setParentId] = useState(initial?.parentId ?? '')

  const rootCats = categories.filter(c => !c.parentId && c.id !== initial?.id)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Nome da categoria *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Recursos Humanos" className="h-9" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Cor</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="h-9 w-14 border border-gray-200 rounded-lg cursor-pointer p-1" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Ícone</label>
        <div className="flex flex-wrap gap-1">
          {PRESET_ICONS.map((i) => (
            <button key={i} type="button" onClick={() => setIcon(i)}
              className={`text-lg p-1 rounded transition-colors ${icon === i ? 'bg-blue-200' : 'hover:bg-blue-100'}`}>{i}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Subcategoria de (opcional)</label>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Categoria raiz —</option>
          {rootCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="w-4 h-4" /> Cancelar</Button>
        <Button size="sm" onClick={() => name.trim() && onSave({ name, icon, color, parentId: parentId || null })}>
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>
    </div>
  )
}

export default function AdminWikiPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/wiki/categories').then(r => r.json()).then(d => { setCategories(d); setLoading(false) })
  }, [isAdmin])

  if (!isAdmin) return (
    <div className="py-20 text-center text-gray-500"><p>Sem permissão para acessar esta área.</p></div>
  )

  const createCategory = async (data: Partial<Category>) => {
    setSaving(true)
    const res = await fetch('/api/wiki/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const cat = await res.json()
    setCategories(prev => [...prev, cat])
    setShowCreate(false)
    setSaving(false)
  }

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setSaving(true)
    const res = await fetch('/api/wiki/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    const cat = await res.json()
    setCategories(prev => prev.map(c => c.id === id ? cat : c))
    setEditingId(null)
    setSaving(false)
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Excluir a categoria "${name}"? Artigos desta categoria perderão a categoria.`)) return
    await fetch('/api/wiki/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const rootCats = categories.filter(c => !c.parentId)
  const childCats = categories.filter(c => c.parentId)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wiki — Categorias</h1>
          <p className="text-sm text-gray-500">{categories.length} categorias cadastradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/wiki')}>
            <BookOpen className="w-4 h-4" /> Ver Wiki
          </Button>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4" /> Nova categoria
          </Button>
        </div>
      </div>

      {showCreate && (
        <CategoryForm categories={categories} onSave={createCategory} onCancel={() => setShowCreate(false)} />
      )}

      <div className="space-y-3">
        {rootCats.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {editingId === cat.id ? (
              <div className="p-4">
                <CategoryForm initial={cat} categories={categories}
                  onSave={(data) => updateCategory(cat.id, data)}
                  onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">{cat.icon ?? '📁'}</span>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color ?? '#6366f1' }} />
                <span className="font-semibold text-gray-900 flex-1">{cat.name}</span>
                <span className="text-xs text-gray-400">
                  {childCats.filter(c => c.parentId === cat.id).length} subcategorias
                </span>
                <button onClick={() => setEditingId(cat.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteCategory(cat.id, cat.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}

            {childCats.filter(c => c.parentId === cat.id).map((child) => (
              <div key={child.id}>
                {editingId === child.id ? (
                  <div className="pl-8 pr-4 pb-4">
                    <CategoryForm initial={child} categories={categories}
                      onSave={(data) => updateCategory(child.id, data)}
                      onCancel={() => setEditingId(null)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pl-8 pr-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
                    <FolderOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{child.icon ?? '📂'}</span>
                    <span className="text-sm text-gray-700 flex-1">{child.name}</span>
                    <button onClick={() => setEditingId(child.id)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteCategory(child.id, child.name)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
