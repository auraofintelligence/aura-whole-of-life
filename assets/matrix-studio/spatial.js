import {SHELLS,address,shellPoint,PRESETS} from './core.js?v=0.4.26';

export const KINDS=['facet','edge-u','edge-v','vertex','volume','stack','ray-facet','ray-vertex','ray-edge-u','ray-edge-v'];
export const KIND_NAMES={'facet':'Facet','edge-u':'Edge along row','edge-v':'Edge along column','vertex':'Vertex','volume':'Volume point','stack':'Stack layer','ray-facet':'Ray to facet centre','ray-vertex':'Ray to vertex','ray-edge-u':'Ray to row-edge centre','ray-edge-v':'Ray to column-edge centre'};
export function target(shell,face,kind,index,layer){return validateTarget({shell,face,kind,index,...(layer?{layer}:{})});}
export function validateTarget(t){
  if(!t||!KINDS.includes(t.kind))throw Error('Choose a facet, edge, vertex or volume point.');
  address(t.shell,t.kind==='volume'?1:t.index,t.face);
  if(t.kind==='volume'&&(typeof t.index!=='string'||!t.index||t.index.length>200))throw Error('Invalid volume point ID.');
  if(t.kind==='stack'&&(!Number.isInteger(t.layer)||t.layer<1||t.layer>16777215))throw Error('A stack layer must be between 1 and 16,777,215.');
  return {shell:t.shell,face:t.face,kind:t.kind,index:t.index,...(t.kind==='stack'?{layer:t.layer}:{})};
}
export function targetKey(t){return `${t.shell}/${t.face}/${t.kind}/${t.index}${t.kind==='stack'?'/'+t.layer:''}`;}
export function targetLabel(t){
  if(!t)return 'Nothing selected';
  if(t.kind.startsWith('ray-'))return `${KIND_NAMES[t.kind]} · ${targetLabel({...t,kind:t.kind.slice(4)})}`;
  if(t.kind==='facet')return address(t.shell,t.index,t.face);
  if(t.kind==='stack')return `${address(t.shell,t.index,t.face)} · Layer ${t.layer} · ${stackColour(t.shell,t.layer)}`;
  if(t.kind==='volume')return `${SHELLS[t.shell][0]} ${t.face} · Volume point`;
  const n=String(t.index).padStart(3,'0'),r=Math.floor((t.index-1)/24)+1;
  return `${SHELLS[t.shell][0]} ${t.face} · ${t.kind==='vertex'?`R${r},L${n}`:t.kind==='edge-u'?`E-U${n}`:`E-V${n}`}`;
}
export function remembered(selections,shell,face){return selections[`${shell}/${face}`]??null;}
export function remember(selections,t,shell=t?.shell,face=t?.face){
  address(shell,1,face);return {...selections,[`${shell}/${face}`]:t?validateTarget(t):null};
}
export function selectFacetGroup(groups,t,toggle=false){
  t=validateTarget(t);if(t.kind!=='facet')throw Error('Choose a facet for group selection.');
  const key=`${t.shell}/${t.face}`,previous=groups[key]||[];
  const cells=toggle?(previous.includes(t.index)?previous.filter(n=>n!==t.index):[...previous,t.index]):[t.index];
  const focused=cells.includes(t.index)?t:cells.length?target(t.shell,t.face,'facet',cells.at(-1)):null;
  return {groups:{...groups,[key]:cells},focused};
}
export function setFacetStacks(stacks,facets,count){
  if(!Number.isInteger(count)||count<0||count>16777215)throw Error('Use a stack count from 0 to 16,777,215.');
  const keys=new Set();for(const t of facets){validateTarget(t);if(t.kind!=='facet')throw Error('Select base facets to set stack counts.');keys.add(`${t.shell}/${t.face}/${t.index}`);}
  const next=stacks.filter(s=>!keys.has(`${s.shell}/${s.face}/${s.cell}`));
  if(count)for(const key of keys){const [shell,face,cell]=key.split('/');next.push({shell:+shell,face,cell:+cell,count});}
  return next;
}
export function recordTarget(r){return r.anchor||target(r.shell,r.face,'facet',r.cell);}
export function recordsAt(records,t){return t?records.filter(r=>targetKey(recordTarget(r))===targetKey(t)):[];}
export function parameters(t){
  if(t.kind.startsWith('ray-'))t={...t,kind:t.kind.slice(4)};
  const r=Math.floor((t.index-1)/24),c=(t.index-1)%24;
  if(t.kind==='facet'||t.kind==='stack')return [(c+.5)/24,(r+.5)/12];
  if(t.kind==='vertex')return [c/24,r/12];
  return t.kind==='edge-u'?[(c+.5)/24,r/12]:[c/24,(r+.5)/12];
}
export function targetPoint(t,pose,vectors=[]){
  if(t.kind==='volume'){const v=vectors.find(v=>v.id===t.index);return v?v.position.map(x=>x*4.4):[0,0,0];}
  if(t.kind==='stack')return stackPoint(t,...parameters(t),pose);
  return shellPoint(...parameters(t),pose,t.shell);
}
export function edgePoints(t,pose){
  const r=Math.floor((t.index-1)/24),c=(t.index-1)%24;
  return Array.from({length:9},(_,i)=>shellPoint((c+(t.kind==='edge-u'?i/8:0))/24,(r+(t.kind==='edge-v'?i/8:0))/12,pose,t.shell));
}
export function rayEnd(t,pose,vectors=[]){
  const p=targetPoint(t,pose,vectors);
  // Coincident horn registers retain their IDs but have no visible ray length.
  return Math.hypot(...p)<1e-9?null:p;
}
// Stable ray addresses are independent of camera, skin and animation.
export function rayTargets(shell,face,mode,selection=null){
  if(mode==='selected')return selection?[selection]:[];
  const kinds=({centres:['facet'],vertices:['vertex'],edges:['edge-u','edge-v'],all:['facet','vertex','edge-u','edge-v']})[mode]||[];
  return kinds.flatMap(kind=>Array.from({length:288},(_,i)=>target(shell,face,'ray-'+kind,i+1)));
}
export function rayDescriptor(t,pose=PRESETS.horn){
  validateTarget(t);if(!t.kind.startsWith('ray-'))throw Error('Choose a ray.');
  const end=targetPoint(t,pose);
  return {id:targetKey(t),target:{...t},origin:[0,0,0],end,length:Math.hypot(...end),endpoint:{...t,kind:t.kind.slice(4)}};
}
export function parseValues(text){
  if(!text.trim())return [];
  let values;try{values=text.trim().startsWith('[')?JSON.parse(text):text.trim().split(/[\s,]+/).map(Number);}catch{throw Error('Use a list of finite numbers for vector values.');}
  if(!Array.isArray(values)||!values.every(v=>typeof v==='number'&&Number.isFinite(v)))throw Error('Use a list of finite numbers for vector values.');
  return values;
}
export const stackColour=(shell,layer)=>'#'+((parseInt(SHELLS[shell][1].slice(1),16)+layer)%16777216).toString(16).padStart(6,'0');
// Display height is independent of the number of stored program steps.
export const stackDepth=(layer,count=Math.max(24,layer))=>Math.min(1.2,count*.04)*layer/count;
export function stackPoint(t,u,v,pose){
  const base=shellPoint(u,v,pose,t.shell),[uc,vc]=parameters(t),delta=.00001;
  const a=shellPoint(uc+delta,vc,pose,t.shell),b=shellPoint(uc-delta,vc,pose,t.shell),c=shellPoint(uc,vc+delta,pose,t.shell),d=shellPoint(uc,vc-delta,pose,t.shell),du=a.map((n,i)=>n-b[i]),dv=c.map((n,i)=>n-d[i]);
  let n=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]];
  if(pose.curl<.001&&pose.ring<.001)n=[0,0,1];
  const count=pose.stackCounts?.[`${t.shell}/${t.face}/${t.index}`];
  const len=Math.hypot(...n)||1,depth=stackDepth(t.layer,count)*(1+3*(pose.explodeStacks||0));
  return base.map((x,i)=>x+n[i]/len*depth);
}
export const STACK_DRAW_LIMIT=256;
export function stackSamples(count,selected=null){
  const size=Math.min(count,STACK_DRAW_LIMIT);
  const ids=Array.from({length:size},(_,i)=>count<=STACK_DRAW_LIMIT?i+1:1+Math.round(i*(count-1)/(size-1)));
  if(Number.isInteger(selected)&&selected>=1&&selected<=count&&!ids.includes(selected))ids.push(selected);
  return ids.sort((a,b)=>a-b);
}
export function fitStackFrame(frame,radius,aspect,zoom=1){
  if(frame.inside||!radius)return frame;
  const vertical=frame.fov*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect);
  const required=radius*1.12/Math.sin(Math.min(vertical,horizontal))/zoom,current=Math.hypot(...frame.eye);
  return required>current?{...frame,eye:frame.eye.map(n=>n*required/current)}:frame;
}
export function validateSpatial(raw,records){
  const selections={},facetSelections={},vectors=[],programs=[],stacks=[];
  if(raw.facetSelections!==undefined&&(!raw.facetSelections||Array.isArray(raw.facetSelections)||typeof raw.facetSelections!=='object'))throw Error('Invalid facet group selections.');
  for(const [key,cells] of Object.entries(raw.facetSelections||{})){
    if(!/^[0-6]\/[IO]$/.test(key)||!Array.isArray(cells)||new Set(cells).size!==cells.length)throw Error('Each facet group needs distinct cells on its own torus and side.');
    for(const cell of cells)address(+key[0],cell,key[2]);
    facetSelections[key]=[...cells];
  }
  if(raw.stacks!==undefined&&!Array.isArray(raw.stacks))throw Error('Invalid facet stacks.');
  const stackIds=new Set();for(const s of raw.stacks||[]){address(s.shell,s.cell,s.face);const key=`${s.shell}/${s.face}/${s.cell}`;if(stackIds.has(key)||!Number.isInteger(s.count)||s.count<1||s.count>16777215)throw Error('Use one stack per facet, with 1 to 16,777,215 added layers.');stackIds.add(key);stacks.push({shell:s.shell,cell:s.cell,face:s.face,count:s.count});}
  if(raw.selections!==undefined&&(!raw.selections||Array.isArray(raw.selections)||typeof raw.selections!=='object'))throw Error('Invalid remembered selections.');
  if(raw.vectors!==undefined&&!Array.isArray(raw.vectors))throw Error('Invalid vector list.');
  const ids=new Set();
  for(const v of raw.vectors||[]){
    if(!v||typeof v.id!=='string'||!v.id||v.id.length>200||ids.has(v.id))throw Error('Vector IDs must be unique.');ids.add(v.id);
    address(v.shell,1,v.face);
    if(typeof v.label!=='string'||!v.label.trim()||v.label.length>500)throw Error('Give the vector a label.');
    if(!Array.isArray(v.position)||v.position.length!==3||!v.position.every(x=>Number.isFinite(x)&&x>=-1&&x<=1))throw Error('Volume coordinates must be between -1 and 1.');
    if(!Array.isArray(v.values)||!v.values.every(x=>typeof x==='number'&&Number.isFinite(x)))throw Error('Vector values must be finite numbers.');
    const anchor=v.anchor?validateTarget(v.anchor):null;if(anchor?.kind==='volume')throw Error('Bind a vector to a facet, edge or vertex.');
    vectors.push({id:v.id,label:v.label.trim(),shell:v.shell,face:v.face,position:[...v.position],values:[...v.values],anchor});
  }
  function checked(t){t=validateTarget(t);if(t.kind==='volume'&&!vectors.some(v=>v.id===t.index&&v.shell===t.shell&&v.face===t.face))throw Error('The selected volume point no longer exists.');if(t.kind==='stack'&&!stacks.some(s=>s.shell===t.shell&&s.face===t.face&&s.cell===t.index&&s.count>=t.layer))throw Error('The selected stack layer does not exist.');return t;}
  vectors.forEach(v=>{if(v.anchor)checked(v.anchor);});
  for(const [k,t]of Object.entries(raw.selections||{})){
    if(!/^[0-6]\/[IO]$/.test(k))throw Error('Invalid selection owner.');
    selections[k]=t===null?null:checked(t);
    if(t&&k!==`${t.shell}/${t.face}`)throw Error('Each selection belongs to its own torus and side.');
  }
  for(const r of records)if(r.anchor){checked(r.anchor);if(r.anchor.shell!==r.shell||r.anchor.face!==r.face||(r.anchor.kind!=='volume'&&r.anchor.index!==r.cell))throw Error('A record anchor must match its shell, side and cell register.');}
  if(raw.programs!==undefined&&!Array.isArray(raw.programs))throw Error('Invalid sequence list.');
  const programIds=new Set();
  for(const p of raw.programs||[]){
    if(!p||typeof p.id!=='string'||!p.id||p.id.length>200||programIds.has(p.id))throw Error('Sequence IDs must be unique.');programIds.add(p.id);
    if(typeof p.name!=='string'||!p.name.trim()||p.name.length>300||typeof p.loop!=='boolean'||!Array.isArray(p.steps))throw Error('Invalid sequence.');
    const steps=p.steps.map(s=>{
      if(!s||!['visit','recall','pause'].includes(s.action)||!Number.isFinite(s.seconds)||s.seconds<.1||s.seconds>120)throw Error('A step needs Visit, Recall or Pause, and 0.1 to 120 seconds.');
      const t=checked(s.target),span=s.span??1;
      if(!Number.isInteger(span)||span<1||span>16777215||(span>1&&t.kind!=='stack'))throw Error('Only stack steps can span multiple ordered layers.');
      if(t.kind==='stack')checked({...t,layer:t.layer+span-1});
      return {target:t,action:s.action,seconds:s.seconds,...(s.span!==undefined?{span}:{})};
    });programs.push({id:p.id,name:p.name.trim(),loop:p.loop,steps});
  }
  return {selections,facetSelections,vectors,programs,stacks};
}
export const sequenceLength=p=>p.steps.reduce((n,s)=>n+(s.span||1),0);
export function sequenceStep(program,index,project){
  const total=sequenceLength(program);if(!Number.isInteger(index)||index<0||index>=total)throw Error('This sequence has no step at that position.');
  let offset=index,step;for(const s of program.steps){if(offset<(s.span||1)){step=s;break;}offset-=s.span||1;}
  const t=step.target.kind==='stack'?{...step.target,layer:step.target.layer+offset}:step.target;
  return {target:t,action:step.action,seconds:step.seconds,
    records:step.action==='recall'?structuredClone(recordsAt(project.records,t)):[],
    next:index+1<total?index+1:program.loop?0:null};
}
export function agentPackage(program,project){
  const included=t=>program.steps.some(s=>s.target.kind==='stack'?t.kind==='stack'&&s.target.shell===t.shell&&s.target.face===t.face&&s.target.index===t.index&&t.layer>=s.target.layer&&t.layer<s.target.layer+(s.span||1):targetKey(s.target)===targetKey(t));
  return {format:'aura-agent-program/1',lattice:project.lattice,rows:12,columns:24,operations:{visit:'Focus the address. No external action.',recall:'Read the attached records as context. Do not execute asset contents automatically.',pause:'Wait for the step duration.'},geometry:{rayOrigin:[0,0,0],rayKinds:['ray-facet','ray-vertex','ray-edge-u','ray-edge-v'],rayEndpoints:'Resolve the matching facet centre, vertex or edge centre on the addressed torus.'},program:structuredClone(program),records:project.records.filter(r=>included(recordTarget(r))),vectors:project.vectors.filter(v=>included(target(v.shell,v.face,'volume',v.id))||(v.anchor&&included(v.anchor))),stacks:project.stacks.filter(s=>program.steps.some(p=>p.target.kind==='stack'&&p.target.shell===s.shell&&p.target.face===s.face&&p.target.index===s.cell))};
}
export function cameraFrame(p,shell,face,theta,phi,aspect,zoom=1){
  const closed=p.curl>.99&&p.ring>.99;
  const size=Math.max(9,24*(1-p.ring)+13*p.ring,20*p.arrange);
  if(face==='I'&&closed){
    const scale=1+(((shell+1)/7+(.44-(shell+1)/7)*p.arrange)-1)*p.nest;
    const radius=(24-12*p.pinch)/(2*Math.PI)*scale;
    const eye=[0,(shell-3)*2.3*p.arrange*p.nest,radius];
    const direction=[Math.sin(theta)*Math.cos(phi),Math.sin(phi),Math.cos(theta)*Math.cos(phi)];
    return {eye,look:eye.map((n,i)=>n+direction[i]),near:Math.max(.001,.01*scale),fov:Math.max(35,Math.min(115,105/zoom)),inside:true};
  }
  const distance=Math.max(size/Math.min(aspect,1.65)*1.85,31*p.arrange)/zoom;
  const sign=face==='I'?-1:1;
  return {eye:[sign*Math.sin(theta)*Math.cos(phi)*distance,Math.sin(phi)*distance,sign*Math.cos(theta)*Math.cos(phi)*distance],look:[0,0,0],near:.05,fov:36,inside:false};
}
