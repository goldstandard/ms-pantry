-- ============================================================================
-- MS Pantry — databázové schéma pro Supabase (Postgres)
-- Spusť celé v Supabase → SQL Editor. Je idempotentní (lze spustit opakovaně).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Tabulky
-- ----------------------------------------------------------------------------

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name_i18n jsonb not null default '{}'::jsonb,
  critical_days int not null default 14,
  soon_days int not null default 60,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name_i18n jsonb not null default '{}'::jsonb,
  slug text,
  is_default boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  name_i18n jsonb not null default '{}'::jsonb,
  original_lang text,
  brand text,
  barcode text,
  category_id uuid references public.categories (id) on delete set null,
  quantity int not null default 1,
  servings_per_unit numeric,
  unit text,
  expiration_date date,
  image_url text,
  note text,
  is_opened boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_location_idx on public.items (location_id);
create index if not exists items_user_idx on public.items (user_id);
create index if not exists items_category_idx on public.items (category_id);

-- Migrace pro existující instalace (idempotentní)
alter table public.items add column if not exists is_opened boolean not null default false;

create table if not exists public.product_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  barcode text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  brand text,
  default_category_id uuid references public.categories (id) on delete set null,
  default_servings numeric,
  default_unit text,
  times_seen int not null default 1,
  updated_at timestamptz not null default now(),
  unique (user_id, barcode)
);

-- ----------------------------------------------------------------------------
-- Row Level Security — každý vidí jen svoje řádky
-- ----------------------------------------------------------------------------

alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.product_profiles enable row level security;

drop policy if exists "own locations" on public.locations;
create policy "own locations" on public.locations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own categories" on public.categories;
create policy "own categories" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own items" on public.items;
create policy "own items" on public.items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own product_profiles" on public.product_profiles;
create policy "own product_profiles" on public.product_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Seed výchozích skladů a kategorií pro nového uživatele
-- ----------------------------------------------------------------------------

create or replace function public.seed_defaults_for_user(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.locations (user_id, name_i18n, critical_days, soon_days, is_default, sort_order)
  values
    (uid, '{"cs":"Chata","en":"Cottage","zh":"小屋"}'::jsonb, 14, 60, true, 0),
    (uid, '{"cs":"Domácnost","en":"Home","zh":"家"}'::jsonb, 3, 14, false, 1);

  insert into public.categories (user_id, name_i18n, slug, is_default, sort_order)
  values
    (uid, '{"cs":"Konzervy","en":"Canned goods","zh":"罐头"}'::jsonb, 'canned', true, 0),
    (uid, '{"cs":"Těstoviny a rýže","en":"Pasta & rice","zh":"意面与米饭"}'::jsonb, 'pasta_rice', true, 1),
    (uid, '{"cs":"Luštěniny","en":"Legumes","zh":"豆类"}'::jsonb, 'legumes', true, 2),
    (uid, '{"cs":"Nápoje","en":"Drinks","zh":"饮料"}'::jsonb, 'drinks', true, 3),
    (uid, '{"cs":"Koření a omáčky","en":"Spices & sauces","zh":"调料与酱汁"}'::jsonb, 'spices_sauces', true, 4),
    (uid, '{"cs":"Sladkosti","en":"Sweets","zh":"甜食"}'::jsonb, 'sweets', true, 5),
    (uid, '{"cs":"Trvanlivé pečivo","en":"Bakery (shelf-stable)","zh":"烘焙食品"}'::jsonb, 'bakery', true, 6),
    (uid, '{"cs":"Mléčné výrobky","en":"Dairy","zh":"乳制品"}'::jsonb, 'dairy', true, 7),
    (uid, '{"cs":"Mražené","en":"Frozen","zh":"冷冻食品"}'::jsonb, 'frozen', true, 8),
    (uid, '{"cs":"Oleje a tuky","en":"Oils & fats","zh":"油脂"}'::jsonb, 'oils_fats', true, 9),
    (uid, '{"cs":"Snídaně","en":"Breakfast","zh":"早餐"}'::jsonb, 'breakfast', true, 10),
    (uid, '{"cs":"Ostatní","en":"Other","zh":"其他"}'::jsonb, 'other', true, 11);
end;
$$;

-- Trigger: po registraci nového uživatele naseeduj defaulty
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_defaults_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Doplň defaulty i pro už existující uživatele (kteří se přihlásili dřív)
do $$
declare u record;
begin
  for u in select id from auth.users loop
    if not exists (select 1 from public.locations where user_id = u.id) then
      perform public.seed_defaults_for_user(u.id);
    end if;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Trigger: automaticky nastav updated_at při UPDATE (bez závislosti na klientovi)
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

create or replace trigger product_profiles_set_updated_at
  before update on public.product_profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RPC: upsert profilu produktu atomicky (1 roundtrip, bez race condition)
-- ----------------------------------------------------------------------------

create or replace function public.upsert_product_profile(
  p_barcode             text,
  p_name_i18n           jsonb,
  p_brand               text,
  p_default_category_id uuid,
  p_default_servings    numeric,
  p_default_unit        text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_profiles
    (user_id, barcode, name_i18n, brand, default_category_id, default_servings, default_unit, times_seen, updated_at)
  values
    (auth.uid(), p_barcode, p_name_i18n, p_brand, p_default_category_id, p_default_servings, p_default_unit, 1, now())
  on conflict (user_id, barcode) do update set
    name_i18n           = excluded.name_i18n,
    brand               = excluded.brand,
    default_category_id = excluded.default_category_id,
    default_servings    = excluded.default_servings,
    default_unit        = excluded.default_unit,
    times_seen          = product_profiles.times_seen + 1,
    updated_at          = now();
$$;
