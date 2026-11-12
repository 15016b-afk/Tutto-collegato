/* Tutto e collegato v0.26 — O2 disciolto: SOLO SCENARIO, NON SENSORI.
 * Unita: mg O2 come stock e mg/L come concentrazione derivata dal volume fisico.
 * Principi: USGS dissolved oxygen; HEC USACE water-quality DO modules.
 * Sorgenti/sink: fotosintesi, respirazione, richiesta della mineralizzazione,
 * scambio aria-acqua. Conservazione del solo stock di O2 con flussi cumulati.
 * NON c'e bilancio del carbonio o stechiometria di fotosintesi, nitrificazione,
 * pH, solubilita effettiva o misura di una vasca. TUTTI i tassi sotto sono
 * CONVENZIONI ludiche illustrative e NON valori ricavati dalle fonti.
 */
(function(root){'use strict';
 const VERSION=1;
 const P=Object.freeze({temperatureScenarioC:20,initialDoMgL:7.8,daylightFraction:0.5,
   biofilmPhotosynthesisMgO2PerMgNDay:4.0,plantPhotosynthesisMgO2PerMgNDay:5.5,plantRespirationMgO2PerMgNDay:0.75,
   animalRespirationMgO2PerMgNDay:1.5,biofilmRespirationMgO2PerMgNDay:0.9,
   mineralDemandMgO2PerMgN:4.0,airExchangePerHalfDayOpen:0.17,
   airExchangePerHalfDayVentilated:0.09,maxSaturationFraction:1.5,
   hypoxiaSevereMgL:2,hypoxiaModerateMgL:4,hypoxiaPartialMgL:6});
 const SOURCES=Object.freeze({do:'https://www.usgs.gov/water-science-school/science/dissolved-oxygen-and-water',
    usace:'https://www.hec.usace.army.mil/confluence/ResSimDocs/rswqum/appendix-a-technical-background-for-water-quality-modules',
    saturation:root.TECOxygenReference.SOURCE.url});
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 const saturation=()=>root.TECOxygenReference.atTemperature(P.temperatureScenarioC).mgL;
 const volume=state=>{if(state.waterBudget&&state.waterBudget.cover==='open'&&finite(state.waterBudget.currentL))return Math.max(0,state.waterBudget.currentL);
   return Math.max(0,(Number(state.capacity)||20)*clamp(Number(state.waterLevel)||0,0,1));};
 const emptyLast=(d)=>({photosynthesisMg:0,respirationMg:0,mineralDemandMg:0,airExchangeMg:0,
     topOffMg:0,unmetOxygenMg:0,dayPeakMgL:d,nightEndMgL:d,lowestMgL:d});
 function begin(state,migrated=false){const l=volume(state),initial=l*P.initialDoMgL;
  return {schema:VERSION,processedThroughDay:state.day,fromDay:state.day,wasMigrated:!!migrated,
   waterL:l,oxygenMg:initial,initialOxygenMg:initial,
   totalPhotosynthesisMg:0,totalRespirationMg:0,totalMineralDemandMg:0,totalAirExchangeMg:0,totalTopOffMg:0,
   last:emptyLast(l?P.initialDoMgL:0)};
 }
 function expected(s){return s.initialOxygenMg+s.totalPhotosynthesisMg+s.totalAirExchangeMg+s.totalTopOffMg-s.totalRespirationMg-s.totalMineralDemandMg;}
 function concentration(s){return s&&s.waterL>0?s.oxygenMg/s.waterL:0;}
 function valid(s){if(!s||s.schema!==VERSION||!Number.isSafeInteger(s.processedThroughDay)||s.processedThroughDay<0||!Number.isSafeInteger(s.fromDay)||s.fromDay>s.processedThroughDay||s.fromDay<0||!s.last)return false;
   const nums=[s.waterL,s.oxygenMg,s.initialOxygenMg,s.totalPhotosynthesisMg,s.totalRespirationMg,s.totalMineralDemandMg,s.totalAirExchangeMg,s.totalTopOffMg];
   if(!nums.every(finite)||nums.slice(0,3).some(x=>x<0)||nums.slice(3,6).some(x=>x<0)||s.totalTopOffMg<0)return false;
   if(!Object.entries(s.last).every(([key,x])=>finite(x)&&(x>=0||key==='airExchangeMg')))return false;
   return Math.abs(expected(s)-s.oxygenMg)<1e-7*Math.max(1,s.oxygenMg,s.initialOxygenMg);
 }
 // Usa la concentrazione corrente: un rabbocco aerato modifica subito la disponibilita.
 function oxygenFactor(s){if(!valid(s))return 1;
   const x=concentration(s);
   if(s.waterL<=0)return 0;
   if(x<P.hypoxiaSevereMgL)return .15;
   if(x<P.hypoxiaModerateMgL)return .45;
   if(x<P.hypoxiaPartialMgL)return .75;
   return 1;
 }
 function tick(previous,state){if(!valid(previous)||state.day!==previous.processedThroughDay+1)throw Error('O2 giorno non sequenziale');
   const next={...previous,processedThroughDay:state.day,waterL:volume(state),last:emptyLast(0)};
   const wet=next.waterL>0;
   if(!wet){next.totalAirExchangeMg-=next.oxygenMg;next.last.airExchangeMg=-next.oxygenMg;next.oxygenMg=0;
     if(!valid(next))throw Error('O2 secco non conservativo');return next;}
   const c=state.ecoCycleN||{};
   const plants=Object.values(c.plants||{}).reduce((a,p)=>a+p.nMg,0);
   const animals=Object.values(c.trophic?.animals||{}).reduce((a,p)=>a+p.nMg,0);
   const biofilm=Object.values(c.trophic?.surfaces||{}).reduce((a,p)=>a+p.nMg,0);
   const litPlants=Object.entries(c.plants||{}).reduce((a,[id,p])=>a+p.nMg*(root.TECTrophicWeb?root.TECTrophicWeb.lightAt(state,id,c,true):1),0);
   const litBiofilm=Object.entries(c.trophic?.surfaces||{}).reduce((a,[id,p])=>a+(p.photoNmg||0)*(root.TECTrophicWeb?root.TECTrophicWeb.lightAt(state,id,c):1),0);
   const photo=litPlants*P.plantPhotosynthesisMgO2PerMgNDay+litBiofilm*P.biofilmPhotosynthesisMgO2PerMgNDay;
   const respiration=plants*P.plantRespirationMgO2PerMgNDay+animals*P.animalRespirationMgO2PerMgNDay+biofilm*P.biofilmRespirationMgO2PerMgNDay;
   const mineral=Number(c.last?.detritusToAvailableMg||0)*P.mineralDemandMgO2PerMgN;
   const k=state.cover==='ventilated'?P.airExchangePerHalfDayVentilated:P.airExchangePerHalfDayOpen;
   let lowest=concentration(next);
   for(const lit of [true,false]){
     const made=lit?photo:0;next.oxygenMg+=made;next.totalPhotosynthesisMg+=made;next.last.photosynthesisMg+=made;
     const requestR=respiration/2,requestM=mineral/2,total=requestR+requestM;
     const consumed=Math.min(next.oxygenMg,total),rat=total?consumed/total:0;
     const usedR=requestR*rat,usedM=requestM*rat;
     next.oxygenMg-=consumed;lowest=Math.min(lowest,concentration(next));next.totalRespirationMg+=usedR;next.totalMineralDemandMg+=usedM;
     next.last.respirationMg+=usedR;next.last.mineralDemandMg+=usedM;
     next.last.unmetOxygenMg+=total-consumed;
     // Bulk re-aeration in a still vessel is a proxy; saturation is literature reference at assumed 20 C.
     let flux=k*(saturation()*next.waterL-next.oxygenMg);
     next.oxygenMg+=flux;
     const ceiling=P.maxSaturationFraction*saturation()*next.waterL;
     if(next.oxygenMg>ceiling){flux-=next.oxygenMg-ceiling;next.oxygenMg=ceiling;}
     next.totalAirExchangeMg+=flux;next.last.airExchangeMg+=flux;
     const doNow=concentration(next);lowest=Math.min(lowest,doNow);
     if(lit)next.last.dayPeakMgL=doNow;else next.last.nightEndMgL=doNow;
   }
   next.last.lowestMgL=lowest;
   if(!valid(next))throw Error('Bilancio di O2 violato');return next;
 }
 function topOff(old,addedL){if(!valid(old)||!finite(addedL)||addedL<0)throw Error('Rabbocco O2 non valido');
   if(!addedL)return old;
   // L'acqua di rabbocco viene rappresentata come acqua aerata a 7.8 mg/L.
   const extra=addedL*P.initialDoMgL;
   const next={...old,waterL:old.waterL+addedL,oxygenMg:old.oxygenMg+extra,totalTopOffMg:old.totalTopOffMg+extra,
       last:{...old.last,topOffMg:old.last.topOffMg+extra}};
   if(!valid(next))throw Error('Bilancio O2 di rabbocco');return next;
 }
 function describe(s){if(!valid(s))return null;
   return {day:s.processedThroughDay,doMgL:concentration(s),waterL:s.waterL,
    oxygenMg:s.oxygenMg,saturationMgL:saturation(),temperatureScenarioC:P.temperatureScenarioC,
    scenario:true,measured:false,fromDay:s.fromDay,migrated:s.wasMigrated,
    availability:oxygenFactor(s),last:s.last,balanceErrorMg:s.oxygenMg-expected(s)};
 }
 function selfTest(){const s={capacity:20,day:0,waterLevel:1,cover:'open',ecoCycleN:{plants:{p:{nMg:1}},trophic:{animals:{},surfaces:{}},last:{detritusToAvailableMg:.02}}};
   let x=begin(s);s.day=1;x=tick(x,s);const one=valid(x)&&x.last.photosynthesisMg>0&&x.last.respirationMg>0;
   const top=topOff(x,.3);return {allPassed:one&&valid(top)&&top.totalTopOffMg>x.totalTopOffMg&&oxygenFactor(top)===1,
     checks:{one,balance:valid(x),topOff:valid(top)}};}
 root.TECOxygenCycle=Object.freeze({VERSION,PARAMETERS:P,SOURCES,begin,valid,tick,topOff,describe,oxygenFactor,concentration,expected,volume,selfTest});
})(typeof window!=='undefined'?window:globalThis);
