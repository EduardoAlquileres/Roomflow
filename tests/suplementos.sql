-- Ejecutar tras la migración. Solo comprueba cálculos; no modifica registros.
do $$
begin
  assert public.roomflow_importe_suplemento(30,'MENSUAL','2026-06-15',null,true,'2026-01-01',null,'2026-06-01') = 16, 'Junio parcial';
  assert public.roomflow_importe_suplemento(29,'MENSUAL','2024-02-01',null,true,'2024-01-01','2024-02-14','2024-02-01') = 14, 'Febrero bisiesto';
  assert public.roomflow_importe_suplemento(30,'MENSUAL','2026-06-15','2026-09-15',false,'2026-01-01',null,'2026-09-01') = 30, 'Importe completo';
  assert public.roomflow_importe_suplemento(30,'MENSUAL','2026-06-15',null,true,'2026-01-01','2026-09-14','2026-10-01') = 0, 'Fin de estancia';
  assert public.roomflow_importe_suplemento(75,'PUNTUAL','2026-06-15','2026-09-15',false,'2026-01-01',null,'2026-07-01') = 0, 'Puntual no repetido';
  assert public.roomflow_importe_suplemento(75,'PUNTUAL','2026-06-15','2026-09-15',false,'2026-01-01',null,'2026-06-01') = 75, 'Puntual en su mes';
end $$;
