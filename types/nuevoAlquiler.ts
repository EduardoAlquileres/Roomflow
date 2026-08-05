export type TipoInicio = "RESERVA" | "DIRECTO";

export interface InquilinoNuevo {
  nombre: string;
  apellidos: string;
  tipoDocumento: "DNI" | "NIE" | "PASAPORTE";
  dni: string;
  telefono: string;
  email: string;
}

export interface NuevoAlquiler {
  tipoInicio: TipoInicio | null;
  viviendaId: string;
  habitacionId: string;
  esPareja: boolean;
  inquilino1: InquilinoNuevo;
  inquilino2: InquilinoNuevo | null;
  fechaReserva: string;
  fechaEntrada: string;
  alquiler: number;
  gastos: number;
  fianza: number;
  importeFianzaInicial: number;
  numeroCuotasFianza: number;
  importeReserva: number;
  metodoPago: string;
  observaciones: string;
}

export const nuevoAlquilerInicial: NuevoAlquiler = {
  tipoInicio: null,
  viviendaId: "",
  habitacionId: "",
  esPareja: false,
  inquilino1: { nombre: "", apellidos: "", tipoDocumento: "DNI", dni: "", telefono: "", email: "" },
  inquilino2: null,
  fechaReserva: "",
  fechaEntrada: "",
  alquiler: 0,
  gastos: 0,
  fianza: 0,
  importeFianzaInicial: 0,
  numeroCuotasFianza: 2,
  importeReserva: 0,
  metodoPago: "",
  observaciones: "",
};
