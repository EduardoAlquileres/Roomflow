alter table public.fianzas drop constraint if exists fianzas_estado_check;

alter table public.fianzas add constraint fianzas_estado_check
  check (estado in ('COBRADA', 'DEVUELTA', 'RETENIDA', 'PENDIENTE_REVISION'));

insert into public.fianzas (
  estancia_id, inquilino_id, habitacion_id, importe, fecha_cobro,
  estado, fecha_resolucion, importe_devuelto, importe_retenido,
  motivo_retencion, observaciones
)
select
  e.id, e.inquilino_id, e.habitacion_id, e.fianza, e.fecha_entrada,
  case when e.estado = 'ACTIVA' then 'COBRADA' else 'PENDIENTE_REVISION' end,
  null, 0, 0, null,
  case when e.estado = 'ACTIVA'
    then 'Fianza importada desde una estancia activa.'
    else 'Fianza historica importada: revisa si fue devuelta o retenida.'
  end
from public.estancias e
where coalesce(e.fianza, 0) > 0
  and not exists (select 1 from public.fianzas f where f.estancia_id = e.id);
