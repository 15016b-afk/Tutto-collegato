
/* Tutto è collegato — Ecosistema v0.20
 * Audit puramente documentale di ingressi/uscite degli oggetti che POSSONO
 * veicolare microbi. Non ricostruisce cellule, taxa, vitalità o colonizzazione.
 * Distingue elementi presenti da introdotti storicamente e rimossi: rimuovere
 * una foglia non permette di cancellare, né di confermare, la sua precedente
 * opportunità d'ingresso microbico.
 * Hayer et al. 2022, ISME J 16:717-725 (DOI 10.1038/s41396-021-01114-6)
 * confronta foglie e acqua in mesocosmi di TORRENTE: non trasferire quote alla vasca.
 */
(function(root){'use strict';
 const KINDS=Object.freeze([
  ['leaf','Foglie'],['echinodorus','Echinodorus'],['cryptocoryne','Cryptocoryne'],
  ['ceratophyllum','Ceratophyllum'],['marimo','Marimo'],['wood','Legni'],
  ['rock','Rocce'],['shrimp','Neocaridina'],['physa','Physa']
 ]);
 const NAMES=Object.freeze(Object.fromEntries(KINDS));
 const FIELDS=Object.freeze(['entered','removed','present']);
 const SOURCE=Object.freeze({title:'Hayer et al. (2022), The ISME Journal 16:717–725',url:'https://doi.org/10.1038/s41396-021-01114-6',scope:'Mesocosmi di torrente con foglie, acqua e sedimenti; non un acquario domestico senza filtro.'});
 const isId=v=>Number.isSafeInteger(v)&&v>0;
 const isDay=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
 function evaluate(state){
  if(!state||typeof state!=='object')throw new TypeError('Stato non disponibile');
  const objects=Array.isArray(state.objects)?state.objects:[];
  const ledger=Array.isArray(state.matterLedger)?state.matterLedger:null;
  const maxDay=Number.isSafeInteger(state.day)&&state.day>=0?state.day:null;
  const complete=state.matterLedgerComplete===true&&Boolean(ledger);
  const problems=[],entries=new Map(),present=new Map(),seenIds=new Set();
  for(const o of objects){
   if(!o||!Object.hasOwn(NAMES,o.kind))continue;
   if(!isId(o.id)||seenIds.has(o.id)){
    problems.push('ID di un oggetto attuale non valido o duplicato');continue;
   }
   seenIds.add(o.id);present.set(o.id,o);
  }
  if(ledger){
   for(const e of ledger){
    if(!e||!Object.hasOwn(NAMES,e.kind))continue;
    if(!isId(e.id)){problems.push('ID di evento non valido');continue;}
    if(maxDay===null||!isDay(e.day,maxDay))problems.push('Giorno di evento mancante o fuori intervallo');
    if(e.type==='in'){
     if(entries.has(e.id)){problems.push('Ingresso duplicato o ID riciclato');continue;}
     entries.set(e.id,{id:e.id,kind:e.kind,day:e.day,origin:e.origin||null,outDay:null});
     if(e.origin==='alimentazione autorizzata'||(Number.isSafeInteger(e.day)&&e.day>0))
      problems.push('Ingresso di nuovo organismo/materiale dopo l’avvio');
    }else if(e.type==='out'){
     const prior=entries.get(e.id);
     if(!prior){problems.push('Uscita senza ingresso tracciato');continue;}
     if(prior.kind!==e.kind){problems.push('Tipo cambiato fra ingresso e uscita');continue;}
     if(prior.outDay!==null){problems.push('Uscita ripetuta');continue;}
     if(Number.isSafeInteger(e.day)&&Number.isSafeInteger(prior.day)&&e.day<prior.day)
      problems.push('Uscita precedente all’ingresso');
     prior.outDay=e.day;
    }else problems.push('Evento non riconosciuto');
   }
  }
  // For an incomplete or reconstructed ledger never claim the missing past is zero.
  const groups=KINDS.map(([kind,label])=>{
   const listed=[...entries.values()].filter(e=>e.kind===kind);
   const actual=[...present.values()].filter(o=>o.kind===kind);
   const active=listed.filter(e=>e.outDay===null);
   const out=listed.filter(e=>e.outDay!==null);
   if(complete){
    for(const e of active)if(!present.has(e.id)||present.get(e.id).kind!==kind)
     problems.push('Oggetto introdotto ma assente senza uscita');
    for(const e of out)if(present.has(e.id))
     problems.push('Oggetto rimosso ancora presente');
    for(const o of actual)if(!entries.has(o.id)||entries.get(o.id).kind!==kind)
     problems.push('Oggetto presente senza ingresso registrato');
   }
   return Object.freeze({kind,label,entered:listed.length,removed:out.length,present:actual.length,
    historicalKnown:complete,units:'oggetti',microbesMeasured:null});
  }).filter(g=>g.entered>0||g.present>0);
  const uniqueProblems=[...new Set(problems)];
  const confidence=complete&&uniqueProblems.length===0?'integro':complete?'incoerente':'parziale';
  return Object.freeze({confidence,historyComplete:complete&&uniqueProblems.length===0,
   groups:Object.freeze(groups),issues:Object.freeze(uniqueProblems),
   recordedEntries:entries.size,recordedRemovals:[...entries.values()].filter(e=>e.outDay!==null).length,
   recordedFeedings:ledger?ledger.filter(e=>e&&e.kind==='feed'&&e.type==='in').length:null,
   currentWaterPresent:Number(state.waterLevel)>0,waterProfileKnown:typeof state.profile==='string'&&state.profile.length>0,
   currentSubstrateCells:Array.isArray(state.cells)?state.cells.filter(Boolean).length:null,
   waterEntryHistoryKnown:false,substrateEntryHistoryKnown:false,
   possibleMicrobialIntroduction:null,liveMicrobialPersistence:null,colonization:null,
   activeBiologicalProcess:false,source:SOURCE.url});
 }
 function selfTest(){
  const blank={day:0,phase:'setup',objects:[],matterLedger:[],matterLedgerComplete:true,cells:[],waterLevel:0};
  const leaf={id:1,kind:'leaf'},plant={id:2,kind:'echinodorus'},food={id:3,kind:'feed'};
  const event=(id,kind,type,day=0,origin='allestimento iniziale')=>({id,kind,type,day,origin});
  const zero=evaluate(blank);
  const initial={...blank,objects:[leaf,plant],matterLedger:[event(1,'leaf','in'),event(2,'echinodorus','in')]};
  const a=evaluate(initial),a7=evaluate({...initial,day:7});
  const removed={...initial,phase:'running',day:7,objects:[plant],matterLedger:[...initial.matterLedger,event(1,'leaf','out',7,'rimozione manuale della foglia')]};
  const b=evaluate(removed);
  const partial=evaluate({...removed,matterLedgerComplete:false});
  const invalid=evaluate({...removed,matterLedger:[...removed.matterLedger,event(2,'echinodorus','in',7,'alimentazione autorizzata')]});
  const orphan=evaluate({...initial,objects:[leaf]});
  const feeding=evaluate({...removed,objects:[...removed.objects,food],matterLedger:[...removed.matterLedger,event(3,'feed','in',7,'alimentazione autorizzata')]});
  const snapshot=JSON.stringify(removed);evaluate(removed);
  const checks={dryIsEmpty:zero.groups.length===0&&zero.historyComplete,
   firstCarriersRecorded:a.recordedEntries===2&&a.historyComplete,
   dayDoesNotCreateEntries:JSON.stringify(a.groups)===JSON.stringify(a7.groups),
   removalRetainsHistoricalRoute:b.groups.find(g=>g.kind==='leaf').entered===1&&b.groups.find(g=>g.kind==='leaf').removed===1&&b.groups.find(g=>g.kind==='leaf').present===0,
   noPersistenceInferred:b.liveMicrobialPersistence===null&&b.possibleMicrobialIntroduction===null,
   noActivation:b.activeBiologicalProcess===false,
   partialNotCertified:partial.confidence==='parziale'&&!partial.historyComplete,
   invalidPostStartNotCertified:invalid.confidence==='incoerente'&&invalid.issues.length>0,
   missingExitDetected:orphan.confidence==='incoerente',
   feedingExcludedFromNewCarriers:feeding.confidence==='integro'&&feeding.recordedFeedings===1&&feeding.groups.every(g=>g.kind!=='feed'),
   noWaterHistoryFabricated:b.waterEntryHistoryKnown===false&&b.substrateEntryHistoryKnown===false,
   pure:JSON.stringify(removed)===snapshot
  };
  return Object.freeze({allPassed:Object.values(checks).every(Boolean),tests:checks});
 }
 root.TECMicrobialEntryHistory=Object.freeze({evaluate,selfTest,SOURCE,KINDS,FIELDS});
 if(typeof module==='object'&&module.exports)module.exports=root.TECMicrobialEntryHistory;
})(typeof window!=='undefined'?window:globalThis);

