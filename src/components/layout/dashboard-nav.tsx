'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/types'

interface DashboardNavProps {
  userRole: UserRole
}

export function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname()
  
  const isAdmin = userRole === 'admin'
  // const isStudent = userRole === 'student'
  const isFaculty = userRole === 'faculty'
  
  // Base links for all users
  const links = [
    {
      href: isAdmin ? '/admin' : isFaculty ? '/faculty' : '/student',
      label: 'Dashboard',
      active: pathname === (isAdmin ? '/admin' : isFaculty ? '/faculty' : '/student')
    },
    {
      href: isAdmin ? '/admin/announcements' : isFaculty ? '/faculty/announcements' : '/student/announcements',
      label: 'Announcements',
      active: pathname.includes('announcements')
    },
    {
      href: isAdmin ? '/admin/study-materials' : isFaculty ? '/faculty/study-materials' : '/student/study-materials',
      label: 'Study Materials',
      active: pathname.includes('study-materials')
    },
    {
      href: isAdmin ? '/admin/lost-and-found' : isFaculty ? '/faculty/lost-and-found' : '/student/lost-and-found',
      label: 'Lost & Found',
      active: pathname.includes('lost-and-found')
    }
  ]
  
  // Faculty management links
  if (isFaculty) {
    links.push(
      {
        href: '/faculty/teachers',
        label: 'Teachers',
        active: pathname.includes('/faculty/teachers')
      },
      {
        href: '/faculty/subjects',
        label: 'Subjects',
        active: pathname.includes('/faculty/subjects')
      },
      {
        href: '/faculty/rooms',
        label: 'Rooms',
        active: pathname.includes('/faculty/rooms')
      },
      {
        href: '/faculty/floors',
        label: 'Floors',
        active: pathname.includes('/faculty/floors')
      }
    )
  }
  
  // Admin can also access faculty management
  if (isAdmin) {
    links.push({
      href: '/admin/faculty',
      label: 'Faculty Management',
      active: pathname.includes('/admin/faculty')
    })
  }
  
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            link.active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
