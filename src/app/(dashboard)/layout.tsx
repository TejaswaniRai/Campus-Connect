'use client'

import { useEffect, useState } from 'react'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { UserRole } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [userRole, setUserRole] = useState<UserRole | null>(null)

  useEffect(() => {
    // In a real app, this would come from an auth context or API
    // For now, we'll determine based on the URL
    const isAdminPage = window.location.pathname.startsWith('/admin')
    const isFacultyPage = window.location.pathname.startsWith('/faculty')
    if (isAdminPage) {
      setUserRole('admin')
    } else if (isFacultyPage) {
      setUserRole('faculty')
    } else {
      setUserRole('student')
    }
  }, [])

  if (!userRole) {
    // Prevent hydration mismatch by not rendering until userRole is set on client
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-800 bg-slate-950 text-slate-100">
        <div className="container mx-auto flex items-center justify-between px-4 py-5 md:px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-amber-400 text-sm font-bold text-slate-950">CC</span>
              <div>
                <h1 className="font-sans text-xl font-semibold tracking-tight text-slate-100">Campus Connect</h1>
                <p className="text-xs text-slate-400">University operations desk</p>
              </div>
            </div>
          </div>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-slate-500 sm:block">Live campus systems</span>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 md:px-6">
        <DashboardNav userRole={userRole} />
        {children}
      </div>
    </div>
  )
}