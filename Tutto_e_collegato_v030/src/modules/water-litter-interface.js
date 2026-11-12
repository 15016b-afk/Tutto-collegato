/* Tutto è collegato — v0.22 | interfaccia acqua-lettiera.
 * Quantifica unicamente CONTATTI DI STATO simulati, a fine giornata discreta,
 * delle foglie collocate sul fondo. Non stima ore di immersione, reazioni,
 * decomposizione, massa residua, organismi, concentrazioni o flussi.
 * Lo stock iniziale di N/C proviene da scenario massa utente x Rojo et al.
 * (2026) Table 1, DOI 10.1111/fwb.70163, NON è una misura della vasca.
 * Contesto metodologico: Bärlocher et al. (2020), DOI
 * 10.1007/978-3-030-30515-4; un contatto non è un tasso biologico.
 * Il contatto è definito dalla convenzione di gioco: foglie sul fondo e
 * waterLevel>0; non è una misura geometrica o di immersione di laboratorio.
 */
(function(root){'use strict';
 const VERSION=1;
 const leaf=o=>o&&o.kind==='leaf'&&Number.isSafeInteger(o.id)&&o.id>0;
 const present=s=>s.objects.filter(leaf);
 const finiteDay=d=>Number.isSafeInteger(d)&&d>=0;
 const hasWater=s=>Number.isFinite(s.waterLevel)&&s.waterLevel>0;
 function newRecord(day){return {sinceDay:day,wetEndDayChecks:0,dryEndDayChecks:0};}
 function start(state, historicalUnknown=false){
  if(!finiteDay(state.day)||!Array.isArray(state.objects))throw Error('Giorno o foglie invalidi');
  const records=Object.create(null);
  for(const o of present(state)){
   if(Object.hasOwn(records,o.id))throw Error('ID foglia duplicato');
   records[o.id]=newRecord(state.day);
  }
  return {schema:VERSION,beginDay:state.day,processedThroughDay:state.day,
   historicalUnknown:Boolean(historicalUnknown),records};
 }
 function valid(ledger){
  if(!ledger||ledger.schema!==VERSION||!finiteDay(ledger.beginDay)||!finiteDay(ledger.processedThroughDay)||ledger.processedThroughDay<ledger.beginDay||typeof ledger.historicalUnknown!=='boolean'||!ledger.records||typeof ledger.records!=='object'||Array.isArray(ledger.records))return false;
  for(const [id,r] of Object.entries(ledger.records)){
   if(!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||!r||!finiteDay(r.sinceDay)||r.sinceDay<ledger.beginDay||r.sinceDay>ledger.processedThroughDay||!finiteDay(r.wetEndDayChecks)||!finiteDay(r.dryEndDayChecks)||r.wetEndDayChecks+r.dryEndDayChecks>ledger.processedThroughDay-r.sinceDay)return false;
  }
  return true;
 }
 function register(ledger,object,day){
  if(!valid(ledger)||!leaf(object)||!finiteDay(day)||day!==ledger.processedThroughDay||Object.hasOwn(ledger.records,object.id))throw Error('Registrazione foglia incoerente');
  return {...ledger,records:{...ledger.records,[object.id]:newRecord(day)}};
 }
 function tick(ledger,state){
  if(!valid(ledger)||!finiteDay(state.day)||state.day!==ledger.processedThroughDay+1||!Array.isArray(state.objects))throw Error('Passaggio giornaliero non sequenziale');
  const ids=new Set();const records={...ledger.records};const wet=hasWater(state);
  for(const o of present(state)){
   if(ids.has(o.id))throw Error('Foglia duplicata nello stato');ids.add(o.id);
   // An existing leaf without a record implies an incomplete/corrupted save,
   // not a basis for reconstructing earlier days.
   if(!Object.hasOwn(records,o.id))throw Error('Foglia priva di registrazione');
   const r=records[o.id];records[o.id]={...r,
    wetEndDayChecks:r.wetEndDayChecks+(wet?1:0),
    dryEndDayChecks:r.dryEndDayChecks+(wet?0:1)};
  }
  return {...ledger,processedThroughDay:state.day,records};
 }
 function evaluate(state){
  if(!Array.isArray(state?.objects))throw Error('Stato non valido');
  const checked=valid(state.exposureLedger),ledger=checked?state.exposureLedger:null;
  const wet=hasWater(state),items=present(state);
  const reference=root.TECLeafInventory.inventory(wet?items:[]);
  const total=root.TECLeafInventory.inventory(items);
  const tracked=items.map(o=>{
   const r=ledger?.records[o.id];return Object.freeze({id:o.id,wetNow:wet,
    wetEndDayChecks:r?.wetEndDayChecks??null,dryEndDayChecks:r?.dryEndDayChecks??null,
    trackedSinceDay:r?.sinceDay??null});
  });
  return Object.freeze({day:state.day,waterPresent:wet,leafCount:items.length,
   wetLeafCount:wet?items.length:0,dryLeafCount:wet?0:items.length,
   referenceInitialWetNmg:wet?reference.referenceNmg:0,
   referenceInitialWetCmg:wet?reference.referenceCmg:0,
   referenceInitialDryNmg:wet?0:total.referenceNmg,
   referenceInitialDryCmg:wet?0:total.referenceCmg,
   estimatedWetCount:wet?reference.estimableCount:0,
   unknownWetCount:wet?reference.unestimatedCount:0,
   historicalUnknown:!ledger||ledger.historicalUnknown,
   trackedFromDay:ledger?.beginDay??null,
   // Counts are discrete internal end-of-day state checks, NEVER hours immersed
   // or user-observed samples. No physicochemical or biological flux.
   checksTotal:tracked.reduce((n,r)=>n+(r.wetEndDayChecks??0),0),
   records:Object.freeze(tracked),biologicalProcessActive:false,
   releaseToWaterMg:null,remainingTissueMg:null,measuredInAquarium:false,
   referenceSource:root.TECLeafInventory.SOURCE.url});
 }
 function selfTest(){
  const a={id:1,kind:'leaf',leafSpecies:'alnus_glutinosa',hypotheticalDryMassG:1},b={id:2,kind:'leaf',leafSpecies:'quercus_robur',hypotheticalDryMassG:.5};
  const s={day:0,waterLevel:0,objects:[]};let l=start(s);
  s.objects=[a];l=register(l,a,0);s.waterLevel=.4;s.day=1;l=tick(l,s);
  s.objects.push(b);l=register(l,b,1);s.day=2;l=tick(l,s);
  let v=evaluate({...s,exposureLedger:l});
  const wet=Math.abs(v.referenceInitialWetNmg-37.5)<1e-9&&Math.abs(v.referenceInitialWetCmg-785.75)<1e-9&&v.checksTotal===3;
  s.waterLevel=0;s.day=3;l=tick(l,s);v=evaluate({...s,exposureLedger:l});
  const dry=!v.waterPresent&&v.dryLeafCount===2&&v.referenceInitialWetNmg===0&&Math.abs(v.referenceInitialDryNmg-37.5)<1e-9&&v.checksTotal===3;
  s.objects=[b];s.waterLevel=1;s.day=4;l=tick(l,s);v=evaluate({...s,exposureLedger:l});
  const removed=v.leafCount===1&&v.records[0].id===2&&v.records[0].wetEndDayChecks===2&&l.records['1'].wetEndDayChecks===2;
  let badSteps=false,badDuplicates=false,badLedger=false;
  try{tick(l,{...s,day:6})}catch{badSteps=true}
  try{start({day:0,objects:[a,a]})}catch{badDuplicates=true}
  badLedger=!valid({...l,records:{...l.records,1:{...l.records[1],wetEndDayChecks:999}}});
  const migrated=start({...s,day:4},true);
  return {allPassed:wet&&dry&&removed&&badSteps&&badDuplicates&&badLedger&&migrated.historicalUnknown&&
   v.biologicalProcessActive===false&&v.releaseToWaterMg===null&&v.remainingTissueMg===null&&v.measuredInAquarium===false,
   checks:{wet,dry,removed,badSteps,badDuplicates,badLedger,migration:true,noBiologicalFlux:true}};
 }
 root.TECWaterLitterInterface=Object.freeze({start,valid,register,tick,evaluate,selfTest});
})(typeof window!=='undefined'?window:globalThis);
