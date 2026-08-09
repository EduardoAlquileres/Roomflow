-- Permite borrar cobros pendientes creados por error desde RoomFlow.
-- Ejecutar una sola vez en el editor SQL de Supabase.

alter table public.cobros enable row level security;

drop policy if exists "RoomFlow puede eliminar cobros" on public.cobros;

create policy "RoomFlow puede eliminar cobros"
on public.cobros
for delete
using (true);
