-- Aplicar SOLO después de publicar la versión con /api/datos y configurar
-- SUPABASE_SERVICE_ROLE_KEY en el servidor de RoomFlow.
-- Proyecto: ufpxewrtejuesfsmcgic. No elimina registros.
begin;

do $$
declare
  tabla text;
  politica record;
  tablas text[] := array['viviendas','habitaciones','inquilinos','estancias',
    'cobros','movimientos_cobro','fianzas','fianza_cuotas','gastos',
    'propietarios','vivienda_propietarios','inquilino_documentos',
    'clausulas_contrato','mensajes_redes','integracion_onedrive'];
begin
  foreach tabla in array tablas loop
    if to_regclass(format('public.%I', tabla)) is null then
      raise exception 'Falta la tabla esperada: %; revisar antes de continuar', tabla;
    end if;
    execute format('alter table public.%I enable row level security', tabla);
    for politica in select policyname from pg_policies where schemaname = 'public' and tablename = tabla loop
      execute format('drop policy %I on public.%I', politica.policyname, tabla);
    end loop;
    execute format('revoke all on table public.%I from public, anon, authenticated', tabla);
    execute format('grant select, insert, update, delete on table public.%I to service_role', tabla);
  end loop;
end $$;

revoke execute on function public.roomflow_eliminar_cobro(uuid) from public, anon, authenticated;
revoke execute on function public.roomflow_eliminar_fianza_erronea(uuid) from public, anon, authenticated;
grant execute on function public.roomflow_eliminar_cobro(uuid) to service_role;
grant execute on function public.roomflow_eliminar_fianza_erronea(uuid) to service_role;

drop policy if exists "Documentos de inquilinos accesibles" on storage.objects;
drop policy if exists "Documentos de gastos accesibles" on storage.objects;
-- Restrict these buckets even if another permissive policy exists.
drop policy if exists "RoomFlow documentos privados" on storage.objects;
create policy "RoomFlow documentos privados" on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id not in ('documentos-inquilinos', 'documentos-gastos'))
  with check (bucket_id not in ('documentos-inquilinos', 'documentos-gastos'));
update storage.buckets set public = false where id in ('documentos-inquilinos', 'documentos-gastos');

commit;

-- Verificación: todas las filas deben mostrar rls=true, anon_select=false.
select c.relname as tabla, c.relrowsecurity as rls,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_select
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
order by c.relname;
