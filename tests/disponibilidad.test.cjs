const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const modulo = { exports: {} };
const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/disponibilidad.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module', 'exports', codigo)(modulo, modulo.exports);
const { habitacionesDisponibles, textoDisponibilidad } = modulo.exports;

test('las salidas previstas no convierten habitaciones ocupadas en libres y se ordenan por fecha', () => {
  const habitaciones = [
    { codigo: 'H3', estado: 'OCUPADA', disponible_desde: '2026-10-10' },
    { codigo: 'H4', estado: 'RESERVADA', disponible_desde: '2026-09-20' },
    { codigo: 'H2', estado: 'OCUPADA', disponible_desde: '2026-09-25' },
    { codigo: 'H1', estado: 'LIBRE', disponible_desde: null },
    { codigo: 'H5', estado: 'OCUPADA', disponible_desde: null },
  ];
  assert.deepEqual(habitacionesDisponibles(habitaciones).map(h => h.codigo), ['H1', 'H2', 'H3']);
  assert.equal(habitaciones[0].estado, 'OCUPADA');
  assert.equal(habitaciones[0].codigo, 'H3');
});

test('un aviso vencido sigue visible y requiere confirmar la salida', () => {
  const habitacion = { codigo: 'H1', estado: 'OCUPADA', disponible_desde: '2026-09-15' };
  assert.equal(habitacionesDisponibles([habitacion]).length, 1);
  assert.match(textoDisponibilidad(habitacion, '2026-09-16'), /pendiente de confirmar/);
  assert.match(textoDisponibilidad(habitacion, '2026-09-15'), /hoy/);
  assert.match(textoDisponibilidad(habitacion, '2026-09-14'), /15 de septiembre de 2026 \(previsto\)/);
  assert.equal(habitacionesDisponibles([{ ...habitacion, disponible_desde: null }]).length, 0);
});
