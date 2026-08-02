-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Solo guarda las credenciales de conexión cifradas; las fotos y PDF se guardan en OneDrive.

create table if not exists public.integracion_onedrive (
  id text primary key default 'principal' check (id = 'principal'),
  access_token_cifrado text not null,
  refresh_token_cifrado text not null,
  expira_en timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.integracion_onedrive disable row level security;
