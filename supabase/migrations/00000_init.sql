-- CreatorPassport canonical initial schema
-- Tables, RLS policies, and indexes in one migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- creators: profile data attached to Supabase auth.users
-- ---------------------------------------------------------------------------
create table public.creators (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  mind_id text,
  mind_email text,
  voice_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.creators (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  title text not null,
  source_text text not null default '',
  sponsor_brief jsonb not null default '{}'::jsonb,
  platforms text[] not null default '{}',
  deadline timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'reviewing', 'complete', 'published')),
  mind_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- platform_versions
-- ---------------------------------------------------------------------------
create table public.platform_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  platform text not null,
  generated_text text not null,
  final_text text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'approved', 'published', 'replaced')),
  consistency_checks jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  modified_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- follow_up_tasks
-- ---------------------------------------------------------------------------
create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  task_type text not null
    check (task_type in ('deadline_approaching', 'content_expiring', 'incomplete_versions', 'learned_preference_update')),
  description text not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'dismissed', 'failed')),
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  mind_decision jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- learning_events
-- ---------------------------------------------------------------------------
create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  event_type text not null,
  original_text text,
  modified_text text,
  context text,
  extracted_pattern text,
  applied_to_campaigns uuid[],
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.creators enable row level security;
alter table public.campaigns enable row level security;
alter table public.platform_versions enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.learning_events enable row level security;

create policy "creators_select_own"
  on public.creators for select
  using (auth.uid() = id);

create policy "creators_insert_own"
  on public.creators for insert
  with check (auth.uid() = id);

create policy "creators_update_own"
  on public.creators for update
  using (auth.uid() = id);

create policy "campaigns_select_own"
  on public.campaigns for select
  using (auth.uid() = creator_id);

create policy "campaigns_insert_own"
  on public.campaigns for insert
  with check (auth.uid() = creator_id);

create policy "campaigns_update_own"
  on public.campaigns for update
  using (auth.uid() = creator_id);

create policy "campaigns_delete_own"
  on public.campaigns for delete
  using (auth.uid() = creator_id);

create policy "platform_versions_select_own"
  on public.platform_versions for select
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = platform_versions.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  );

create policy "platform_versions_insert_own"
  on public.platform_versions for insert
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = platform_versions.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  );

create policy "platform_versions_update_own"
  on public.platform_versions for update
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = platform_versions.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  );

create policy "platform_versions_delete_own"
  on public.platform_versions for delete
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = platform_versions.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  );

create policy "follow_up_tasks_manage_own"
  on public.follow_up_tasks for all
  using (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = follow_up_tasks.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.campaigns
      where campaigns.id = follow_up_tasks.campaign_id
        and campaigns.creator_id = auth.uid()
    )
  );

create policy "learning_events_manage_own"
  on public.learning_events for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_campaigns_creator_id on public.campaigns(creator_id);
create index idx_platform_versions_campaign_id on public.platform_versions(campaign_id);
create index idx_follow_up_tasks_campaign_id on public.follow_up_tasks(campaign_id);
create index idx_learning_events_creator_id on public.learning_events(creator_id);
