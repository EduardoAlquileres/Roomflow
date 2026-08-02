-- Ejecuta este archivo una sola vez en Supabase > SQL Editor.
-- Permite guardar fotos y PDF de facturas o recibos vinculados a gastos.

insert into storage.buckets (id, name, public)
values ('documentos-gastos', 'documentos-gastos', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Documentos de gastos accesibles'
  ) then
    create policy "Documentos de gastos accesibles"
      on storage.objects for all to anon
      using (bucket_id = 'documentos-gastos')
      with check (bucket_id = 'documentos-gastos');
  end if;
end $$;
