const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
function cargar(ruta, dependencias = {}) {
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(ruta, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(nombre => dependencias[nombre] ?? require(nombre), modulo, modulo.exports);
  return modulo.exports;
}
const referencia = cargar('lib/aplazamientoRecibo.ts');
const economia = cargar('lib/estanciasCobros.ts');
const cobro = { id: 'c1', inquilino_id: 'i1', habitacion_id: 'h1', periodo_anio: 2026, periodo_mes: 10, alquiler: 550, gastos: 70, total: 620, pagado: 150, pendiente: 470 };
const acuerdo = { id: 'a1', cobro_id: 'c1', importe_inicial: 620, pagado_inicial: 0, fecha_acuerdo: '2026-10-08', cuota_orientativa: 50, proxima_fecha: '2026-11-05', notas: '50 € al mes y más cuando pueda.', created_at: '2026-10-08' };
const euros = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

test('el recibo sin acuerdo no contiene ninguna referencia al aplazamiento', () => {
  assert.equal(referencia.referenciaAplazamientoRecibo(null, cobro), '');
});
test('un acuerdo de otro recibo del mismo inquilino no se muestra', () => {
  assert.equal(referencia.referenciaAplazamientoRecibo({ ...acuerdo, cobro_id: 'otro-mes' }, cobro), '');
});
test('el recibo aplazado incluye saldo, entregas variables y condiciones sin duplicar el total', () => {
  const html = referencia.referenciaAplazamientoRecibo(acuerdo, cobro);
  for (const texto of ['Pago aplazado de este recibo', 'Condiciones pactadas', acuerdo.notas, euros(620), euros(150), euros(470), euros(50), 'Próximo pago o revisión']) assert(html.includes(texto));
  assert(!html.includes('Total mensual'));
});
test('un acuerdo liquidado mantiene su referencia sin anunciar nuevos pagos', () => {
  const html = referencia.referenciaAplazamientoRecibo(acuerdo, { ...cobro, pagado: 620, pendiente: 0 });
  assert(html.includes('Liquidado'));
  assert(!html.includes('Próximo pago'));
  assert(!html.includes('Cuota mensual orientativa'));
});
test('las condiciones se escapan y las entregas previas al acuerdo se excluyen', () => {
  const html = referencia.referenciaAplazamientoRecibo({ ...acuerdo, notas: '<script>prueba</script>\nSegunda línea', pagado_inicial: 100 }, cobro);
  assert(html.includes('&lt;script&gt;prueba&lt;/script&gt;<br>Segunda línea'));
  assert(!html.includes('<script>'));
  assert(html.includes(`<span>Devuelto desde el acuerdo</span><strong>${euros(50)}</strong>`));
});

async function generarRecibo(acuerdos, actualizado = cobro) {
  let html;
  const consultas = [];
  const supabase = { from(tabla) {
    const filtros = {};
    const consulta = { select: () => consulta, limit: () => consulta, eq: (campo, valor) => { filtros[campo] = valor; return consulta; }, single: () => consulta };
    consulta.then = resolver => {
      consultas.push({ tabla, filtros });
      const data = tabla === 'pagos_aplazados' ? acuerdos.filter(a => a.cobro_id === filtros.cobro_id) : tabla === 'cobros' ? actualizado : tabla === 'habitaciones' ? { id: 'h1', codigo: 'H1', vivienda_id: 'v1', gastos: 70 } : [];
      return Promise.resolve({ data, error: null }).then(resolver);
    };
    return consulta;
  } };
  const Componente = cargar('components/ReciboCobroButton.tsx', { '#roomflow-supabase': { supabase }, '@/lib/estanciasCobros': economia, '@/lib/aplazamientoRecibo': referencia, '@/lib/reciboPdf': { descargarReciboPdf: contenido => { html = contenido; } } }).default;
  const boton = Componente({ cobro, vivienda: { id: 'v1', nombre: 'Vivienda de prueba' }, habitacion: { codigo: 'H1' }, inquilino: { nombre: 'Inquilino', apellidos: 'de prueba' } });
  await boton.props.onClick();
  return { html, consultas };
}
test('se consulta el recibo exacto y no aparece información de otros alquileres', async () => {
  const { html, consultas } = await generarRecibo([{ ...acuerdo, cobro_id: 'otro-mes' }]);
  assert.deepEqual(consultas[0], { tabla: 'pagos_aplazados', filtros: { cobro_id: 'c1' } });
  assert(!html.includes('Pago aplazado'));
  assert(!html.includes('Condiciones pactadas'));
  assert(html.includes('entre los días 1 y 5'));
});
test('el recibo aplazado refresca los pagos y usa las condiciones pactadas', async () => {
  const { html } = await generarRecibo([acuerdo], { ...cobro, pagado: 200, pendiente: 420 });
  assert(html.includes(`<span>Importe recibido</span><strong>${euros(200)}</strong>`));
  assert(html.includes(`<span>Saldo pendiente del aplazamiento</span><strong>${euros(420)}</strong>`));
  assert(html.includes('Pago aplazado de este recibo'));
  assert(html.includes('según el acuerdo de pago aplazado'));
  assert(!html.includes('entre los días 1 y 5'));
});
