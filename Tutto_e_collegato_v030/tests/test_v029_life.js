const assert=require('node:assert/strict');
require('../src/modules/life-history');
function tank(kinds){
 const animals={},objects=[];
 for(const [i,kind] of kinds.entries()){
  animals[i+1]={kind,x:.4,z:.4,nMg:.6,condition:1,lastGrazedMg:.025};
  objects.push({id:i+1,kind,x:.4,z:.4});
 }
 return {waterLevel:1,day:0,ecoCycleN:{trophic:{animals}},objects,nextId:kinds.length+1};
}
function run(s,days){
 const mass=()=>Object.values(s.ecoCycleN.trophic.animals).reduce((n,a)=>n+a.nMg,0);
 const initial=mass();
 for(let d=0;d<days;d++){s.day++;TECLifeHistory.tick(s,()=>{});assert.ok(Math.abs(mass()-initial)<1e-10);}
}
const single=tank(['shrimp']);run(single,90);assert.equal(single.objects.length,1);
const pair=tank(['shrimp','shrimp']);run(pair,8);const restored=JSON.parse(JSON.stringify(pair));run(restored,18);run(pair,18);assert.deepEqual(restored,pair);assert.equal(pair.objects.length,3);assert.equal(pair.objects[2].bornInTank,true);
const physa=tank(['physa']);run(physa,34);assert.equal(physa.ecoCycleN.trophic.animals[1].life.eggDays,0);run(physa,13);assert.equal(physa.objects.length,2);
const young=physa.ecoCycleN.trophic.animals[2];run(physa,50);assert.equal(young.life.adult,false);young.nMg=.4;run(physa,1);assert.equal(young.life.adult,true);
const unfed=tank(['physa']);unfed.ecoCycleN.trophic.animals[1].lastGrazedMg=0;run(unfed,100);assert.equal(unfed.objects.length,1);
console.log('PASS: isolated shrimp, shrimp pair, delayed selfing, growth gate, fasting, reload and N conservation.');
