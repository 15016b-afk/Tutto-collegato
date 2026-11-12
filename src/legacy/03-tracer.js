

/* Tutto è collegato v0.7 — tracciante matematico NON volatile.
   Non rappresenta pH, GH, KH o una misura della composizione dell'acquario.
   In assenza di ingressi/uscite/reazioni del tracciante, C/C0 = V0/V.
   La validità riguarda soltanto la conservazione ideale in soluzione;
   eventuali rabbocchi sono trattati come acqua senza questo tracciante.
   Fonte di contesto: USGS, Chloride, Salinity and Dissolved Solids,
   https://www.usgs.gov/mission-areas/water-resources/science/chloride-salinity-and-dissolved-solids
*/
(function(root){'use strict';
const SOURCE='https://www.usgs.gov/mission-areas/water-resources/science/chloride-salinity-and-dissolved-solids';
function atBudget(b){
 if(!b||b.cover!=='open'||!Number.isFinite(b.capacityL)||!Number.isFinite(b.currentL)||!Number.isFinite(b.initialL)||b.initialL<=0)return null;
 if(b.currentL<=0)return {factor:null,reason:'volume nullo; non si definisce una concentrazione',source:SOURCE};
 const factor=b.initialL/b.currentL;
 return {factor,percentAbove:(factor-1)*100,source:SOURCE,assumptions:'Soluto non volatile, massa costante, nessuna precipitazione, adsorbimento, rilascio, assorbimento o aggiunta nel rabbocco. È un tracciante ideale, NON una misura dei sali presenti.'};
}
function selfTest(){
 const almost=(a,b)=>Math.abs(a-b)<1e-10;
 const b={cover:'open',capacityL:20,initialL:20,currentL:16};
 const f=atBudget(b);
 const pass=almost(f.factor,1.25)&&almost(f.percentAbove,25)&&atBudget({...b,currentL:20}).factor===1&&atBudget({...b,cover:'ventilated'})===null&&atBudget({...b,currentL:0}).factor===null;
 return {allPassed:pass,example:f};
}
root.TECTracer=Object.freeze({SOURCE,atBudget,selfTest});
})(typeof window!=='undefined'?window:globalThis);


