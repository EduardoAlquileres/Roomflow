export interface CobroView {
  id: string;

  vivienda: string;

  habitacion: string;

  inquilino: string;

  anio: number;

  mes: number;

  alquiler: number;

  gastos: number;

  total: number;

  pagado: number;

  pendiente: number;

  estado: "PENDIENTE" | "PARCIAL" | "PAGADO" | "VENCIDO";
}