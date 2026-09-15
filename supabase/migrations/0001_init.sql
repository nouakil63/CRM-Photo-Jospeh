-- Schéma initial du CRM Photo (Académie de Lavo).
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run.

create extension if not exists "pgcrypto";

-- Les académiciens (élèves). La table servira aussi plus tard au site de
-- l'académie (espace photos personnel) : l'email fera le lien avec le compte.
create table public.students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text unique,
  phone text,
  class_name text,
  expected_amount integer not null default 0, -- montant dû, en centimes
  notes text,
  created_at timestamptz not null default now()
);

-- Les paiements : Stripe (via webhook) ou manuels (espèces, chèque, virement).
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students (id) on delete set null,
  stripe_id text unique, -- payment_intent Stripe ; null pour un paiement manuel
  amount integer not null, -- en centimes
  currency text not null default 'eur',
  method text not null default 'stripe'
    check (method in ('stripe', 'especes', 'cheque', 'virement', 'autre')),
  status text not null default 'paid', -- paid | refunded
  payer_email text,
  description text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index payments_student_id_idx on public.payments (student_id);

-- RLS : seul un utilisateur connecté (Joseph) peut lire/écrire.
-- Le webhook Stripe utilise la clé service_role qui contourne RLS.
alter table public.students enable row level security;
alter table public.payments enable row level security;

create policy "acces complet authentifie" on public.students
  for all to authenticated using (true) with check (true);

create policy "acces complet authentifie" on public.payments
  for all to authenticated using (true) with check (true);
