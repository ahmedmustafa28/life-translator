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
  FileText, CheckCircle2, Loader2, XCircle, Trash2, ExternalLink, 
  Search, Filter, ArrowUpDown, Inbox, AlertTriangle, Shield, Eye
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

export default function HistoryPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedRisk, setSelectedRisk] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, largest, smallest

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
        console.error('Error fetching history:', err)
      } finally {
        setLoading(false)
      }
    }

    const initHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      fetchDocuments(user.id)
    }
    initHistory()
  }, [supabase, router])

  const handleDelete = async (docId: string, filePath: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this document? This will remove all associated translation data.')) {
      return
    }

    setDeletingId(docId)

    try {
      // 1. Delete from Storage (ignore if mock file path or error)
      try {
        await supabase.storage.from('documents').remove([filePath])
      } catch (err) {
        console.warn('Storage removal bypassed or failed:', err)
      }

      // 2. Delete from DB
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

  // Extract unique document types for filter dropdown
  const documentTypes = ['all', ...Array.from(new Set(documents.map(doc => {
    return doc.ai_result?.category || doc.document_type || 'Other'
  })))]

  // Filter & Sort Logic
  const filteredAndSortedDocs = documents
    .filter(doc => {
      const title = doc.ai_result?.title || doc.file_name
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())

      const type = doc.ai_result?.category || doc.document_type || 'Other'
      const matchesType = selectedType === 'all' || type.toLowerCase() === selectedType.toLowerCase()

      const risk = doc.ai_result?.risk_level || 'low'
      const matchesRisk = selectedRisk === 'all' || risk.toLowerCase() === selectedRisk.toLowerCase()

      const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus

      return matchesSearch && matchesType && matchesRisk && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortBy === 'largest') {
        return b.file_size - a.file_size
      }
      if (sortBy === 'smallest') {
        return a.file_size - b.file_size
      }
      return 0
    })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
            <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30 animate-pulse">
            <Loader2 className="h-3 w-3 mr-1 shrink-0 animate-spin" />
            Processing
          </span>
        )
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30">
            <XCircle className="h-3 w-3 mr-1 shrink-0" />
            Failed
          </span>
        )
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30">
            <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
            High Risk
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-250 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">
            Medium Risk
          </span>
        )
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-350 dark:border-slate-700/50">
            Low Risk
          </span>
        )
    }
  }

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
                Translation History
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Browse, search, and manage all your past translations and document simplifications.
              </p>
            </div>
            <Link href="/dashboard/upload">
              <Button variant="primary">
                Translate New
              </Button>
            </Link>
          </div>

          {/* Filters Area */}
          <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Bar */}
                <div className="relative md:col-span-1">
                  <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by file name or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 dark:text-slate-200"
                  />
                </div>

                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 dark:text-slate-200 capitalize"
                  >
                    <option value="all">All Document Types</option>
                    {documentTypes.filter(t => t !== 'all').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Risk Level Filter */}
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                    className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 dark:text-slate-200"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 dark:text-slate-200"
                  >
                    <option value="all">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Secondary Sort Row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 gap-2">
                <div>
                  Showing {filteredAndSortedDocs.length} of {documents.length} documents
                </div>
                <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="py-1 px-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 dark:text-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="newest">Date: Newest First</option>
                    <option value="oldest">Date: Oldest First</option>
                    <option value="largest">Size: Largest First</option>
                    <option value="smallest">Size: Smallest First</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 w-full bg-slate-100 dark:bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredAndSortedDocs.length === 0 ? (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 py-16 text-center bg-white/20 dark:bg-slate-900/10">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-slate-50 p-4 dark:bg-slate-900 text-slate-400">
                  <Inbox className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No documents found</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  {documents.length === 0 
                    ? "You haven't uploaded any documents yet. Get started by translating your first document!" 
                    : "No documents match the active search filters. Try updating your filters or search query."}
                </p>
                {documents.length === 0 && (
                  <Link href="/dashboard/upload" className="pt-2">
                    <Button variant="primary">Translate New Document</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
              {/* Desktop view table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse bg-white/30 dark:bg-slate-950/20 backdrop-blur-sm text-left text-sm text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th scope="col" className="px-6 py-4">Document</th>
                      <th scope="col" className="px-6 py-4">Type</th>
                      <th scope="col" className="px-6 py-4">Risk Level</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4">Uploaded</th>
                      <th scope="col" className="px-6 py-4">Size</th>
                      <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                    {filteredAndSortedDocs.map((doc) => {
                      const docType = doc.ai_result?.category || doc.document_type || 'Other'
                      const title = doc.ai_result?.title || doc.file_name
                      const risk = doc.ai_result?.risk_level || 'low'
                      const isCompleted = doc.status === 'completed'

                      return (
                        <tr 
                          key={doc.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/documents/${doc.id}`)}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-3">
                            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="truncate max-w-[280px]">
                              <p className="font-bold truncate text-slate-800 dark:text-slate-200">{title}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">{doc.file_name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 uppercase text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {docType}
                          </td>
                          <td className="px-6 py-4">
                            {isCompleted ? getRiskBadge(risk) : <span className="text-slate-400 dark:text-slate-600">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(doc.status)}
                          </td>
                          <td className="px-6 py-4 text-xs font-normal">
                            {new Date(doc.created_at).toLocaleDateString(undefined, { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4 text-xs font-normal">
                            {formatBytes(doc.file_size)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link href={`/documents/${doc.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-slate-500 hover:text-indigo-600 dark:text-slate-450 dark:hover:text-indigo-400"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                isLoading={deletingId === doc.id}
                                onClick={(e) => handleDelete(doc.id, doc.file_path, e)}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-455"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Card List */}
              <div className="block lg:hidden divide-y divide-slate-150 dark:divide-slate-850 bg-white/30 dark:bg-slate-950/20">
                {filteredAndSortedDocs.map((doc) => {
                  const docType = doc.ai_result?.category || doc.document_type || 'Other'
                  const title = doc.ai_result?.title || doc.file_name
                  const risk = doc.ai_result?.risk_level || 'low'
                  const isCompleted = doc.status === 'completed'

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
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{title}</h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{doc.file_name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={deletingId === doc.id}
                          onClick={(e) => handleDelete(doc.id, doc.file_path, e)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-455 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350 px-2 py-0.5 rounded uppercase font-semibold">
                          {docType}
                        </span>
                        {isCompleted && getRiskBadge(risk)}
                        {getStatusBadge(doc.status)}
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
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
        </main>
      </div>
    </div>
  )
}
