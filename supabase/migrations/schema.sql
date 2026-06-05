-- Supabase Migration / DDL Schema Setup (Unified Documents Layout)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES: Stores extra user-related information linked to Supabase auth.users
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DOCUMENTS: Main unified documents table containing metadata, text, and AI results
create table if not exists public.documents (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,               -- Document title (updated by AI)
    raw_text text,                     -- Extracted text layout
    ai_result jsonb,                   -- Combined AI result containing {summary, jargon_translations, actionable_steps}
    document_type text,                -- Category classification (e.g. Medical, Legal, Financial)
    file_path text,                    -- Path inside Storage bucket (null for manual text)
    file_name text,                    -- File name (null for manual text)
    file_type text,                    -- MIME type (null for manual text)
    file_size integer,                 -- bytes (null for manual text)
    status text default 'processing'::text check (status in ('processing', 'completed', 'failed')) not null,
    error_message text,                -- details if processing fails
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES --

-- Enable RLS on tables
alter table public.profiles enable row level security;
alter table public.documents enable row level security;

-- Profiles Policies
drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile." on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles
    for update using (auth.uid() = id);

-- Documents Policies
drop policy if exists "Users can view their own documents." on public.documents;
create policy "Users can view their own documents." on public.documents
    for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own documents." on public.documents;
create policy "Users can insert their own documents." on public.documents
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own documents." on public.documents;
create policy "Users can update their own documents." on public.documents
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own documents." on public.documents;
create policy "Users can delete their own documents." on public.documents
    for delete using (auth.uid() = user_id);

-- Profile creation trigger from auth.users --
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
