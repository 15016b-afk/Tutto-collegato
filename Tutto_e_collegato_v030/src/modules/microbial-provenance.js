/* Tutto e collegato v0.19 - provenance and scientific eligibility audit.
 * PURE AND READ-ONLY. No populations, biomass, microbial births, activity,
 * stochastic colonisation, transformation rates or hidden observations.
 * Object counts = declared physical items, never microbial cells or inoculum counts.
 */
(function(root){'use strict';
 const SOURCES=Object.freeze([
  Object.freeze({id:'hayer2022',title:'Hayer et al. (2022), The ISME Journal 16:717-725',role:'Fungi carried on leaves and bacteria colonising from stream water; different leaf species and stream mesocosms; cannot establish colonisation in this aquarium.',url:'https://doi.org/10.1038/s41396-021-01114-6'}),
  Object.freeze({id:'epiphytes2008',title:'Epiphytic bacterial community composition on two common submerged macrophytes (2008)',role:'Surface-associated bacterial communities vary with plant and habitat; not an assay of the plants represented in this work.',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2386815/'}),
  Object.freeze({id:'surfaces2012',title:'Reuben et al. (2012), Water Science and Technology',role:'Freshwater surface attachment differs by substrate and environment; exposure or available surface does not prove an established biofilm.',url:'https://doi.org/10.2166/wst.2012.952'}),
  Object.freeze({id:'aquarium2025',title:'Microbial community succession of home aquarium biofilters (2025)',role:'Three home aquaria WITH biofilters: nitrifiers and water chemistry measured. Deliberately non-transferable to a filterless aquarium.',url:'https://doi.org/10.1093/ismeco/ycaf212'}),
  Object.freeze({id:'aquarium2024',title:'McKnight & Neufeld (2024), Applied and Environmental Microbiology',role:'Comammox Nitrospira and other nitrifiers documented in aquarium BIOFILTERS; does not demonstrate their presence or activity without filters.',url:'https://doi.org/10.1128/aem.00104-24'})
 ]);
 const PLANTS=Object.freeze(['echinodorus','cryptocoryne','ceratophyllum','marimo']);
 const ANIMALS=Object.freeze(['shrimp','physa']);
 const SOURCE_KINDS=Object.freeze(['water','leaves','plants','wood','rocks','substrate','animals']);
 const LIMITS=Object.freeze({
  'leaf-breakdown':Object.freeze(['Comunità iniziali non campionate né identificate','Nessuna massa residua misurata nella vasca','Ossigeno e condizioni microambientali non misurati','Destinazioni del carbonio e dell’azoto non quantificate','Cinetica trasferibile non validata']),
  'nitrification':Object.freeze(['Ossidatori di NH₃/NH₄⁺ e NO₂⁻ non documentati nella vasca','Concentrazioni, ossigeno, alcalinità e condizioni locali non misurati','Nessuna prova di attività o velocità in un sistema senza filtro','I dati sui biofiltri non sono trasferibili']),
  'biofilm':Object.freeze(['Microrganismi iniziali non identificati','Colonizzazione e crescita non osservate','Substrati e condizioni locali non calibrati','Nessun criterio quantitativo per comparsa visiva'])
 });
 function count(arr,condition){return arr.reduce((n,x)=>n+(condition(x)?1:0),0)}
 function evaluate(state){
  if(!state||typeof state!=='object')throw Error('Stato della vasca mancante');
  const objects=Array.isArray(state.objects)?state.objects:[];
  const cells=Array.isArray(state.cells)?state.cells:[];
  const wet=Number(state.waterLevel)>0;
  const countKind=k=>count(objects,o=>o&&o.kind===k);
  const countAny=list=>count(objects,o=>o&&list.includes(o.kind));
  const carriers=[
   {key:'water',label:'Acqua immessa',n:wet?1:0,unit:'profilo fisico',type:'Vettore potenziale',note:'La provenienza idrica è dichiarata; microbi presenti, vitalità e composizione non sono noti.'},
   {key:'leaves',label:'Foglie',n:countKind('leaf'),unit:'oggetti',type:'Vettore potenziale',note:'La letteratura mostra microrganismi sulle foglie; il carico delle foglie virtuali non è misurato.'},
   {key:'plants',label:'Piante e alga introdotte',n:countAny(PLANTS),unit:'oggetti',type:'Vettore potenziale',note:'Biofilm epifitici esistono in piante studiate altrove, ma non si assegna un microbioma alle tavole illustrate.'},
   {key:'wood',label:'Legni',n:countKind('wood'),unit:'oggetti',type:'Superficie disponibile',note:'Una superficie inserita non certifica microbi trasportati né colonizzazione.'},
   {key:'rocks',label:'Rocce',n:countKind('rock'),unit:'oggetti',type:'Superficie disponibile',note:'Non sono documentate identità mineralogica e comunità microbiche degli oggetti virtuali.'},
   {key:'substrate',label:'Fondale posato',n:count(cells,x=>Boolean(x)),unit:'celle grafiche',type:'Superficie disponibile',note:'Le celle sono disegno del substrato: non misure di superficie reale né di biomassa.'},
   {key:'animals',label:'Invertebrati introdotti',n:countAny(ANIMALS),unit:'oggetti',type:'Ingresso iniziale',note:'Nessun microbiota trasportato dall’animale è stato identificato; nessuna colonia implicita.'}
  ].filter(x=>x.n>0);
  const feed=countKind('feed');
  const phase=state.phase==='running'?'running':'setup';
  const paths=carriers.map(x=>Object.freeze({...x,status:'possibile, non verificato',microbialPresence:null}));
  const byKey=Object.fromEntries(paths.map(x=>[x.key,x.n]));
  const processes=[
   {key:'leaf-breakdown',label:'Decomposizione della lettiera',contextPresent:wet&&Boolean(byKey.leaves),conditionsMissing:LIMITS['leaf-breakdown']},
   {key:'nitrification',label:'Nitrificazione',contextPresent:wet,conditionsMissing:LIMITS.nitrification},
   {key:'biofilm',label:'Colonizzazione e crescita di biofilm',contextPresent:wet&&paths.some(x=>x.key!=='water'),conditionsMissing:LIMITS.biofilm}
  ].map(x=>Object.freeze({...x,active:false,rate:null,measured:false,status:'non validato',contextPresent:Boolean(x.contextPresent)}));
  const incoming=Array.isArray(state.matterLedger)?state.matterLedger.filter(e=>e&&e.type==='in'):[];
  const suspectLater=incoming.filter(e=>ANIMALS.includes(e.kind)&&e.origin==='alimentazione autorizzata');
  return Object.freeze({phase,wet,day:Number.isInteger(state.day)?state.day:null,paths:Object.freeze(paths),processes:Object.freeze(processes),feedItems:feed,possibleRoutes:paths.length,hasQuantifiedMicrobiome:false,measuredMicrobialAbundance:null,initialMicrobialSpecies: null,biologicalFluxes: null,closedToNewSpecies:phase==='running',historyComplete:state.matterLedgerComplete!==false&&Array.isArray(state.matterLedger),unusualFaunaEntries:suspectLater.length, noLiveMicrobialModel:true});
 }
 function selfTest(){
  const empty={phase:'setup',day:0,waterLevel:0,cells:[],objects:[],matterLedger:[],matterLedgerComplete:true};
  const e=evaluate(empty);
  const a={phase:'running',day:7,waterLevel:1,cells:[{kind:'sand'}],objects:[{id:1,kind:'leaf'},{id:2,kind:'echinodorus'},{id:3,kind:'physa'},{id:4,kind:'feed'}],matterLedger:[],matterLedgerComplete:true};
  const snapshot=JSON.stringify(a),r=evaluate(a),r15=evaluate({...a,day:15});
  const tests={
   dryNoRoutes:e.paths.length===0&&!e.wet,
   wetCarriersOnly:r.paths.some(x=>x.key==='water'&&x.n===1)&&r.paths.some(x=>x.key==='leaves'&&x.n===1),
   feedIsNotColoniser:!r.paths.some(x=>x.key==='feed')&&r.feedItems===1,
   neverInventsMeasuredMicrobes:r.hasQuantifiedMicrobiome===false&&r.measuredMicrobialAbundance===null&&r.initialMicrobialSpecies===null,
   noBiologicalActivation:r.processes.every(x=>x.active===false&&x.rate===null&&x.measured===false&&x.conditionsMissing.length>0),
   timeDoesNotCreateColonisation:JSON.stringify(r.paths)===JSON.stringify(r15.paths),
   noStateMutation:JSON.stringify(a)===snapshot,
   strictInitialClosure:r.closedToNewSpecies&&e.closedToNewSpecies===false,
   noInventedGenealogy:r.paths.every(p=>p.microbialPresence===null&&p.status.includes('non verificato')),
   notEquatingSurfaceWithInoculum:r.paths.find(x=>x.key==='substrate').type==='Superficie disponibile',
   noHistoricalCertainty:!evaluate({...a,matterLedgerComplete:false}).historyComplete,
   dataAuditFlagsExceptionalFauna:evaluate({...a,matterLedger:[{kind:'shrimp',type:'in',origin:'alimentazione autorizzata'}]}).unusualFaunaEntries===1,
   noSpeciesFromLeaf:r.processes[0].active===false&&r.processes[0].contextPresent
  };
  return Object.freeze({allPassed:Object.values(tests).every(Boolean),tests});
 }
 root.TECMicrobialProvenance=Object.freeze({evaluate,selfTest,SOURCES,SOURCE_KINDS});
 if(typeof module==='object'&&module.exports)module.exports=root.TECMicrobialProvenance;
})(typeof window!=='undefined'?window:globalThis);
