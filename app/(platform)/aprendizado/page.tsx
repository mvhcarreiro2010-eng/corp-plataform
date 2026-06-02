'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Clock, Star, ChevronRight, Loader2, Trophy } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Course = {
  id: string; title: string; description: string; thumbnail: string | null; xpReward: number
  totalLessons: number; completedLessons: number
  _count: { modules: number }
}

export default function AprendizadoPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then(setCourses)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const completed = courses.filter((c) => c.completedLessons === c.totalLessons && c.totalLessons > 0)
  const inProgress = courses.filter((c) => c.completedLessons > 0 && c.completedLessons < c.totalLessons)
  const notStarted = courses.filter((c) => c.completedLessons === 0)

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Aprendizado
          </h1>
          <p className="text-sm text-gray-500">Cursos, treinamentos e desenvolvimento profissional</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Concluídos', value: completed.length, icon: '🏆', color: 'bg-green-50 border-green-200' },
          { label: 'Em andamento', value: inProgress.length, icon: '📚', color: 'bg-blue-50 border-blue-200' },
          { label: 'Disponíveis', value: notStarted.length, icon: '🎯', color: 'bg-purple-50 border-purple-200' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-xl p-4 text-center`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Em andamento */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Em Andamento</h2>
          <div className="space-y-3">
            {inProgress.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Disponíveis */}
      {notStarted.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Disponíveis</h2>
          <div className="space-y-3">
            {notStarted.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Concluídos */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">✅ Concluídos</h2>
          <div className="space-y-3">
            {completed.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum curso disponível</p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const percent = course.totalLessons > 0
    ? Math.round((course.completedLessons / course.totalLessons) * 100)
    : 0
  const isDone = percent === 100

  return (
    <Link href={`/aprendizado/${course.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 ${isDone ? 'bg-green-100' : 'bg-blue-50'}`}>
            {isDone ? '🏆' : course.thumbnail ?? '🎓'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{course.title}</h3>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 group-hover:text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{course.description}</p>

            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                {course._count.modules} módulo{course._count.modules !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="default" className="text-xs gap-1 bg-amber-100 text-amber-700">
                <Star className="w-3 h-3" />
                +{course.xpReward} XP
              </Badge>
              {isDone && <Badge variant="success" className="text-xs">✓ Concluído</Badge>}
            </div>

            {course.totalLessons > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{course.completedLessons}/{course.totalLessons} lições</span>
                  <span>{percent}%</span>
                </div>
                <Progress value={percent} className={isDone ? '[&>div]:bg-green-500' : ''} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
