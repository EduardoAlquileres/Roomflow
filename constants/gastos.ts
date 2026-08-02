export const CATEGORIAS_GASTO = [
  "Agua",
  "Luz",
  "Gas",
  "Internet",
  "Comunidad",
  "IBI",
  "Seguro",
  "Limpieza",
  "Reparación",
  "Mantenimiento",
  "Electrodomésticos",
  "Mobiliario",
  "Material",
  "Impuestos",
  "Otros",
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

export const METODOS_PAGO = [
  "Efectivo",
  "Transferencia",
  "Bizum",
  "Tarjeta",
  "Domiciliación",
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number];