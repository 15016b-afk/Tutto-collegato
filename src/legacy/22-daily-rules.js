
// Daily gameplay rules. Egg N remains earmarked inside the parent's stock
// until hatching; transferring it to the juvenile keeps total N unchanged.
(function(root){
 'use strict';
 const settings={
  shrimp:{incubation:25,maturity:60,recovery:20},
  physa:{incubation:12,maturity:45,recovery:14}
 };
 const eggN=0.09;
 function tick(state,announce){
  const animals=state.ecoCycleN.trophic.animals;
  const objects=new Map(state.objects.map(o=>[String(o.id),o]));
  const entries=Object.entries(animals);
  const rank={shrimp:0,physa:0};
  for(const [id,a] of entries){
   const index=rank[a.kind]++;
   if(!objects.has(id))throw Error('Individuo senza oggetto');
   if(!a.life)a.life={adult:true,days:0,role:a.kind==='physa'?'ermafrodita':index%2?'maschio':'femmina',eggDays:0,ready:0};
  }
  if(!(state.waterLevel>0))return;
  for(const [id,a] of entries){
   const life=a.life,rule=settings[a.kind],o=objects.get(id);
   life.days++;
   if(!life.adult){
    life.adult=life.days>=rule.maturity && a.nMg>=0.35;
    o.scale=life.adult?1:Math.min(.9,.42+.48*Math.max(0,Math.min(1,(a.nMg-eggN)/(.35-eggN))));
    continue;
   }
   if(life.eggDays){
    if(--life.eggDays>0)continue;
    const childId=state.nextId++,x=Math.min(.96,Math.max(.04,a.x+(childId%2?.025:-.025)));
    a.nMg-=eggN;
    const role=a.kind==='physa'?'ermafrodita':rank.shrimp++%2?'maschio':'femmina';
    animals[childId]={kind:a.kind,x,z:a.z,nMg:eggN,condition:1,lastGrazedMg:0,life:{adult:false,days:0,role,eggDays:0,ready:0}};
    state.objects.push({id:childId,kind:a.kind,x,z:a.z,addedDay:state.day,scale:.42,dayMotion:0,bornInTank:true});
    life.ready=life.days+rule.recovery;
    announce(a.kind==='physa'?'È comparsa una giovane Physa.':'È comparsa una giovane Neocaridina.');
    continue;
   }
   if(life.days<life.ready || a.condition<.8 || a.nMg<.52 || a.lastGrazedMg<.015)continue;
   const partner=entries.some(([other,b])=>other!==id && b.kind===a.kind && b.life.adult && Math.abs(a.x-b.x)<=.4 && Math.abs(a.z-b.z)<=.48 && (a.kind==='physa'||b.life.role==='maschio'));
   if(a.kind==='shrimp'?(life.role!=='femmina'||!partner):(!partner&&life.days<35))continue;
   life.eggDays=rule.incubation;
   // Incubazione osservabile solo selezionando il genitore.
  }
 }
 root.TECLifeHistory={tick};
})(typeof window!=='undefined'?window:globalThis);

