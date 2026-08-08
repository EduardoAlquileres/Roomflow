-- Permite conservar cobros distintos cuando una habitación cambia de inquilino
-- dentro del mismo mes. Ejecutar una sola vez en el editor SQL de Supabase.

alter table public.cobros
  drop constraint if exists cobro_unico_mes;

alter table public.cobros
  add constraint cobro_unico_mes
  unique (habitacion_id, inquilino_id, periodo_anio, periodo_mes);
