/* Tutto è collegato · v0.24 — PICCOLO CICLO ESPLORATIVO DELL'AZOTO.
 * Solo azoto contabilizzato (mg N di scenario): NON massa secca, NH4, nitrati,
 * concentrazione misurata, microbi contati o fertilizzazione reale.
 * Evidenza del percorso: Robbins et al. (2023), Ecology 104:e4060,
 * doi:10.1002/ecy.4060; assorbimento N acquatico: Frontiers in Plant
 * Science (2022), doi:10.3389/fpls.2022.865578. N iniziale foglie:
 * Rojo et al. (2026), Freshwater Biology, doi:10.1111/fwb.70163, Tabella 1.
 * Perdita visibile della foglia: mod. v0.23, Abril et al. (2021), doi:
 * 10.1007/s00027-021-00810-x, finestra 32 giorni bagnati.
 * Le seguenti cifre NON sono ricavate dalle pubblicazioni: 0.25 g di foglia
 * di riferimento quando non indicata, 1 mg N visivo per pianta, 18% al giorno
 * del pool organico detritale verso pool N disponibile, 50% al giorno del pool
 * disponibile assorbibile, massimo 0.07 mg N/pianta/giorno.
 * Questo proxy NON assegna l'intera massa uscita a NH4+: assume SOLO per
 * l'azoto uno spostamento del contenuto iniziale proporzionale alla perdita
 * secca, prima a detrito organico e poi a N minerale indistinto; carbonio e
 * destino fisico reale restano NON modellati. Stato conservativo anche per
 * rimozioni, potature, salti, pause asciutte, migrazioni senza retroattivita'.
 */
