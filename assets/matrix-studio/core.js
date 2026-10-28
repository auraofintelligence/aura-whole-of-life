import {validateShellStyles} from './shell-style.js?v=0.4.26';
import {defaultAuraGlow,validateAuraGlow} from './aura-glow-data.js?v=0.4.26';
import {validateTables,validateQuickStart} from './dataset-schema.js?v=0.4.26';
import {emptyFavourites,validateFavourites} from './favourites-data.js?v=0.4.26';
import {validateSpatial,validateTarget} from './spatial.js?v=0.4.26';
// Based on Luke Nathan Hayes' aura-horn-torus roll path and aura-spatial-perception addressing.
// The drawing can change shape. These dimensions and semantic addresses cannot.
export const ROWS = 12, COLS = 24, CELLS = 288, LATTICE = 'aura-lattice/1.0.0';
export const FORMAT = 'aura-matrix-studio/1';
export const SHELLS = [
  ['Red','#e23a2e'],['Orange','#f2801f'],['Yellow','#edc119'],['Green','#35a24f'],
  ['Blue','#2f6fed'],['Indigo','#5546c8'],['Violet','#9a4fd6']
];
export const PRESETS = {
  flat: { name:'Flat matrix', curl:0, ring:0, pinch:0, nest:0, arrange:0 },
  tube: { name:'Cylinder', curl:1, ring:0, pinch:0, nest:0, arrange:0 },
  ring: { name:'Ring torus', curl:1, ring:1, pinch:0, nest:0, arrange:0 },
  horn: { name:'Horn torus', curl:1, ring:1, pinch:1, nest:0, arrange:0 },
  nested: { name:'Seven nested shells', curl:1, ring:1, pinch:1, nest:1, arrange:0 },
  body: { name:'Body arrangement', curl:1, ring:1, pinch:1, nest:1, arrange:1 }
};
export const CAMERAS = { front:[0,0], quarter:[0.55,0.4], top:[0,1.5] };
export const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
export const lerp = (a,b,t) => a+(b-a)*t;
export const ease = t => {t=clamp(t);return t*t*(3-2*t);};
export function address(shell,cell,face) {
  if (!Number.isInteger(shell)||shell<0||shell>6||!Number.isInteger(cell)||cell<1||cell>CELLS||!['I','O'].includes(face)) throw Error('Use a shell, cell 1 to 288, and side I or O.');
  return `${SHELLS[shell][0]} ${face}${cell}`;
}
export function neighbours(cell) {
  address(0,cell,'I'); const r=Math.floor((cell-1)/COLS),c=(cell-1)%COLS;
  return {north:((r+11)%12)*24+c+1,east:r*24+(c+1)%24+1,south:((r+1)%12)*24+c+1,west:r*24+(c+23)%24+1};
}
export function point(u,v,p) {
  const tau=Math.PI*2,r=ROWS/tau, axial=lerp(COLS,ROWS,p.pinch);
  const av=p.curl*tau, au=p.ring*tau;
  const t=av>1e-6 ? ROWS/av*Math.sin((v-1)*av) : (v-1)*ROWS;
  const g=av>1e-6 ? ROWS/av*(1-Math.cos((v-1)*av)) : 0;
  const dr=g-r*p.curl, y=-(t+ROWS/2*(1-p.curl));
  if(au<=1e-6) return [(u-.5)*axial,y,dr];
  const rho=axial/au,psi=(u-.5)*au;
  return [(rho+dr)*Math.sin(psi),y,(rho+dr)*Math.cos(psi)-rho+axial/tau*p.ring];
}
export function shellPoint(u,v,p,shell,focus=0) {
  const xyz=point(u,v,p), nestedScale=(shell+1)/7;
  const size=lerp(1,lerp(nestedScale,.44,p.arrange),p.nest);
  // A focused shell is enlarged for editing; its address is unchanged.
  return [xyz[0]*size,xyz[1]*size+(shell-3)*2.3*p.arrange*p.nest,xyz[2]*size];
}
export function makeStory() {
  const captions=[
    'Start with twelve rows and twenty-four columns. Every cell is a place you can return to.',
    'Curl the matrix into a cylinder. Your records keep their original cell addresses.',
    'Bend the cylinder until its ends meet. The same matrix now forms a ring torus.',
    'Bring the inner opening to one shared point. This is the horn torus.',
    'Seven shells share the same twelve by twenty-four structure. Choose your own meanings.',
    'Spread the shells into a body arrangement. Follow relationships across the same addresses.'
  ];
  return Object.keys(PRESETS).map((preset,i)=>({preset,duration:6,camera:i===0?'front':'quarter',caption:captions[i]}));
}
export function poseAt(story,time) {
  const total=story.reduce((n,s)=>n+s.duration,0);time=clamp(time,0,total);
  let begin=0,i=0;
  for(;i<story.length-1;i++){if(time<begin+story[i].duration)break;begin+=story[i].duration;}
  const shot=story[i], previous=story[Math.max(0,i-1)], phase=clamp((time-begin)/Math.min(3,shot.duration*.65));
  const p={},a=PRESETS[previous.preset],b=PRESETS[shot.preset],e=ease(phase);
  for(const key of ['curl','ring','pinch','nest','arrange'])p[key]=lerp(a[key],b[key],e);
  p.camera=CAMERAS[shot.camera].map((n,j)=>lerp(CAMERAS[previous.camera][j],n,e));
  return {pose:p,index:i,caption:shot.caption,total,time};
}
export function blankProject(){return {format:FORMAT,lattice:LATTICE,rows:ROWS,columns:COLS,records:[],links:[],story:makeStory(),selections:{},facetSelections:{},vectors:[],programs:[],stacks:[],tables:[],quickStart:{step:0},shellStyles:{},auraGlow:defaultAuraGlow(),favourites:emptyFavourites()};}
const cleanText=(v,label,max=100000)=>{if(typeof v!=='string'||v.length>max)throw Error(`Invalid ${label}.`);return v;};
export function validateProject(raw) {
  if(!raw||raw.format!==FORMAT||raw.lattice!==LATTICE||raw.rows!==ROWS||raw.columns!==COLS)throw Error('This file must use Aura Matrix Studio and the fixed 12 × 24 lattice.');
  if(!Array.isArray(raw.records)||!Array.isArray(raw.links)||!Array.isArray(raw.story)||!raw.story.length)throw Error('The project is missing records, connections or its explainer.');
  const ids=new Set();
  const records=raw.records.map(r=>{
    if(!r||typeof r!=='object')throw Error('Invalid record.');
    const id=cleanText(r.id,'record ID',200);if(!id||ids.has(id))throw Error('Record IDs must be unique.');ids.add(id);
    address(r.shell,r.cell,r.face);
    const title=cleanText(r.title,'title',500).trim();if(!title)throw Error('A record needs a title.');
    const fields={};for(const [k,v] of Object.entries(r.fields||{})){if(['__proto__','prototype','constructor'].includes(k))continue;Object.defineProperty(fields,cleanText(k,'column',500),{value:cleanText(v,'field'),enumerable:true});}
    let asset;if(r.asset){const url=cleanText(r.asset.url,'asset URL',4000);let parsed;try{parsed=new URL(url);}catch{throw Error('Use a full https:// or http:// asset link.');}if(!['https:','http:'].includes(parsed.protocol))throw Error('Asset links must use https:// or http://.');asset={url:parsed.href};}
    let data;if(r.data!==undefined){const encoded=JSON.stringify(r.data,(_,v)=>{if(typeof v==='number'&&!Number.isFinite(v))throw Error('Attached data contains a non-finite number.');return v;});if(encoded===undefined)throw Error('Attached data must be valid JSON.');data=JSON.parse(encoded);}
    return {id,title,note:cleanText(r.note||'','note'),shell:r.shell,cell:r.cell,face:r.face,fields,...(r.anchor?{anchor:validateTarget(r.anchor)}:{}),...(asset?{asset}:{}),...(r.instructions!==undefined?{instructions:cleanText(r.instructions,'instructions')}:{}) ,...(data!==undefined?{data}:{})};
  });
  const links=raw.links.map(l=>{if(!l||!ids.has(l.from)||!ids.has(l.to)||l.from===l.to)throw Error('A connection needs two different existing records.');return{from:l.from,to:l.to,label:cleanText(l.label,'connection label',300)};});
  const story=raw.story.map(s=>{if(!s||!Object.hasOwn(PRESETS,s.preset)||!Object.hasOwn(CAMERAS,s.camera)||!Number.isFinite(s.duration)||s.duration<1||s.duration>120)throw Error('An explainer shot needs a recognised shape and camera, and 1 to 120 seconds.');return{preset:s.preset,camera:s.camera,duration:s.duration,caption:cleanText(s.caption,'caption',700)};});
  return {...blankProject(),records,links,story,...validateSpatial(raw,records),tables:validateTables(raw.tables),quickStart:validateQuickStart(raw.quickStart),shellStyles:validateShellStyles(raw.shellStyles),auraGlow:validateAuraGlow(raw.auraGlow),favourites:validateFavourites(raw.favourites)};
}
// Quoted commas, newlines, BOMs and escaped double quotes are supported.
export function parseCSV(text) {
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],value='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
    if(c==='"'){if(value||closed)throw Error('Unexpected quote in CSV.');quoted=true;continue;}
    if(c===','||c==='\n'||c==='\r'){row.push(value);value='';closed=false;if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}continue;}
    if(closed)throw Error('Unexpected text after a quoted CSV value.');value+=c;
  }
  if(quoted)throw Error('An opening CSV quote has no closing quote.');
  if(value||row.length){row.push(value);if(row.some(x=>x!==''))rows.push(row);}
  if(rows.length<2)throw Error('Choose a CSV with a header and at least one data row.');
  const headers=rows.shift().map(x=>x.trim());
  if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('CSV column names must be non-empty and unique.');
  if(rows.some(r=>r.length!==headers.length))throw Error('Every CSV row must have the same number of columns as the header.');
  return {headers,rows};
}
export function recordsFromCSV(csv,mapping,makeId) {
  if(!csv.headers.includes(mapping.title))throw Error('Choose the column containing record titles.');
  address(mapping.shell,mapping.start,mapping.face);
  return csv.rows.map((row,i)=>{
    const fields=Object.fromEntries(csv.headers.map((h,j)=>[h,row[j]]));
    const title=fields[mapping.title].trim();if(!title)throw Error(`Row ${i+2} has an empty title.`);
    const cell=mapping.cell ? Number(fields[mapping.cell]) : ((mapping.start-1+i)%CELLS)+1;
    address(mapping.shell,cell,mapping.face);
    return {id:makeId(),title,note:fields[mapping.note]||'',shell:mapping.shell,cell,face:mapping.face,fields};
  });
}
export function exampleRecords(makeId) {
  return [
    ['Observation','The sample garden bed receives morning sunlight.',97],
    ['Question','Does the shaded bed need less water?',98],
    ['Comparison','Compare two beds over the same seven days.',121],
    ['Action','Record soil moisture at the same time each morning.',122]
  ].map(([title,note,cell])=>({id:makeId(),title:`Example: ${title}`,note,shell:0,cell,face:'I',fields:{dataset:'Fictional learning example'}}));
}
