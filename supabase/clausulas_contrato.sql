-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Cláusulas adicionales para contratos de alquiler y documentos de reserva.

create table if not exists public.clausulas_contrato (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text not null,
  tipo_documento text not null default 'CONTRATO' check (tipo_documento in ('CONTRATO', 'RESERVA', 'AMBOS')),
  activa boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.clausulas_contrato disable row level security;
