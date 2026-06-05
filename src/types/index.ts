export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export type DocumentStatus = 'processing' | 'completed' | 'failed'

export type StepPriority = 'low' | 'medium' | 'high'

export interface ActionableStep {
  step_number: number
  title: string
  description: string
  priority: StepPriority
  deadline?: string
  due_date_hint?: string
  is_completed: boolean
}

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AIResult {
  type: string
  summary: string
  what_it_means: string
  actions: ActionableStep[]
  deadline: string
  risk_level: RiskLevel
  warnings: string[]
}

export interface Document {
  id: string
  user_id: string
  title: string
  raw_text: string | null
  ai_result: AIResult | null
  document_type: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  status: DocumentStatus
  error_message: string | null
  created_at: string
}
