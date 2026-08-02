-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Guarda el historial de cada habitación y permite adjuntar documentos privados.
create extension if not exists pgcrypto;

create table if not exists public.estancias (
  id uuid primary key default gen_random_uuid(),
  inquilino_id uuid not null references public.inquilinos(id) on delete cascade,
  habitacion_id uuid not null references public.habitaciones(id) on delete cascade,
  fecha_entrada date not null,
  fecha_salida date,
  precio numeric not null default 0,
  gastos numeric not null default 0,
  fianza numeric not null default 0,
  estado text not null check (estado in ('ACTIVA', 'FINALIZADA')),
  observaciones text,
  created_at timestamptz not null default now()
);

create index if not exists idx_estancias_inquilino_fecha on public.estancias (inquilino_id, fecha_entrada desc);

create table if not exists public.inquilino_documentos (
  id uuid primary key default gen_random_uuid(),
  inquilino_id uuid not null references public.inquilinos(id) on delete cascade,
  nombre text not null,
  ruta_archivo text not null unique,
  tipo_archivo text,
  tamano bigint,
  created_at timestamptz not null default now()
);

create index if not exists idx_inquilino_documentos_inquilino on public.inquilino_documentos (inquilino_id, created_at desc);
alter table public.estancias disable row level security;
alter table public.inquilino_documentos disable row level security;

insert into storage.buckets (id, name, public)
values ('documentos-inquilinos', 'documentos-inquilinos', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Documentos de inquilinos accesibles') then
    create policy "Documentos de inquilinos accesibles" on storage.objects for all to anon
    using (bucket_id = 'documentos-inquilinos')
    with check (bucket_id = 'documentos-inquilinos');
  end if;
end $$;
