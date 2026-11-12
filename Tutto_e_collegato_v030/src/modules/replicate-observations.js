/* Tutto è collegato — v0.17. Repliche gravimetriche indipendenti.
   Calcolo osservazionale/scenario, NON dinamica biologica della vasca.
   Supporto metodologico: Bärlocher, Gessner & Graça (eds.) 2020,
   DOI 10.1007/978-3-030-30515-4; Monroy et al. 2023,
   DOI 10.1007/s00248-022-02041-5; Marks 2019,
   DOI 10.1146/annurev-ecolsys-110218-024755.
*/
(function(root){'use strict';
 const MAX_REPLICATES=30;
 const SOURCES=Object.freeze([
  {title:'Bärlocher, Gessner & Graça (2020), Methods to Study Litter Decomposition',url:'https://doi.org/10.1007/978-3-030-30515-4',role:'trattamento e interpretazione dei campioni'},
  {title:'Monroy et al. (2023), Microbial Ecology',url:'https://doi.org/10.1007/s00248-022-02041-5',role:'DM e AFDM, protocolli di campionamento e repliche'},
  {title:'Marks (2019), Annual Review of Ecology, Evolution, and Systematics',url:'https://doi.org/10.1146/annurev-ecolsys-110218-024755',role:'destini alternativi della materia fogliare'}
 ]);
 function amount(raw){
  const s=String(raw).trim();
  if(!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s))throw Error('Usa soltanto numeri decimali, con punto oppure virgola.');
  const v=Number(s.replace(',','.'));
  if(!Number.isFinite(v)||v>1e9)throw Error('Massa fuori intervallo valido.');
  return v;
 }
 function parseRows(input){
  if(typeof input!=='string')throw Error('Inserisci le coppie di pesate.');
  const nonempty=input.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(nonempty.length<2)throw Error('Servono almeno due repliche indipendenti.');
  if(nonempty.length>MAX_REPLICATES)throw Error('Massimo 30 repliche in un confronto.');
  return nonempty.map((line,i)=>{
   const cols=line.split(/[;\t]/).map(s=>s.trim());
   if(cols.length!==2||cols.some(s=>s===''))throw Error(`Riga ${i+1}: usa due masse separate da punto e virgola o tabulazione.`);
   let initialG,remainingG;
   try{initialG=amount(cols[0]);remainingG=amount(cols[1]);}catch(e){throw Error(`Riga ${i+1}: ${e.message}`);}
   if(initialG<=0)throw Error(`Riga ${i+1}: la massa iniziale deve essere maggiore di zero.`);
   return Object.freeze({sample:i+1,initialG,remainingG,differenceG:initialG-remainingG,
      missingPct:100*(initialG-remainingG)/initialG,remainingPct:100*remainingG/initialG,
      requiresCheck:remainingG>initialG});
  });
 }
 function analyze(v){
  if(!v||!['alnus_glutinosa','quercus_robur'].includes(v.species))throw Error('Seleziona una specie verificata.');
  if(!['scenario','external'].includes(v.origin))throw Error('Indica la provenienza dei valori.');
  if(!['DM','AFDM'].includes(v.basis))throw Error('La base deve essere DM oppure AFDM.');
  if(!Number.isSafeInteger(v.days)||v.days<=0||v.days>36500)throw Error('Servono giorni interi positivi.');
  const rows=parseRows(v.rows),n=rows.length;
  const initialG=rows.reduce((a,b)=>a+b.initialG,0),remainingG=rows.reduce((a,b)=>a+b.remainingG,0);
  const differenceG=initialG-remainingG;
  const meanPct=rows.reduce((a,b)=>a+b.missingPct,0)/n;
  const sdPct=Math.sqrt(rows.reduce((a,b)=>a+(b.missingPct-meanPct)**2,0)/(n-1));
  const requiresCheck=rows.some(r=>r.requiresCheck);
  return Object.freeze({species:v.species,origin:v.origin,basis:v.basis,days:v.days,n,rows,
    initialG,remainingG,differenceG,missingPctPooled:100*differenceG/initialG,
    meanPct,sdPct,requiresCheck,
    observationsFromTank:false,biologicalProcessActive:false,
    decompositionRatePerDay:null,oxygenConsumptionMg:null,carbonReleaseMg:null,
    dissolvedNitrogenMg:null,compartmentAllocation:null,persistedInTank:false,
    interpretation:requiresCheck?'Controllo dei campioni necessario; il dato potrebbe includere materiale esterno.':
      'Differenza di massa recuperata: il destino della quota non recuperata non è determinato.'});
 }
 function selfTest(){
  const a={species:'alnus_glutinosa',origin:'external',basis:'DM',days:8,rows:'1,00;0,72\n2,00;1,44'};
  const b=analyze(a);
  const tolerance=Math.abs(b.initialG-3)<1e-10&&Math.abs(b.remainingG-2.16)<1e-10&&
  Math.abs(b.differenceG-.84)<1e-10&&Math.abs(b.missingPctPooled-28)<1e-10&&
  Math.abs(b.meanPct-28)<1e-10&&b.sdPct<1e-10&&b.decompositionRatePerDay===null&&b.biologicalProcessActive===false;
  const warn=analyze({...a,rows:'1;1,1\n1;0,7'}).requiresCheck;
  const rejects=['','1;0,4','1;0,2\n0;0','1;0,2\n1;-1','1;0,4\n2;','1;0,2\nNaN;0,3','1;0,2\n1|0,8','1;0,2\n1;Infinity',Array(31).fill('1;0,5').join('\n')]
  .every(rows=>{try{analyze({...a,rows});return false;}catch{return true;}});
  const rejectsOther=[{...a,days:0},{...a,basis:'DM+AFDM'},{...a,origin:'aquarium_measurement'}].every(v=>{try{analyze(v);return false}catch{return true}});
  return Object.freeze({allPassed:tolerance&&warn&&rejects&&rejectsOther,tolerance,warn,rejects,rejectsOther});
 }
 root.TECReplicateObservations=Object.freeze({parseRows,analyze,selfTest,SOURCES,MAX_REPLICATES});
})(typeof window!=='undefined'?window:globalThis);
