'use client'

import React from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { DocumentUploader } from '@/components/translator/DocumentUploader'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function UploadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 space-y-6 overflow-y-auto">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-8">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Translate New Document
              </h1>
              <p className="text-xs text-slate-500">
                Upload a bill, contract, or form to translate into human-friendly explanations.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <DocumentUploader />
          </div>
        </main>
      </div>
    </div>
  )
}
