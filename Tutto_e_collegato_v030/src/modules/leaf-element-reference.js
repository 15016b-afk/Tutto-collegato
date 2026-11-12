
/* Tutto è collegato v0.7 — contenuti ELEMENTALI misurati, NON rilasci in acqua.
   Ho, Nakajima & Urabe (2023), Ecology and Evolution 13:e10372,
   Table 1, DOI https://doi.org/10.1002/ece3.10372.
   Specie Quercus serrata (NON Quercus robur dello studio Oertli).
   Valori medi ± deviazione standard µg per mg di materiale secco,
   equivalenti a mg per grammo di materiale secco.
   Campioni di età apparente e SITO di provenienza differenti,
   NON prova che l'età sia la causa esclusiva delle differenze.
   Fonte dei dati: https://pmc.ncbi.nlm.nih.gov/articles/PMC10368945/
*/
(function(root){'use strict';
const SOURCE=Object.freeze({authors:'Ho, Nakajima e Urabe',year:2023,species:'Quercus serrata',url:'https://doi.org/10.1002/ece3.10372',article:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10368945/',table:'Tabella 1',
 samples:Object.freeze([
  Object.freeze({id:'aged',label:'Foglia invecchiata',site:'Zao',n:{mean:19.10,sd:1.59},p:{mean:1.11,sd:.19},c:{mean:458.88,sd:8.63}}),
  Object.freeze({id:'young',label:'Foglia recentemente caduta',site:'Kawatabi',n:{mean:28.18,sd:.86},p:{mean:3.20,sd:.61},c:{mean:460.78,sd:3.10}})
 ])});
function content(sampleId,dryGrams=1){if(typeof dryGrams!=='number'||!Number.isFinite(dryGrams)||dryGrams<0)throw Error('Massa secca non valida');
 const s=SOURCE.samples.find(x=>x.id===sampleId);if(!s)throw Error('Campione non documentato');
 const element=(v)=>({mg:v.mean*dryGrams,sdMg:v.sd*dryGrams});
 return {sample:s,grams:dryGrams,N:element(s.n),P:element(s.p),C:element(s.c),source:SOURCE.url};
}
function selfTest(){const a=content('aged',1),b=content('young',1),c=content('aged',.5),d=content('young',0);
 let rejects=false;try{content('aged',-1)}catch(e){rejects=true;}
 return {allPassed:a.N.mg===19.1&&b.N.mg===28.18&&Math.abs(c.N.mg-9.55)<1e-12&&d.N.mg===0&&rejects&&SOURCE.samples.length===2};
}
root.TECLeafElements=Object.freeze({SOURCE,content,selfTest});
})(typeof window!=='undefined'?window:globalThis);

