-- Ejecuta este archivo UNA sola vez en Supabase > SQL Editor.
-- Permite guardar, editar y eliminar cláusulas desde RoomFlow.

alter table public.clausulas_contrato disable row level security;
grant select, insert, update, delete on table public.clausulas_contrato to anon, authenticated;
