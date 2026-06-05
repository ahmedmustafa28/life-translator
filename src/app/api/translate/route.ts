import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { translateDocument, translateText } from '@/lib/ai'

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

  const { document_id } = body
  if (!document_id) {
    return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })
  }

  try {
    // 2. Fetch document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    // If already processed, return success
    if (document.status === 'completed') {
      return NextResponse.json({
        success: true,
        document_id: document.id
      })
    }

    // 3. Update document status to processing
    if (document.status !== 'processing') {
      await supabase
        .from('documents')
        .update({ status: 'processing', error_message: null })
        .eq('id', document.id)
    }

    let result
    if (document.file_path) {
      // 4. Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('documents')
        .download(document.file_path)

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file from storage: ${downloadError?.message || 'Empty file'}`)
      }

      // 5. Convert file buffer to base64
      const arrayBuffer = await fileData.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileBase64 = buffer.toString('base64')

      // 6. Request translation from Gemini
      result = await translateDocument(fileBase64, document.file_type)
    } else {
      // Manual text entry translation
      if (!document.raw_text) {
        throw new Error('No text content available to translate.')
      }
      result = await translateText(document.raw_text)
    }

    // Map actions with default is_completed: false
    const mappedActions = result.actions.map((action, index) => ({
      step_number: index + 1,
      title: action.title,
      description: action.description,
      priority: action.priority,
      deadline: action.deadline || null,
      is_completed: false
    }))

    const aiResultField = {
      ...result,
      actions: mappedActions
    }

    // 7. Update document columns with translation details
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        title: document.title || result.type,
        document_type: result.type,
        ai_result: aiResultField,
        status: 'completed',
        error_message: null
      })
      .eq('id', document.id)

    if (updateError) {
      throw new Error(`Failed to update document translation details: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      document_id: document.id
    })

  } catch (error: any) {
    console.error('Translation route error:', error)

    // Set document status to failed
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown processing error'
      })
      .eq('id', document_id)

    return NextResponse.json({
      success: false,
      error: error.message || 'Translation failed'
    }, { status: 550 })
  }
}
