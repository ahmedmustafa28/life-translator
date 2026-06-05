import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Life Translator API is running and connected successfully!',
    timestamp: new Date().toISOString()
  })
}
