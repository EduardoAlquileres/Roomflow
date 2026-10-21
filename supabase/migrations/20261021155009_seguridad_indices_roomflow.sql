-- Solo metadatos: no modifica filas, importes, contratos ni datos de la interfaz.
-- Las tablas existentes son pequeñas; limitar las esperas evita bloqueos prolongados.
set local lock_timeout = '3s';
set local statement_timeout = '60s';

-- Fijar la resolución de funciones sin alterar la fórmula ni sus permisos.
alter function public.roomflow_importe_suplemento(numeric,text,date,date,boolean,date,date,date)
  set search_path = pg_catalog;

create index if not exists idx_rf_cobros_inquilino on public.cobros(inquilino_id);
create index if not exists idx_rf_estancias_habitacion on public.estancias(habitacion_id);
create index if not exists idx_rf_fianzas_habitacion on public.fianzas(habitacion_id);
create index if not exists idx_rf_fianzas_inquilino on public.fianzas(inquilino_id);
create index if not exists idx_rf_inquilinos_empadronamiento_vivienda on public.inquilinos(empadronamiento_vivienda_id);
create index if not exists idx_rf_inquilinos_habitacion on public.inquilinos(habitacion_id);
create index if not exists idx_rf_mensajes_redes_habitacion on public.mensajes_redes(habitacion_id);
create index if not exists idx_rf_mensajes_redes_vivienda on public.mensajes_redes(vivienda_id);
create index if not exists idx_rf_vivienda_propietarios_propietario on public.vivienda_propietarios(propietario_id);
