'use client'

import React, { useState } from 'react'
import { Search, Info, HelpCircle } from 'lucide-react'

export interface JargonTranslation {
  original_term: string
  simple_translation: string
  impact: string
  context?: string
}

interface JargonTableProps {
  translations: JargonTranslation[]
}

export function JargonTable({ translations }: JargonTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTranslations = translations.filter(
    (item) =>
      item.original_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.simple_translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.impact.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-500" />
            Jargon Dictionary
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explaining complex terms, legal clauses, and billing codes found in the document.
          </p>
        </div>

        <div className="relative max-w-md w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search jargon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 dark:text-slate-200"
          />
        </div>
      </div>

      {filteredTranslations.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-slate-500 text-sm">No jargon items matched your search query.</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Original Jargon / Code</th>
                  <th className="py-3.5 px-4 font-semibold">Plain-English Meaning</th>
                  <th className="py-3.5 px-4 font-semibold">What It Means For You</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-sm text-slate-700 dark:text-slate-350">
                {filteredTranslations.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors"
                  >
                    <td className="py-4 px-4 align-top font-medium text-slate-900 dark:text-slate-100 max-w-[200px]">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 mb-1">
                        {item.original_term}
                      </span>
                      {item.context && (
                        <p className="text-xs text-slate-400 italic block mt-1">
                          Ref: &ldquo;{item.context}&rdquo;
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 align-top leading-relaxed max-w-xs sm:max-w-sm">
                      {item.simple_translation}
                    </td>
                    <td className="py-4 px-4 align-top leading-relaxed">
                      <div className="flex items-start space-x-2 text-slate-600 dark:text-slate-400">
                        <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-850 dark:text-slate-300">
                          {item.impact}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
