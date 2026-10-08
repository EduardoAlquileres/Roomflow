-- Acuerdos sobre recibos existentes. Los pagos siguen en movimientos_cobro.
create table public.pagos_aplazados (
  id uuid primary key default gen_random_uuid(),
  cobro_id uuid not null unique references public.cobros(id) on delete cascade,
  importe_inicial numeric(12,2) not null check (importe_inicial > 0),
  pagado_inicial numeric(12,2) not null,
  fecha_acuerdo date not null,
  cuota_orientativa numeric(12,2) check (cuota_orientativa > 0),
  proxima_fecha date,
  notas text not null default '',
  created_at timestamptz not null default now()
);
alter table public.pagos_aplazados enable row level security;
revoke all on public.pagos_aplazados from public, anon, authenticated;
grant select, insert, update, delete on public.pagos_aplazados to service_role;

create function public.roomflow_crear_aplazamiento(
  p_cobro_id uuid, p_fecha date, p_cuota numeric default null,
  p_proxima_fecha date default null, p_notas text default ''
) returns public.pagos_aplazados
language plpgsql security invoker set search_path = '' as $$
declare c public.cobros; a public.pagos_aplazados;
begin
  select * into c from public.cobros where id=p_cobro_id for update;
  if not found then raise exception 'No se encuentra el recibo.'; end if;
  if c.pendiente <= 0 then raise exception 'El recibo no tiene saldo pendiente.'; end if;
  if p_fecha is null then raise exception 'Indica la fecha del acuerdo.'; end if;
  if p_cuota is not null and (p_cuota <= 0 or p_cuota::text in ('NaN','Infinity','-Infinity')) then
    raise exception 'La cuota orientativa debe ser positiva.';
  end if;
  if exists(select 1 from public.pagos_aplazados where cobro_id=p_cobro_id) then
    raise exception 'Este recibo ya tiene un acuerdo de pago aplazado.';
  end if;
  insert into public.pagos_aplazados(cobro_id,importe_inicial,pagado_inicial,fecha_acuerdo,cuota_orientativa,proxima_fecha,notas)
    values(c.id,c.pendiente,c.pagado,p_fecha,p_cuota,p_proxima_fecha,coalesce(p_notas,'')) returning * into a;
  return a;
end;
$$;

create function public.roomflow_pagar_aplazamiento(
  p_acuerdo_id uuid, p_movimiento_id uuid, p_fecha date, p_importe numeric,
  p_metodo text, p_observaciones text default '', p_proxima_fecha date default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare a public.pagos_aplazados; c public.cobros; m public.movimientos_cobro;
begin
  select * into a from public.pagos_aplazados where id=p_acuerdo_id;
  if not found then raise exception 'No se encuentra el acuerdo.'; end if;
  select * into c from public.cobros where id=a.cobro_id for update;
  -- Reintentar la misma petición no duplica un pago confirmado.
  select * into m from public.movimientos_cobro where id=p_movimiento_id;
  if found then
    if m.cobro_id=c.id and m.importe=p_importe and m.fecha=p_fecha and m.metodo=p_metodo then return m.id; end if;
    raise exception 'La referencia del pago ya está utilizada.';
  end if;
  if p_movimiento_id is null or p_fecha is null then raise exception 'Indica la fecha del pago.'; end if;
  if p_importe is null or p_importe <= 0 or p_importe <> round(p_importe,2) or p_importe::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Introduce un importe positivo con un máximo de dos decimales.';
  end if;
  if p_importe > c.pendiente then raise exception 'El pago supera el saldo pendiente actual.'; end if;
  if p_metodo is null or p_metodo not in ('Transferencia','Efectivo','Bizum','Tarjeta','Otro') then
    raise exception 'Indica un método de pago válido.';
  end if;
  insert into public.movimientos_cobro(id,cobro_id,fecha,importe,metodo,observaciones)
    values(p_movimiento_id,c.id,p_fecha,p_importe,p_metodo,coalesce(p_observaciones,''));
  update public.cobros set
    pagado=c.pagado+p_importe,
    pendiente=greatest(c.pendiente-p_importe,0),
    estado=case when c.pendiente-p_importe <= 0 then 'PAGADO' when c.estado='DEUDA' then 'DEUDA' else 'PARCIAL' end,
    fecha_primer_pago=least(coalesce(c.fecha_primer_pago,p_fecha),p_fecha),
    fecha_ultimo_pago=greatest(coalesce(c.fecha_ultimo_pago,p_fecha),p_fecha)
  where id=c.id;
  update public.pagos_aplazados set proxima_fecha=p_proxima_fecha where id=a.id;
  return p_movimiento_id;
end;
$$;
revoke execute on function public.roomflow_crear_aplazamiento(uuid,date,numeric,date,text) from public,anon,authenticated;
revoke execute on function public.roomflow_pagar_aplazamiento(uuid,uuid,date,numeric,text,text,date) from public,anon,authenticated;
grant execute on function public.roomflow_crear_aplazamiento(uuid,date,numeric,date,text) to service_role;
grant execute on function public.roomflow_pagar_aplazamiento(uuid,uuid,date,numeric,text,text,date) to service_role;
notify pgrst, 'reload schema';
