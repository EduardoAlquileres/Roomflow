alter table public.fianzas add column if not exists importe_entregado numeric;
update public.fianzas set importe_entregado = importe where importe_entregado is null;
alter table public.fianzas alter column importe_entregado set default 0;
alter table public.fianzas alter column importe_entregado set not null;