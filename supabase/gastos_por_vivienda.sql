-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Los gastos pertenecen a viviendas. Los prorrateados se guardan como una parte
-- independiente para cada vivienda y, por tanto, no se imputan a habitaciones.
create extension if not exists pgcrypto;

create table if not exists public.gastos (
  id uuid primary key default gen_random_uuid(),
  vivienda_id uuid not null references public.viviendas(id) on delete cascade,
  habitacion_id uuid references public.habitaciones(id) on delete set null,
  fecha date not null default current_date,
  categoria text not null,
  concepto text not null,
  proveedor text,
  importe numeric not null check (importe > 0),
  metodo_pago text,
  es_recurrente boolean not null default false,
  periodicidad text,
  estado text not null default 'PENDIENTE',
  origen text not null default 'MANUAL',
  fecha_pago date,
  observaciones text,
  documento text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gastos add column if not exists grupo_prorrateo uuid;
alter table public.gastos add column if not exists es_prorrateado boolean not null default false;
alter table public.gastos disable row level security;
create index if not exists idx_gastos_vivienda_fecha on public.gastos (vivienda_id, fecha desc);
create index if not exists idx_gastos_prorrateo on public.gastos (grupo_prorrateo);
