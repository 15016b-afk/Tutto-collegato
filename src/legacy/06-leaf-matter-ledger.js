

/* v0.15 — audit di provenienza delle foglie, NON simulazione della loro decomposizione.
   Fonte per equivalenti ELEMENTARI INIZIALI: Rojo et al. (2026), Tabella 1,
   https://doi.org/10.1111/fwb.70163 ; composizione media dei campioni
   utilizzata soltanto quando una massa secca ipotizzata è stata dichiarata.

   Distingue: foglie introdotte, presenti e rimosse manualmente.
   Il calcolo non assegna N/C a compartimenti biologici, non stima quanto
   resti realmente nel tessuto e NON assume che la rimozione esporti gli
   equivalenti iniziali. Il giorno non modifica i dati.  */
(function(root){'use strict';
const near=(a,b)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function entry(o){
 const species=o?.leafSpecies,grams=o?.hypotheticalDryMassG;
 if(!Object.hasOwn(root.TECLeafInventory.SAMPLES,species)||!Number.isFinite(grams)||grams<=0)return null;
 try{return root.TECLeafInventory.calc(species,grams)}catch{return null}
}
function tally(items){
 const result={count:items.length,estimableCount:0,unknownCount:0,estimatedDryG:0,referenceNmg:0,referenceCmg:0,hasEstimate:false};
 for(const o of items){const e=entry(o);if(!e){result.unknownCount++;continue}
  result.estimableCount++;result.estimatedDryG+=e.grams;result.referenceNmg+=e.nMg;result.referenceCmg+=e.cMg;
 }
 result.hasEstimate=result.estimableCount>0;
 return result;
}
function audit(visibleObjects,ledger,complete){
 if(!Array.isArray(visibleObjects)||!Array.isArray(ledger))throw Error('Provenienza non valida');
 const observed=visibleObjects.filter(o=>o&&o.kind==='leaf');
 const inputs=new Map(),removed=new Set(),problems=[];
 for(const event of ledger){
  if(!event||event.kind!=='leaf')continue;
  if(!Number.isSafeInteger(event.id)||event.id<=0){problems.push('Identificativo evento non valido');continue}
  if(event.type==='in'){
   if(inputs.has(event.id))problems.push('Introduzione duplicata');
   else inputs.set(event.id,{id:event.id,leafSpecies:event.leafSpecies??null,hypotheticalDryMassG:event.hypotheticalDryMassG??null});
  }else if(event.type==='out'){
   if(removed.has(event.id))problems.push('Rimozione duplicata');
   removed.add(event.id);
  }else problems.push('Evento foglia non riconosciuto');
 }
 for(const id of removed)if(!inputs.has(id))problems.push('Rimozione senza entrata registrata');
 const seen=new Set();for(const o of observed){
  if(!Number.isSafeInteger(o.id)||seen.has(o.id))problems.push('Foglia presente con ID duplicato o non valido');
  seen.add(o.id);
  if(removed.has(o.id))problems.push('Foglia rimossa ancora visibile');
  if(!inputs.has(o.id))problems.push('Foglia visibile senza evento di introduzione');
  const prior=inputs.get(o.id);
  if(prior&&(prior.leafSpecies!==o.leafSpecies||prior.hypotheticalDryMassG!==o.hypotheticalDryMassG))
   problems.push('Dati iniziali modificati rispetto al registro');
 }
 for(const [id] of inputs)if(!removed.has(id)&&!seen.has(id))problems.push('Foglia introdotta assente senza rimozione registrata');
 const validHistory=complete===true&&problems.length===0;
 // I valori degli oggetti visibili rimangono accessibili anche per salvataggi parziali.
 const present=tally(observed);
 // Il registro di ingresso conserva gli equivalenti iniziali, anche quando la foglia e' rimossa.
 const entered=tally([...inputs.values()]);
 const manuallyRemoved=tally([...removed].filter(id=>inputs.has(id)).map(id=>inputs.get(id)));
 const nBalanced=near(entered.referenceNmg,present.referenceNmg+manuallyRemoved.referenceNmg);
 const cBalanced=near(entered.referenceCmg,present.referenceCmg+manuallyRemoved.referenceCmg);
 const countsBalanced=entered.count===present.count+manuallyRemoved.count;
 return Object.freeze({present,entered,manuallyRemoved,validHistory,
  referenceIdentityHolds:validHistory?(nBalanced&&cBalanced&&countsBalanced):null,
  unresolvedTransfersMg:null,estimatedActualRemainingTissueMg:null,
  biologicalProcessActive:false,scope:'initial-reference-only',
  problems:problems.length,
  source:root.TECLeafInventory.SOURCE.url});
}
function selfTest(){
 const a={id:1,kind:'leaf',leafSpecies:'alnus_glutinosa',hypotheticalDryMassG:1};
 const q={id:2,kind:'leaf',leafSpecies:'quercus_robur',hypotheticalDryMassG:.5};
 const unknown={id:3,kind:'leaf',leafSpecies:'quercus_robur',hypotheticalDryMassG:null};
 const ins=[a,q,unknown].map(({id,leafSpecies,hypotheticalDryMassG})=>({id,kind:'leaf',type:'in',leafSpecies,hypotheticalDryMassG}));
 const open=audit([a,q,unknown],ins,true);
 const closed=audit([q,unknown],[...ins,{id:1,kind:'leaf',type:'out',day:7}],true);
 const partial=audit([q,unknown],[{id:2,kind:'leaf',type:'in',leafSpecies:q.leafSpecies,hypotheticalDryMassG:q.hypotheticalDryMassG}],false);
 const tampered=audit([q],[...ins,{id:2,kind:'leaf',type:'out'}],true);
 const empty=audit([],[],true);
 return {allPassed:open.referenceIdentityHolds===true&&closed.referenceIdentityHolds===true&&
  near(closed.entered.referenceNmg,37.5)&&near(closed.present.referenceNmg,5.1)&&
  near(closed.manuallyRemoved.referenceNmg,32.4)&&near(closed.entered.referenceCmg,785.75)&&
  closed.entered.unknownCount===1&&closed.present.unknownCount===1&&
  closed.unresolvedTransfersMg===null&&closed.biologicalProcessActive===false&&
  partial.validHistory===false&&partial.referenceIdentityHolds===null&&
  tampered.validHistory===false&&empty.referenceIdentityHolds===true};
}
root.TECLeafMatterLedger=Object.freeze({audit,tally,selfTest});
})(typeof window!=='undefined'?window:globalThis);


