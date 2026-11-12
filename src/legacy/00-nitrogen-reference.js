

/*
 * Tutto e' collegato — nucleo conservativo dell'azoto, v0.4
 * Il motore non assume né inventa velocità. Ogni flusso in mg di AZOTO
 * deve essere fornito esplicitamente da una fonte/condizione validata.
 * I numeri nei test sono esempi matematici sintetici, non valori acquario.
 */
(function(global){'use strict';
 const POOLS=Object.freeze(['organic','ammoniacal','nitrite','nitrate','biomass']);
 const EPS=1e-8;
 function positive(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0;}
 function total(b){return POOLS.reduce((a,k)=>a+b.pools[k],0);}
 function assert(b){
  if(!b||!b.pools||!positive(b.input)||!positive(b.output)||!positive(b.start))throw Error('Registro azoto incompleto');
  for(const k of POOLS)if(!positive(b.pools[k]))throw Error('Pool azoto non valido: '+k);
  const discrepancy=(total(b)+b.output)-(b.start+b.input);
  if(Math.abs(discrepancy)>EPS*Math.max(1,b.start+b.input))throw Error('Bilancio non conservativo');
  return discrepancy;
 }
 function create(pools){
  if(!pools||POOLS.some(k=>!positive(pools[k])))throw Error('Tutte le masse iniziali devono essere note in mg N');
  const p={};for(const k of POOLS)p[k]=pools[k];
  const b={unit:'mg N',pools:p,input:0,output:0,start:Object.values(p).reduce((a,v)=>a+v,0),flows:[]};assert(b);return b;
 }
 function apply(b,transfers){
  if(!Array.isArray(transfers))throw Error('I flussi devono essere espliciti');
  const next=JSON.parse(JSON.stringify(b));assert(next);
  for(const t of transfers){
    if(!t||!positive(t.amount)||!t.source||typeof t.source!=='string')throw Error('Flusso privo di massa/fonte verificata');
    if(!((t.from===null)||(POOLS.includes(t.from)))||!((t.to===null)||(POOLS.includes(t.to)))||t.from===t.to)throw Error('Sorgente o destinazione non valida');
    if(t.from===null&&t.to===null)throw Error('Flusso senza confini');
    if(t.from===null){next.pools[t.to]+=t.amount;next.input+=t.amount;}
    else {if(next.pools[t.from]+EPS<t.amount)throw Error('Massa in uscita superiore al disponibile');
      next.pools[t.from]=Math.max(0,next.pools[t.from]-t.amount);
      if(t.to===null)next.output+=t.amount;else next.pools[t.to]+=t.amount;
    }
    next.flows.push({from:t.from,to:t.to,amount:t.amount,source:t.source});
    assert(next);
  }
  return next;
 }
 function selfTest(){
  const p={organic:10,ammoniacal:0,nitrite:0,nitrate:0,biomass:0};
  let b=create(p);
  b=apply(b,[
   {from:'organic',to:'ammoniacal',amount:4,source:'TEST SINTETICO'},
   {from:'ammoniacal',to:'nitrite',amount:2,source:'TEST SINTETICO'},
   {from:'nitrite',to:'nitrate',amount:1.5,source:'TEST SINTETICO'},
   {from:'nitrate',to:'biomass',amount:0.5,source:'TEST SINTETICO'},
   {from:'nitrate',to:null,amount:0.25,source:'TEST SINTETICO — oltre confine'},
   {from:null,to:'organic',amount:1,source:'TEST SINTETICO — ingresso'}
  ]);
  const conservation=Math.abs(assert(b))<EPS&&Math.abs(total(b)+b.output-b.start-b.input)<EPS;
  let negativeRejected=false;try{apply(b,[{from:'nitrite',to:'nitrate',amount:9999,source:'TEST'}]);}catch(e){negativeRejected=true;}
  let sourceRejected=false;try{apply(b,[{from:'organic',to:'nitrate',amount:1,source:''}]);}catch(e){sourceRejected=true;}
  let missingRejected=false;try{create({organic:1,ammoniacal:0,nitrite:0,nitrate:0,biomass:null});}catch(e){missingRejected=true;}
  return {conservation,negativeRejected,sourceRejected,missingRejected,allPassed:conservation&&negativeRejected&&sourceRejected&&missingRejected};
 }
 global.TECBalance=Object.freeze({POOLS,create,apply,assert,total,selfTest});
})(typeof window!=='undefined'?window:globalThis);


