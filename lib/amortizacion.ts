export type FilaAmortizacion = { numero: number; fecha: string; saldoInicial: number; cuota: number; saldoFinal: number };

export function pagosAmortizados(pendiente: number, pagos: { id: string; fecha: string; importe: number }[]) {
  let saldo = Math.round(pendiente * 100) + pagos.reduce((suma, pago) => suma + Math.round(Number(pago.importe) * 100), 0);
  return pagos.map(pago => {
    const inicial = saldo;
    saldo -= Math.round(Number(pago.importe) * 100);
    return { id: pago.id, fecha: pago.fecha, saldoInicial: inicial / 100, cuota: Number(pago.importe), saldoFinal: saldo / 100 };
  });
}

// Conserva el día pactado y limita al último día de los meses más cortos.
export function fechaMensual(fecha: string, meses: number) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const destino = new Date(Date.UTC(anio, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimoDia));
  return destino.toISOString().slice(0, 10);
}

export function cuadroAmortizacion(pendiente: number, cuota: number | null, primeraFecha: string) {
  const filas: FilaAmortizacion[] = [];
  let saldo = Math.max(Math.round(pendiente * 100), 0);
  const cuotaCentimos = cuota === null ? 0 : Math.round(cuota * 100);
  if (!Number.isFinite(saldo) || !Number.isFinite(cuotaCentimos) || cuotaCentimos <= 0) return { filas, pendienteSinPlan: saldo / 100 };
  for (let mes = 0; saldo > 0 && mes < 600; mes++) {
    const pago = Math.min(cuotaCentimos, saldo);
    filas.push({ numero: mes + 1, fecha: fechaMensual(primeraFecha, mes), saldoInicial: saldo / 100, cuota: pago / 100, saldoFinal: (saldo - pago) / 100 });
    saldo -= pago;
  }
  return { filas, pendienteSinPlan: saldo / 100 };
}
