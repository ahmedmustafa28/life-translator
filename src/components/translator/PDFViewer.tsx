'use client'

import React from 'react'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  fileType: string
}

export function PDFViewer({ fileUrl, fileName, fileType }: PDFViewerProps) {
  const isImage = fileType.startsWith('image/')
  const isPdf = fileType === 'application/pdf'

  return (
    <div className="flex flex-col h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2 truncate">
          <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
            {fileName}
          </span>
        </div>
        <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="h-3.5 w-3.5 mr-1" />
            Download
          </Button>
        </a>
      </div>
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg border border-slate-200 dark:border-slate-850 shadow-sm"
          />
        ) : isPdf ? (
          <iframe
            src={`${fileUrl}#toolbar=0`}
            className="w-full h-full border-none rounded-lg bg-white"
            title={fileName}
          />
        ) : (
          <div className="text-center p-6 text-slate-550">
            <FileText className="h-12 w-12 text-slate-350 mx-auto mb-2" />
            <p className="text-sm">Preview not supported for this file type.</p>
            <p className="text-xs mt-1 text-slate-400">
              Please use the download button to view the file.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
