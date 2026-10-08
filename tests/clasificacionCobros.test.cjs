const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const modulo = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('lib/clasificacionCobros.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(modulo, modulo.exports);
const { coincideEstadoCobro, calcularResumenCobros, cobrosSinAplazamiento } = modulo.exports;
const anterior = { id: 'octubre', inquilino_id: 'i1', habitacion_id: 'h1', total: 620, pagado: 0, pendiente: 620, estado: 'PENDIENTE' };
const siguiente = { ...anterior, id: 'noviembre' };
const aplazados = new Set(['octubre']);
test('el aplazamiento excluye únicamente su recibo de los filtros de cobros pendientes', () => {
  assert.deepEqual(cobrosSinAplazamiento([anterior, siguiente], aplazados).map(cobro => cobro.id), ['noviembre']);
  for (const estado of ['PENDIENTE', 'PARCIAL', 'DEUDA']) {
    const cobro = { ...anterior, estado };
    assert.equal(coincideEstadoCobro(cobro, 'ABIERTOS', aplazados), false);
    assert.equal(coincideEstadoCobro(cobro, estado, aplazados), false);
    assert.equal(coincideEstadoCobro(cobro, '', aplazados), true);
  }
  assert.equal(coincideEstadoCobro(siguiente, 'ABIERTOS', aplazados), true);
  assert.equal(coincideEstadoCobro(siguiente, 'PENDIENTE', aplazados), true);
});
test('el saldo aplazado se muestra separado sin contar dinero no recibido como cobrado', () => {
  const resumen = calcularResumenCobros([anterior, siguiente], aplazados);
  assert.equal(resumen.previstas, 1240);
  assert.equal(resumen.cobradas, 0);
  assert.equal(resumen.pendientes, 620);
  assert.equal(resumen.aplazadas, 620);
  assert.equal(resumen.habitacionesPendientes, 1);
  assert.equal(calcularResumenCobros([anterior], aplazados).habitacionesPendientes, 0);
});
test('las entregas variables descuentan el aplazamiento y no alteran el recibo siguiente', () => {
  const resumen = calcularResumenCobros([{ ...anterior, pagado: 150, pendiente: 470, estado: 'PARCIAL' }, siguiente], aplazados);
  assert.equal(resumen.cobradas, 150);
  assert.equal(resumen.aplazadas, 470);
  assert.equal(resumen.pendientes, 620);
  assert.equal(resumen.previstas, resumen.cobradas + resumen.pendientes + resumen.aplazadas);
});
test('un acuerdo liquidado aparece como pagado y no conserva saldo aplazado', () => {
  const liquidado = { ...anterior, pagado: 620, pendiente: 0, estado: 'PAGADO' };
  assert.equal(coincideEstadoCobro(liquidado, 'PAGADO', aplazados), true);
  assert.equal(calcularResumenCobros([liquidado], aplazados).aplazadas, 0);
});
