const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

test('informe incluye pendientes anteriores de activos y mantiene deudas separadas', async () => {
  const datos = {
    viviendas: [{ id: 'v', nombre: 'Inca' }],
    habitaciones: [{ id: 'h', vivienda_id: 'v', codigo: 'H1', estado: 'OCUPADA' }],
    inquilinos: [{ id: 'viejo', nombre: 'Anterior', apellidos: 'Responsable', activo: false }, { id: 'nuevo', habitacion_id: 'h', nombre: 'Nuevo', apellidos: 'Ocupante', activo: true }],
    fianzas: [],
    cobros: [
      { habitacion_id: 'h', inquilino_id: 'viejo', pendiente: 10.67, periodo_anio: 2025, periodo_mes: 12, estado: 'DEUDA' },
      { habitacion_id: 'h', inquilino_id: 'nuevo', pendiente: 20.25, periodo_anio: 2026, periodo_mes: 9, estado: 'PARCIAL' },
      { habitacion_id: 'h', inquilino_id: 'nuevo', pendiente: 0, periodo_anio: 2026, periodo_mes: 10, estado: 'PAGADO' },
    ],
  };
  const supabase = { from(tabla) {
    let filas = datos[tabla];
    const q = { select(){return q}, order(){return q}, in(k,vs){filas=filas.filter(r=>vs.includes(r[k]));return q}, eq(k,v){filas=filas.filter(r=>r[k]===v);return q}, gt(k,v){filas=filas.filter(r=>r[k]>v);return q}, then(resolve){return Promise.resolve({data:filas,error:null}).then(resolve)} };
    return q;
  }};
  let html = '';
  const window = { open: () => ({ document: { write: s => { html=s; }, open(){}, close(){} }, close(){} }) };
  const m = { exports: {} };
  const requireMock = name => name === '#roomflow-supabase' ? {supabase} : name === 'lucide-react' ? {FileDown:()=>null} : {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const js = ts.transpileModule(fs.readFileSync('components/InformeSituacionButton.tsx','utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('module','exports','require','window','alert',js)(m,m.exports,requireMock,window,message=>{throw new Error(message)});
  await m.exports.default().props.onClick();
  assert.match(html,/diciembre de 2025/);
  assert.match(html,/septiembre de 2026/);
  const actuales = html.split('<h2>Pendientes de pago actuales</h2>')[1].split('<h2>Deudas históricas no cobradas</h2>')[0];
  const historicas = html.split('<h2>Deudas históricas no cobradas</h2>')[1].split('<h2>Situación por vivienda</h2>')[0];
  assert.match(actuales,/20,25/);
  assert.doesNotMatch(actuales,/10,67|Anterior Responsable|30,92/);
  assert.match(historicas,/10,67/);
  assert.doesNotMatch(historicas,/20,25|Nuevo Ocupante/);
  assert.match(html,/10,67/);
  assert.match(html,/Anterior Responsable/);
  assert.match(actuales,/Nuevo Ocupante/);
  assert.doesNotMatch(html,/octubre de 2026<\/td>/);
});

