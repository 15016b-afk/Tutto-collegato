
/*
 * Tutto e' collegato 0.9 — stechiometria teorica della nitrificazione.
 * US EPA, Municipal Nutrient Removal Technologies Reference Document,
 * EPA 832-R-08-006 (2008), Chapter 2, p. 2-2.
 * https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100GE8B.TXT
 * O2: 3.43 mg/mg NH4-N for first step, 1.14 mg/mg NO2-N second step.
 * Alkalinity: 7.14 mg CaCO3 equivalent per mg NH4-N oxidized.
 * ROUNDED engineering stoichiometry, oxygen and alkalinity are not measured in the tank.
 * No time or automatic biological flux inferred. Strictly an explicit reaction calculator.
 */
(function(root){'use strict';
const SOURCE=Object.freeze({authority:'US EPA',year:2008,title:'Municipal Nutrient Removal Technologies Reference Document',code:'EPA 832-R-08-006',url:'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100GE8B.TXT',page:'Chapter 2, p. 2-2'});
const O2_NH4=3.43,O2_NO2=1.14,ALK_NH4=7.14;
function finiteNonneg(x){return typeof x==='number'&&Number.isFinite(x)&&x>=0;}
function checkInputs(v){
 const keys=['ammoniacalNmg','nitriteNmg','nitrateNmg','oxygenMg','alkalinityCaCO3Mg','oxidizeAmmoniacalNmg','oxidizeNitriteNmg'];
 if(!v||keys.some(k=>!finiteNonneg(v[k])))throw Error('Servono masse esplicite non negative e finite; valori ignoti non ammessi');
 if(v.oxidizeAmmoniacalNmg>v.ammoniacalNmg+1e-10)throw Error('Azoto ammoniacale insufficiente');
 if(v.oxidizeNitriteNmg>v.nitriteNmg+v.oxidizeAmmoniacalNmg+1e-10)throw Error('Nitrito insufficiente');
 const oxygen=v.oxidizeAmmoniacalNmg*O2_NH4+v.oxidizeNitriteNmg*O2_NO2;
 const alkalinity=v.oxidizeAmmoniacalNmg*ALK_NH4;
 if(oxygen>v.oxygenMg+1e-10)throw Error('Ossigeno insufficiente');
 if(alkalinity>v.alkalinityCaCO3Mg+1e-10)throw Error('Alcalinità insufficiente');
 return {oxygen,alkalinity};
}
function reaction(v){
 const need=checkInputs(v);
 const n0=v.ammoniacalNmg+v.nitriteNmg+v.nitrateNmg;
 const result={
  ammoniacalNmg:v.ammoniacalNmg-v.oxidizeAmmoniacalNmg,
  nitriteNmg:v.nitriteNmg+v.oxidizeAmmoniacalNmg-v.oxidizeNitriteNmg,
  nitrateNmg:v.nitrateNmg+v.oxidizeNitriteNmg,
  oxygenMg:v.oxygenMg-need.oxygen,
  alkalinityCaCO3Mg:v.alkalinityCaCO3Mg-need.alkalinity,
  oxygenConsumedMg:need.oxygen,alkalinityConsumedCaCO3Mg:need.alkalinity,
  nitrogenBeforeMg:n0,nitrogenAfterMg:n0,
  source:SOURCE.url,
  category:'calcolo condizionale di reazione, NON processo della vasca'
 };
 const eps=1e-8;
 if(Object.entries(result).some(([k,x])=>k.endsWith('Mg')&&typeof x==='number'&&x < -eps))throw Error('Errore numerico: massa negativa');
 const n1=result.ammoniacalNmg+result.nitriteNmg+result.nitrateNmg;
 if(Math.abs(n0-n1)>eps*Math.max(1,n0))throw Error('Massa di azoto non conservata');
 return Object.freeze({...result,ammoniacalNmg:Math.max(0,result.ammoniacalNmg),nitriteNmg:Math.max(0,result.nitriteNmg),oxygenMg:Math.max(0,result.oxygenMg),alkalinityCaCO3Mg:Math.max(0,result.alkalinityCaCO3Mg)});
}
function reference(nmg){
 if(!finiteNonneg(nmg))throw Error('Valore N di riferimento non valido');
 return reaction({ammoniacalNmg:nmg,nitriteNmg:0,nitrateNmg:0,oxygenMg:nmg*(O2_NH4+O2_NO2),alkalinityCaCO3Mg:nmg*ALK_NH4,oxidizeAmmoniacalNmg:nmg,oxidizeNitriteNmg:nmg});
}
function selfTest(){
 const r=reference(1),z=reference(0),h=reference(2),a=reaction({ammoniacalNmg:2,nitriteNmg:0,nitrateNmg:0,oxygenMg:3.43,alkalinityCaCO3Mg:7.14,oxidizeAmmoniacalNmg:1,oxidizeNitriteNmg:0});
 let missingRejected=false,oxygenRejected=false,alkRejected=false,overspendRejected=false;
 try{reaction({ammoniacalNmg:null,nitriteNmg:0,nitrateNmg:0,oxygenMg:5,alkalinityCaCO3Mg:8,oxidizeAmmoniacalNmg:1,oxidizeNitriteNmg:1})}catch(e){missingRejected=true;}
 try{reaction({...r,ammoniacalNmg:1,nitriteNmg:0,nitrateNmg:0,oxygenMg:4,alkalinityCaCO3Mg:8,oxidizeAmmoniacalNmg:1,oxidizeNitriteNmg:1})}catch(e){oxygenRejected=true;}
 try{reaction({ammoniacalNmg:1,nitriteNmg:0,nitrateNmg:0,oxygenMg:5,alkalinityCaCO3Mg:7,oxidizeAmmoniacalNmg:1,oxidizeNitriteNmg:1})}catch(e){alkRejected=true;}
 try{reaction({ammoniacalNmg:0,nitriteNmg:0,nitrateNmg:0,oxygenMg:100,alkalinityCaCO3Mg:100,oxidizeAmmoniacalNmg:1,oxidizeNitriteNmg:0})}catch(e){overspendRejected=true;}
 const close=(x,y)=>Math.abs(x-y)<1e-9;
 return {reference:close(r.oxygenConsumedMg,4.57)&&close(r.alkalinityConsumedCaCO3Mg,7.14)&&close(r.nitrateNmg,1),linearity:close(h.oxygenConsumedMg,9.14)&&close(h.nitrateNmg,2),zero:close(z.nitrateNmg,0),twoStageConservation:close(a.ammoniacalNmg,1)&&close(a.nitriteNmg,1)&&close(a.oxygenConsumedMg,3.43)&&close(a.alkalinityConsumedCaCO3Mg,7.14),missingRejected,oxygenRejected,alkRejected,overspendRejected,allPassed:false};
}
const original=selfTest;
function verifiedTests(){const t=original();return {...t,allPassed:Object.entries(t).filter(([k])=>k!=='allPassed').every(([,v])=>v===true)};}
root.TECNitrification=Object.freeze({SOURCE,O2_NH4,O2_NO2,ALK_NH4,reaction,reference,selfTest:verifiedTests});
})(typeof window!=='undefined'?window:globalThis);

