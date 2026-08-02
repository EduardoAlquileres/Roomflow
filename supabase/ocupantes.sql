-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.inquilinos (
  id uuid primary key default gen_random_uuid(),
  habitacion_id uuid not null references public.habitaciones(id) on delete cascade,
  nombre text not null,
  apellidos text,
  documento text,
  telefono text,
  email text,
  fecha_nacimiento date,
  nacionalidad text,
  profesion text,
  empresa text,
  fecha_entrada date not null default current_date,
  fecha_salida date,
  activo boolean not null default true,
  observaciones text,
  created_at timestamptz not null default now()
);

alter table public.inquilinos add column if not exists documento text;
alter table public.inquilinos add column if not exists profesion text;
alter table public.inquilinos add column if not exists empresa text;
alter table public.inquilinos add column if not exists activo boolean not null default true;
create index if not exists idx_inquilinos_habitacion_activo on public.inquilinos (habitacion_id, activo);
alter table public.inquilinos disable row level security;
