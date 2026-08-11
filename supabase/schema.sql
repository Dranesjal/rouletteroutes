-- ============================================================
-- Roulette Routes Roamers — Supabase Schema
-- Plak dit in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Profiles (extends auth.users, auto-aangemaakt bij signup)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  name       text not null default '',
  role       text not null default 'roamer', -- 'roamer' | 'admin'
  created_at timestamptz default now()
);

-- Registrations (aanmeldingen voor wandelingen)
create table if not exists public.registrations (
  id             uuid default gen_random_uuid() primary key,
  wandeling      text not null,
  name           text not null,
  adres          text default '',
  postcode       text default '',
  woonplaats     text default '',
  land           text default 'Nederland',
  geboortedatum  text default '',
  geslacht       text default '',
  email          text not null,
  phone          text default '',
  dietary        text default '',
  message        text default '',
  wilt_boekje    boolean default false,
  registered_at  timestamptz default now()
);

-- Walk records (fase 2: persoonlijke kaart met pinnen)
create table if not exists public.walk_records (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users on delete cascade not null,
  type         text not null default 'personal', -- 'personal' | 'organized'
  walk_slug    text,           -- koppeling naar RRR-wandeling
  title        text not null,
  lat          double precision,
  lng          double precision,
  distance_km  double precision,
  date         date,
  is_circular  boolean default true,
  notes        text default '',
  verified     boolean default false, -- admin goedgekeurd
  created_at   timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.registrations enable row level security;
alter table public.walk_records  enable row level security;

-- Profiles: eigen profiel lezen en updaten
create policy "Eigen profiel lezen"   on public.profiles for select using (auth.uid() = id);
create policy "Eigen profiel updaten" on public.profiles for update using (auth.uid() = id);

-- Registrations: alleen via service role key (admin + API)
-- (geen public policies — alleen server-side met service key)

-- Walk records: eigen walks beheren, geverifieerde zien iedereen
create policy "Eigen walks lezen"    on public.walk_records for select using (auth.uid() = user_id);
create policy "Geverifieerde zien"   on public.walk_records for select using (verified = true);
create policy "Eigen walks toevoegen" on public.walk_records for insert with check (auth.uid() = user_id);
create policy "Eigen walks updaten"  on public.walk_records for update using (auth.uid() = user_id);
create policy "Eigen walks verwijderen" on public.walk_records for delete using (auth.uid() = user_id);

-- ============================================================
-- Trigger: maak profiel aan bij nieuwe gebruiker
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Maak jezelf admin (vervang het e-mailadres)
-- Voer dit uit NA je eerste aanmelding via de site
-- ============================================================
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'jouw@email.nl');
