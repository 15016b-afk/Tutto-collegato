

/* Inventario elementare di riferimento, non analisi chimica dell'acquario.
   Rojo et al. (2026), Freshwater Biology, DOI 10.1111/fwb.70163, Table 1.
   Foglie senescenti raccolte dopo abscissione, essiccate all'aria;
   medie +/- SE (n=6), % della massa secca delle foglie raccolte.
   N: A. glutinosa 3.24 +/-0.04%; Q. robur 1.02 +/-0.03%.
   C: A. glutinosa 53.19 +/-0.91%; Q. robur 50.77 +/-0.51%.
   Queste medie NON sono misure della foglia virtuale.
   NON simulare lisciviazione, chimica disciolta, microorganismi o nitrificazione.
*/
(function(root){'use strict';
const SOURCE=Object.freeze({authors:'Rojo et al.',year:2026,title:'Restoration of Riparian Vegetation Can Mitigate Impacts of Agricultural Land Use on Stream Ecosystems',table:'Tabella 1',doi:'10.1111/fwb.70163',url:'https://doi.org/10.1111/fwb.70163',metric:'% di massa secca',error:'errore standard (SE)',n:6,preparation:'lettiera senescente raccolta dopo abscissione; essiccata all’aria'});
const SAMPLES=Object.freeze({
 alnus_glutinosa:Object.freeze({latin:'Alnus glutinosa',label:'Ontano nero',nPct:3.24,nSE:0.04,cPct:53.19,cSE:0.91}),
 quercus_robur:Object.freeze({latin:'Quercus robur',label:'Quercia comune',nPct:1.02,nSE:0.03,cPct:50.77,cSE:0.51})
});
function calc(species,dryGrams){
 if(!Object.hasOwn(SAMPLES,species))throw Error('Specie non documentata nel protocollo');
 if(typeof dryGrams!=='number'||!Number.isFinite(dryGrams)||dryGrams<=0||dryGrams>1e9)throw Error('Massa secca ipotizzata non valida');
 const s=SAMPLES[species],factor=10*dryGrams;
 return Object.freeze({species,grams:dryGrams,nMg:s.nPct*factor,nSEmg:s.nSE*factor,cMg:s.cPct*factor,cSEmg:s.cSE*factor,measuredInAquarium:false,source:SOURCE.url});
}
function inventory(objects){
 if(!Array.isArray(objects))throw Error('Inventario non valido');
 const out={totalLeafCount:0,estimableCount:0,unestimatedCount:0,estimatedDryG:0,referenceNmg:0,referenceCmg:0,items:[],source:SOURCE.url,measuredInAquarium:false};
 for(const o of objects){
  if(!o||o.kind!=='leaf')continue;
  out.totalLeafCount++;
  if(!Object.hasOwn(SAMPLES,o.leafSpecies)||typeof o.hypotheticalDryMassG!=='number'||!Number.isFinite(o.hypotheticalDryMassG)||o.hypotheticalDryMassG<=0||o.hypotheticalDryMassG>1e9){out.unestimatedCount++;continue;}
  const e=calc(o.leafSpecies,o.hypotheticalDryMassG);
  out.estimableCount++;out.estimatedDryG+=e.grams;out.referenceNmg+=e.nMg;out.referenceCmg+=e.cMg;
  out.items.push({id:o.id,label:SAMPLES[o.leafSpecies].label,...e});
 }
 return out;
}
function selfTest(){
 const a=calc('alnus_glutinosa',1),q=calc('quercus_robur',.5);
 const batch=inventory([{id:1,kind:'leaf',leafSpecies:'alnus_glutinosa',hypotheticalDryMassG:1},{id:2,kind:'leaf',leafSpecies:'quercus_robur',hypotheticalDryMassG:.5},{id:3,kind:'leaf',leafSpecies:null,hypotheticalDryMassG:null},{id:4,kind:'shrimp'}]);
 const after=inventory([{id:2,kind:'leaf',leafSpecies:'quercus_robur',hypotheticalDryMassG:.5}]);
 let bad=0;for(const [s,m] of [['quercus_serrata',1],['alnus_glutinosa',0],['alnus_glutinosa',NaN],['alnus_glutinosa',-1]]){try{calc(s,m)}catch{bad++}}
 const close=(a,b)=>Math.abs(a-b)<1e-9;
 return {allPassed:close(a.nMg,32.4)&&close(a.cMg,531.9)&&close(q.nMg,5.1)&&close(q.cMg,253.85)&&close(batch.referenceNmg,37.5)&&close(after.referenceNmg,5.1)&&batch.estimableCount===2&&batch.unestimatedCount===1&&after.totalLeafCount===1&&batch.measuredInAquarium===false&&bad===4};
}
root.TECLeafInventory=Object.freeze({SOURCE,SAMPLES,calc,inventory,selfTest});
})(typeof window!=='undefined'?window:globalThis);


