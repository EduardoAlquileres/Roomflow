begin;

create table if not exists public.suplementos_estancia (
  id uuid primary key default gen_random_uuid(),
  estancia_id uuid not null references public.estancias(id) on delete cascade,
  concepto text not null check (length(trim(concepto)) between 1 and 200),
  importe numeric(12,2) not null check (importe > 0 and importe < 1000000),
  modalidad text not null check (modalidad in ('PUNTUAL','MENSUAL')),
  fecha_inicio date not null,
  fecha_fin date,
  prorratear boolean not null default false,
  created_at timestamptz not null default now(),
  check (fecha_fin is null or fecha_fin >= fecha_inicio),
  check (modalidad <> 'PUNTUAL' or not prorratear)
);
alter table public.suplementos_estancia enable row level security;
revoke all on public.suplementos_estancia from anon, authenticated;
grant all on public.suplementos_estancia to service_role;
create index if not exists suplementos_estancia_estancia_idx on public.suplementos_estancia(estancia_id);
alter table public.cobros add column if not exists suplementos numeric(12,2) not null default 0;
alter table public.cobros add column if not exists detalle_suplementos jsonb not null default '[]';

-- Fechas inclusivas. El puntual se cobra una sola vez, en su mes de inicio.
create or replace function public.roomflow_importe_suplemento(importe numeric, modalidad text, inicio date, fin date, prorratear boolean, entrada date, salida date, periodo date)
returns numeric language sql immutable as $$
  select case
    when least(coalesce(fin,'9999-12-31'::date),coalesce(salida,'9999-12-31'::date),(periodo + interval '1 month - 1 day')::date) < greatest(inicio,entrada,periodo) then 0
    when modalidad = 'PUNTUAL' then case when inicio >= entrada and (salida is null or inicio <= salida) and date_trunc('month',inicio)::date = periodo then importe else 0 end
    when not prorratear then importe
    else round(importe * (least(coalesce(fin,'9999-12-31'::date),coalesce(salida,'9999-12-31'::date),(periodo + interval '1 month - 1 day')::date) - greatest(inicio,entrada,periodo) + 1) / extract(day from periodo + interval '1 month - 1 day'),2)
  end;
$$;

create or replace function public.roomflow_cobro_suplementos()
returns trigger language plpgsql set search_path = public as $$
declare
  detalle jsonb; suma numeric; periodo date; anterior numeric := 0;
begin
  if tg_op = 'UPDATE' then anterior := old.suplementos; end if;
  periodo := make_date(new.periodo_anio,new.periodo_mes,1);
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'concepto',x.concepto,'importe',x.valor) order by x.id),'[]'), coalesce(sum(x.valor),0)
  into detalle,suma
  from (
    select s.id,s.concepto,public.roomflow_importe_suplemento(s.importe,s.modalidad,s.fecha_inicio,s.fecha_fin,s.prorratear,e.fecha_entrada,e.fecha_salida,periodo) valor
    from public.suplementos_estancia s join public.estancias e on e.id=s.estancia_id
    where e.habitacion_id=new.habitacion_id
      and exists (select 1 from public.estancias t where t.inquilino_id=new.inquilino_id and t.habitacion_id=e.habitacion_id and t.fecha_entrada=e.fecha_entrada
        and t.fecha_entrada <= (periodo + interval '1 month - 1 day')::date and (t.fecha_salida is null or t.fecha_salida >= periodo))
  ) x where x.valor > 0;
  new.suplementos := suma;
  new.detalle_suplementos := detalle;
  if suma > 0 or anterior > 0 then
    new.total := round(new.alquiler + new.gastos + suma,2);
    new.pendiente := greatest(round(new.total-new.pagado,2),0);
    if new.pendiente=0 then new.estado := 'PAGADO';
    elsif new.estado='DEUDA' then null;
    elsif new.pagado > 0 then new.estado := 'PARCIAL';
    else new.estado := 'PENDIENTE'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists zz_roomflow_cobro_suplementos on public.cobros;
create trigger zz_roomflow_cobro_suplementos before insert or update on public.cobros for each row execute function public.roomflow_cobro_suplementos();

create or replace function public.roomflow_validar_suplemento()
returns trigger language plpgsql set search_path = public as $$
declare e public.estancias;
begin
  select * into strict e from public.estancias where id=new.estancia_id for update;
  if new.fecha_inicio < e.fecha_entrada or (e.fecha_salida is not null and new.fecha_inicio > e.fecha_salida) then
    raise exception 'El inicio del suplemento debe estar dentro de la estancia.';
  end if;
  if tg_op='UPDATE' and new.estancia_id<>old.estancia_id then raise exception 'No se puede trasladar un suplemento a otra estancia.'; end if;
  return new;
end;
$$;
drop trigger if exists roomflow_validar_suplemento on public.suplementos_estancia;
create trigger roomflow_validar_suplemento before insert or update on public.suplementos_estancia for each row execute function public.roomflow_validar_suplemento();

create or replace function public.roomflow_refrescar_suplementos()
returns trigger language plpgsql set search_path = public as $$
declare estancia uuid; vivienda_habitacion uuid;
begin
  if tg_table_name='estancias' then
    estancia := new.id;
    vivienda_habitacion := new.habitacion_id;
    if not exists(select 1 from public.suplementos_estancia where estancia_id=estancia) then return new; end if;
  else
    if tg_op='DELETE' then estancia := old.estancia_id; else estancia := new.estancia_id; end if;
    select habitacion_id into vivienda_habitacion from public.estancias where id=estancia;
  end if;
  update public.cobros set suplementos=suplementos where habitacion_id=vivienda_habitacion;
  return null;
end;
$$;
drop trigger if exists roomflow_refrescar_suplementos on public.suplementos_estancia;
create trigger roomflow_refrescar_suplementos after insert or update or delete on public.suplementos_estancia for each row execute function public.roomflow_refrescar_suplementos();
drop trigger if exists roomflow_salida_suplementos on public.estancias;
create trigger roomflow_salida_suplementos after update of fecha_salida,fecha_entrada on public.estancias for each row execute function public.roomflow_refrescar_suplementos();

notify pgrst, 'reload schema';
commit;
