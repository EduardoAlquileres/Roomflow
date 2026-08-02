-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Las fianzas se registran aparte de los cobros de alquiler para no inflar los ingresos reales.
create extension if not exists pgcrypto;

create table if not exists public.fianzas (
  id uuid primary key default gen_random_uuid(),
  estancia_id uuid not null references public.estancias(id) on delete cascade,
  inquilino_id uuid not null references public.inquilinos(id) on delete cascade,
  habitacion_id uuid not null references public.habitaciones(id) on delete cascade,
  importe numeric not null check (importe > 0),
  fecha_cobro date not null,
  estado text not null default 'COBRADA' check (estado in ('COBRADA', 'DEVUELTA', 'RETENIDA', 'PENDIENTE_REVISION')),
  fecha_resolucion date,
  importe_devuelto numeric not null default 0 check (importe_devuelto >= 0),
  importe_retenido numeric not null default 0 check (importe_retenido >= 0),
  motivo_retencion text,
  observaciones text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_fianzas_estancia on public.fianzas (estancia_id);
create index if not exists idx_fianzas_estado on public.fianzas (estado);
alter table public.fianzas disable row level security;
