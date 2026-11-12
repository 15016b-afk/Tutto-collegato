/* Tutto è collegato · v0.23 — modello esplorativo di perdita di massa della lettiera.
 * Fonte dei coefficienti: Abril, Menéndez & Ferreira (2021), Aquatic Sciences 83:54,
 * DOI 10.1007/s00027-021-00810-x, Tabella 2, singole foglie nel trattamento
 * con corrente lenta: Alnus 0.0289 day-1; Quercus 0.0117 day-1.
 * Contesto: sacchetti con foglie in un TORRENTE per 32 giorni, non acquario.
 * È un modello didattico con perdita netta di massa del campione, NON una
 * misura, una mineralizzazione o la massa di nutrienti assorbibili dalle piante.
 * Si interrompe al giorno di esposizione 32; niente estrapolazione occulta.
 * Il conteggio dei giorni bagnati è quello del registro di v0.22, non una
 * ricostruzione dello storico precedente a una migrazione.
 */
(function(root){'use strict';
 const SOURCE=Object.freeze({authors:'Abril, Menéndez e Ferreira',year:2021,title:'Decomposition of leaf litter mixtures in streams: effects of component litter species and current velocity',table:'Tabella 2, foglie singole, corrente lenta',url:'https://doi.org/10.1007/s00027-021-00810-x',environment:'Torrente forestale, incubazione di 32 giorni, sacchetti a maglia grossa',maxWetDays:32});
 const RATES=Object.freeze({alnus_glutinosa:0.0289,quercus_robur:0.0117});
 function calculate(species,wetDays,initialDryG=null){
  if(!Number.isSafeInteger(wetDays)||wetDays<0)throw new TypeError('Giorni di esposizione non validi');
  if(!Object.hasOwn(RATES,species))return Object.freeze({eligible:false,wetDays,modeledDays:0,remainingFraction:null,missingFraction:null,remainingG:null,unresolvedG:null,rate:null,atLimit:false});
  const modeledDays=Math.min(wetDays,SOURCE.maxWetDays), rate=RATES[species];
  const remainingFraction=Math.exp(-rate*modeledDays), missingFraction=1-remainingFraction;
  const massValid=typeof initialDryG==='number'&&Number.isFinite(initialDryG)&&initialDryG>0&&initialDryG<=1e9;
  return Object.freeze({eligible:true,wetDays,modeledDays,remainingFraction,missingFraction,
   remainingG:massValid?initialDryG*remainingFraction:null,
   unresolvedG:massValid?initialDryG*missingFraction:null,
   initialG:massValid?initialDryG:null,rate,atLimit:wetDays>SOURCE.maxWetDays,
   // Unresolved is NOT a specific destination: includes leaching, respiration,
   // microbial processing and physical fragmentation in the published experiment.
   modelOnly:true,source:SOURCE.url});
 }
 function evaluate(state){
  if(!state||!Array.isArray(state.objects))throw new TypeError('Stato non valido');
  const ledger=state.exposureLedger;
  const validLedger=root.TECWaterLitterInterface.valid(ledger)&&ledger.processedThroughDay===state.day;
  const rows=[];let count=0, modeled=0,unknown=0,totalInitial=0,totalRemaining=0,totalUnresolved=0,withMass=0;
  for(const o of state.objects){
   if(o.kind!=='leaf')continue;count++;
   const record=validLedger?ledger.records[o.id]:null;
   const row=record?calculate(o.leafSpecies,record.wetEndDayChecks,o.hypotheticalDryMassG):null;
   if(row?.eligible){modeled++;if(row.remainingG!==null){withMass++;totalInitial+=row.initialG;totalRemaining+=row.remainingG;totalUnresolved+=row.unresolvedG;}}
   else unknown++;
   rows.push(Object.freeze({id:o.id,species:o.leafSpecies,tracked:!!record,...(row||{eligible:false,remainingFraction:null,missingFraction:null,remainingG:null,unresolvedG:null,wetDays:null,atLimit:false})}));
  }
  return Object.freeze({day:state.day,leafCount:count,modeledCount:modeled,unknownCount:unknown,withMass,
   initialScenarioG:withMass?totalInitial:null,remainingScenarioG:withMass?totalRemaining:null,unresolvedScenarioG:withMass?totalUnresolved:null,
   records:Object.freeze(rows),activeExploratoryModel:state.phase==='running'&&state.waterLevel>0&&rows.some(r=>r.eligible&&r.wetDays<SOURCE.maxWetDays),
   // A daily decay is a loss of mass from the experimental sample: downstream
   // destination cannot be allocated into nutrients, gas, biofilm, etc.
   source:SOURCE.url,measuredInAquarium:false,mineralizedNitrogenMg:null,plantAvailableNitrogenMg:null,oxygenConsumptionMg:null,
   historicalUnknown:validLedger?ledger.historicalUnknown:true});
 }
 function selfTest(){
  const near=(x,y)=>Math.abs(x-y)<1e-10;
  const a=calculate('alnus_glutinosa',7,1),q=calculate('quercus_robur',7,.5),dry=calculate('alnus_glutinosa',0,1),limit=calculate('alnus_glutinosa',32,1),after=calculate('alnus_glutinosa',33,1);
  const state={phase:'running',day:0,waterLevel:1,objects:[{kind:'leaf',id:1,leafSpecies:'alnus_glutinosa',hypotheticalDryMassG:1}],exposureLedger:root.TECWaterLitterInterface.start({day:0,objects:[{kind:'leaf',id:1}]})};
  let t=evaluate(state),badDays=false;
  try{calculate('alnus_glutinosa',-1)}catch{badDays=true}
  return {allPassed:near(a.remainingFraction,Math.exp(-.0289*7))&&near(q.remainingFraction,Math.exp(-.0117*7))&&near(a.remainingG+a.unresolvedG,1)&&near(q.remainingG+q.unresolvedG,.5)&&near(dry.remainingG,1)&&near(limit.remainingFraction,after.remainingFraction)&&after.atLimit&&badDays&&t.activeExploratoryModel&&t.records[0].remainingFraction===1&&t.mineralizedNitrogenMg===null&&t.oxygenConsumptionMg===null&&calculate(null,7,1).eligible===false,
   checks:{alder:near(a.remainingFraction,Math.exp(-.0289*7)),oak:near(q.remainingFraction,Math.exp(-.0117*7)),massIdentity:near(a.remainingG+a.unresolvedG,1),noRetroactive:t.records[0].remainingFraction===1,rangeStop:after.atLimit&&near(limit.remainingFraction,after.remainingFraction),noInventedChemistry:t.mineralizedNitrogenMg===null}};
 }
 root.TECLitterDynamics=Object.freeze({SOURCE,RATES,calculate,evaluate,selfTest});
})(typeof window!=='undefined'?window:globalThis);
