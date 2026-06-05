import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Helper to find project root containing package.json
function getProjectRoot() {
  let dir = process.cwd()
  while (dir && dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir
    }
    dir = path.dirname(dir)
  }
  return process.cwd()
}

const DB_FILE = path.join(getProjectRoot(), 'sb-mock-db.json')

// Helper to read database
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Initialize with default template data
      const defaultData = {
        users: [
          {
            id: 'mock-user-id',
            email: 'mustafa@gmail.com',
            full_name: 'Ahmed Mustafa',
            password: 'password123'
          }
        ],
        documents: []
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2))
      return defaultData
    }
    const data = fs.readFileSync(DB_FILE, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error reading mock db:', err)
    return { users: [], documents: [] }
  }
}

// Helper to write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error writing mock db:', err)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const id = searchParams.get('id')
  const userId = searchParams.get('user_id')
  const email = searchParams.get('email')

  const db = readDb()

  if (table === 'users') {
    if (email) {
      const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())
      return NextResponse.json({ data: user || null })
    }
    return NextResponse.json({ data: db.users })
  }

  if (table === 'documents') {
    if (id) {
      const doc = db.documents.find((d: any) => d.id === id)
      return NextResponse.json({ data: doc || null })
    }
    if (userId) {
      const docs = db.documents.filter((d: any) => d.user_id === userId)
      // Sort by created_at desc
      docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return NextResponse.json({ data: docs })
    }
    return NextResponse.json({ data: db.documents })
  }

  return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = readDb()

  if (table === 'users') {
    const existing = db.users.find((u: any) => u.email.toLowerCase() === body.email.toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email: body.email,
      full_name: body.full_name || '',
      password: body.password || '',
      created_at: new Date().toISOString()
    }
    db.users.push(newUser)
    writeDb(db)
    return NextResponse.json({ data: newUser })
  }

  if (table === 'documents') {
    const newDoc = {
      id: body.id || `doc-${Date.now()}`,
      user_id: body.user_id,
      title: body.title,
      raw_text: body.raw_text || '',
      ai_result: body.ai_result || null,
      document_type: body.document_type || 'Other',
      file_path: body.file_path || null,
      file_name: body.file_name || 'manual.txt',
      file_type: body.file_type || 'text/plain',
      file_size: body.file_size || 0,
      status: body.status || 'processing',
      error_message: body.error_message || null,
      created_at: new Date().toISOString()
    }
    db.documents.push(newDoc)
    writeDb(db)
    return NextResponse.json({ data: newDoc })
  }

  return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id param' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const db = readDb()

  if (table === 'documents') {
    const index = db.documents.findIndex((d: any) => d.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Merge updates
    db.documents[index] = {
      ...db.documents[index],
      ...body
    }
    writeDb(db)
    return NextResponse.json({ data: db.documents[index] })
  }

  return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id param' }, { status: 400 })
  }

  const db = readDb()

  if (table === 'documents') {
    const index = db.documents.findIndex((d: any) => d.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    db.documents.splice(index, 1)
    writeDb(db)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
}
