const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
function cargar(ruta, dependencias = {}) {
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', ruta), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(nombre => dependencias[nombre] ?? require(nombre), modulo, modulo.exports);
  return modulo.exports;
}
const { cuadroAmortizacion, fechaMensual, pagosAmortizados } = cargar('lib/amortizacion.ts');
const llamadas = [];
const pagos = cargar('lib/pagosAplazados.ts', { '#roomflow-supabase': { supabase: { rpc: async (nombre, parametros) => { llamadas.push({ nombre, parametros }); return { error: null }; } } } });

test('620 euros a 50 al mes termina con una última cuota de 20, sin intereses', () => {
  const cuadro = cuadroAmortizacion(620, 50, '2026-11-05');
  assert.equal(cuadro.filas.length, 13);
  assert.equal(cuadro.filas.at(-1).cuota, 20);
  assert.equal(cuadro.filas.at(-1).saldoFinal, 0);
  assert.equal(cuadro.filas.reduce((suma, fila) => suma + fila.cuota, 0), 620);
});
test('entregas variables reducen el saldo del recibo y recalculan la previsión', () => {
  const acuerdo = { importe_inicial: 620, pagado_inicial: 0 };
  const resumen = pagos.resumenAplazamiento(acuerdo, { pagado: 150, pendiente: 470 });
  assert.deepEqual(resumen, { devuelto: 150, pendiente: 470, liquidado: false });
  const cuadro = cuadroAmortizacion(resumen.pendiente, 50, '2027-01-05');
  assert.equal(cuadro.filas.length, 10);
  assert.equal(cuadro.filas.at(-1).cuota, 20);
});
test('pagos previos al acuerdo no cuentan como devolución y el último pago liquida', () => {
  const acuerdo = { importe_inicial: 500, pagado_inicial: 120 };
  assert.equal(pagos.resumenAplazamiento(acuerdo, { pagado: 170, pendiente: 450 }).devuelto, 50);
  assert.equal(pagos.resumenAplazamiento(acuerdo, { pagado: 620, pendiente: 0 }).liquidado, true);
  assert.deepEqual(cuadroAmortizacion(0, 50, '2026-11-05').filas, []);
});
test('las fechas de fin de mes no se desplazan y conservan el año bisiesto', () => {
  assert.equal(fechaMensual('2026-01-31', 1), '2026-02-28');
  assert.equal(fechaMensual('2026-01-31', 2), '2026-03-31');
  assert.equal(fechaMensual('2028-01-31', 1), '2028-02-29');
  assert.equal(fechaMensual('2026-12-05', 1), '2027-01-05');
});
test('la previsión no inventa cuotas si no se ha pactado un importe', () => {
  assert.deepEqual(cuadroAmortizacion(620, null, '2026-11-05'), { filas: [], pendienteSinPlan: 620 });
  assert.equal(cuadroAmortizacion(620, 0.01, '2026-11-05').filas.length, 600);
});
test('la aritmética en céntimos evita una cuota extra por redondeo', () => {
  const cuadro = cuadroAmortizacion(0.3, 0.1, '2026-11-05');
  assert.equal(cuadro.filas.length, 3);
  assert.equal(cuadro.filas.at(-1).saldoFinal, 0);
});
test('el cuadro de entregas reales conserva el saldo tras pagos distintos y correcciones', () => {
  const filas = pagosAmortizados(470, [{ id: '1', fecha: '2026-11-05', importe: 50 }, { id: '2', fecha: '2026-12-05', importe: 100 }]);
  assert.deepEqual(filas.map(fila => [fila.saldoInicial, fila.cuota, fila.saldoFinal]), [[620, 50, 570], [570, 100, 470]]);
});
test('se rechazan pagos vacíos, negativos, decimales inválidos y sobrepagos', () => {
  for (const importe of [0, -50, NaN, Infinity, 50.001, 621]) assert.throws(() => pagos.validarEntrega(importe, 620));
  assert.doesNotThrow(() => pagos.validarEntrega(50, 620));
  assert.doesNotThrow(() => pagos.validarEntrega(620, 620));
});
test('cada entrega lleva una referencia estable para impedir duplicados al reintentar', async () => {
  const datos = { acuerdoId: 'a', movimientoId: 'm', fecha: '2026-10-08', importe: 50, metodo: 'Transferencia', observaciones: 'Primera entrega', proximaFecha: '2026-11-08' };
  await pagos.registrarEntrega(datos, 620);
  await pagos.registrarEntrega(datos, 620);
  assert.equal(llamadas.at(-1).nombre, 'roomflow_pagar_aplazamiento');
  assert.equal(llamadas.at(-1).parametros.p_movimiento_id, llamadas.at(-2).parametros.p_movimiento_id);
  assert.equal(llamadas.at(-1).parametros.p_importe, 50);
});
