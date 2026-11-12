

/* Tutto è collegato 0.10 — ricerca sperimentale sulla massa secca.
 * Oertli (1991), Quercus robur in due stagni, k per giorno, 255 giorni;
 * foglie contenute in sacchetti di massa iniziale 4,85 g (descrizione del metodo).
 * DOI https://doi.org/10.1080/03680770.1989.11899017
 * È un modello retrospettivo del protocollo bibliografico, NON la decomposizione
 * della foglia generica collocata nell'acquario. La massa perduta non equivale
 * ad azoto ammoniacale, nitrati, anidride carbonica o nuova biomassa.
 */
(function(root){'use strict';
 const SOURCE=Object.freeze({authors:'Beat Oertli',year:1991,title:'Oak leaf litter processing and associated macroinvertebrates in two ponds near Geneva (Switzerland)',url:'https://doi.org/10.1080/03680770.1989.11899017',species:'Quercus robur',method:'litter bag in standing freshwater pond',initialDryG:4.85,days:255,sites:Object.freeze({BV:Object.freeze({label:'Bois-Vieux',kPerDay:0.0035}),MC:Object.freeze({label:'Marais du Château',kPerDay:0.0012})})});
 const quality=Object.freeze({identificationRequired:true,initialDryMassRequired:true,communityAndConditionsRequired:true,fishNotRequired:true,activeInTank:false});
 function start(x){
  if(!x||x.protocol!=='Oertli1991' || x.species!==SOURCE.species || !Object.hasOwn(SOURCE.sites,x.site) || x.initialDryG!==SOURCE.initialDryG || x.startDay!==0)throw Error('Protocollo sperimentale non documentato: serve Quercus robur, campione e sito originali');
  return Object.freeze({protocol:'Oertli1991',site:x.site,species:x.species,initialDryG:x.initialDryG,day:0,remainingDryG:x.initialDryG,unresolvedMassG:0});
 }
 function step(s,days){
  if(!s||s.protocol!=='Oertli1991'||s.species!==SOURCE.species||!Object.hasOwn(SOURCE.sites,s.site)||s.initialDryG!==SOURCE.initialDryG||!Number.isInteger(s.day)||s.day<0||s.day>SOURCE.days||!Number.isInteger(days)||days<0)throw Error('Stato o intervallo di giorni non valido');
  const target=s.day+days;
  if(target>SOURCE.days)return null; // Non extrapolare oltre la finestra di osservazione.
  const k=SOURCE.sites[s.site].kPerDay;
  const remainingDryG=s.initialDryG*Math.exp(-k*target);
  const unresolvedMassG=s.initialDryG-remainingDryG;
  // "unresolved" è massa perduta dai sacchetti, non uno specifico prodotto chimico.
  return Object.freeze({...s,day:target,remainingDryG,unresolvedMassG});
 }
 function attemptTankActivation(x){
  const missing=[];
  if(!x||x.species!=='Quercus robur')missing.push('identificazione della foglia Quercus robur');
  if(!x||!Number.isFinite(x.initialDryG)||x.initialDryG<=0)missing.push('massa secca iniziale misurata');
  // Anche una foglia Quercus robur pesata NON equivale allo stagno sperimentale.
  missing.push('modello trasferibile e validato per il contesto e la comunità della vasca');
  return Object.freeze({allowed:false,missing,reason:'I coefficienti misurati negli stagni non sono automaticamente applicabili a un acquario domestico senza filtro.'});
 }
 function selfTest(){
  const first=start({protocol:'Oertli1991',site:'BV',species:'Quercus robur',initialDryG:4.85,startDay:0});
  const second=start({protocol:'Oertli1991',site:'MC',species:'Quercus robur',initialDryG:4.85,startDay:0});
  const close=(x,y)=>Math.abs(x-y)<1e-10;
  const seven=step(first,7),oneByOne=Array.from({length:7}).reduce(s=>step(s,1),first);
  const day255=step(first,255),slow=step(second,7);
  let rejectsUnknown=false,rejectsWrongSpecies=false,rejectsWrongMass=false,rejectsWrongDay=false;
  try{start({protocol:'Oertli1991',site:'BV',species:'foglia generica',initialDryG:4.85,startDay:0})}catch(e){rejectsUnknown=true}
  try{start({protocol:'Oertli1991',site:'BV',species:'Quercus serrata',initialDryG:4.85,startDay:0})}catch(e){rejectsWrongSpecies=true}
  try{start({protocol:'Oertli1991',site:'BV',species:'Quercus robur',initialDryG:1,startDay:0})}catch(e){rejectsWrongMass=true}
  try{step(first,1.5)}catch(e){rejectsWrongDay=true}
  const t=attemptTankActivation({species:'Quercus robur',initialDryG:4.85});
  const results={zero:close(first.remainingDryG,4.85)&&close(first.unresolvedMassG,0),conserved:close(seven.remainingDryG+seven.unresolvedMassG,4.85)&&close(day255.remainingDryG+day255.unresolvedMassG,4.85),monotone:seven.remainingDryG<first.remainingDryG&&day255.remainingDryG<seven.remainingDryG,contextDependent:seven.remainingDryG<slow.remainingDryG,partitionInvariant:close(seven.remainingDryG,oneByOne.remainingDryG),bounded:step(first,256)===null&&step(day255,1)===null,requiresEvidence:rejectsUnknown&&rejectsWrongSpecies&&rejectsWrongMass&&rejectsWrongDay,requiresTankValidation:!t.allowed&&t.missing.length>=1};
  return {...results,allPassed:Object.values(results).every(Boolean)};
 }
 root.TECLitterProtocol=Object.freeze({SOURCE,quality,start,step,attemptTankActivation,selfTest});
})(typeof window!=='undefined'?window:globalThis);


