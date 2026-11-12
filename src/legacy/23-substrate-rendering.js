
// The painted map remains authoritative. Both projections sample the same
// continuous material field, relief and stable grain positions.
(function(root){
 const palette={sand:[218,200,163],gravel:[172,172,151],aquasoil:[147,128,107],fertile:[125,107,90],glass:[184,204,190]};
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const smooth=t=>t*t*(3-2*t);
 let cachedKey='',cache={};
 function field(cells,cols,rows,x,z){
  const u=clamp(x*cols-.5+.17*Math.sin(18*z+11*x)+.08*Math.sin(43*z),0,cols-1);
  const v=clamp(z*rows-.5+.20*Math.sin(22*x+4*z)+.10*Math.sin(58*x),0,rows-1);
  const i=Math.floor(u),j=Math.floor(v),a=smooth(u-i),b=smooth(v-j);
  let r=0,g=0,blue=0,h=0,max=-1,kind='glass';
  for(const [dx,dz,w] of [[0,0,(1-a)*(1-b)],[1,0,a*(1-b)],[0,1,(1-a)*b],[1,1,a*b]]){
   const cell=cells[Math.min(rows-1,j+dz)*cols+Math.min(cols-1,i+dx)],k=cell?.kind||'glass',p=palette[k]||palette.glass;
   r+=w*p[0];g+=w*p[1];blue+=w*p[2];h+=w*(cell?.thickness||0)*2;
   if(w>max){max=w;kind=k;}
  }
  return {r,g,b:blue,h,kind};
 }
 function art(cells,cols,rows,top){
  const key=JSON.stringify(cells);
  if(key!==cachedKey){cachedKey=key;cache={};}
  if(cache[top])return cache[top];
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=top?164:170;
  const ctx=canvas.getContext('2d'), data=ctx.createImageData(canvas.width,canvas.height);
  let seed=673182;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  function project(x,z,h){return top?[25+950*x,4+152*z]:[500+(x-.5)*1000*(.78+.22*z),25+106*z-h];}
  // Draw rear-to-front scan lines. The exposed front face takes its colour
  // and height from the material immediately behind the glass.
  for(let row=0;row<=320;row++){
   const z=row/320,left=project(0,z,0)[0],span=2*(500-left);
   for(let px=Math.ceil(left);px<left+span;px++){
    const x=(px-left)/span,f=field(cells,cols,rows,x,z);
    const y=Math.round(project(x,z,f.h)[1]);
    const face=(!top&&row===320&&f.kind!=='glass')?Math.ceil(8+f.h*2.8+1.3*Math.sin(16*x)):0;
    for(let t=0;t<=Math.max(1,face);t++){
     if(y+t<0||y+t>=canvas.height)continue;
     const idx=4*((y+t)*1000+px);
     const shade=t>1?14:0;
     data.data[idx]=f.r-shade;data.data[idx+1]=f.g-shade;data.data[idx+2]=f.b-shade;data.data[idx+3]=255;
    }
   }
  }
  ctx.putImageData(data,0,0);seed=182341;
  for(let n=0;n<300;n++){
   const x=random(),z=random(),s=random(),tone=random(),angle=random()-.5;
   const f=field(cells,cols,rows,x,z);if(f.kind==='glass')continue;
   const [px,py]=project(x,z,f.h),size=({sand:.70,gravel:2.5,aquasoil:1.65,fertile:1.05}[f.kind])*(.42+s)*(.72+.28*z);
   ctx.beginPath();ctx.ellipse(px,py,size,size*(top?.72:.45),angle,0,2*Math.PI);
   ctx.fillStyle=tone>.53?'rgba(239,223,193,.25)':'rgba(62,59,52,.17)';ctx.fill();
  }
  return cache[top]=canvas.toDataURL('image/png');
 }
 root.TECSubstrateArt={art,field};
})(window);