(function(root){'use strict';
 const VERSION=2;
 const PARAMETERS=Object.freeze({proxyLeafDryG:0.25,initialPlantNmg:1,
  detritusMineralizedFractionPerWetDay:0.18,mineralUptakeFractionPerWetDay:0.50,
  maxPlantUptakeMgPerWetDay:0.07,maxPlantScale:1.70});
 const SOURCES=Object.freeze({leafN:'https://doi.org/10.1111/fwb.70163',litter:'https://doi.org/10.1007/s00027-021-00810-x',pathway:'https://doi.org/10.1002/ecy.4060',uptake:'https://doi.org/10.3389/fpls.2022.865578'});
 const plant=k=>['marimo','echinodorus','cryptocoryne','ceratophyllum'].includes(k);
 const finiteNonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const sum=a=>a.reduce((n,x)=>n+x,0);
 const mass=o=>Number.isFinite(o.hypotheticalDryMassG)&&o.hypotheticalDryMassG>0?o.hypotheticalDryMassG:PARAMETERS.proxyLeafDryG;
 function total(s){return sum(Object.values(s.leaves).map(o=>o.nMg))+s.detritalNmg+s.availableNmg+
  sum(Object.values(s.plants).map(o=>o.nMg))+s.removedNmg+root.TECTrophicWeb.total(s.trophic);}
 function valid(s){
  if(!s||s.schema!==VERSION||!root.TECTrophicWeb.valid(s.trophic)||!Number.isSafeInteger(s.processedThroughDay)||s.processedThroughDay<0||!s.leaves||!s.plants||Array.isArray(s.leaves)||Array.isArray(s.plants))return false;
  if(![s.detritalNmg,s.availableNmg,s.removedNmg,s.referenceTotalNmg].every(finiteNonnegative))return false;
  for(const l of Object.values(s.leaves))if(!l||![l.nMg,l.initialNmg,l.dryG,l.initialFraction].every(finiteNonnegative)||l.initialFraction>1||l.nMg>l.initialNmg+1e-7)return false;
  for(const p of Object.values(s.plants))if(!p||![p.nMg,p.referenceNmg].every(finiteNonnegative)||p.referenceNmg<=0)return false;
  return Math.abs(total(s)-s.referenceTotalNmg)<=1e-7*Math.max(1,s.referenceTotalNmg);
 }
 function begin(state,wasMigrated=false){
  if(!Number.isSafeInteger(state.day)||state.day<0||!Array.isArray(state.objects))throw Error('Stato del giorno non valido');
  const leaves={},plants={};
  const rows=root.TECLitterDynamics.evaluate(state).records;
  for(const o of state.objects){
   if(o.kind==='leaf'){
    const r=rows.find(x=>x.id===o.id);if(!r?.eligible)continue;
    const dryG=mass(o),initialNmg=root.TECLeafInventory.calc(o.leafSpecies,dryG).nMg;
    const remainingFraction=r.remainingFraction;
    leaves[o.id]={initialNmg,nMg:initialNmg*remainingFraction,dryG,initialFraction:remainingFraction,proxyMass:!(Number.isFinite(o.hypotheticalDryMassG)&&o.hypotheticalDryMassG>0)};
   }else if(plant(o.kind)){
    const baseScale=Number.isFinite(o.scale)&&o.scale>0?o.scale:1;
    plants[o.id]={nMg:PARAMETERS.initialPlantNmg*baseScale*baseScale,referenceNmg:PARAMETERS.initialPlantNmg};
   }
  }
  const cycle={schema:VERSION,processedThroughDay:state.day,fromDay:state.day,wasMigrated:Boolean(wasMigrated),leaves,plants,trophic:root.TECTrophicWeb.begin(state),
   detritalNmg:0,availableNmg:0,removedNmg:0,referenceTotalNmg:0,
   last:{leafToDetritusMg:0,detritusToAvailableMg:0,availableToPlantsMg:0}};
  cycle.referenceTotalNmg=total(cycle);return cycle;
 }
 function tick(previous,state){
  if(!valid(previous)||state.day!==previous.processedThroughDay+1)throw Error('Avanzamento dell’azoto non sequenziale');
  const next={...previous,leaves:Object.fromEntries(Object.entries(previous.leaves).map(([id,o])=>[id,{...o}])),plants:Object.fromEntries(Object.entries(previous.plants).map(([id,o])=>[id,{...o}])),processedThroughDay:state.day,
   last:{leafToDetritusMg:0,detritusToAvailableMg:0,availableToPlantsMg:0}};
  const wet=Number.isFinite(state.waterLevel)&&state.waterLevel>0;
  if(wet){
   const rows=root.TECLitterDynamics.evaluate(state).records;
   for(const [id,l] of Object.entries(next.leaves)){
    const r=rows.find(v=>String(v.id)===id);
    if(!r?.eligible)continue; // prior removal must be handled with removeLeaf().
    const target=Math.min(l.nMg,l.initialNmg*r.remainingFraction);
    const released=Math.max(0,l.nMg-target);
    l.nMg=target;next.detritalNmg+=released;next.last.leafToDetritusMg+=released;
   }
   // A deliberately slow two-stage pathway: organic N is not dissolved NH4 by fiat.
   const oxygenGate=root.TECOxygenCycle?root.TECOxygenCycle.oxygenFactor(state.oxygenCycle):1;
   const converted=Math.min(next.detritalNmg,next.detritalNmg*PARAMETERS.detritusMineralizedFractionPerWetDay*oxygenGate);
   next.detritalNmg-=converted;next.availableNmg+=converted;next.last.detritusToAvailableMg=converted;
   const living=Object.entries(next.plants).filter(([id,p])=>state.objects.some(o=>String(o.id)===id&&plant(o.kind)));
   // Defer uptake until plant and biofilm requests can share the pool without priority.
   const requests=living.map(([id])=>({id,amount:Math.min(next.availableNmg*PARAMETERS.mineralUptakeFractionPerWetDay/Math.max(1,living.length),PARAMETERS.maxPlantUptakeMgPerWetDay)*root.TECTrophicWeb.lightAt(state,id,next,true)}));
   const result=root.TECTrophicWeb.tick(next,state,requests);
   if(!valid(result))throw Error('Bilancio N violato nel tick');return result;
  }
  const withTrophic=root.TECTrophicWeb.tick(next,state);
  if(!valid(withTrophic))throw Error('Bilancio N violato nel tick');
  return withTrophic;
 }
 function removeLeaf(previous,id){if(!valid(previous))throw Error('Ciclo non valido');
  const next={...previous,leaves:{...previous.leaves}};
  if(Object.hasOwn(next.leaves,id)){next.removedNmg+=next.leaves[id].nMg;delete next.leaves[id];}
  const relocated=root.TECTrophicWeb.removeSurface(next,id);next.trophic=relocated.trophic;next.removedNmg=relocated.removedNmg;
  if(!valid(next))throw Error('Bilancio N foglia rimossa');return next;
 }
 function trim(previous,id,requestedScale){if(!valid(previous))throw Error('Ciclo non valido');
  if(!Number.isFinite(requestedScale)||requestedScale<0)throw Error('Scala di potatura non valida');
  const source=previous.plants[id];if(!source)return previous;
  const currentScale=visualScale(previous,id),fraction=Math.max(0,Math.min(1,Math.pow(requestedScale/Math.max(currentScale,1e-12),2)));
  const next={...previous,plants:{...previous.plants,[id]:{...source,nMg:source.nMg*fraction}},removedNmg:previous.removedNmg+source.nMg*(1-fraction)};
  // A trimmed plant carries away the same fraction of its attached biofilm.
  // This is an explicit uniform-cover convention, not a botanical measurement.
  const surface=previous.trophic.surfaces[id];
  if(surface){const t=root.TECTrophicWeb.clone(previous.trophic);t.last={...previous.trophic.last};
   t.surfaces[id].nMg=surface.nMg*fraction;
   t.surfaces[id].photoNmg=(surface.photoNmg||0)*fraction;
   next.trophic=t;next.removedNmg+=surface.nMg*(1-fraction);
  }
  if(!valid(next))throw Error('Bilancio N potatura');return next;
 }
 function visualScale(s,id){const p=s?.plants?.[id];return p?Math.max(.45,Math.min(PARAMETERS.maxPlantScale,Math.sqrt(p.nMg/p.referenceNmg))):null;}
 function canUpgrade(old){return !!(old&&old.schema===1&&old.leaves&&old.plants&&Number.isSafeInteger(old.processedThroughDay)&&Number.isFinite(old.referenceTotalNmg));}
 function upgrade(old,state){if(!canUpgrade(old)||old.processedThroughDay!==state.day)throw Error('Vecchio ciclo non migrabile');
  const next={...old,schema:VERSION,wasMigrated:true,trophic:root.TECTrophicWeb.begin(state)};
  next.referenceTotalNmg=old.referenceTotalNmg+root.TECTrophicWeb.total(next.trophic);
  if(!valid(next))throw Error('Bilancio della migrazione non valido');return next;
 }
 function addFeed(previous,o){if(!valid(previous))throw Error('Ciclo non valido');
  const next=root.TECTrophicWeb.addFeed(previous,o);if(!valid(next))throw Error('Bilancio dopo alimentazione non valido');return next;
 }
 function describe(s){if(!valid(s))return null;
  return {day:s.processedThroughDay,leafNmg:sum(Object.values(s.leaves).map(x=>x.nMg)),organicNmg:s.detritalNmg,availableNmg:s.availableNmg,
   plantsNmg:sum(Object.values(s.plants).map(x=>x.nMg)),removedNmg:s.removedNmg,trophic:root.TECTrophicWeb.describe(s),totalNmg:total(s),startTotalNmg:s.referenceTotalNmg,plantCount:Object.keys(s.plants).length,leafCount:Object.keys(s.leaves).length,
   proxyLeafCount:Object.values(s.leaves).filter(l=>l.proxyMass).length,migrated:s.wasMigrated,last:s.last,measured:false,chemicalSpecies:'azoto disponibile aggregato (non NH4/NO3)'};
 }
 function selfTest(){const near=(a,b)=>Math.abs(a-b)<1e-8;
  const state={phase:'running',day:0,waterLevel:1,objects:[{id:1,kind:'leaf',leafSpecies:'alnus_glutinosa',hypotheticalDryMassG:null},{id:2,kind:'echinodorus',scale:1}]};
  state.exposureLedger=root.TECWaterLitterInterface.start(state);let c=begin(state);
  const original=c.referenceTotalNmg,pre=c.leaves[1].nMg;
  state.day=1;state.exposureLedger=root.TECWaterLitterInterface.tick(state.exposureLedger,state);c=tick(c,state);
  const works=c.leaves[1].nMg<pre&&c.detritalNmg>0&&c.availableNmg>=0&&c.plants[2].nMg>1&&near(total(c),original);
  const saved=JSON.parse(JSON.stringify(c));const preserved=valid(saved)&&near(total(saved),original);
  const plantScale=visualScale(c,2);c=trim(c,2,plantScale-.12);const trimmed=valid(c)&&c.removedNmg>0;
  c=removeLeaf(c,1);const removed=valid(c)&&!Object.hasOwn(c.leaves,1)&&near(total(c),original);
  state.waterLevel=0;state.day=2;state.exposureLedger=root.TECWaterLitterInterface.tick(state.exposureLedger,state);
  const before=JSON.stringify(c);c=tick(c,state);const dry=near(c.detritalNmg,JSON.parse(before).detritalNmg)&&near(c.availableNmg,JSON.parse(before).availableNmg);
  return {allPassed:works&&preserved&&trimmed&&removed&&dry&&near(total(c),original)&&begin({...state,objects:[]},true).wasMigrated,
   checks:{works,preserved,trimmed,removed,dry,conservation:near(total(c),original)}};
 }
 root.TECEcoCycleN=Object.freeze({VERSION,PARAMETERS,SOURCES,begin,valid,canUpgrade,upgrade,addFeed,tick,removeLeaf,trim,visualScale,describe,total,selfTest});
})(typeof window!=='undefined'?window:globalThis);
