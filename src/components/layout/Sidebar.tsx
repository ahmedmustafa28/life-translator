'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/upload', label: 'Translate New', icon: Upload },
  ]

  return (
    <aside className="w-64 hidden md:block shrink-0 border-r border-slate-200 dark:border-slate-800 min-h-[calc(100vh-4rem)] p-4 bg-white/50 backdrop-blur-md dark:bg-slate-950/50">
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href === '/dashboard' && pathname.startsWith('/documents/'))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-450'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-450 dark:hover:bg-slate-900 dark:hover:text-slate-100'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
