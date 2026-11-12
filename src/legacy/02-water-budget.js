

/* TEC v0.13 — Bilancio idrico: misure sperimentali su acqua dolce, NON misurazione della vasca.
 * Natarajan, Raja, Marichamy & Rajagopal (2009), Curr. Res. J. Biol. Sci. 1(3):72–77, Table 4.
 * Contenitori cilindrici aperti da 14 L, osservati per 15 giorni in quattro ambienti.
 * Per acqua dolce: A/C=1.367, edificio acquario=2.203, stanza non A/C=3.526 L/m²/giorno.
 * Sono condizioni osservate DIFFERENTI, non confidenza statistica; la prova all'aperto (9.737)
 * non è inclusa perché il gioco simula un interno. Nessuna temperatura, umidità o geometria
 * precisa è stata misurata nella vasca del gioco.
 * La vasca coperta ventilata non è calibrata e non viene simulata come perdita zero.
 * Migrazione: i bilanci legacy v0.6–v0.12 proseguono con IL PROPRIO modello storico,
 * evitando riscritture retroattive o cambi di velocità non dichiarati.
 */
(function(global){'use strict';
const EXPERIMENT=Object.freeze({model:'freshwater-indoor-benchmark-2009',rateLPerM2Day:2.203,observedIndoorLowLPerM2Day:1.367,observedIndoorHighLPerM2Day:3.526,initialContainerL:14,observationDays:15,source:'Natarajan, Raja, Marichamy e Rajagopal (2009), Effect of Temperature, Dissolved Oxygen Variation and Evaporation Rate in Marine Aquarium, Tabella 4: prove su acqua dolce',url:'https://citeseerx.ist.psu.edu/document?doi=a591c4aaef67c0e5c4f758098df4d5dc69faa769&repid=rep1&type=pdf',details:'Contenitori aperti di acqua dolce da 14 L misurati per 15 giorni in un edificio per acquari e in due stanze. Le tre portate rappresentano ambienti diversi, non un intervallo di confidenza statistico.'});
const LEGACY_EXPERIMENT=Object.freeze({model:'published-indoor-pool-scenario',rateKgPerM2Hour:0.060,waterC:26,airC:28,relativeHumidityPct:44,surfaceM2:0.6732,source:'Rzeźnik e Rzeźnik (2025), Experimental measurements of water evaporation rate in indoor swimming pools',url:'https://doi.org/10.36119/15.2025.12.11'});
const MODEL=EXPERIMENT.model,EPS=1e-8;
function requireCapacity(v){if(![20,40,60].includes(v))throw Error('Capacità ammessa: 20, 40, 60 L');return v;}
function geometry(litres){requireCapacity(litres);const h=Math.cbrt(litres/2000);return {heightM:h,widthM:2*h,depthM:h,surfaceM2:2*h*h,assumption:'Vasca prismatica con larghezza:altezza:profondità = 2:1:1; la forma è una convenzione geometrica e non una misura della vasca.'};}
function rateFor(model){if(model===LEGACY_EXPERIMENT.model)return LEGACY_EXPERIMENT.rateKgPerM2Hour*24;if(model===MODEL)return EXPERIMENT.rateLPerM2Day;throw Error('Modello non riconosciuto');}
function dailyLitres(litres,model=MODEL){return rateFor(model)*geometry(litres).surfaceM2;}
function referenceBand(litres,days){requireCapacity(litres);if(!Number.isInteger(days)||days<0)throw Error('Giorni non validi');const a=geometry(litres).surfaceM2;return Object.freeze({lowL:Math.min(litres,EXPERIMENT.observedIndoorLowLPerM2Day*a*days),referenceL:Math.min(litres,EXPERIMENT.rateLPerM2Day*a*days),highL:Math.min(litres,EXPERIMENT.observedIndoorHighLPerM2Day*a*days),differentConditions:true,validatedForAquarium:false});}
function begin(litres,day,covered,atLitres=litres){requireCapacity(litres);if(!Number.isInteger(day)||day<0)throw Error('Giorno non valido');if(!Number.isFinite(atLitres)||atLitres<0||atLitres>litres+EPS)throw Error('Volume iniziale non valido');return {schema:1,model:MODEL,beginDay:day,capacityL:litres,cover:covered?'ventilated':'open',initialL:atLitres,currentL:atLitres,lostL:0,addedL:0,daysModeled:0,calibratedForAquarium:false};}
function valid(v){if(!v||v.schema!==1||![20,40,60].includes(v.capacityL)||!['open','ventilated'].includes(v.cover))return false;
 if(![MODEL,LEGACY_EXPERIMENT.model].includes(v.model))return false;
 return ['initialL','currentL','lostL','addedL','daysModeled'].every(k=>Number.isFinite(v[k])&&v[k]>=0)&&Number.isInteger(v.daysModeled)&&v.currentL<=v.capacityL+EPS&&Math.abs(v.initialL+v.addedL-v.lostL-v.currentL)<1e-6;}
function advanceDay(b){if(!valid(b))throw Error('Bilancio acqua corrotto');const n={...b,daysModeled:b.daysModeled+1};if(b.cover==='ventilated')return n;
 const loss=Math.min(b.currentL,dailyLitres(b.capacityL,b.model));n.currentL=Math.max(0,b.currentL-loss);n.lostL=b.lostL+loss;return n;}
function topOff(b){if(!valid(b))throw Error('Bilancio acqua corrotto');if(b.cover==='ventilated')throw Error('Rabbocco non quantificabile con coperchio non calibrato');const missing=Math.max(0,b.capacityL-b.currentL);if(missing<=EPS)return {budget:{...b},addedL:0};const n={...b,currentL:b.capacityL,addedL:b.addedL+missing};return {budget:n,addedL:missing};}
function level(b){if(!valid(b))throw Error('Bilancio acqua corrotto');return b.currentL/b.capacityL;}
function dropMm(b){if(!valid(b))throw Error('Bilancio acqua corrotto');return (b.capacityL-b.currentL)/geometry(b.capacityL).surfaceM2; /* 1 L / m² = 1 mm */ }
function selfTest(){let checks={};for(const c of [20,40,60]){let b=begin(c,0,false);for(let i=0;i<7;i++)b=advanceDay(b);checks['conservation'+c]=valid(b);checks['rate'+c]=Math.abs(b.lostL-7*dailyLitres(c))<1e-7;checks['level'+c]=Math.abs(dropMm(b)-7*EXPERIMENT.rateLPerM2Day)<1e-7;let top=topOff(b);checks['refill'+c]=valid(top.budget)&&Math.abs(top.budget.currentL-c)<EPS&&Math.abs(dropMm(top.budget))<1e-8;let band=referenceBand(c,7);checks['band'+c]=band.lowL<band.referenceL&&band.referenceL<band.highL;}
 let legacy=begin(20,0,false);legacy.model=LEGACY_EXPERIMENT.model;for(let i=0;i<7;i++)legacy=advanceDay(legacy);checks.legacyPreserved=valid(legacy)&&Math.abs(legacy.lostL-7*dailyLitres(20,LEGACY_EXPERIMENT.model))<1e-7;
 let covered=begin(40,0,true);for(let i=0;i<7;i++)covered=advanceDay(covered);checks.coverUncalibrated=covered.currentL===40&&covered.lostL===0;checks.coverTopOffGuard=(()=>{try{topOff(covered);return false}catch{return true}})();
 let long=begin(20,0,false);for(let i=0;i<500;i++)long=advanceDay(long);checks.noNegativeWater=long.currentL>=0&&valid(long);checks.malformedRejected=(()=>{try{advanceDay({...begin(20,0,false),lostL:5});return false}catch{return true}})();return {allPassed:Object.values(checks).every(Boolean),checks};}
global.TECWaterBudget=Object.freeze({EXPERIMENT,LEGACY_EXPERIMENT,MODEL,geometry,dailyLitres,referenceBand,begin,valid,advanceDay,topOff,level,dropMm,selfTest});
})(typeof window!=='undefined'?window:globalThis);


