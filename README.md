# 📄 Life Translator

> **Life Translator** is a production-ready, full-stack web application designed to simplify real-world documents. It converts complex, jargon-heavy medical bills, lease agreements, tax notices, and insurance letters into friendly, plain-English summaries and actionable checklists.

---

## 🌟 Key Features

* 🚀 **Multi-Engine AI Client:** Supports **Anthropic Claude**, **OpenAI**, and **Google Gemini** API requests, with automated exponential backoff retry mechanisms.
* 🔒 **Offline Developer Sandbox Mode:** Automatic mock-generation fallback when API keys are absent, ensuring seamless developer onboarding and local testing.
* 📝 **Multimodal OCR & Layout Preservation:** Extract tables, columns, and structural text directly from PDFs, JPEGs, and PNGs.
* 📋 **Interactive Action Checklists:** Dynamically generated checklists categorizing tasks by priority (`high | medium | low`) and tracking completion status directly synced to Supabase.
* 🖨️ **Printable PDF Export Summary:** Styled CSS printing templates allowing users to export jargon dictionaries and checklists directly to paper/PDF summaries.
* 🛡️ **Secure Backend Integrations:** Supabase Auth, Row-Level Security (RLS) tables, and secure storage vaults ensuring private document control.

---

## 🛠️ Technology Stack

* **Frontend Framework:** Next.js 14 (App Router) with React 18 & TypeScript
* **Styling & Animation:** Tailwind CSS v3 (Glassmorphism & dark/light variable configuration)
* **Backend Database & Storage:** Supabase (PostgreSQL, Auth, Storage Bucket API)
* **AI Runtime Engines:** Anthropic API (Claude), OpenAI API (gpt-4o-mini), and Google GenAI SDK (gemini-2.5-flash)
* **Validation & Types:** Zod schemas (`AIResultSchema`) for secure, runtime JSON parsing

---

## 📁 Repository Structure

```text
/
├── src/
│   ├── app/                                 # App Router tree
│   │   ├── layout.tsx                       # Root layout & providers
│   │   ├── page.tsx                         # Interactive Landing/Marketing page
│   │   ├── auth/                            # Sign-in / Sign-up layout
│   │   ├── dashboard/                       # Authenticated Document Portal
│   │   ├── documents/[id]/                  # Multi-tab analysis viewport & print templates
│   │   └── api/                             # Server API routes
│   │       ├── extract/                     # Document text OCR extraction
│   │       ├── translate/                   # Multi-engine translation and persistence
│   │       └── test-ai/                     # E2E test-suite validator
│   ├── components/                          # React Components
│   │   ├── ui/                              # Atomic UI elements (Buttons, Cards, Skeletons)
│   │   ├── layout/                          # Global Navbar & Sidebars
│   │   └── translator/                      # Document upload areas & interactive checklists
│   ├── lib/                                 # Core utility modules
│   │   ├── ai.ts                            # Unified Multi-Engine AI client
│   │   ├── supabase/                        # SSR client mappings and middlewares
│   │   └── utils.ts                         # Style merge helpers
│   └── types/                               # Common TypeScript interfaces
├── supabase/                                # Supabase SQL migrations
└── tailwind.config.js                       # Tailwind configuration file
```

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your system.

### 2. Repository Configuration
Clone the repository and install the dependencies:
```bash
git clone https://github.com/ahmedmustafa28/life-translator.git
cd life-translator
npm install
```

### 3. Environment Variables (`.env`)
Create a `.env` file in the root directory and configure the following keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...

# AI Provider Keys (At least one required for live models, otherwise runs in Sandbox Mode)
CLAUDE_API_KEY=sk-ant-api03...
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
```

### 4. Supabase Database Migration
Execute the following DDL in your Supabase SQL Editor to establish the schemas, trigger functions, and Row-Level Security (RLS) policies:
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DOCUMENTS
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    raw_text text,
    ai_result jsonb,
    document_type text,
    file_path text,
    file_name text,
    file_type text,
    file_size integer,
    status text default 'processing'::text check (status in ('processing', 'completed', 'failed')) not null,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

create policy "Users can view their own profile." on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own documents." on public.documents for select using (auth.uid() = user_id);
create policy "Users can insert their own documents." on public.documents for insert with check (auth.uid() = user_id);
create policy "Users can update their own documents." on public.documents for update using (auth.uid() = user_id);
create policy "Users can delete their own documents." on public.documents for delete using (auth.uid() = user_id);

-- Profile creation trigger from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 🚦 Execution

To run the development server locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

To run type checking, linting, and build optimization validation:
```bash
npm run build
```

---

## 🔍 Validation Suite

The repository includes a validation endpoint at `/api/test-ai` that runs an E2E verification across three mock document profiles (Medical Bill, Lease Agreement, Insurance Notice) and edge-case exceptions, ensuring 100% Zod validation pass rates on all AI JSON parses.

---

## 📜 Disclaimer
This application is AI-powered for educational and advocacy support purposes. Important medical, financial, or legal dates and calculations should always be cross-referenced with professionals.
