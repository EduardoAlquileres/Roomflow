-- Ejecuta este archivo UNA sola vez en Supabase.
-- Añade el estado DEUDA para conservar los importes no cobrados
-- tras la salida de una habitación.

do $$
declare
  nombre_restriccion text;
begin
  select conname
    into nombre_restriccion
  from pg_constraint
  where conrelid = 'public.cobros'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%estado%'
  limit 1;

  if nombre_restriccion is not null then
    execute format('alter table public.cobros drop constraint %I', nombre_restriccion);
  end if;

  alter table public.cobros
    add constraint cobros_estado_check
    check (estado in ('PENDIENTE', 'PARCIAL', 'PAGADO', 'DEUDA'));
end $$;

alter table public.cobros enable row level security;

