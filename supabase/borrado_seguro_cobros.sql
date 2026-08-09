-- Borrado seguro de un cobro desde RoomFlow.
-- Elimina primero los pagos vinculados y después el cobro.
-- Ejecutar una sola vez en el editor SQL de Supabase.

create or replace function public.roomflow_eliminar_cobro(p_cobro_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cobros_eliminados integer;
begin
  delete from public.movimientos_cobro
  where cobro_id = p_cobro_id;

  delete from public.cobros
  where id = p_cobro_id;

  get diagnostics cobros_eliminados = row_count;

  if cobros_eliminados = 0 then
    raise exception 'No se encontró el cobro o ya había sido eliminado.';
  end if;

  return true;
end;
$$;

grant execute on function public.roomflow_eliminar_cobro(uuid) to anon, authenticated;
