'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

import { Checklist } from '@/components/translator/Checklist'
import { PDFViewer } from '@/components/translator/PDFViewer'
import { 
  ArrowLeft, Loader2, AlertCircle, FileText, CheckCircle2, 
  BookOpen, ClipboardList, Eye, Printer, AlertTriangle 
} from 'lucide-react'

export default function DocumentDetails() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const router = useRouter()

  const [document, setDocument] = useState<any>(null)
  const [translation, setTranslation] = useState<any>(null)
  const [actionSteps, setActionSteps] = useState<any[]>([])
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'explanation' | 'checklist' | 'original'>('explanation')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Fetch Document Record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single()

      if (docError || !docData) {
        throw new Error('Document not found or access denied.')
      }

      setDocument(docData)

      // 2. Fetch File URL from Storage bucket
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(docData.file_path, 3600) // 1 Hour Link

      if (!urlError && urlData) {
        setFileUrl(urlData.signedUrl)
      }

      // If document is completed, load Translation and checklist items
      if (docData.status === 'completed' && docData.ai_result) {
        setTranslation(docData.ai_result)
        setActionSteps(docData.ai_result.actions || [])
      }
    } catch (err: any) {
      console.error('Error loading page data:', err)
      setError(err.message || 'An error occurred loading the document.')
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  const handleToggleStep = async (stepNumber: number, currentStatus: boolean) => {
    if (!document || !translation) return

    const updatedSteps = actionSteps.map((step) =>
      step.step_number === stepNumber ? { ...step, is_completed: !currentStatus } : step
    )
    
    const updatedAiResult = {
      ...translation,
      actions: updatedSteps
    }

    const { error: updateErr } = await supabase
      .from('documents')
      .update({ ai_result: updatedAiResult })
      .eq('id', document.id)

    if (updateErr) {
      throw updateErr
    }

    setTranslation(updatedAiResult)
    setActionSteps(updatedSteps)
  }

  // Load Initial Document Meta
  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id, fetchData])

  // Polling for processing status
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (document && document.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const { data: updatedDoc, error: fetchErr } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single()

          if (fetchErr) throw fetchErr

          if (updatedDoc) {
            setDocument(updatedDoc)
            if (updatedDoc.status !== 'processing') {
              clearInterval(interval)
              fetchData() // Refresh everything
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 2500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [document, id, supabase, fetchData])

  const handlePrint = () => {
    window.print()
  }

  // Loading indicator for page fetches
  if (loading && !document) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm text-slate-500">Loading document data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error boundary page
  if (error || !document) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader className="text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-2" />
              <CardTitle>Error Loading File</CardTitle>
              <CardDescription>{error || 'The requested document does not exist.'}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="no-print">
        <Navbar />
      </div>
      <div className="flex-1 flex">
        <div className="no-print">
          <Sidebar />
        </div>
        <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">
          
          {/* Back button */}
          <div className="flex items-center justify-between no-print">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
            {document.status === 'completed' && translation && (
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-8">
                <Printer className="h-4 w-4 mr-1.5" />
                Export PDF Summary
              </Button>
            )}
          </div>

          {/* 1. PROCESSING VIEW (STEPPER) */}
          {document.status === 'processing' && (
            <Card className="max-w-xl mx-auto shadow-md border-slate-200 dark:border-slate-800">
              <CardHeader className="text-center pb-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-3" />
                <CardTitle className="text-xl">Translating Document...</CardTitle>
                <CardDescription>
                  Our Gemini LLM is extracting structure, identifying jargon, and organizing action checklists. This usually takes 5-10 seconds.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-4">
                {/* Stepper progress representation */}
                <div className="relative pl-6 border-l border-indigo-200 dark:border-indigo-900 space-y-6 text-sm">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 rounded-full bg-emerald-500 text-white p-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">File uploaded securely</p>
                      <p className="text-xs text-slate-500 mt-0.5">{document.file_name} stored in cloud vault</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 rounded-full bg-indigo-650 text-white p-0.5 animate-pulse-subtle">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-850 dark:text-slate-250">Analyzing layout & text</p>
                      <p className="text-xs text-slate-500 mt-0.5">Mapping tables, clauses, and structures</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative opacity-60">
                    <div className="absolute -left-[31px] top-0.5 rounded-full bg-slate-200 text-slate-500 p-0.5 dark:bg-slate-800 dark:text-slate-500">
                      <div className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-350">Translating Jargon with Gemini</p>
                      <p className="text-xs text-slate-400 mt-0.5">Generating plain-English equivalent definitions</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative opacity-60">
                    <div className="absolute -left-[31px] top-0.5 rounded-full bg-slate-200 text-slate-500 p-0.5 dark:bg-slate-800 dark:text-slate-500">
                      <div className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-350">Structuring actionable task list</p>
                      <p className="text-xs text-slate-400 mt-0.5">Defining deadlines, priorities, and steps</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. FAILED VIEW */}
          {document.status === 'failed' && (
            <Card className="max-w-xl mx-auto border-red-200 bg-red-50/20 shadow-md dark:border-red-900/30">
              <CardHeader className="text-center">
                <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-2" />
                <CardTitle className="text-rose-700 dark:text-red-400">Translation Failed</CardTitle>
                <CardDescription className="text-slate-650">
                  We hit an error parsing your file:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-sm font-mono p-3 bg-red-50 dark:bg-red-955/40 text-red-700 dark:text-red-300 rounded-lg">
                  {document.error_message || 'The model was unable to parse this document layout.'}
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <Link href="/dashboard/upload">
                    <Button variant="primary">Retry Upload</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3. COMPLETED VIEW */}
          {document.status === 'completed' && translation && (
            <div className="space-y-6">
              
              {/* Document Summary Card */}
              <Card className="bg-gradient-to-r from-indigo-50/30 via-white/50 to-violet-50/30 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                      {translation.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Processed on {new Date(document.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white pt-2">
                    {document.title}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed max-w-3xl pt-1">
                    <span className="font-semibold text-slate-850 dark:text-slate-200 block text-xs uppercase tracking-wider mb-1">
                      Simplified TL;DR Summary:
                    </span>
                    {translation.summary}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Warning Disclaimer Box */}
              <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-955/10 border border-amber-200/50 dark:border-amber-900/20 text-slate-600 dark:text-slate-400 text-xs flex items-start gap-2.5 no-print">
                <AlertCircle className="h-4.5 w-4.5 text-amber-605 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold text-amber-700 dark:text-amber-500">Legal/Medical Disclaimer:</span> This analysis is AI-generated for educational purposes only. Always cross-reference crucial action dates or bill amounts with professional legal, financial, or medical practitioners.
                </p>
              </div>

              {/* Tab Navigation (no-print) */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 no-print">
                <button
                  onClick={() => setActiveTab('explanation')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
                    activeTab === 'explanation'
                      ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Simple Explanation
                </button>
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
                    activeTab === 'checklist'
                      ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Action Checklist
                </button>
                {fileUrl && (
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
                      activeTab === 'original'
                        ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    <Eye className="h-4 w-4" />
                    Original File
                  </button>
                )}
              </div>

              {/* Tab Content Areas */}
              <div className="no-print">
                {activeTab === 'explanation' && (
                  <div className="space-y-6">
                    {/* What It Means Block */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-955/20 shadow-sm backdrop-blur-md">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-indigo-550" />
                          Explanation Breakdown
                        </CardTitle>
                        <CardDescription>
                          A simplified, plain-English translation of your document&apos;s contents.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {translation.what_it_means}
                      </CardContent>
                    </Card>

                    {/* Warnings / Red Flags */}
                    {translation.warnings && translation.warnings.length > 0 && (
                      <Card className="border border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-955/10 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold text-rose-705 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-rose-555" />
                            Critical Warnings & Red Flags
                          </CardTitle>
                          <CardDescription className="text-rose-600/80 dark:text-rose-400/80">
                            Hidden details, clauses, or risks identified in this document.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {translation.warnings.map((warning: string, index: number) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Risk Level & Deadline details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-955/20 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Risk Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2.5">
                            <span className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 ${
                              translation.risk_level === 'high' ? 'bg-rose-500 animate-pulse' :
                              translation.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <span className="text-lg font-bold capitalize text-slate-800 dark:text-slate-200">
                              {translation.risk_level} Risk
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-955/20 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline / Deadline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                            {translation.deadline || 'No specific deadline identified'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {activeTab === 'checklist' && <Checklist steps={actionSteps} onToggleStep={handleToggleStep} />}
                {activeTab === 'original' && fileUrl && (
                  <PDFViewer fileUrl={fileUrl} fileName={document.file_name} fileType={document.file_type} />
                )}
              </div>

              {/* PRINT ONLY VIEWPORT: pre-renders all tabs for standard paper exports */}
              <div className="print-only hidden space-y-8">
                <div className="border-b-2 border-indigo-650 pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black text-slate-900">LIFE TRANSLATOR REPORT</h1>
                    <p className="text-xs text-slate-500 mt-1">AI-Powered Document Simplification & Advocacy</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Processed: {new Date(document.created_at).toLocaleDateString()}</p>
                    <p className="capitalize font-semibold">Risk Level: {translation.risk_level}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-bold uppercase text-indigo-605 tracking-wider border-b border-slate-200 pb-1">Document Details</h2>
                  <p className="text-sm"><span className="font-bold text-slate-700">Title:</span> {document.title}</p>
                  <p className="text-sm"><span className="font-bold text-slate-700">Classification:</span> {translation.type}</p>
                  {translation.deadline && <p className="text-sm"><span className="font-bold text-slate-700">Overall Deadline:</span> {translation.deadline}</p>}
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-bold uppercase text-indigo-655 tracking-wider border-b border-slate-200 pb-1">TL;DR Summary</h2>
                  <p className="text-sm leading-relaxed text-slate-700">{translation.summary}</p>
                </div>

                <div className="space-y-2">
                  <h2 className="text-lg font-bold uppercase text-indigo-655 tracking-wider border-b border-slate-200 pb-1">Explanation Breakdown</h2>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{translation.what_it_means}</p>
                </div>

                {translation.warnings && translation.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold uppercase text-rose-600 tracking-wider border-b border-slate-200 pb-1">Critical Warnings & Red Flags</h2>
                    <ul className="space-y-1">
                      {translation.warnings.map((warning: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-750 flex items-start gap-2">
                          <span className="shrink-0 text-rose-500">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4 page-break-before">
                  <h2 className="text-lg font-bold uppercase text-indigo-655 tracking-wider border-b border-slate-200 pb-1">Action Checklist To-Dos</h2>
                  <div className="space-y-3">
                    {actionSteps.map((step: any) => (
                      <div key={step.step_number} className="border border-slate-300 rounded p-4 flex items-start">
                        <div className="h-5 w-5 border border-slate-400 rounded shrink-0 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            [{step.priority || 'low'} Priority] {step.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                          {(step.deadline || step.due_date_hint) && (
                            <p className="text-xs text-amber-600 font-bold mt-1">Timeline Hint: {step.deadline || step.due_date_hint}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-center text-slate-450 mt-12 pt-4 border-t border-slate-200">
                  Disclaimer: This is an AI-generated translator summary report. Always confirm dates and amounts with official service desks.
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  )
}
