-- Permite a RoomFlow crear, modificar y borrar cobros.
-- Ejecutar una sola vez en el editor SQL de Supabase.

alter table public.cobros enable row level security;

drop policy if exists "RoomFlow puede crear cobros" on public.cobros;
drop policy if exists "RoomFlow puede modificar cobros" on public.cobros;
drop policy if exists "RoomFlow puede eliminar cobros" on public.cobros;

create policy "RoomFlow puede crear cobros"
on public.cobros
for insert
with check (true);

create policy "RoomFlow puede modificar cobros"
on public.cobros
for update
using (true)
with check (true);

create policy "RoomFlow puede eliminar cobros"
on public.cobros
for delete
using (true);
