const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
function cargar(supabase = {}) {
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync('lib/reciboGastoExtra.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', codigo)(nombre => nombre === '#roomflow-supabase' ? { supabase } : require(nombre), modulo, modulo.exports);
  return modulo.exports;
}
const gasto = { id: 'extra1', estancia_id: 'e1', concepto: 'Reparación de persiana', importe: 75.5, modalidad: 'PUNTUAL', fecha_inicio: '2026-10-18', fecha_fin: null, prorratear: false };
const base = { gasto, vivienda: { nombre: 'Vivienda de prueba', direccion: 'Calle de prueba, 1' }, habitacion: { codigo: 'H2' }, inquilinos: [{ nombre: 'Titular', apellidos: 'Anterior', documento: 'PRUEBA' }], propietarios: [{ nombre_completo: 'Propietario de prueba', documento: null }], incluidoEnCobro: true, cobroLiquidado: false };
const { documentoGastoExtra } = cargar();
test('el recibo identifica un único gasto extra y su habitación', () => {
  const html = documentoGastoExtra(base, new Date('2026-10-18T12:00:00Z'));
  for (const texto of ['RECIBO DE GASTO EXTRA', 'GE-extra1', gasto.concepto, 'H2', 'Titular Anterior', '75,50', 'octubre', 'ni se suma otra vez al alquiler']) assert(html.includes(texto), texto);
  assert(!html.includes('Total mensual'));
  assert(!html.includes('Importe recibido'));
});
test('no se afirma que un gasto esté pagado por emitir su recibo', () => {
  const html = documentoGastoExtra(base);
  assert(html.includes('Su pago se controla junto con el alquiler'));
  assert(html.includes('no acredita que el gasto se haya pagado'));
  assert(!html.includes('recibo mensual liquidado'));
});
test('se distingue un gasto aún sin cobro de otro incluido en un cobro liquidado', () => {
  const sinCobro = documentoGastoExtra({ ...base, incluidoEnCobro: false });
  assert(sinCobro.includes('pendiente de incorporarse'));
  const pagado = documentoGastoExtra({ ...base, cobroLiquidado: true });
  assert(pagado.includes('Incluido en el recibo mensual liquidado'));
  assert(!pagado.includes('no acredita'));
});
test('se escapan los datos y se rechazan los suplementos recurrentes e importes inválidos', () => {
  const html = documentoGastoExtra({ ...base, gasto: { ...gasto, concepto: '<script>prueba</script>' }, vivienda: { ...base.vivienda, nombre: '<Casa>' } });
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;script&gt;'));
  assert(html.includes('&lt;Casa&gt;'));
  assert.throws(() => documentoGastoExtra({ ...base, gasto: { ...gasto, modalidad: 'MENSUAL' } }));
  for (const importe of [0, -1, NaN, Infinity]) assert.throws(() => documentoGastoExtra({ ...base, gasto: { ...gasto, importe } }));
});
function baseSimulada({ mensual = false, sinDetalle = false } = {}) {
  const consultas = [];
  const registros = {
    suplementos_estancia: [{ ...gasto, modalidad: mensual ? 'MENSUAL' : 'PUNTUAL' }],
    estancias: [{ id: 'e1', habitacion_id: 'h1', inquilino_id: 'i1', fecha_entrada: '2026-08-01' }, { id: 'e2', habitacion_id: 'h1', inquilino_id: 'i2', fecha_entrada: '2026-08-01' }, { id: 'e3', habitacion_id: 'h1', inquilino_id: 'i3', fecha_entrada: '2026-11-01' }],
    habitaciones: [{ id: 'h1', codigo: 'H2', vivienda_id: 'v1' }],
    viviendas: [{ id: 'v1', nombre: 'Vivienda de prueba', direccion: '' }],
    inquilinos: ['i1', 'i2', 'i3'].map(id => ({ id, nombre: id, apellidos: 'Titular', documento: null, activo: false })),
    vivienda_propietarios: [],
    cobros: [{ habitacion_id: 'h1', periodo_anio: 2026, periodo_mes: 10, pendiente: 0, detalle_suplementos: [{ id: sinDetalle ? 'otro-extra' : 'extra1' }] }],
  };
  const supabase = { from(tabla) {
    const filtros = []; let unico = false;
    const consulta = { select: () => consulta, eq: (columna, valor) => { filtros.push([columna, valor]); return consulta; }, in: (columna, valores) => { filtros.push([columna, valores]); return consulta; }, single: () => { unico = true; return consulta; } };
    for (const operacion of ['insert', 'update', 'delete', 'upsert']) consulta[operacion] = () => { throw new Error('El recibo no debe escribir datos'); };
    consulta.then = resolver => {
      consultas.push({ tabla, filtros });
      const filas = (registros[tabla] ?? []).filter(fila => filtros.every(([columna, valor]) => Array.isArray(valor) ? valor.includes(fila[columna]) : fila[columna] === valor));
      return Promise.resolve({ data: unico ? filas[0] : filas, error: unico && !filas.length ? { message: 'No encontrado' } : null }).then(resolver);
    };
    return consulta;
  } };
  return { supabase, consultas };
}
test('se recupera el gasto guardado y solo los titulares de su contrato, aunque ya hayan salido', async () => {
  const { supabase, consultas } = baseSimulada();
  const datos = await cargar(supabase).obtenerDatosGastoExtra('extra1');
  assert.equal(datos.gasto.importe, 75.5);
  assert.deepEqual(datos.inquilinos.map(persona => persona.nombre), ['i1', 'i2']);
  assert.equal(datos.incluidoEnCobro, true);
  assert.equal(datos.cobroLiquidado, true);
  assert(consultas.find(consulta => consulta.tabla === 'cobros').filtros.some(([columna, valor]) => columna === 'periodo_mes' && valor === 10));
});
test('otro cobro pagado no demuestra el pago de este gasto si no contiene su referencia', async () => {
  const datos = await cargar(baseSimulada({ sinDetalle: true }).supabase).obtenerDatosGastoExtra('extra1');
  assert.equal(datos.incluidoEnCobro, false);
  assert.equal(datos.cobroLiquidado, false);
});
test('no se emite un recibo puntual para un gasto inexistente o un suplemento mensual', async () => {
  await assert.rejects(cargar(baseSimulada().supabase).obtenerDatosGastoExtra('inexistente'));
  await assert.rejects(cargar(baseSimulada({ mensual: true }).supabase).obtenerDatosGastoExtra('extra1'));
});
