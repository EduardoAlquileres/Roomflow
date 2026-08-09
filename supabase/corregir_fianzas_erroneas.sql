-- Permite eliminar una fianza finalizada que se haya creado por error.
-- Solo admite fianzas RETENIDAS, DEVUELTAS o pendientes de revisión.
-- Ejecutar una sola vez en el editor SQL de Supabase.

create or replace function public.roomflow_eliminar_fianza_erronea(p_fianza_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  fianzas_eliminadas integer;
begin
  delete from public.fianza_cuotas where fianza_id = p_fianza_id;

  delete from public.fianzas
  where id = p_fianza_id
    and estado in ('RETENIDA', 'DEVUELTA', 'PENDIENTE_REVISION');

  get diagnostics fianzas_eliminadas = row_count;

  if fianzas_eliminadas = 0 then
    raise exception 'Solo se pueden eliminar fianzas ya finalizadas o marcadas para revisión.';
  end if;

  return true;
end;
$$;

grant execute on function public.roomflow_eliminar_fianza_erronea(uuid) to anon, authenticated;
