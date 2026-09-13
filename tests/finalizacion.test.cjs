const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
function cargar(ruta, deps={}) {
  const m={exports:{}};
  const codigo=ts.transpileModule(fs.readFileSync(ruta,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
  new Function('require','module','exports',codigo)(n=>deps[n]??require(n),m,m.exports);return m.exports;
}
const economia=cargar('lib/estanciasCobros.ts');
const base={habitacion_id:'h',fecha_entrada:'2026-03-01',fecha_salida:'2026-09-14',estado:'FINALIZADA',created_at:'2026-03-01'};
function preparar(estado='FINALIZADA') {
  const tablas={
    estancias:[{...base,id:'e1',inquilino_id:'i1',estado},{...base,id:'e2',inquilino_id:'i2'}, {...base,id:'anterior',inquilino_id:'i1',fecha_entrada:'2025-01-01',fecha_salida:'2025-02-28'}],
    habitaciones:[{id:'h',codigo:'H1',vivienda_id:'v'}],viviendas:[{id:'v',direccion:'Calle ejemplo'}],
    inquilinos:[{id:'i1',nombre:'Uno',documento:'D1'},{id:'i2',nombre:'Dos',documento:'D2'}],
    fianzas:[{id:'f1',estancia_id:'e1',importe_entregado:600,importe_devuelto:600,importe_retenido:0,estado:'DEVUELTA'}],
    cobros:[{habitacion_id:'h',inquilino_id:'i1',periodo_anio:2026,periodo_mes:9,pendiente:10.67},{habitacion_id:'h',inquilino_id:'i1',periodo_anio:2025,periodo_mes:2,pendiente:300},{habitacion_id:'h',inquilino_id:'i2',periodo_anio:2026,periodo_mes:8,pendiente:0}],
  };
  const supabase={from(t){let filas=tablas[t];let single=false;const q={select(){return q},eq(k,v){filas=filas.filter(x=>x[k]===v);return q},in(k,vs){filas=filas.filter(x=>vs.includes(x[k]));return q},single(){single=true;return q},then(resolve){return Promise.resolve({data:single?filas[0]:filas,error:null}).then(resolve)}};return q}};
  return cargar('lib/datosFinalizacion.ts',{'#roomflow-supabase':{supabase},'./estanciasCobros':economia,'./propietarios':{obtenerPropietarios:async()=>[],obtenerTitularesVivienda:async()=>[]}});
}
test('incluye los dos titulares, una sola fianza y solo deuda de la estancia cerrada',async()=>{
  const d=await preparar().obtenerDatosFinalizacion('e1');
  assert.equal(d.titulares.length,2);
  assert.equal(d.fianza.length,2);
  assert.deepEqual(d.pendientes,[{periodo:'09/2026',importe:10.67}]);
});
test('no permite emitir una finalización de una estancia activa',async()=>{
  await assert.rejects(preparar('ACTIVA').obtenerDatosFinalizacion('e1'),/check-out/);
});
