-- Ejecuta todo este bloque en Supabase > SQL Editor.
alter table public.fianza_cuotas disable row level security;
grant select, insert, update, delete on table public.fianza_cuotas to anon, authenticated;
