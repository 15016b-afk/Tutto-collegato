
/* Dati di laboratorio e campo: non sono flussi del simulatore.
   Le fonti e le loro unità sono esplicitate. */
(function(g){'use strict';
 const BRUDER=Object.freeze({
  id:'Bruder2011',authors:'Bruder, Chauvet e Gessner',year:2011,
  title:'Litter diversity, fungal decomposers and litter decomposition under simulated stream intermittency',
  url:'https://doi.org/10.1111/j.1365-2435.2011.01903.x',
  methods:'Foglie essiccate a 40 °C; immersione per 24 ore in acqua corrente di rubinetto, con successiva essiccazione a massa costante a 65 °C.',
  metric:'Perdita di massa secca per lisciviazione nelle prime 24 ore',
  observations:Object.freeze({
   alnus_glutinosa:Object.freeze({species:'Alnus glutinosa',meanPercent:16.6,ci95HalfWidthPercent:1.1}),
   quercus_ilex:Object.freeze({species:'Quercus ilex',meanPercent:2.9,ci95HalfWidthPercent:0.5})
  })
 });
 const MONROY=Object.freeze({
  id:'Monroy2023',authors:'Monroy et al.',year:2023,
  title:'Temperature Sensitivity of Microbial Litter Decomposition in Freshwaters: Role of Leaf Litter Quality and Environmental Characteristics',
  url:'https://doi.org/10.1007/s00248-022-02041-5',
  methods:'Dischi di foglie essiccati all’aria in sacchetti a maglia fine, immersi per 8 giorni in tre corsi d’acqua; perdita misurata come massa secca senza ceneri (AFDM).',
  metric:'Perdita media di AFDM durante 8 giorni di condizionamento in torrente',
  observations:Object.freeze({alnus_glutinosa:Object.freeze({species:'Alnus glutinosa',meanPercent:27.8,sitePercents:[26.8,28.6,28.0]})})
 });
 function evidenceFor(species){
  if(!species||typeof species!=='string')return {species:null,matched24h:null,matched8d:null};
  const a=BRUDER.observations[species]||null,b=MONROY.observations[species]||null;
  return Object.freeze({species,matched24h:a?Object.freeze({study:BRUDER.id,...a}):null,matched8d:b?Object.freeze({study:MONROY.id,...b}):null});
 }
 function forObjects(objects){if(!Array.isArray(objects))return [];
  return [...new Set(objects.filter(o=>o&&o.kind==='leaf').map(o=>o.leafSpecies||null))].map(evidenceFor);
 }
 function canApplyToTank(){return false;}
 function previewTankTransformation(){throw Error('Nessuna cinetica validata: i dati di lisciviazione non si applicano automaticamente alla vasca.');}
 function selfTest(){let tests={};
  tests.alder24h=evidenceFor('alnus_glutinosa').matched24h.meanPercent===16.6;
  tests.alder8d=evidenceFor('alnus_glutinosa').matched8d.meanPercent===27.8;
  tests.oakRoburNotIlex=evidenceFor('quercus_robur').matched24h===null;
  tests.ilexDistinct=evidenceFor('quercus_ilex').matched24h.meanPercent===2.9;
  tests.unknownNoData=evidenceFor('unknown').matched24h===null;
  tests.separateUnits=BRUDER.metric!==MONROY.metric;
  tests.noTankTransfer=!canApplyToTank();
  try{previewTankTransformation();tests.rejected=false}catch(e){tests.rejected=/non si applicano/.test(e.message)}
  return {allPassed:Object.values(tests).every(Boolean),checks:tests};
 }
 g.TECEarlyLeaching=Object.freeze({BRUDER,MONROY,evidenceFor,forObjects,canApplyToTank,previewTankTransformation,selfTest});
})(typeof window!=='undefined'?window:globalThis);

