with reservas as (
  select
    c.inquilino_id,
    c.habitacion_id,
    e.id as estancia_id,
    max(mc.fecha) as fecha,
    sum(mc.importe) as importe_reserva,
    h.precio * h.fianza_meses as fianza_total
  from public.movimientos_cobro mc
  join public.cobros c on c.id = mc.cobro_id
  join public.habitaciones h on h.id = c.habitacion_id
  join lateral (
    select id
    from public.estancias
    where inquilino_id = c.inquilino_id
      and habitacion_id = c.habitacion_id
      and estado = 'ACTIVA'
    order by created_at desc
    limit 1
  ) e on true
  where mc.observaciones = 'Importe de reserva'
  group by c.inquilino_id, c.habitacion_id, e.id, h.precio, h.fianza_meses
)
insert into public.fianzas (
  estancia_id,
  inquilino_id,
  habitacion_id,
  importe,
  importe_entregado,
  fecha_cobro,
  estado,
  observaciones
)
select
  estancia_id,
  inquilino_id,
  habitacion_id,
  greatest(importe_reserva, fianza_total),
  importe_reserva,
  fecha,
  'COBRADA',
  'Reserva entregada a cuenta de fianza'
from reservas
on conflict (estancia_id) do update
set
  importe = greatest(public.fianzas.importe, excluded.importe),
  importe_entregado = greatest(public.fianzas.importe_entregado, excluded.importe_entregado),
  observaciones = excluded.observaciones;

with cobros_reserva as (
  select distinct cobro_id
  from public.movimientos_cobro
  where observaciones = 'Importe de reserva'
), ocupacion as (
  select
    h.id as habitacion_id,
    h.precio,
    h.gastos,
    count(e.id) as titulares
  from public.habitaciones h
  join public.estancias e on e.habitacion_id = h.id and e.estado = 'ACTIVA'
  group by h.id, h.precio, h.gastos
)
update public.cobros c
set
  alquiler = o.precio,
  gastos = o.gastos * o.titulares,
  total = o.precio + (o.gastos * o.titulares)
from cobros_reserva r, ocupacion o
where c.id = r.cobro_id
  and o.habitacion_id = c.habitacion_id;

delete from public.movimientos_cobro
where observaciones = 'Importe de reserva';

with totales as (
  select
    c.id,
    c.total,
    coalesce(sum(mc.importe), 0) as pagado
  from public.cobros c
  left join public.movimientos_cobro mc on mc.cobro_id = c.id
  group by c.id, c.total
)
update public.cobros c
set
  pagado = t.pagado,
  pendiente = greatest(t.total - t.pagado, 0),
  estado = case
    when t.pagado >= t.total then 'PAGADO'
    when t.pagado > 0 then 'PARCIAL'
    else 'PENDIENTE'
  end
from totales t
where t.id = c.id;
