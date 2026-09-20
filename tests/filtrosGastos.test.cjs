const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const modulo = { exports: {} };
const codigo = ts.transpileModule(fs.readFileSync('lib/filtrosGastos.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('module', 'exports', codigo)(modulo, modulo.exports);
const { filtrarGastos, filtrosGastosIniciales } = modulo.exports;
const gastos = [
  { id: '1', vivienda_id: 'inca', categoria: 'Luz', fecha: '2026-09-01', concepto: 'Factura', importe: 25 },
  { id: '2', vivienda_id: 'inca', categoria: 'Internet', fecha: '2026-08-31', concepto: 'Internet (prorrateado)', importe: 10 },
  { id: '3', vivienda_id: 'lloseta', categoria: 'Luz', fecha: '2025-09-30', concepto: 'Factura', es_prorrateado: true, importe: 15 },
  { id: '4', vivienda_id: 'lloseta', categoria: 'Agua', fecha: '2026-10-01', concepto: 'Agua', importe: 30 },
];
const ids = (filtros = {}) => filtrarGastos(gastos, { ...filtrosGastosIniciales, ...filtros }).map((g) => g.id);

test('sin filtros muestra todos los gastos y no modifica los originales', () => {
  assert.deepEqual(ids(), ['1', '2', '3', '4']);
  assert.equal(gastos.length, 4);
});
test('combina vivienda, categoría, mes y año usando la fecha del gasto', () => {
  assert.deepEqual(ids({ viviendaId: 'inca', categoria: 'Luz', mes: '09', anio: '2026' }), ['1']);
  assert.deepEqual(ids({ mes: '09' }), ['1', '3']);
  assert.deepEqual(ids({ anio: '2026' }), ['1', '2', '4']);
  assert.deepEqual(ids({ viviendaId: 'inca', mes: '10' }), []);
});
test('reconoce reparto tanto en registros nuevos como antiguos', () => {
  assert.deepEqual(ids({ tipo: 'prorrateado' }), ['2', '3']);
  assert.deepEqual(ids({ tipo: 'propio' }), ['1', '4']);
  assert.deepEqual(ids({ tipo: 'prorrateado', viviendaId: 'lloseta', anio: '2025' }), ['3']);
});
