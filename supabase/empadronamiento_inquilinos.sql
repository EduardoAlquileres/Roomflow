-- Sin valor por defecto: desconocer el estado no equivale a no estar empadronado.
ALTER TABLE public.inquilinos
  ADD COLUMN IF NOT EXISTS empadronado boolean,
  ADD COLUMN IF NOT EXISTS empadronamiento_vivienda_id uuid REFERENCES public.viviendas(id) ON DELETE SET NULL;
NOTIFY pgrst, 'reload schema';
