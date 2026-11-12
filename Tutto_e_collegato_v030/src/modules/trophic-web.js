/* Tutto è collegato v0.28 – web trofico di scenario, unità mg di N (NON misure).
 * Giustificazione qualitativa: Viau et al 2020 doi:10.1111/are.14733
 * e Lombardo & Cooke 2002 doi:10.1127/archiv-hydrobiol/155/2002/667;
 * i parametri qui sotto sono SOLO convenzioni di gioco; nessuno deriva da tali lavori.
 * N non viene creato: disponibile -> quota fotosintetica; detrito -> quota eterotrofa;
 * entrambe -> fauna/detrito. photoNmg e un sottoinsieme di nMg, NON un nuovo stock.
 * Luce locale e competizione sono proxy esplorativi senza unita radiometriche;
 * alimentazione volontaria = N esterno esplicitamente contabilizzato.
 * Una superficie candidata nasce SOLO da materiali introdotti prima dell'avvio,
 * non si simulano specie nuove o colonizzazione dall'esterno dopo l'avvio.
 */
(function(root){'use strict';
 const VERSION=2;
 const P=Object.freeze({initialAnimalNmg:0.6,foodNmgPerAction:0.32,
  biofilmUptakeFractionPerWetDay:0.28,heterotrophDetritusFractionPerWetDay:0.08,
  canopyShadePerPlantNmg:0.35,epiphyteShadeAtCapacity:1.5,shadeRangeX:0.24,shadeRangeZ:0.30,maxSurfaceUptakeNmgPerDay:0.032,
  maxSurfaceStorageNmg:0.32,biofilmTurnoverPerWetDay:0.018,
  shrimpBiofilmGrazingNmgPerWetDay:0.035,physaBiofilmGrazingNmgPerWetDay:0.025,
  animalFeedGrazingNmgPerWetDay:0.048,grazeAnimalAssimilationFraction:0.30,
  animalTurnoverFractionPerWetDay:0.006,minimumAnimalNmg:0.18,
  feedDecompositionFractionPerWetDay:0.22,
  animalConditionGain:0.032,animalConditionLoss:0.022,
  grazingRangeX:0.40,grazingRangeZ:0.48});
 const SOURCES=Object.freeze({light:'https://doi.org/10.1007/s10750-016-3067-1',epiphytes:'https://pubmed.ncbi.nlm.nih.gov/28313514/',shrimp:'https://doi.org/10.1111/are.14733',snail:'https://doi.org/10.1127/archiv-hydrobiol/155/2002/667'});
 const isSurface=k=>['leaf','rock','wood','marimo','echinodorus','cryptocoryne','ceratophyllum'].includes(k);
 const isAnimal=k=>k==='shrimp'||k==='physa';
 const nonnegative=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 const sum=a=>a.reduce((total,x)=>total+x,0);
 const blankLast=()=>({availableToBiofilmMg:0,detritusToBiofilmMg:0,photoBiofilmGrazedMg:0,biofilmToDetritusMg:0,biofilmGrazedMg:0,feedGrazedMg:0,grazedToAnimalsMg:0,grazedToDetritusMg:0,animalToDetritusMg:0,feedToDetritusMg:0});
 function begin(state){const surfaces={},animals={};
  for(const o of state.objects||[]){
   if(isSurface(o.kind))surfaces[o.id]={kind:o.kind,x:Math.min(1,Math.max(0,Number(o.x)||0)),z:Math.min(1,Math.max(0,Number(o.z)||0)),nMg:0,photoNmg:0};
   if(isAnimal(o.kind))animals[o.id]={kind:o.kind,x:Math.min(1,Math.max(0,Number(o.x)||0)),z:Math.min(1,Math.max(0,Number(o.z)||0)),nMg:P.initialAnimalNmg,condition:1,lastGrazedMg:0};
  }
  return {schema:VERSION,surfaces,animals,feeds:{},externalInputNmg:0,last:blankLast()};
 }
 function total(t){return sum(Object.values(t.surfaces).map(x=>x.nMg))+sum(Object.values(t.animals).map(x=>x.nMg))+sum(Object.values(t.feeds).map(x=>x.nMg));}
 function valid(t){if(!t||![1,VERSION].includes(t.schema)||!t.surfaces||!t.animals||!t.feeds||![t.surfaces,t.animals,t.feeds].every(v=>v&&typeof v==='object'&&!Array.isArray(v))||!nonnegative(t.externalInputNmg))return false;
  for(const s of Object.values(t.surfaces)){if(t.schema===VERSION&&(!nonnegative(s?.photoNmg)||s.photoNmg>s.nMg+1e-10))return false;if(!s||!isSurface(s.kind)||![s.nMg,s.x,s.z].every(nonnegative)||s.x>1||s.z>1||s.nMg>P.maxSurfaceStorageNmg+1e-7)return false;}
  for(const a of Object.values(t.animals)){if(!a||!isAnimal(a.kind)||![a.nMg,a.x,a.z,a.condition,a.lastGrazedMg].every(nonnegative)||a.x>1||a.z>1||a.condition>1+1e-9)return false;}
  for(const f of Object.values(t.feeds)){if(!f||![f.nMg,f.initialNmg,f.x,f.z].every(nonnegative)||f.x>1||f.z>1||f.nMg>f.initialNmg+1e-7)return false;}
  return Object.values(t.last||{}).every(nonnegative);
 }
 function clone(t){return {...t,schema:VERSION,surfaces:Object.fromEntries(Object.entries(t.surfaces).map(([id,s])=>[id,{...s,photoNmg:s.photoNmg??0}])),animals:Object.fromEntries(Object.entries(t.animals).map(([id,a])=>[id,{...a}])),feeds:Object.fromEntries(Object.entries(t.feeds).map(([id,f])=>[id,{...f}])),last:blankLast()};}
 function nearby(a,b,rangeX=P.grazingRangeX,rangeZ=P.grazingRangeZ){return Math.abs(a.x-b.x)<=rangeX&&Math.abs(a.z-b.z)<=rangeZ;}
 // Dimensionless light proxy, NOT irradiance: local canopy and epiphytic cover.
 // Missing geometry in older module callers means no inferred canopy shading.
 function lightAt(state,id,cycle=state.ecoCycleN,forPlant=false){
  const objects=state.objects||[],target=objects.find(o=>String(o.id)===String(id));
  let shade=0;
  if(target&&Number.isFinite(target.x)&&Number.isFinite(target.z)){
   for(const [pid,p] of Object.entries(cycle?.plants||{})){
    if(String(pid)===String(id))continue;
    const o=objects.find(v=>String(v.id)===pid);if(!o||!Number.isFinite(o.x)||!Number.isFinite(o.z))continue;
    const weight=Math.max(0,1-Math.abs(target.x-o.x)/P.shadeRangeX)*Math.max(0,1-Math.abs(target.z-o.z)/P.shadeRangeZ);
    shade+=p.nMg*weight*P.canopyShadePerPlantNmg;
   }
  }
  if(forPlant)shade+=(cycle?.trophic?.surfaces?.[id]?.nMg||0)/P.maxSurfaceStorageNmg*P.epiphyteShadeAtCapacity;
  return 1/(1+shade);
 }
 function upgrade(t,day){if(!valid(t))throw Error('Biofilm precedente non valido');
  if(t.schema===VERSION)return t;
  const next=clone(t);next.last={...blankLast(),...t.last};next.componentsFromDay=day;return next;
 }
 // Simultaneous requests across every reachable patch. Remaining demand is
 // redistributed after a patch is exhausted, never by insertion/ID priority.
 // Stock-weighted choice is a gameplay allocation rule, not animal cognition.
 function allocateGrazing(resources,animals,budgets,rangeX,rangeZ){
  const patches=Object.entries(resources).sort(([a],[b])=>a.localeCompare(b));
  const consumers=Object.entries(animals).sort(([a],[b])=>a.localeCompare(b));
  const remaining=Object.fromEntries(consumers.map(([id])=>[id,budgets[id]||0]));
  const taken=Object.fromEntries(patches.map(([id])=>[id,0]));
  const consumed=Object.fromEntries(consumers.map(([id])=>[id,0]));
  const links=Object.fromEntries(consumers.map(([id,a])=>[id,patches.filter(([,r])=>nearby(a,r,rangeX,rangeZ)).map(([rid])=>rid)]));
  const stock=Object.fromEntries(patches.map(([id,r])=>[id,r.nMg]));
  // Every nonfinal round exhausts at least one resource; an extra round closes demand.
  for(let round=0;round<=patches.length;round++){
   const requests={},totals={};let requested=0;
   for(const [id] of consumers){
    const reachable=links[id].filter(rid=>stock[rid]>0),supply=sum(reachable.map(rid=>stock[rid]));
    if(remaining[id]<=0||supply<=0)continue;
    const budget=remaining[id];requests[id]={};
    for(const rid of reachable){const want=budget*stock[rid]/supply;requests[id][rid]=want;totals[rid]=(totals[rid]||0)+want;requested+=want;}
   }
   if(requested<=1e-14)break;
   const used={};let progress=0;
   for(const [id] of consumers){
    let gained=0;
    for(const [rid,want] of Object.entries(requests[id]||{})){
     const bite=want*Math.min(1,stock[rid]/totals[rid]);
     gained+=bite;used[rid]=(used[rid]||0)+bite;
    }
    consumed[id]+=gained;remaining[id]=Math.max(0,remaining[id]-gained);progress+=gained;
   }
   for(const [rid,amount] of Object.entries(used)){taken[rid]+=amount;stock[rid]=Math.max(0,stock[rid]-amount);}
   if(progress<=1e-14)break;
  }
  return {taken,consumed};
 }
 function tick(cycle,state,plantRequests=[]){const t=clone(cycle.trophic);if(!(state.waterLevel>0))return {...cycle,trophic:t};
  const oxygenGate=root.TECOxygenCycle?root.TECOxygenCycle.oxygenFactor(state.oxygenCycle):1;
  const entries=Object.entries(t.surfaces),sites=entries.map(([,s])=>s),n=sites.length;
  // Both phototroph groups request from the SAME available-N pool before any uptake.
  // Each component gets at most half the surface daily ceiling; shared storage stays capped.
  const photoRequests=entries.map(([id,s])=>({s,amount:Math.min(
    cycle.availableNmg*P.biofilmUptakeFractionPerWetDay/Math.max(1,n)*lightAt(state,id,cycle),
    P.maxSurfaceUptakeNmgPerDay/2*lightAt(state,id,cycle),Math.max(0,P.maxSurfaceStorageNmg-s.nMg))}));
  const requested=sum(plantRequests.map(r=>r.amount))+sum(photoRequests.map(r=>r.amount));
  const fraction=requested>0?Math.min(1,cycle.availableNmg/requested):0;
  let used=0;
  for(const r of plantRequests){const take=r.amount*fraction;cycle.plants[r.id].nMg+=take;used+=take;cycle.last.availableToPlantsMg+=take;}
  for(const r of photoRequests){const take=r.amount*fraction;r.s.nMg+=take;r.s.photoNmg+=take;used+=take;t.last.availableToBiofilmMg+=take;}
  cycle.availableNmg=Math.max(0,cycle.availableNmg-used);
  // Organic detrital N proxies substrate for nonphotosynthetic biomass; carbon is untracked.
  const organicBudget=cycle.detritalNmg*P.heterotrophDetritusFractionPerWetDay*oxygenGate;
  for(const s of sites){const take=Math.min(organicBudget/Math.max(1,n),P.maxSurfaceUptakeNmgPerDay/2*oxygenGate,Math.max(0,P.maxSurfaceStorageNmg-s.nMg));
   s.nMg+=take;cycle.detritalNmg-=take;t.last.detritusToBiofilmMg+=take;}
  // Biofilm turnover replenishes detrital organic N, never disappears.
  for(const s of sites){const decay=s.nMg*P.biofilmTurnoverPerWetDay;s.nMg-=decay;s.photoNmg*=1-P.biofilmTurnoverPerWetDay;cycle.detritalNmg+=decay;t.last.biofilmToDetritusMg+=decay;}
  // Consumo concorrente: risorse locali divise proporzionalmente fra gli animali
  // raggiungibili; l'ordine di inserimento (Neocaridina/Physa) non dà priorità.
  const grazed=Object.fromEntries(Object.keys(t.animals).map(id=>[id,0]));
  const bioBudgets=Object.fromEntries(Object.entries(t.animals).map(([id,a])=>[id,(a.kind==='shrimp'?P.shrimpBiofilmGrazingNmgPerWetDay:P.physaBiofilmGrazingNmgPerWetDay)*oxygenGate]));
  const feedBudgets=Object.fromEntries(Object.keys(t.animals).map(id=>[id,P.animalFeedGrazingNmgPerWetDay*oxygenGate]));
  function consume(resources,budgets,isFeed,rx,rz){
   const result=allocateGrazing(resources,t.animals,budgets,rx,rz);
   for(const [rid,taken] of Object.entries(result.taken)){
    const resource=resources[rid],before=resource.nMg;
    if(!isFeed&&before>0){const photoTaken=taken*resource.photoNmg/before;
     resource.photoNmg=Math.max(0,resource.photoNmg-photoTaken);t.last.photoBiofilmGrazedMg+=photoTaken;}
    resource.nMg=Math.max(0,before-taken);
    if(!isFeed)resource.photoNmg=Math.min(resource.nMg,resource.photoNmg);
    if(isFeed)t.last.feedGrazedMg+=taken;else t.last.biofilmGrazedMg+=taken;
   }
   for(const [id,bite] of Object.entries(result.consumed))grazed[id]+=bite;
  }
  consume(t.surfaces,bioBudgets,false,P.grazingRangeX,P.grazingRangeZ);
  consume(t.feeds,feedBudgets,true,.55,.72);
  for(const [id,a] of Object.entries(t.animals)){
   const graze=grazed[id],assimilated=graze*P.grazeAnimalAssimilationFraction;a.nMg+=assimilated;
   cycle.detritalNmg+=graze-assimilated;t.last.grazedToAnimalsMg+=assimilated;t.last.grazedToDetritusMg+=graze-assimilated;
   const turnover=Math.min(Math.max(0,a.nMg-P.minimumAnimalNmg),a.nMg*P.animalTurnoverFractionPerWetDay);
   a.nMg-=turnover;cycle.detritalNmg+=turnover;t.last.animalToDetritusMg+=turnover;
   a.condition=Math.max(0,Math.min(1,a.condition+(graze>.008?P.animalConditionGain:-P.animalConditionLoss)-(1-oxygenGate)*0.06));
   a.lastGrazedMg=graze;
  }
  for(const f of Object.values(t.feeds)){const decayed=f.nMg*P.feedDecompositionFractionPerWetDay;f.nMg-=decayed;cycle.detritalNmg+=decayed;t.last.feedToDetritusMg+=decayed;}
  return {...cycle,trophic:t};
 }
 function addFeed(previous,o){if(!valid(previous.trophic)||!o||o.kind!=='feed'||Object.hasOwn(previous.trophic.feeds,o.id))throw Error('Ingresso alimento non valido');
  const t=clone(previous.trophic);t.last={...previous.trophic.last};t.feeds[o.id]={nMg:P.foodNmgPerAction,initialNmg:P.foodNmgPerAction,x:Math.min(1,Math.max(0,o.x)),z:Math.min(1,Math.max(0,o.z))};
  t.externalInputNmg+=P.foodNmgPerAction;
  return {...previous,trophic:t,referenceTotalNmg:previous.referenceTotalNmg+P.foodNmgPerAction};
 }
 function removeSurface(previous,id){if(!valid(previous.trophic))throw Error('Rimozione biofilm non valida');
  const t=clone(previous.trophic),site=t.surfaces[id];t.last={...previous.trophic.last};if(!site)return previous;
  const amount=site.nMg;delete t.surfaces[id];return {...previous,trophic:t,removedNmg:previous.removedNmg+amount};
 }
 function condition(cycle,id){const animal=cycle?.trophic?.animals?.[id];return animal?animal.condition:null;}
 function describe(cycle){const t=cycle?.trophic;if(!valid(t))return null;
  return {photoSurfaceNmg:sum(Object.values(t.surfaces).map(x=>x.photoNmg||0)),heterotrophSurfaceNmg:sum(Object.values(t.surfaces).map(x=>x.nMg-(x.photoNmg||0))),surfaceNmg:sum(Object.values(t.surfaces).map(x=>x.nMg)),animalNmg:sum(Object.values(t.animals).map(x=>x.nMg)),foodNmg:sum(Object.values(t.feeds).map(x=>x.nMg)),feedInputNmg:t.externalInputNmg,
    surfaceCount:Object.keys(t.surfaces).length,animalCount:Object.keys(t.animals).length,feedingCount:Object.values(t.animals).filter(a=>a.lastGrazedMg>0).length,
    meanCondition:Object.values(t.animals).length?sum(Object.values(t.animals).map(a=>a.condition))/Object.keys(t.animals).length:null,last:t.last,measured:false};
 }
 root.TECTrophicWeb=Object.freeze({VERSION,PARAMETERS:P,SOURCES,isSurface,isAnimal,begin,valid,clone,upgrade,lightAt,allocateGrazing,total,tick,addFeed,removeSurface,condition,describe,selfTest(){const s={day:0,objects:[{id:1,kind:'rock',x:.3,z:.4},{id:2,kind:'shrimp',x:.3,z:.4}]};const t=begin(s);return {allPassed:valid(t)&&total(t)===P.initialAnimalNmg&&Object.keys(t.surfaces).length===1&&Object.keys(t.animals).length===1};}});
})(typeof window!=='undefined'?window:globalThis);
