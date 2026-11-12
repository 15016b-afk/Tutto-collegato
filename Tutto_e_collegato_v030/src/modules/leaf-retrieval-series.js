/* Tutto è collegato — Ecosistema v0.18.
 * Multi-date destructive-retrieval series for leaf-litter samples.
 * Input = user-declared hypothetical values or independent external measurements.
 * NO model of tank, temporal interpolation, respiration, or decomposition k.
 * Methods background: Bärlocher, Gessner & Graça 2020, DOI 10.1007/978-3-030-30515-4.
 * Independent destructive retrieval sampling: Bansal et al. 2023,
 * https://www.srs.fs.usda.gov/pubs/ja/2024/ja_2024_trettin_001.pdf
 */
(function(root){'use strict';
 const MAX_ROWS=120;
 const SOURCES=Object.freeze([
  Object.freeze({title:'Bärlocher, Gessner & Graça (2020) · Methods to Study Litter Decomposition, 2nd ed.',url:'https://doi.org/10.1007/978-3-030-30515-4',role:'protocolli di perdita di massa per sacchetti di lettiera, campioni e date di recupero'}),
  Object.freeze({title:'Bansal et al. (2023) · Practical Guide to Measuring Wetland Carbon Pools and Fluxes',url:'https://doi.org/10.1007/s13157-023-01722-2',role:'repliche ritirate in date successive per analisi distruttive'}),
  Object.freeze({title:'Marks (2019) · Revisiting the Fates of Dead Leaves That Fall into Streams',url:'https://doi.org/10.1146/annurev-ecolsys-110218-024755',role:'destini differenti della materia fogliare non distinguibili con la sola pesata'})
 ]);
 function number(raw,line){
  const s=String(raw).trim();
  if(!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s))throw Error(`Riga ${line}: inserisci solo numeri decimali validi.`);
  const n=Number(s.replace(',','.'));
  if(!Number.isFinite(n)||n>1e9)throw Error(`Riga ${line}: massa fuori intervallo.`);
  return n;
 }
 function parseRows(text){
  if(typeof text!=='string')throw Error('Mancano le osservazioni.');
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length)throw Error('Inserisci le osservazioni.');
  if(lines.length>MAX_ROWS)throw Error('Il pannello accetta al massimo 120 righe per analisi.');
  return lines.map((line,i)=>{
   const p=line.split(/[;\t]/).map(x=>x.trim());
   if(p.length!==3||p.some(x=>x===''))throw Error(`Riga ${i+1}: usa giorno; massa iniziale; massa recuperata.`);
   if(!/^\d+$/.test(p[0]))throw Error(`Riga ${i+1}: il giorno deve essere un intero positivo.`);
   const day=Number(p[0]),m0=number(p[1],i+1),mr=number(p[2],i+1);
   if(!Number.isSafeInteger(day)||day<1||day>36500)throw Error(`Riga ${i+1}: il giorno deve essere fra 1 e 36500.`);
   if(m0<=0)throw Error(`Riga ${i+1}: massa iniziale maggiore di zero richiesta.`);
   return Object.freeze({line:i+1,day,initialG:m0,recoveredG:mr,
    recoveredPct:100*mr/m0,missingPct:100*(m0-mr)/m0,
    recoveredGreater:mr>m0});
  });
 }
 function analyze(input){
  if(!input||!['alnus_glutinosa','quercus_robur'].includes(input.species))throw Error('Specie non supportata nel confronto.');
  if(!['scenario','external'].includes(input.origin))throw Error('Dichiara scenario oppure misure esterne.');
  if(!['DM','AFDM'].includes(input.basis))throw Error('Le masse devono condividere la base DM o AFDM.');
  const rows=parseRows(input.rows);
  const byDay=new Map();
  rows.forEach(r=>{if(!byDay.has(r.day))byDay.set(r.day,[]);byDay.get(r.day).push(r);});
  if(byDay.size<2)throw Error('Servono almeno due giorni di recupero distinti.');
  for(const [day,samples] of byDay){if(samples.length<2)throw Error(`Giorno ${day}: servono almeno due unità campionarie indipendenti.`);}
  const days=[...byDay].sort((a,b)=>a[0]-b[0]).map(([day,samples])=>{
   const n=samples.length;
   const initialG=samples.reduce((sum,r)=>sum+r.initialG,0);
   const recoveredG=samples.reduce((sum,r)=>sum+r.recoveredG,0);
   const meanRecoveredPct=samples.reduce((sum,r)=>sum+r.recoveredPct,0)/n;
   const sdRecoveredPct=Math.sqrt(samples.reduce((sum,r)=>sum+(r.recoveredPct-meanRecoveredPct)**2,0)/(n-1));
   return Object.freeze({day,n,initialG,recoveredG,unrecoveredG:initialG-recoveredG,
    pooledRecoveredPct:100*recoveredG/initialG,
    meanRecoveredPct,sdRecoveredPct,
    minRecoveredPct:Math.min(...samples.map(r=>r.recoveredPct)),
    maxRecoveredPct:Math.max(...samples.map(r=>r.recoveredPct)),
    requiresCheck:samples.some(r=>r.recoveredGreater)});
  });
  const requiresCheck=rows.some(r=>r.recoveredGreater);
  return Object.freeze({species:input.species,origin:input.origin,basis:input.basis,
   rowCount:rows.length,timepointCount:days.length,rows:Object.freeze(rows),days:Object.freeze(days),requiresCheck,
   observedTank:false,independentDestructiveSamples:true,biologicalProcessActive:false,
   decompositionRate:null,interpolatedTimepoints:null,predictedDays:null,
   carbonFate:null,dissolvedOxygen:null,nitrogenFate:null,storedInTank:false,
   interpretation:'Solo quote gravimetriche dichiarate alle date di recupero: non è una traiettoria della stessa unità campionaria.'});
 }
 function selfTest(){
  const sample={species:'alnus_glutinosa',origin:'scenario',basis:'DM',
   rows:'3;1;0,8\n3;2;1,6\n8;1;0,7\n8;2;1,4'};
  const r=analyze(sample);
  const arithmetic=r.timepointCount===2&&r.rowCount===4&&r.days[0].day===3&&r.days[1].day===8&&
   Math.abs(r.days[0].pooledRecoveredPct-80)<1e-9&&Math.abs(r.days[1].meanRecoveredPct-70)<1e-9&&
   Math.abs(r.days[1].unrecoveredG-.9)<1e-9&&r.days[1].sdRecoveredPct<1e-9;
  const unweighted=analyze({...sample,rows:'3;1;0,5\n3;3;3\n8;1;0,6\n8;1;0,5'}).days[0];
  const noMixing=Math.abs(unweighted.meanRecoveredPct-75)<1e-9 && Math.abs(unweighted.pooledRecoveredPct-87.5)<1e-9;
  const inputReject=[
   {...sample,rows:'3;1;0,8\n3;1;0,7'},
   {...sample,rows:'3;1;0,8\n8;1;0,7'},
   {...sample,rows:'3;1;0,8\n3;1;0,7\n8;1;0,7'},
   {...sample,rows:'3;0;0\n3;1;0,7\n8;1;0,7\n8;1;0,5'},
   {...sample,rows:'3;-1;0\n3;1;0,7\n8;1;0,7\n8;1;0,5'},
   {...sample,rows:'3;1;NaN\n3;1;0,7\n8;1;0,7\n8;1;0,5'},
   {...sample,rows:'3;1;0,8\n3;1;0,7\n8;1;0,7\n8;1;Infinity'},
   {...sample,rows:'0;1;0,8\n3;1;0,7\n8;1;0,7\n8;1;0,5'},
   {...sample,rows:'3;1;0,8\n3;1;0,7\n8;1;0,7\n8;1;0,5',basis:'DM/AFDM'},
   {...sample,rows:'3;1;0,8\n3;1;0,7\n8;1;0,7\n8;1;0,5',origin:'aquarium'},
   {...sample,rows:Array(121).fill('3;1;0,8').join('\n')}
  ].every(v=>{try{analyze(v);return false;}catch{return true;}});
  const over=analyze({...sample,rows:'3;1;1,2\n3;1;0,8\n8;1;0,7\n8;1;0,5'});
  const strict=noMixing&&over.requiresCheck&&r.decompositionRate===null&&r.interpolatedTimepoints===null&&r.observedTank===false&&r.storedInTank===false;
  return Object.freeze({allPassed:arithmetic&&strict&&inputReject,arithmetic,strict,inputReject});
 }
 root.TECLeafRetrievalSeries=Object.freeze({analyze,parseRows,selfTest,SOURCES,MAX_ROWS});
})(typeof window!=='undefined'?window:globalThis);
