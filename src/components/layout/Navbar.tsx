'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, LogOut, User, Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAuthPage = pathname.startsWith('/auth')

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/75 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 text-white shadow-md shadow-indigo-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-xl font-bold text-transparent dark:from-indigo-400 dark:to-violet-400">
                Life Translator
              </span>
            </Link>
          </div>

          {!isAuthPage && (
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/dashboard'
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/upload"
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/dashboard/upload'
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Translate Document
                    </Link>
                    <Link
                      href="/dashboard/history"
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pathname === '/dashboard/history'
                          ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                      }`}
                    >
                      History
                    </Link>
                    <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <User className="h-4 w-4" />
                        <span className="text-xs max-w-[150px] truncate">
                          {user.email}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button variant="primary" size="sm">
                        Create Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex md:hidden">
            {!isAuthPage && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none dark:hover:bg-slate-900"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && !isAuthPage && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/upload"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  Translate Document
                </Link>
                <Link
                  href="/dashboard/history"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  History
                </Link>
                <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 px-3">
                  <p className="text-xs text-slate-500 mb-2 truncate">{user.email}</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    className="w-full justify-start"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-2">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
