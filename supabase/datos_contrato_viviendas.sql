alter table public.viviendas add column if not exists municipio text;
alter table public.viviendas add column if not exists referencia_catastral text;
alter table public.viviendas add column if not exists entidad_bancaria text;
alter table public.viviendas add column if not exists iban_cobro text;
alter table public.viviendas add column if not exists suministros_contrato text;
