-- Ejecuta este archivo UNA sola vez en Supabase > SQL Editor.
-- Crea la tabla si aún no existe y permite guardar, editar y eliminar cláusulas desde RoomFlow.

create extension if not exists pgcrypto;

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
grant select, insert, update, delete on table public.clausulas_contrato to anon, authenticated;
