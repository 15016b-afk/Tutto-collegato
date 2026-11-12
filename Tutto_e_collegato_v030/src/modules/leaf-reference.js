
/* TUTTO È COLLEGATO — riferimenti temporali, non dati misurati nell’acquario.
   Oertli, B. (1991) Oak leaf litter processing and associated macroinvertebrates
   in two ponds near Geneva (Switzerland). SIL Proceedings 24(3), 1543–1546.
   DOI: 10.1080/03680770.1989.11899017
   Quercus robur L., due stagni d’acqua dolce senza corrente,
   durata 255 giorni, k = 0.0035 /giorno (Bois-Vieux) e
   0.0012 /giorno (Marais du Château).
   M(t) / M(0) = exp(-k t). I valori sono fit pubblicati,
   NON tempi, misurazioni o previsioni per la vasca domestica.
   L’unità è frazione della massa secca iniziale: nessuna massa assoluta
   o composizione chimica di foglie non identificate è assegnata.
*/
(function(root){'use strict';
 const SOURCE=Object.freeze({author:'Beat Oertli',year:1991,species:'Quercus robur',days:255,
   url:'https://doi.org/10.1080/03680770.1989.11899017',
   contexts:Object.freeze([{id:'BV',label:'Bois-Vieux',k:0.0035},{id:'MC',label:'Marais du Château',k:0.0012}])});
 function atDay(t){
  if(!Number.isInteger(t)||t<0)throw new Error('Il giorno deve essere un intero non negativo');
  if(t>SOURCE.days)return null; // Niente estrapolazioni oltre la durata della pubblicazione.
  return {day:t,source:SOURCE.url,species:SOURCE.species,contexts:SOURCE.contexts.map(c=>({
    id:c.id,label:c.label,k:c.k,remaining:Math.exp(-c.k*t),loss:1-Math.exp(-c.k*t)
  }))};
 }
 function selfTest(){
  const zero=atDay(0),seven=atDay(7),end=atDay(255);
  const close=(a,b)=>Math.abs(a-b)<1e-12;
  const ok=zero.contexts.every(c=>c.remaining===1&&c.loss===0)&&
     seven.contexts.every(c=>close(c.remaining+c.loss,1)&&c.remaining>0&&c.remaining<1)&&
     seven.contexts[0].loss>seven.contexts[1].loss&&
     seven.contexts.every(c=>close(c.remaining,Math.pow(Math.exp(-c.k),7)))&&
     end.contexts.every(c=>c.remaining>0&&c.remaining<1)&&atDay(256)===null;
  let rejects=false;try{atDay(-1)}catch(e){rejects=true}
  return {allPassed:ok&&rejects,zero,day7:seven,day255:end,noExtrapolation:atDay(256)===null};
 }
 root.TECLeafReference=Object.freeze({SOURCE,atDay,selfTest});
})(typeof window!=='undefined'?window:globalThis);

