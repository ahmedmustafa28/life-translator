import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromDocument } from '@/lib/ai'

export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 })
  }

  const { file_path, file_type } = body
  if (!file_path || !file_type) {
    return NextResponse.json({ error: 'Missing file_path or file_type' }, { status: 400 })
  }

  try {
    // 2. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file from storage: ${downloadError?.message || 'Empty file'}`)
    }

    // 3. Convert file buffer to base64
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileBase64 = buffer.toString('base64')

    // 4. Request layout-preserving OCR from Gemini
    const text = await extractTextFromDocument(fileBase64, file_type)

    return NextResponse.json({
      success: true,
      text: text
    })

  } catch (error: any) {
    console.error('Text extraction route error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Text extraction failed'
    }, { status: 500 })
  }
}
