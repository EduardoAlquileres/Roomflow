export type Suplemento = {
  id: string; estancia_id: string; concepto: string; importe: number;
  modalidad: "PUNTUAL" | "MENSUAL"; fecha_inicio: string; fecha_fin: string | null; prorratear: boolean;
};
