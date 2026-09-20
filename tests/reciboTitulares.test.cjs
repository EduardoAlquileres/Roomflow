const fs=require('node:fs');
const ts=require('typescript');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('lib/estanciasCobros.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
const base={habitacion_id:'h1',precio:600,gastos:50,created_at:'2026-01-01'};
const estancias=[{...base,id:'a',inquilino_id:'anterior1',fecha_entrada:'2026-03-08',fecha_salida:'2026-09-14'},{...base,id:'b',inquilino_id:'anterior2',fecha_entrada:'2026-03-08',fecha_salida:'2026-09-14'},{...base,id:'c',inquilino_id:'nuevo1',fecha_entrada:'2026-09-20',fecha_salida:null},{...base,id:'d',inquilino_id:'nuevo2',fecha_entrada:'2026-09-20',fecha_salida:null}];
test('cada recibo agrupa solamente los titulares del mismo contrato aunque ambos contratos coincidan en el mes',()=>{
 for(const [titular,esperados] of [['anterior1',['a','b']],['nuevo1',['c','d']]]){
 const estancia=m.exports.estanciaParaPeriodo(estancias,titular,2026,9);
 assert.deepEqual(m.exports.estanciasDelContrato(estancias,estancia).map(e=>e.id),esperados);
 }
});
