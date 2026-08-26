-- Permite conservar la deuda del inquilino anterior y crear el cobro
-- prorrateado del nuevo inquilino cuando ambos ocupan la misma habitación
-- durante meses parcialmente coincidentes.

begin;

alter table public.cobros
  drop constraint if exists cobro_unico_mes;

create unique index if not exists cobro_unico_inquilino_mes
  on public.cobros (habitacion_id, inquilino_id, periodo_anio, periodo_mes);

commit;
