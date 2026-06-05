'use client'

import React, { useState, useEffect } from 'react'
import { ActionableStep } from '@/types'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistProps {
  steps: ActionableStep[]
  onToggleStep?: (stepNumber: number, currentStatus: boolean) => Promise<void>
}

export function Checklist({ steps: initialSteps, onToggleStep }: ChecklistProps) {
  const [steps, setSteps] = useState<ActionableStep[]>(initialSteps)

  // Sync state if initialSteps change
  useEffect(() => {
    setSteps(initialSteps)
  }, [initialSteps])

  const toggleStep = async (stepNumber: number, currentStatus: boolean) => {
    // Optimistic UI update
    setSteps((prev) =>
      prev.map((step) =>
        step.step_number === stepNumber ? { ...step, is_completed: !currentStatus } : step
      )
    )

    if (onToggleStep) {
      try {
        await onToggleStep(stepNumber, currentStatus)
      } catch (err) {
        console.error('Failed to update step status:', err)
        // Rollback
        setSteps((prev) =>
          prev.map((step) =>
            step.step_number === stepNumber ? { ...step, is_completed: currentStatus } : step
          )
        )
      }
    }
  }

  // Sort: Incomplete first, then by priority (high -> medium -> low), then by step_number
  const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 }
  
  const sortedSteps = [...steps].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    const prioA = (a.priority || '').toLowerCase()
    const prioB = (b.priority || '').toLowerCase()
    const weightA = priorityWeight[prioA] || 0
    const weightB = priorityWeight[prioB] || 0
    if (weightA !== weightB) {
      return weightB - weightA // Descending priority
    }
    return a.step_number - b.step_number
  })

  const completedCount = steps.filter((s) => s.is_completed).length
  const totalCount = steps.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
            Action Checklist
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Personalized, interactive actions structured directly from your document details.
          </p>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-650 dark:text-slate-300">Progress</p>
            <p className="text-sm font-bold text-indigo-650 dark:text-indigo-400">
              {completedCount} of {totalCount} completed
            </p>
          </div>
          <div className="relative h-12 w-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-200 dark:text-slate-800"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
                className="text-indigo-600 dark:text-indigo-400 transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sortedSteps.map((step) => {
          const isCompleted = step.is_completed
          const priorityLower = (step.priority || '').toLowerCase()
          return (
            <div
              key={step.step_number}
              onClick={() => toggleStep(step.step_number, isCompleted)}
              className={cn(
                'group flex items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer',
                isCompleted
                  ? 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-850 opacity-75'
                  : 'bg-white/40 border-slate-200 hover:border-slate-300 dark:bg-slate-950/20 dark:border-slate-800 dark:hover:border-slate-700 shadow-sm'
              )}
            >
              <div className="mt-0.5 shrink-0 transition-transform duration-150 group-active:scale-90">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 fill-indigo-50/50 dark:fill-indigo-950/20" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400 hover:text-indigo-500" />
                )}
              </div>

              <div className="ml-3.5 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'text-sm font-semibold tracking-tight transition-all',
                      isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    )}
                  >
                    {step.title}
                  </span>

                  {/* Priority Badge */}
                  {!isCompleted && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                        priorityLower === 'high' && 'bg-red-50 text-red-700 dark:bg-red-955/30 dark:text-red-400',
                        priorityLower === 'medium' && 'bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400',
                        priorityLower === 'low' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {step.priority} Priority
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    'text-xs leading-relaxed max-w-2xl',
                    isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {step.description}
                </p>

                {/* Due Date Indicator */}
                {(step.deadline || step.due_date_hint) && !isCompleted && (
                  <div className="flex items-center space-x-1.5 pt-1.5 text-[11px] text-amber-605 dark:text-amber-400 font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Timeline: {step.deadline || step.due_date_hint}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
