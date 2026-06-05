'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { AlertCircle, Lock, Mail, User, Shield, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'

export default function SignUp() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (signUpError) throw signUpError

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        <Card className="w-full max-w-md shadow-lg border border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto rounded-xl bg-indigo-55/10 p-2.5 w-fit text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            <CardDescription>
              Join Life Translator to start simplifying your documents.
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent className="space-y-4 py-6 text-center">
              <div className="mx-auto rounded-full bg-emerald-100 p-3 w-fit text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-250">Check your email</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                We have sent a verification link to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>. Please click the link to activate your account.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-2 text-red-700 dark:text-red-400 text-xs font-semibold">
                    <AlertCircle className="h-4.5 w-4.5 mr-1 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="•••••••• (min 6 characters)"
                      value={password}
                      minLength={6}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 dark:text-slate-200"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" isLoading={loading} className="w-full">
                  Create Account
                </Button>
                <div className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    Sign In
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
