const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');

function cargar(ruta, dependencias = {}) {
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', ruta), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(nombre => dependencias[nombre] ?? require(nombre), modulo, modulo.exports);
  return modulo.exports;
}
const economia = cargar('lib/estanciasCobros.ts');
const estancia = { id: 'e1', inquilino_id: 'i1', habitacion_id: 'h7', fecha_entrada: '2026-08-01', fecha_salida: null, precio: 550, gastos: 50, created_at: '2026-08-01' };

test('35 por persona sustituye a 50 en el mes actual y futuro, conservando el histórico', () => {
  const hoy = new Date(2026, 8, 7);
  for (const [mes, tarifa] of [[8, 50], [9, 35], [10, 35]]) {
    const condiciones = economia.estanciaConGastosHabitacion(estancia, { gastos: 35 }, 2026, mes, hoy);
    const importes = economia.importesCobroPeriodo(condiciones, 2, 2026, mes);
    assert.equal(importes.gastos, tarifa * 2);
    assert.equal(importes.total, 550 + tarifa * 2);
  }
  assert.equal(estancia.gastos, 50);
  assert.equal(economia.estanciaConGastosHabitacion(estancia, { gastos: 0 }, 2026, 9, hoy).gastos, 0);
});

function baseSimulada(datos, inserciones) {
  return { from(tabla) {
    const consulta = { then: resolver => Promise.resolve({ data: datos[tabla] ?? [], error: null }).then(resolver) };
    for (const metodo of ['select', 'eq', 'single', 'in', 'order', 'limit', 'lte']) consulta[metodo] = () => consulta;
    consulta.insert = filas => { inserciones?.push(...filas); return consulta; };
    return consulta;
  }};
}

test('el cobro automático de dos titulares usa la tarifa de la habitación y se crea una sola vez', async () => {
  const hoy = new Date();
  const anio = hoy.getFullYear(), mes = hoy.getMonth() + 1;
  const entrada = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const titulares = ['i1', 'i2'].map(id => ({ ...estancia, id, inquilino_id: id, fecha_entrada: entrada, created_at: entrada }));
  const nuevos = [];
  const supabase = baseSimulada({ estancias: titulares, habitaciones: [{ id: 'h7', precio: 550, gastos: 35 }], inquilinos: [], cobros: [] }, nuevos);
  const { generarCobrosPendientes } = cargar('lib/generarCobrosPendientes.ts', { '#roomflow-supabase': { supabase }, '@/lib/estanciasCobros': economia });
  await generarCobrosPendientes(entrada);
  assert.equal(nuevos.length, 1);
  assert.deepEqual([nuevos[0].alquiler, nuevos[0].gastos, nuevos[0].total, nuevos[0].pagado, nuevos[0].pendiente], [550, 70, 620, 0, 620]);
});

test('el PDF conserva los importes del cobro y no inventa el pago eliminado', async () => {
  let html;
  const supabase = baseSimulada({ estancias: [estancia], habitaciones: { id: 'h7', codigo: 'H7', vivienda_id: 'v', gastos: 99 }, viviendas: { id: 'v', nombre: 'Montuïri' }, inquilinos: [{ id: 'i1', nombre: 'Prueba', apellidos: 'Prueba', documento: '' }] });
  const Componente = cargar('components/ReciboCobroButton.tsx', { '#roomflow-supabase': { supabase }, '@/lib/estanciasCobros': economia, '@/lib/reciboPdf': { descargarReciboPdf: contenido => { html = contenido; } } }).default;
  const boton = Componente({ cobro: { inquilino_id: 'i1', habitacion_id: 'h7', periodo_anio: 2026, periodo_mes: 9, alquiler: 550, gastos: 70, pagado: 0 }, vivienda: { id: 'v', nombre: 'Montuïri' }, habitacion: { codigo: 'H7' }, inquilino: null });
  await boton.props.onClick();
  const euros = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  assert(html.includes(`<span>Gastos facturados</span><strong>${euros(70)}</strong>`));
  assert(html.includes(`<span>Importe recibido</span><strong>${euros(0)}</strong>`));
  assert(html.includes(`<span>Importe pendiente</span><strong>${euros(620)}</strong>`));
});
