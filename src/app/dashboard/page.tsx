'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { 
  FileText, CheckCircle2, Loader2, XCircle, Plus, Trash2, ExternalLink, Inbox, Search 
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

export default function Dashboard() {
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchDocuments = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDocuments(data || [])
      } catch (err) {
        console.error('Error fetching documents:', err)
      } finally {
        setLoading(false)
      }
    }

    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      fetchDocuments(user.id)
    }
    initDashboard()
  }, [supabase, router])

  const handleDelete = async (docId: string, filePath: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This will also remove the translation.')) {
      return
    }

    setDeletingId(docId)

    try {
      // 1. Delete from Storage
      await supabase.storage.from('documents').remove([filePath])

      // 2. Delete from DB (cascade deletes translations & actionable steps)
      const { error } = await supabase.from('documents').delete().eq('id', docId)
      if (error) throw error

      setDocuments(prev => prev.filter(doc => doc.id !== docId))
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert('Failed to delete document. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // Filter documents based on search
  const filteredDocs = documents.filter(doc => {
    const title = doc.translations?.title || doc.file_name
    return title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Stats calculation
  const totalCount = documents.length
  const completedCount = documents.filter(d => d.status === 'completed').length
  const processingCount = documents.filter(d => d.status === 'processing').length
  const failedCount = documents.filter(d => d.status === 'failed').length

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage, review, and translate your real-world files.
              </p>
            </div>
            <Link href="/dashboard/upload">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Translate Document
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/40 backdrop-blur-md">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Files</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{totalCount}</p>
            </Card>
            <Card className="p-4 bg-white/40 backdrop-blur-md">
              <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</p>
            </Card>
            <Card className="p-4 bg-white/40 backdrop-blur-md">
              <p className="text-xs font-semibold text-slate-500 uppercase">Processing</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {processingCount}
              </p>
            </Card>
            <Card className="p-4 bg-white/40 backdrop-blur-md">
              <p className="text-xs font-semibold text-slate-500 uppercase">Failed</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-455 mt-1">{failedCount}</p>
            </Card>
          </div>

          {/* Search & List */}
          <div className="space-y-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 dark:text-slate-200"
              />
            </div>

            {loading ? (
              <div className="space-y-4">
                {/* Desktop Skeleton Table */}
                <div className="hidden lg:block overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white/20 dark:bg-slate-950/20">
                  <div className="w-full text-left border-collapse">
                    <div className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 flex py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <div className="w-2/5">Document Title / File Name</div>
                      <div className="w-1/5">Category</div>
                      <div className="w-1/10">Size</div>
                      <div className="w-1/5">Status</div>
                      <div className="w-1/10 text-right">Actions</div>
                    </div>
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex py-4 px-4 items-center border-b border-slate-150 dark:border-slate-850">
                        <div className="w-2/5 flex items-center space-x-3">
                          <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0 animate-pulse-subtle" />
                          <div className="space-y-2 w-full max-w-[180px]">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2" />
                          </div>
                        </div>
                        <div className="w-1/5"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-20" /></div>
                        <div className="w-1/10"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-10" /></div>
                        <div className="w-1/5"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24" /></div>
                        <div className="w-1/10 flex justify-end"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-16" /></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Mobile Skeleton Cards */}
                <div className="block lg:hidden space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="p-5 border border-slate-200 dark:border-slate-850 bg-white/20 dark:bg-slate-950/20 rounded-xl space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                        <div className="space-y-2 w-full">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/3" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-16" />
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-20" />
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-12" />
                        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/10 dark:bg-slate-950/10 animate-fade-in">
                <Inbox className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-750 dark:text-slate-200 mb-1">
                  No documents found
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Upload your first document to get started.'}
                </p>
                {!searchQuery && (
                  <Link href="/dashboard/upload">
                    <Button variant="outline" size="sm">
                      Upload Document
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop View Table */}
                <div className="hidden lg:block overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                          <th className="py-3.5 px-4 font-semibold">Document Title / File Name</th>
                          <th className="py-3.5 px-4 font-semibold">Category</th>
                          <th className="py-3.5 px-4 font-semibold">Size</th>
                          <th className="py-3.5 px-4 font-semibold">Status</th>
                          <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-sm text-slate-700 dark:text-slate-350 font-medium">
                        {filteredDocs.map(doc => {
                          const docTitle = doc.title || doc.file_name
                          const category = doc.document_type || 'Analyzing...'

                          return (
                            <tr key={doc.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors">
                              <td className="py-4 px-4 align-middle font-medium text-slate-900 dark:text-slate-100 max-w-[250px] truncate">
                                <div className="flex items-center space-x-2 truncate">
                                  <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                                  <span className="truncate">{docTitle}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 align-middle font-medium">
                                {category !== 'Analyzing...' ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                                    {category}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Pending analysis</span>
                                )}
                              </td>
                              <td className="py-4 px-4 align-middle font-medium text-xs text-slate-500">
                                {formatBytes(doc.file_size)}
                              </td>
                              <td className="py-4 px-4 align-middle">
                                {doc.status === 'completed' && (
                                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                                    Completed
                                  </span>
                                )}
                                {doc.status === 'processing' && (
                                  <span className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse-subtle">
                                    <Loader2 className="h-4 w-4 mr-1.5 shrink-0 animate-spin" />
                                    Processing...
                                  </span>
                                )}
                                {doc.status === 'failed' && (
                                  <span 
                                    className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-455 cursor-help"
                                    title={doc.error_message || 'Translation failed'}
                                  >
                                    <XCircle className="h-4 w-4 mr-1.5 shrink-0" />
                                    Failed
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 align-middle text-right space-x-2">
                                {doc.status === 'completed' ? (
                                  <Link href={`/documents/${doc.id}`}>
                                    <Button variant="outline" size="sm" className="h-8">
                                      View Summary
                                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                    </Button>
                                  </Link>
                                ) : doc.status === 'processing' ? (
                                  <Link href={`/documents/${doc.id}`}>
                                    <Button variant="outline" size="sm" className="h-8">
                                      Track Progress
                                    </Button>
                                  </Link>
                                ) : (
                                  <Link href="/dashboard/upload">
                                    <Button variant="outline" size="sm" className="h-8">
                                      Retry
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id, doc.file_path)}
                                  disabled={deletingId === doc.id}
                                  className="h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile View Card List */}
                <div className="block lg:hidden divide-y divide-slate-150 dark:divide-slate-850 bg-white/30 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  {filteredDocs.map(doc => {
                    const docTitle = doc.title || doc.file_name
                    const category = doc.document_type || 'Analyzing...'

                    return (
                      <div 
                        key={doc.id}
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors flex flex-col space-y-3 cursor-pointer"
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <div className="flex items-start space-x-3 truncate">
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{docTitle}</h4>
                              <p className="text-xs text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === doc.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDelete(doc.id, doc.file_path)
                            }}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {category !== 'Analyzing...' ? (
                            <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-955/40 dark:text-indigo-450 px-2.5 py-0.5 rounded font-semibold border border-indigo-100/50 dark:border-indigo-900/30">
                              {category}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-405 italic">Pending analysis</span>
                          )}
                          {doc.status === 'completed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                              <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" /> Completed
                            </span>
                          )}
                          {doc.status === 'processing' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30 animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 shrink-0 animate-spin" /> Processing
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30">
                              <XCircle className="h-3 w-3 mr-1 shrink-0" /> Failed
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-450 pt-1">
                          <span>{formatBytes(doc.file_size)}</span>
                          <span>
                            {new Date(doc.created_at).toLocaleDateString(undefined, { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
