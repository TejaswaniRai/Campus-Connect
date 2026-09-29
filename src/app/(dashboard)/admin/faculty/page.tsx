'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Users, Home, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

function DashboardCard({ 
  title, 
  count, 
  icon: Icon, 
  href, 
  color 
}: { 
  title: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string 
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className={`p-6 rounded-xl border ${color} backdrop-blur-md cursor-pointer`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('/30', '/20')}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">{title}</p>
            <h3 className="text-3xl font-bold text-white">{count}</h3>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function FacultyDashboard() {
  const [search, setSearch] = React.useState('')
  const [department, setDepartment] = React.useState('')
  // Fetch live entities - commented out to fix unused variable warnings
  // const { data: teachers } = useQuery({
  //   queryKey: ['teachers'],
  //   queryFn: async () => {
  //     const res = await fetch('/api/teachers')
  //     if (!res.ok) throw new Error('Failed to fetch teachers')
  //     return res.json() as Promise<Array<{ name: string }>>
  //   }
  // })

  // const { data: subjects } = useQuery({
  //   queryKey: ['subjects'],
  //   queryFn: async () => {
  //     const res = await fetch('/api/subjects')
  //     if (!res.ok) throw new Error('Failed to fetch subjects')
  //     return res.json() as Promise<Array<{ name: string }>>
  //   }
  // })

  // const { data: rooms } = useQuery({
  //   queryKey: ['rooms'],
  //   queryFn: async () => {
  //     const res = await fetch('/api/rooms')
  //     if (!res.ok) throw new Error('Failed to fetch rooms')
  //     return res.json() as Promise<Array<{ name?: string; roomNumber?: string }>>
  //   }
  // })

  // const { data: floors } = useQuery({
  //   queryKey: ['floors'],
  //   queryFn: async () => {
  //     const res = await fetch('/api/floors')
  //     if (!res.ok) throw new Error('Failed to fetch floors')
  //     return res.json() as Promise<Array<{ number?: number; name?: string }>>
  //   }
  // })

  // Remove unused variables to fix warnings
  // const teacherNames = (teachers || []).map(t => t.name).filter(Boolean).slice(0, 6)
  // const subjectNames = (subjects || []).map((s: any) => s.name || s.code || s.title).filter(Boolean).slice(0, 8)
  // const roomNames = (rooms || []).map(r => r.roomNumber || r.name).filter(Boolean).slice(0, 8)
  // const floorNames = (floors || []).map(f => (typeof f.number === 'number' ? `Floor ${f.number}` : (f.name || ''))).filter(Boolean).slice(0, 6)

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
      </div>

      {/* Find Teachers */}
      <div className="p-6 bg-white/5 rounded-lg border border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-white">Find Teachers</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-foreground shadow-sm outline-none placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-11 rounded-md border border-slate-300 bg-white px-3 text-foreground shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="CSE-AI">CSE-AI</option>
            <option value="CS-DS">CS-DS</option>
          </select>
        </div>

        <FacultyResults search={search} department={department} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Teachers"
          count={68}
          icon={Users}
          href="/faculty/teachers"
          color="border-blue-500/30 bg-blue-500/10"
        />
        
        <DashboardCard
          title="Subjects"
          count={33}
          icon={BookOpen}
          href="/faculty/subjects"
          color="border-purple-500/30 bg-purple-500/10"
        />
        
        <DashboardCard
          title="Rooms"
          count={32}
          icon={Home}
          href="/faculty/rooms"
          color="border-green-500/30 bg-green-500/10"
        />
        
        <DashboardCard
          title="Floors"
          count={5}
          icon={Building2}
          href="/faculty/floors"
          color="border-amber-500/30 bg-amber-500/10"
        />
      </div>
    </div>
  )
}

function FacultyResults({ search, department }: { search: string; department: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['faculty', { search, department }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (department) params.set('department', department)
      const res = await fetch(`/api/faculty?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch faculty')
      return res.json() as Promise<Array<{
        id: string
        name: string
        department: string
        email: string
        phone: string
        courses: string[]
        feedback: Array<{ rating: number; comment: string }>
        classesHandled: number
        averageRating: number
      }>>
    }
  })

  if (isLoading) return <p className="text-white/70">Loading...</p>
  if (error) return <p className="text-red-400">Error loading faculty.</p>

  // Require a search term to display results (privacy UX)
  if (!search.trim()) {
    return <p className="text-white/60">Type a teacher name or email to search.</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(data || []).map((f) => (
        <div key={f.id} className="p-4 rounded-lg border border-white/10 bg-white/5 text-white">
          <h3 className="text-lg font-semibold">{f.name}</h3>
          <p className="text-xs text-white/60">{f.department}</p>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            <p><strong>ID:</strong> {f.id}</p>
            <p><strong>Email:</strong> {f.email}</p>
            <p><strong>Phone:</strong> {f.phone}</p>
            <p><strong>Courses:</strong> {f.courses.join(', ') || '—'}</p>
            <p><strong>Classes handled:</strong> {f.classesHandled}</p>
            <p><strong>Avg. rating:</strong> {f.averageRating}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs text-white/60 mb-1">Recent feedback:</p>
            {f.feedback.slice(0, 2).map((fb, idx) => (
              <p key={idx} className="text-xs text-white/70">{fb.rating}★ — {fb.comment}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
