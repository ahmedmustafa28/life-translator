import Link from 'next/link'
import { ArrowRight, Shield, HeartPulse, Scale, FileText, CheckCircle2, BadgeAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/layout/Navbar'

export default function Home() {
  const categories = [
    {
      title: 'Medical Bills',
      desc: 'Understand itemized charges, codes, and insurance adjustments to spot hidden fees.',
      icon: HeartPulse,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
    },
    {
      title: 'Legal Contracts',
      desc: 'Simplify leases, terms of service, and NDAs so you know exactly what you are signing.',
      icon: Scale,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
    },
    {
      title: 'Financial Statements',
      desc: 'Demystify loan agreements, tax notices, and investment disclosures.',
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
    }
  ]

  const steps = [
    {
      num: '01',
      title: 'Upload Document',
      desc: 'Drop in any PDF or image (up to 8 pages, 10MB) securely. Files are protected via private cloud vaults.'
    },
    {
      num: '02',
      title: 'AI Translation',
      desc: 'Gemini analyzes the document, highlighting confusing terms, legal clauses, and cryptic billing codes.'
    },
    {
      num: '03',
      title: 'Review Actionable Plan',
      desc: 'Get an interactive checklist of high-priority to-dos, deadlines, and a plain-English jargon dictionary.'
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex-1 py-20 px-4 md:py-32 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-150 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 text-xs font-semibold animate-pulse-subtle">
            <BadgeAlert className="h-4 w-4" />
            <span>Simplify Real-World Jargon Automatically</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Translate Life&apos;s Most{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
              Confusing Documents
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Convert medical bills, lease agreements, court notices, and insurance letters into simple explanations and a clear checklist of action steps.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Cards Section */}
      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              What can you translate?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Stop stressing over fine print. Our AI translator extracts actionable insights across multiple document domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, i) => {
              const Icon = cat.icon
              return (
                <div
                  key={i}
                  className="glass-card p-6 rounded-2xl flex flex-col hover:translate-y-[-4px] transition-transform duration-300"
                >
                  <div className={`p-3 rounded-xl w-fit ${cat.color} mb-5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              How does it work?
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Go from confusing jargon to clear execution in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop layout */}
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-10" />
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-white dark:bg-slate-950 border-4 border-indigo-600 dark:border-indigo-400 shadow-md flex items-center justify-center font-black text-xl text-indigo-600 dark:text-indigo-400">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-250">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/20 dark:bg-slate-950/20 py-8 text-center text-xs text-slate-450 dark:text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Life Translator. Designed for human simplicity.</p>
          <p className="mt-1.5 max-w-lg mx-auto leading-relaxed text-[11px] text-slate-400">
            Disclaimer: Life Translator provides AI-generated summaries and explanations of documents. It does not provide certified legal, financial, or medical advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
