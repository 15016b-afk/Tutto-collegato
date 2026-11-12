

/* v0.16 - confronto gravimetrico fra due letture della STESSA base analitica.
   NON modifica la simulazione, NON attribuisce destino alla massa e non stima k.
   Fonti metodi: Bärlocher/Gessner/Graça (eds.), Methods to Study Litter
   Decomposition (2020), Springer 10.1007/978-3-030-30515-4;
   Monroy et al. (2023) 10.1007/s00248-022-02041-5;
   Marks (2019) 10.1146/annurev-ecolsys-110218-024755.
*/
(function(root){'use strict';
const SOURCES=Object.freeze([
 {title:'Methods to Study Litter Decomposition: A Practical Guide (2020)',url:'https://doi.org/10.1007/978-3-030-30515-4',role:'metodi per la perdita di massa della lettiera'},
 {title:'Monroy et al. (2023), Microbial Ecology',url:'https://doi.org/10.1007/s00248-022-02041-5',role:'distinzione fra massa secca e AFDM, intervalli e trattamento'},
 {title:'Marks (2019), Annual Review of Ecology, Evolution, and Systematics',url:'https://doi.org/10.1146/annurev-ecolsys-110218-024755',role:'destini distinti del carbonio fogliare'}
]);
const validSpecies=['alnus_glutinosa','quercus_robur'];
function analyze(v){
 if(!v||!validSpecies.includes(v.species))throw Error('Scegli una delle specie documentate nel catalogo.');
 if(!['scenario','external'].includes(v.origin))throw Error('Dichiara se si tratta di uno scenario oppure di dati di campioni indipendenti.');
 if(!['DM','AFDM'].includes(v.basis))throw Error('Seleziona una base: DM oppure AFDM, identica nelle due pesate.');
 if(typeof v.initialG!=='number'||!Number.isFinite(v.initialG)||v.initialG<=0||v.initialG>1e9)throw Error('La massa iniziale deve essere un numero positivo e finito, espresso in grammi.');
 if(typeof v.remainingG!=='number'||!Number.isFinite(v.remainingG)||v.remainingG<0||v.remainingG>1e9)throw Error('La massa residua deve essere un numero non negativo e finito, espresso in grammi.');
 if(!Number.isSafeInteger(v.days)||v.days<=0||v.days>36500)throw Error('Indica un intervallo positivo in giorni interi.');
 const diff=v.initialG-v.remainingG;
 const fraction=v.remainingG/v.initialG;
 const increase=diff<0;
 return Object.freeze({
  species:v.species,origin:v.origin,basis:v.basis,days:v.days,
  initialG:v.initialG,remainingG:v.remainingG,
  differenceG:diff,remainingPct:100*fraction,notRecoveredPct:100*(1-fraction),
  label:increase?'massa finale maggiore della iniziale':'massa non recuperata nel campione',
  requiresCheck:increase,uncalibratedForAquarium:true,biologicalProcessActive:false,
  transferredToWaterG:null,carbonReleasedMg:null,nitrogenReleasedMg:null,
  decompositionRatePerDay:null,carriedIntoTankState:false,
  disclaimer:'Differenza gravimetrica, non misura delle frazioni disciolte/particolate, della mineralizzazione o della decomposizione microbica.'
 });
}
function selfTest(){
 const one={species:'alnus_glutinosa',origin:'scenario',basis:'DM',initialG:1,remainingG:.72,days:8};
 const a=analyze(one),b=analyze({...one,remainingG:0}),c=analyze({...one,remainingG:1.2,origin:'external',basis:'AFDM'});
 const rejects=[{...one,initialG:0},{...one,remainingG:-.1},{...one,days:0},{...one,days:1.5},{...one,origin:'misurato_in_vasca'},{...one,basis:'DM/AFDM'},{...one,initialG:NaN},{...one,species:'eucalyptus_globulus'}, {...one,remainingG:Infinity}]
   .every(arg=>{try{analyze(arg);return false}catch{return true}});
 return {allPassed:Math.abs(a.differenceG-.28)<1e-12&&Math.abs(a.remainingPct-72)<1e-10&&
  Math.abs(a.notRecoveredPct-28)<1e-10&&a.transferredToWaterG===null&&
  a.carriedIntoTankState===false&&a.decompositionRatePerDay===null&&
  b.remainingPct===0&&b.notRecoveredPct===100&&c.requiresCheck&&c.differenceG<0&&rejects};
}
root.TECLeafMassProtocol=Object.freeze({analyze,selfTest,SOURCES});
})(typeof window!=='undefined'?window:globalThis);


