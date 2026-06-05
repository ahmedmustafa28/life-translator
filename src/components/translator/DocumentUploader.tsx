'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, File, AlertCircle, CheckCircle2, Loader2, Sparkles, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/utils'

export function DocumentUploader() {
  const supabase = createClient()
  const router = useRouter()

  // Tabs: 'upload' | 'manual'
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'manual'>('upload')

  // Step state: 'input' | 'preview'
  const [step, setStep] = useState<'input' | 'preview'>('input')

  // File Upload State
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileStoragePath, setFileStoragePath] = useState<string | null>(null)

  // Document details (Editable in preview/manual step)
  const [docTitle, setDocTitle] = useState('')
  const [docText, setDocText] = useState('')
  const [docCategory, setDocCategory] = useState<'Medical' | 'Legal' | 'Financial' | 'Government' | 'Insurance' | 'Other'>('Other')

  // Loading & Error States
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const [user, setUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [supabase])

  // Simple PDF page count binary analyzer
  const getPdfPageCount = async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const arrBuffer = reader.result as ArrayBuffer
          const text = new TextDecoder('ascii').decode(arrBuffer)
          const matches = text.match(/\/Type\s*\/Page\b/g)
          resolve(matches ? matches.length : 1)
        } catch {
          resolve(1)
        }
      }
      reader.onerror = () => resolve(1)
      reader.readAsArrayBuffer(file)
    })
  }

  const validateFile = async (selectedFile: File): Promise<boolean> => {
    setError(null)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF, JPEG, or PNG document.')
      return false
    }

    const maxSizeBytes = 10 * 1024 * 1024 // 10MB limit
    if (selectedFile.size > maxSizeBytes) {
      setError('File is too large. Maximum size allowed is 10 MB.')
      return false
    }

    if (selectedFile.type === 'application/pdf') {
      const pageCount = await getPdfPageCount(selectedFile)
      if (pageCount > 8) {
        setError(`Your document has ${pageCount} pages. The maximum allowed is 8 pages.`)
        return false
      }
    }

    return true
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      const isValid = await validateFile(droppedFile)
      if (isValid) setFile(droppedFile)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const isValid = await validateFile(selectedFile)
      if (isValid) setFile(selectedFile)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Phase 4: Extract text using backend OCR/parsing API
  const handleExtractText = async () => {
    if (!file || !user) return

    setLoading(true)
    setError(null)
    setLoadingMessage('Uploading file to secure storage bucket...')

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) throw storageError
      setFileStoragePath(storageData.path)

      setLoadingMessage('Performing OCR and layout text extraction...')

      // 2. Call text extraction API
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: storageData.path,
          file_type: file.type
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract text from file.')
      }

      // 3. Pre-fill Title & Extracted Text
      const cleanTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
      setDocTitle(cleanTitle)
      setDocText(data.text || '')
      
      // Progress to preview step
      setStep('preview')

    } catch (err: any) {
      console.error('Text extraction failed:', err)
      setError(err.message || 'Text extraction failed. Check layout or retry.')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleManualNext = () => {
    if (!docText.trim()) {
      setError('Please type or paste some text content to translate.')
      return
    }
    setError(null)
    setDocTitle(docTitle.trim() || 'Manual Document')
    setStep('preview')
  }

  // Translate document (saves record & triggers translation route)
  const handleTranslate = async () => {
    if (!docText.trim() || !docTitle.trim() || !user) return

    setLoading(true)
    setError(null)
    setLoadingMessage('Saving translation record...')

    try {
      // 1. Save document details in PostgreSQL
      const documentPayload = {
        user_id: user.id,
        title: docTitle.trim(),
        raw_text: docText.trim(),
        document_type: docCategory,
        file_path: activeInputTab === 'upload' ? fileStoragePath : null,
        file_name: activeInputTab === 'upload' && file ? file.name : 'manual.txt',
        file_type: activeInputTab === 'upload' && file ? file.type : 'text/plain',
        file_size: activeInputTab === 'upload' && file ? file.size : Buffer.byteLength(docText, 'utf8'),
        status: 'processing'
      }

      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert(documentPayload)
        .select()
        .single()

      if (dbError || !docData) {
        throw new Error(dbError?.message || 'Failed to save document details.')
      }

      setLoadingMessage('Initializing translation algorithms...')

      // 2. Trigger translation route in the background
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: docData.id })
      }).catch(err => {
        console.error('Translate API trigger error:', err)
      })

      // 3. Redirect immediately to status stepper view
      router.push(`/documents/${docData.id}`)
      router.refresh()

    } catch (err: any) {
      console.error('Translation failed:', err)
      setError(err.message || 'Failed to start translation. Please retry.')
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const resetForm = () => {
    setFile(null)
    setFileStoragePath(null)
    setDocTitle('')
    setDocText('')
    setStep('input')
    setError(null)
  }

  // Loader View overlay
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-sm min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Please Wait
        </h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-xs leading-relaxed animate-pulse">
          {loadingMessage || 'Processing...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-2.5 text-red-700 dark:text-red-400 text-sm font-semibold">
          <AlertCircle className="h-5 w-5 mr-1 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: INPUT SPECIFICATION */}
      {step === 'input' && (
        <div className="space-y-6">
          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6">
            <button
              onClick={() => {
                setActiveInputTab('upload')
                setError(null)
              }}
              className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
                activeInputTab === 'upload'
                  ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload PDF or Image
            </button>
            <button
              onClick={() => {
                setActiveInputTab('manual')
                setError(null)
              }}
              className={`pb-3 text-sm font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
                activeInputTab === 'manual'
                  ? 'border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
              }`}
            >
              <FileText className="h-4 w-4" />
              Manual Text Input
            </button>
          </div>

          {/* Upload Tab View */}
          {activeInputTab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-300 hover:border-indigo-400 bg-white/40 dark:border-slate-800 dark:bg-slate-900/40'
                } backdrop-blur-md shadow-sm`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                />

                <div className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 p-4 mb-4 text-indigo-600 dark:text-indigo-400">
                  <Upload className="h-8 w-8" />
                </div>

                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Drag & drop your file
                </h3>
                <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                  Supports PDFs, JPEGs, and PNGs (Max 8 pages, 10 MB limit)
                </p>

                <Button variant="outline" size="sm" onClick={onButtonClick}>
                  Choose File
                </Button>

                {file && (
                  <div className="mt-6 w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <File className="h-5 w-5 text-indigo-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-750 dark:text-slate-350 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-550">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-emerald-600 font-semibold text-xs shrink-0">
                      <CheckCircle2 className="h-4 w-4 mr-1 shrink-0" /> Selected
                    </div>
                  </div>
                )}
              </div>

              {file && (
                <div className="flex justify-end pt-2">
                  <Button variant="primary" onClick={handleExtractText} className="w-full sm:w-auto">
                    Extract Text
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Manual Text Tab View */}
          {activeInputTab === 'manual' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Content
                </label>
                <textarea
                  placeholder="Paste or type the document text content here..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  rows={8}
                  className="w-full p-4 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 dark:text-slate-200 resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hospital Bill - June 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleManualNext} className="w-full sm:w-auto">
                  Preview Text
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PREVIEW & AI EDITING SCREEN */}
      {step === 'preview' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
              Review Extracted Text
            </h2>
            <Button variant="outline" size="sm" onClick={resetForm} className="h-8">
              Start Over
            </Button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Verify and make any necessary adjustments to the text content before running the translation AI algorithms.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Document Title
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 dark:text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Document Category
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-955/50 dark:text-slate-200"
              >
                <option value="Medical">Medical Document / Bill</option>
                <option value="Legal">Legal Contract / Lease</option>
                <option value="Financial">Financial Statement / Loan</option>
                <option value="Insurance">Insurance Policy / Letter</option>
                <option value="Government">Government Notice / Tax Form</option>
                <option value="Other">Other Document</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Extracted Text
            </label>
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              rows={12}
              className="w-full p-4 font-mono text-xs rounded-xl border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-955/50 dark:text-slate-200 resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={handleTranslate} className="w-full sm:w-auto">
              Translate Document
              <Sparkles className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
