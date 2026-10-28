'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, BadgeVariant } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Filter,
  BookOpen,
  Edit2,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminLesson {
  id: string
  title: string
  slug: string
  skill: string
  difficulty: string
  status: 'draft' | 'review' | 'approved' | 'published' | 'retired'
  estimatedMinutes: number
  updatedAt: string
  module?: { title: string }
  _count?: { activities: number }
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  draft: 'default',
  review: 'warning',
  approved: 'info',
  published: 'success',
  retired: 'outline',
}

const STATUSES = ['all', 'draft', 'review', 'approved', 'published', 'retired'] as const

export default function AdminContentPage() {
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [creating, setCreating] = useState<boolean>(false)

  // New Lesson Form
  const [newTitle, setNewTitle] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newSkill, setNewSkill] = useState<'grammar' | 'vocabulary' | 'speaking' | 'listening' | 'writing' | 'interview'>('grammar')
  const [newDifficulty, setNewDifficulty] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('B1')
  const [newObjective, setNewObjective] = useState('')
  const [newStatus, setNewStatus] = useState<'draft' | 'review' | 'approved' | 'published'>('draft')
  const [newMinutes, setNewMinutes] = useState(5)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      try {
        const url = `/api/speakverse/v1/admin/lessons${selectedStatus !== 'all' ? `?status=${selectedStatus}` : ''}`
        const res = await fetch(url)
        if (res.status === 403) {
          toast.error('403 Forbidden: Administrator permissions required.')
          return
        }
        if (!res.ok) throw new Error('Failed to load lessons')
        const data = await res.json()
        if (isMounted) setLessons(data)
      } catch (err: unknown) {
        console.error('Fetch lessons error:', err)
        toast.error('Error loading lesson library')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [selectedStatus])

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newObjective.trim()) {
      toast.error('Title and objective are required.')
      return
    }

    setCreating(true)
    try {
      const slugVal = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const res = await fetch('/api/speakverse/v1/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: slugVal,
          skill: newSkill,
          difficulty: newDifficulty,
          objective: newObjective.trim(),
          estimatedMinutes: Number(newMinutes),
          status: newStatus,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.message || 'Failed to create lesson')
      }

      toast.success('Lesson created successfully in ' + newStatus + ' state.')
      setIsModalOpen(false)
      // Reset form
      setNewTitle('')
      setNewSlug('')
      setNewObjective('')
      
      // Refresh list
      const url = `/api/speakverse/v1/admin/lessons${selectedStatus !== 'all' ? `?status=${selectedStatus}` : ''}`
      const refreshRes = await fetch(url)
      if (refreshRes.ok) {
        const updated = await refreshRes.json()
        setLessons(updated)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating lesson'
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back button & Header */}
      <div>
        <Link
          href="/speakverse/admin"
          className="inline-flex items-center gap-1.5 text-xs text-sv-text-secondary hover:text-sv-primary mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-sv-text">
              Curriculum Content Library
            </h1>
            <p className="text-xs sm:text-sm text-sv-text-secondary mt-1">
              Authoring table with publication lifecycle management (Draft → Review → Approved → Published → Retired).
            </p>
          </div>

          <Button onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto font-medium">
            <Plus className="h-4 w-4 mr-1.5" />
            Create New Lesson
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sv-border" role="tablist">
        <Filter className="h-4 w-4 text-sv-text-secondary mr-1 flex-shrink-0" />
        {STATUSES.map((st) => (
          <button
            key={st}
            role="tab"
            aria-selected={selectedStatus === st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap min-h-[36px] transition-colors ${
              selectedStatus === st
                ? 'bg-sv-primary text-white font-semibold'
                : 'text-sv-text-secondary hover:bg-gray-100 hover:text-sv-text'
            }`}
          >
            {st} {st !== 'all' && `(${lessons.filter((l) => selectedStatus === 'all' ? l.status === st : true).length})`}
          </button>
        ))}
      </div>

      {/* Lessons Table */}
      <Card className="border-sv-border shadow-sv-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Curriculum lessons table">
            <thead className="bg-gray-50 border-b border-sv-border text-xs uppercase font-semibold text-sv-text-secondary">
              <tr>
                <th scope="col" className="px-5 py-3.5">Lesson Title & Module</th>
                <th scope="col" className="px-4 py-3.5">Skill Domain</th>
                <th scope="col" className="px-4 py-3.5">CEFR Level</th>
                <th scope="col" className="px-4 py-3.5">Lifecycle Status</th>
                <th scope="col" className="px-4 py-3.5">Last Updated</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sv-border bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sv-text-secondary">
                    <RefreshCw className="h-6 w-6 text-sv-primary animate-spin mx-auto mb-2" />
                    Loading lesson database...
                  </td>
                </tr>
              ) : lessons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sv-text-secondary">
                    <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    No lessons found matching the selected filter ({selectedStatus}).
                  </td>
                </tr>
              ) : (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-blue-50/20 transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-sv-text text-sm">{lesson.title}</div>
                      <div className="text-xs text-sv-text-secondary flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px]">/{lesson.slug}</span>
                        <span>•</span>
                        <span>{lesson.estimatedMinutes} mins</span>
                      </div>
                    </td>

                    {/* Skill */}
                    <td className="px-4 py-4 capitalize text-xs font-medium text-sv-text">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-sv-primary font-medium">
                        {lesson.skill}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-4">
                      <Badge variant="outline" className="font-mono text-xs">
                        {lesson.difficulty}
                      </Badge>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4">
                      <Badge variant={STATUS_VARIANTS[lesson.status] || 'default'} className="capitalize text-xs">
                        {lesson.status}
                      </Badge>
                    </td>

                    {/* Last Updated */}
                    <td className="px-4 py-4 text-xs text-sv-text-secondary whitespace-nowrap">
                      {new Date(lesson.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Link href={`/speakverse/learn`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Preview Lesson">
                            <Eye className="h-4 w-4 text-sv-text-secondary" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit Lesson Metadata"
                          onClick={() => toast.info(`Editing lesson: ${lesson.title}`)}
                        >
                          <Edit2 className="h-4 w-4 text-sv-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE LESSON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sv-lg max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-sv-border">
              <h2 className="text-lg font-bold text-sv-text">Create Curriculum Lesson</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-sv-text-secondary hover:text-sv-text p-1"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4">
              <Input
                label="Lesson Title"
                placeholder="e.g. Present Tenses in Daily Stand-ups"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value)
                  if (!newSlug) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                  }
                }}
                required
              />

              <Input
                label="URL Slug"
                placeholder="e.g. present-tenses-standups"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                hint="Unique alphanumeric identifier for routes"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-sv-text mb-1">Skill Domain</label>
                  <select
                    value={newSkill}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewSkill(e.target.value as 'grammar' | 'vocabulary' | 'speaking' | 'listening' | 'writing' | 'interview')
                    }
                    className="w-full px-3 py-2 text-sm border border-sv-border rounded-lg bg-sv-surface min-h-[44px]"
                  >
                    <option value="grammar">Grammar</option>
                    <option value="vocabulary">Vocabulary</option>
                    <option value="speaking">Speaking</option>
                    <option value="listening">Listening</option>
                    <option value="writing">Writing</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-sv-text mb-1">CEFR Level</label>
                  <select
                    value={newDifficulty}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewDifficulty(e.target.value as 'A1' | 'A2' | 'B1' | 'B2' | 'C1')
                    }
                    className="w-full px-3 py-2 text-sm border border-sv-border rounded-lg bg-sv-surface min-h-[44px]"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-sv-text mb-1">Learning Objective</label>
                <textarea
                  rows={3}
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="State the measurable outcome: e.g. Student can introduce their academic background using present perfect tense without tense confusion."
                  className="w-full p-2.5 text-sm border border-sv-border rounded-lg bg-sv-surface focus:outline-none focus:ring-2 focus:ring-sv-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-sv-text mb-1">Lifecycle Status</label>
                  <select
                    value={newStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewStatus(e.target.value as 'draft' | 'review' | 'approved' | 'published')
                    }
                    className="w-full px-3 py-2 text-sm border border-sv-border rounded-lg bg-sv-surface min-h-[44px]"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <Input
                  label="Est. Duration (Mins)"
                  type="number"
                  min={1}
                  max={60}
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Number(e.target.value))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-sv-border">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={creating}>
                  Save & Author Activities
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
