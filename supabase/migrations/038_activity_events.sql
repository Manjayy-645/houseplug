create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('new_listing', 'whatsapp_click', 'new_review', 'verified_landlord')),
  listing_id uuid references public.listings(id) on delete set null,
  area text,
  university text,
  created_at timestamptz not null default now()
);

create index idx_activity_events_created_at on public.activity_events (created_at desc);

alter table public.activity_events enable row level security;

create policy "Public can read activity events"
  on public.activity_events for select
  using (true);

create policy "Anyone can log whatsapp click events"
  on public.activity_events for insert
  with check (event_type = 'whatsapp_click');
