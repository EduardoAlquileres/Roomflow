create extension if not exists pgcrypto;

create table if not exists public.propietarios (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  documento text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.vivienda_propietarios (
  vivienda_id uuid not null references public.viviendas(id) on delete cascade,
  propietario_id uuid not null references public.propietarios(id) on delete restrict,
  porcentaje numeric not null check (porcentaje > 0 and porcentaje <= 100),
  created_at timestamptz not null default now(),
  primary key (vivienda_id, propietario_id)
);

insert into public.propietarios (nombre_completo, documento)
values
  ('Eduardo Pons Esquiva', '43059518E'),
  ('Eva Marina Campaner Moran', '43111836S')
on conflict (documento) do update set nombre_completo = excluded.nombre_completo;

alter table public.propietarios disable row level security;
alter table public.vivienda_propietarios disable row level security;
