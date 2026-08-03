create table if not exists public.mensajes_redes (
  id uuid primary key default gen_random_uuid(),
  canal text not null default 'FACEBOOK' check (canal in ('FACEBOOK', 'INSTAGRAM', 'WHATSAPP', 'TIKTOK', 'OTRO')),
  tipo text not null default 'ANUNCIO' check (tipo in ('ANUNCIO', 'RESPUESTA', 'SEGUIMIENTO')),
  estado text not null default 'BORRADOR' check (estado in ('BORRADOR', 'LISTO', 'PUBLICADO', 'ARCHIVADO')),
  asunto text not null,
  contenido text not null,
  vivienda_id uuid references public.viviendas(id) on delete set null,
  habitacion_id uuid references public.habitaciones(id) on delete set null,
  fecha_programada timestamptz,
  publicado_en timestamptz,
  enlace_publicacion text,
  created_at timestamptz not null default now()
);

create index if not exists mensajes_redes_estado_idx on public.mensajes_redes (estado, created_at desc);
alter table public.mensajes_redes disable row level security;
