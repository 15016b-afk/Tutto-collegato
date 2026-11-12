
/* Tutto è collegato — Ecosistema v0.21
 * Catalogo di prerequisiti EPISTEMICI, non biofisici. Stato read-only.
 * Classi: documented_state = operazione rappresentata nello stato del prototipo;
 * hypothetical = dichiarazione ipotetica; bibliographic = risultato di un altro sistema;
 * absent = materiale non presente; unknown = non misurato/non verificato.
 * Anche tutti i documentati insieme NON attivano alcun processo biologico.
 * Fonti: Hayer et al. 2022 DOI 10.1038/s41396-021-01114-6;
 * Bärlocher et al. 2020 DOI 10.1007/978-3-030-30515-4;
 * USGS DO protocol 2020 DOI 10.3133/tm9A6.2;
 * USEPA Dissolved Oxygen 2015: https://www.epa.gov/caddis/dissolved-oxygen
 */
(function(root){'use strict';
 const SOURCES=Object.freeze([
  Object.freeze({name:'Hayer et al., The ISME Journal 16 (2022), 717–725',url:'https://doi.org/10.1038/s41396-021-01114-6',scope:'Microbi su foglie e acqua di torrente, con metodo di crescita specifico; non prova alcuna colonizzazione della vasca.'}),
  Object.freeze({name:'Bärlocher, Gessner, Graça (eds.), Methods to Study Litter Decomposition, 2020',url:'https://doi.org/10.1007/978-3-030-30515-4',scope:'Metodi sperimentali sulla lettiera; la massa non recuperata non identifica automaticamente un compartimento o processo.'}),
  Object.freeze({name:'USGS, Chapter A6.2 Dissolved Oxygen (2020)',url:'https://doi.org/10.3133/tm9A6.2',scope:'Misura strumentale dell’ossigeno con calibrazione; una concentrazione a saturazione di letteratura NON è la misura della vasca.'}),
  Object.freeze({name:'US EPA, Dissolved Oxygen',url:'https://www.epa.gov/caddis/dissolved-oxygen',scope:'Il bilancio dell’ossigeno dipende da molteplici fattori; non si deduce un consumo da una sola osservazione.'})
 ]);
 const CLASS=Object.freeze({documented_state:'STATO DEL GIOCO',hypothetical:'SCENARIO IPOTETICO',bibliographic:'RIFERIMENTO BIBLIOGRAFICO',absent:'NON PRESENTE',unknown:'NON VERIFICATO'});
 const SPEC=Object.freeze([
  Object.freeze({key:'leaf-breakdown',name:'Decomposizione della lettiera'}),
  Object.freeze({key:'nitrification',name:'Nitrificazione'}),
  Object.freeze({key:'biofilm',name:'Colonizzazione e crescita del biofilm'})
 ]);
 const req=(key,label,status,detail,origin)=>Object.freeze({key,label,status,detail,origin:origin||'nessuna misura disponibile',isTankMeasurement:false});
 const ifPresent=(key,label,exists,yes,no)=>req(key,label,exists?'documented_state':'absent',exists?yes:no,'stato fisico/oggetti del prototipo');
 function evaluate(state){
  if(!state||typeof state!=='object')throw new TypeError('Stato della vasca mancante');
  const objects=Array.isArray(state.objects)?state.objects:[];
  const cells=Array.isArray(state.cells)?state.cells:[];
  const wet=typeof state.waterLevel==='number'&&Number.isFinite(state.waterLevel)&&state.waterLevel>0;
  const leaf=objects.filter(x=>x&&x.kind==='leaf');
  const surface=objects.some(x=>x&&['rock','wood','echinodorus','cryptocoryne','ceratophyllum','marimo','leaf'].includes(x.kind))||cells.some(Boolean);
  const mass=leaf.filter(x=>Number.isFinite(x.hypotheticalDryMassG)&&x.hypotheticalDryMassG>0).length;
  // A valid inventory is not evidence of microorganisms. Integrity is read from
  // the existing audit, not derived by assuming every ledger to be complete.
  const historical=root.TECMicrobialEntryHistory&&typeof root.TECMicrobialEntryHistory.evaluate==='function'
   ?root.TECMicrobialEntryHistory.evaluate(state):null;
  const provenance=historical?historical.confidence:'parziale';
  const water=()=>ifPresent('water','Acqua nello stato visivo',wet,'Acqua presente: nessuna concentrazione o immersione locale misurata.','Vasca asciutta: nessun ambiente acquatico rappresentato.');
  const micro=()=>req('microbial-activity','Presenza e attività dei microbi','unknown','Nessuna identificazione, attività, biomassa o vitalità misurata nella vasca.');
  const oxygen=()=>req('oxygen','Ossigeno disciolto nella vasca','unknown','L’eventuale O₂ a saturazione è un confronto, non una misura locale.');
  const temporal=()=>req('temporal-measures','Serie temporale nella vasca','unknown','I protocolli su campioni esterni non diventano automaticamente osservazioni del gioco.');
  const provenanceReq=()=>req('provenance','Tracciabilità storica di oggetti introdotti',provenance==='integro'?'documented_state':'unknown',provenance==='integro'?'Registro oggetti coerente; non certifica microrganismi.':`Registro ${provenance}: nessuna ricostruzione retroattiva di organismi.`, 'registro oggetti, non microbi');
  const processes=[
   {
    key:'leaf-breakdown',name:SPEC[0].name,requirements:[
     water(), ifPresent('leaves','Foglie fisicamente presenti',leaf.length>0,`${leaf.length} foglie visibili. Non sono automaticamente immerse o biologicamente attive.`,'Nessuna foglia attualmente presente.'),
     provenanceReq(),
     req('mass','Massa iniziale delle foglie',mass>0?'hypothetical':'unknown',mass>0?`${mass} foglie con massa secca IPOTIZZATA, non campionata.`:'Nessuna massa secca reale misurata della vasca.','catalogo foglie, dichiarazioni facoltative'),
     temporal(),micro(),oxygen(),
     req('carbon-nitrogen','Destinazione di C e N','unknown','DOC, frammenti, CO₂, biomassa, azoto mineralizzato e gas non contabilizzati in compartimenti misurati.')
    ]
   },
   {
    key:'nitrification',name:SPEC[1].name,requirements:[
     water(),provenanceReq(),
     req('nitrifiers','Nitrificanti attivi nella vasca','unknown','Origine potenziale ≠ prova di ossidatori dell’ammonio o del nitrito.'),
     req('nitrogen-series','NH₄-N, NO₂-N e NO₃-N locali','unknown','Non è disponibile una serie di concentrazioni misurate nella vasca.'),
     oxygen(),
     req('local-conditions','pH, temperatura, alcalinità locali','unknown','Profili d’acqua e stagioni non sono analisi strumentali.'),
     req('epa-reference','Rapporti stechiometrici','bibliographic','I rapporti teorici non determinano una velocità né provano che il processo avvenga.','riferimento EPA preesistente')
    ]
   },
   {
    key:'biofilm',name:SPEC[2].name,requirements:[
     water(),ifPresent('surfaces','Superfici disponibili nel disegno',surface,'Piante/materiali/celle grafiche presenti, ma non superfici reali misurate.','Nessuna superficie di appoggio aggiuntiva documentata.'),
     provenanceReq(),micro(),
     req('biofilm-local','Biofilm osservato localmente','unknown','Nessun campionamento o osservazione quantitativa localizzata attribuibile al sistema.'),
     req('biofilm-growth','Crescita nel tempo','unknown','Nessuna misura ripetuta o cinetica specifica valida per le superfici rappresentate.')
    ]
   }
  ].map(p=>Object.freeze({...p,requirements:Object.freeze(p.requirements),active:false,activationAllowed:false,rate:null,observedFlux:null,validated:false}));
  return Object.freeze({version:'0.21',day:Number.isInteger(state.day)?state.day:null,waterPresent:wet,leafCount:leaf.length,hypotheticalLeafMassCount:mass,hasAvailableSurface:surface,historyStatus:provenance,
   processes:Object.freeze(processes),activeProcesses:0,measuredTankOxygen:null,measuredTankNitrogen:null,measuredTankMicrobes:null,biologicalFluxes:null,
   onlyReadState:true,noKineticsIntroduced:true,distinguishesExternalProtocols:true});
 }
 function selfTest(){
  const base={day:0,phase:'setup',waterLevel:0,objects:[],cells:[],matterLedger:[],matterLedgerComplete:true};
  const dry=evaluate(base);
  const leaf={id:1,kind:'leaf',hypotheticalDryMassG:1};
  const initial={...base,day:0,waterLevel:1,objects:[leaf],cells:[{kind:'sand'}],matterLedger:[{id:1,kind:'leaf',type:'in',day:0,origin:'allestimento iniziale'}]};
  const before=JSON.stringify(initial),wet=evaluate(initial),week=evaluate({...initial,day:7});
  const removed=evaluate({...initial,day:7,objects:[],matterLedger:[...initial.matterLedger,{id:1,kind:'leaf',type:'out',day:7,origin:'rimozione manuale della foglia'}]});
  const incomplete=evaluate({...initial,matterLedgerComplete:false});
  const highWater=evaluate({...initial,waterLevel:.35});
  const allReq=r=>r.processes.flatMap(x=>x.requirements);
  const checks={
   dryHasNoAquaticContext:dry.waterPresent===false&&dry.processes[0].requirements[0].status==='absent',
   fullWaterIsNotOxygen:wet.waterPresent===true&&wet.measuredTankOxygen===null,
   physicalLeafIsNotDecomposition:wet.leafCount===1&&wet.processes[0].active===false,
   leafMassOnlyHypothesis:wet.processes[0].requirements.find(x=>x.key==='mass').status==='hypothetical',
   noFluxesEver:wet.processes.every(x=>!x.activationAllowed&&x.rate===null&&x.observedFlux===null),
   noConversionOfReferenceToMeasurement:allReq(wet).filter(x=>x.status==='bibliographic').every(x=>x.isTankMeasurement===false),
   noNonexistentMeasurements:allReq(wet).every(x=>!x.isTankMeasurement),
   dayNoColonisation:JSON.stringify(wet.processes)===JSON.stringify(week.processes),
   removalChangesCurrentMaterial:removed.leafCount===0&&removed.processes[0].requirements.find(x=>x.key==='leaves').status==='absent',
   historyNotBiologicalPersistence:removed.historyStatus==='integro'&&removed.measuredTankMicrobes===null,
   incompleteHistoryUnknown:incomplete.historyStatus==='parziale'&&incomplete.processes[0].requirements.find(x=>x.key==='provenance').status==='unknown',
   partialWaterNotMeasured:highWater.waterPresent&&highWater.measuredTankOxygen===null,
   pure:JSON.stringify(initial)===before,
   everyProcessNeedsMeasurement:wet.processes.every(p=>p.requirements.some(x=>x.status==='unknown')),
   allCategoriesDeclared:allReq(wet).every(x=>Object.hasOwn(CLASS,x.status))
  };
  return Object.freeze({allPassed:Object.values(checks).every(Boolean),tests:Object.freeze(checks)});
 }
 root.TECProcessEvidenceGates=Object.freeze({evaluate,selfTest,SOURCES,CLASS,SPEC});
 if(typeof module==='object'&&module.exports)module.exports=root.TECProcessEvidenceGates;
})(typeof window!=='undefined'?window:globalThis);

