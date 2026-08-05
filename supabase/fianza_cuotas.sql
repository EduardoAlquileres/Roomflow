-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Crea el calendario de entregas parciales de cada fianza.
create extension if not exists pgcrypto;

create table if not exists public.fianza_cuotas (
  id uuid primary key default gen_random_uuid(),
  fianza_id uuid not null references public.fianzas(id) on delete cascade,
  numero integer not null check (numero > 0),
  fecha_prevista date not null,
  importe numeric not null check (importe >= 0),
  importe_pagado numeric not null default 0 check (importe_pagado >= 0),
  fecha_pago date,
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE', 'PAGADA')),
  observaciones text,
  created_at timestamptz not null default now(),
  unique (fianza_id, numero)
);

create index if not exists idx_fianza_cuotas_fianza on public.fianza_cuotas (fianza_id, fecha_prevista);
alter table public.fianza_cuotas disable row level security;
