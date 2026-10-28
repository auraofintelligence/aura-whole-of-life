import {mountMatrix} from '../matrix-studio/viewer.js?ui=instant-2';
import {SHELLS,validateProject,neighbours} from '../matrix-studio/core.js?v=0.4.26';
import {target,targetKey,recordTarget,recordsAt} from '../matrix-studio/spatial.js?v=0.4.26';
import {contexts} from './fixtures.js';
import {getStepCards,STAGE_FIELDS,mergeCardValues} from './instant-fields.js';
import {syncInstantSample} from './instant-data.js';

const params=new URLSearchParams(location.search),example=params.get('example')||'memory';
const stage=Object.hasOwn(STAGE_FIELDS,params.get('stage'))?params.get('stage'):'favourites';
const context=contexts[example]||contexts.memory,root=document.getElementById('starter');
const cards=getStepCards(stage,context),slots=new Map(),controls=new Map();
let project=validateProject(structuredClone(context.project)),selection=target(0,'O','facet',1),step=0,viewer,current=null,labelFrame=0;
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const button=(label,fn)=>{const el=make('button',label);el.type='button';el.onclick=fn;return el;};
root.replaceChildren();root.className='instant-host';
const header=make('header',undefined,'instant-header');header.append(make('h1',STAGE_FIELDS[stage].label),make('span','Fictional sample','instant-sample'));root.append(header);
const tool=make('section',undefined,'instant-tool'),scene=make('div',undefined,'instant-scene'),tag=make('div',undefined,'instant-facet-tag');tag.setAttribute('aria-hidden','true');tool.append(scene,tag);root.append(tool);
const owner=make('div',undefined,'instant-owner'),layer=make('select');layer.setAttribute('aria-label','Aura colour');SHELLS.forEach(([name],i)=>{const option=make('option',name);option.value=String(i);layer.append(option);});
const side=button('Inside',()=>pick(target(selection.shell,selection.face==='O'?'I':'O','facet',selection.index))),address=make('label',undefined,'instant-address'),facetNumber=make('input');facetNumber.type='number';facetNumber.min='1';facetNumber.max='288';facetNumber.step='1';facetNumber.setAttribute('aria-label','Facet number');address.append(make('span','Facet'),facetNumber);owner.append(layer,side,address);root.append(owner);
facetNumber.addEventListener('input',()=>{const cell=Number(facetNumber.value);if(Number.isInteger(cell)&&cell>=1&&cell<=288)pick(target(selection.shell,selection.face,'facet',cell));});
if(stage==='allocate'){layer.hidden=true;side.hidden=true;}
layer.onchange=()=>pick(target(Number(layer.value),selection.face,'facet',selection.index));
const navigation=make('nav',undefined,'instant-steps');navigation.setAttribute('aria-label','Sample steps');const previous=button('← Previous',()=>cycle(-1)),progress=make('span'),next=button('Next →',()=>cycle(1));navigation.append(previous,progress,next);root.append(navigation);
const cardTitle=make('h2',undefined,'instant-card-title'),form=make('form',undefined,'instant-fields');form.onsubmit=event=>event.preventDefault();root.append(cardTitle,form);
const status=make('p',undefined,'instant-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
const footer=make('footer',undefined,'instant-footer'),reset=button('Reset sample',resetSample),about=make('details');about.append(make('summary','About this sample'),make('p','Based on Aura Matrix Studio by Luke Nathan Hayes / Strange But True / Aura of Intelligence. Native Studio code; changes stay in this sample. Used under the Strange But True Public Source Licence.'));footer.append(reset,about);root.append(footer);

function seed(){
  project=validateProject(structuredClone(context.project));slots.clear();step=0;selection=target(0,'O','facet',1);
  if(stage==='favourites'){
    const result=syncInstantSample(project,{stage,values:cards.map(card=>card.values),shell:0,face:'O',cell:1,mode:'facets'});
    if(!result.valid)throw Error(result.error);project=result.project;
    result.ref.bindings.forEach((binding,i)=>slots.set(targetKey(binding.target),{ref:{stage,items:[result.ref.items[i]],bindings:[binding],recordId:binding.recordId},values:{...cards[i].values}}));
  }else{
    let values={...cards[0].values};
    if(stage==='avatar'){const keys=new Set(cards.flatMap(card=>card.fields.map(field=>field.key)));values=Object.fromEntries(Object.entries(values).filter(([key])=>keys.has(key)));}
    if(stage==='allocate')values={...values,shell:0,face:'O',start:1,mode:'facets'};
    const result=syncInstantSample(project,{stage,values,...(stage==='allocate'?{}:{target:selection})});
    if(!result.valid)throw Error(result.error);project=result.project;selection=result.selection||selection;
    const state={ref:result.ref,values};for(const binding of result.ref.bindings)slots.set(targetKey(binding.target),state);
  }
}
function stateAt(t){
  const key=targetKey(t);if(slots.has(key))return slots.get(key);
  const record=recordsAt(project.records,t)[0],card=cards[step];
  const row=record&&project.tables.find(table=>table.id===record.fields?.['Aura table ID']);
  const source=row?.rows.find(item=>item.id===record.fields?.['Aura row ID']);
  const saved=source?Object.fromEntries(row.columns.map((name,i)=>[name,source.values[i]])):{};
  const values={...card.values,...saved,...(record?.fields||{})};
  if(!record){for(const field of cards.flatMap(item=>item.fields))if(!['date','time'].includes(field.type))values[field.key]='';}
  if(stage==='allocate')Object.assign(values,{shell:t.shell,face:t.face,start:t.index,mode:t.kind==='stack'?'stack':'facets'});
  if(stage!=='allocate'&&stage!=='avatar'){values.Title=record?.title||'';if(stage==='travel')values.Destination=saved.Destination||'';if(stage==='favourites')values['What resonates']=saved['What resonates']??record?.note??'';}
  const state={values,ref:record?{recordId:record.id}:undefined};slots.set(key,state);return state;
}
function selectOwner(t){
  selection=t;layer.value=String(t.shell);side.textContent=t.face==='O'?'Inside':'Outside';side.setAttribute('aria-label',t.face==='O'?'Look inside':'Look outside');facetNumber.value=String(t.index);
}
function pick(t){
  if(!['facet','stack'].includes(t.kind))return;
  const changedFace=selection.face!==t.face;
  if(stage==='favourites'&&t.kind==='facet'&&t.index>=1&&t.index<=3)step=t.index-1;
  selectOwner(t);current=stateAt(t);viewer?.updateProject(project,selection);renderCard();showResult();
  if(changedFace&&t.face==='I')aimInside();
  positionTag();
}
function cycle(delta){
  step=(step+delta+cards.length)%cards.length;
  const nextTarget=stage==='favourites'?target(selection.shell,selection.face,'facet',cards[step].facet):selection;
  selectOwner(nextTarget);current=stateAt(nextTarget);viewer?.updateProject(project,selection);renderCard();showResult();positionTag();
}
function renderCard(){
  const card=cards[step];cardTitle.textContent=card.label;progress.textContent=(step+1)+' / '+cards.length;
  previous.hidden=next.hidden=cards.length===1;navigation.classList.toggle('single-step',cards.length===1);
  form.replaceChildren();controls.clear();form.classList.toggle('has-category',card.fields.some(field=>field.key==='Category'));
  for(const field of card.fields){
    const label=make('label',field.key==='Category'?'Kind':field.label),input=make(field.type==='textarea'?'textarea':field.type==='select'?'select':'input');
    if(input.tagName==='INPUT')input.type=field.type||'text';
    if(input.tagName==='TEXTAREA')input.rows=2;
    if(field.type==='select'){if(current.values[field.key]===''){const option=make('option','Choose');option.value='';input.append(option);}for(const choice of field.options){const option=make('option',choice.label);option.value=choice.value;input.append(option);}}
    input.value=current.values[field.key]??field.value??'';input.setAttribute('aria-label',field.label);input.addEventListener('input',()=>edit(field.key,input.value));input.addEventListener('change',()=>{if(String(current.values[field.key]??'')!==input.value)edit(field.key,input.value);});
    label.append(input);form.append(label);controls.set(field.key,input);
  }
}
function edit(key,value){
  current.values={...current.values,[key]:value};let values=mergeCardValues(cards[step],current.values,{[key]:value});
  if(stage==='avatar'){const keys=new Set(cards.flatMap(card=>card.fields.map(field=>field.key)));values=Object.fromEntries(Object.entries(values).filter(([name])=>keys.has(name)));}
  const options=stage==='allocate'?{values:{...values,start:selection.index}}:{values,target:selection,reuseSeed:false};
  const result=syncInstantSample(project,{stage,ref:current.ref,...options});
  if(!result.valid){status.textContent=result.error;return;}
  const changedFace=selection.face!==result.selection?.face;
  project=result.project;current.ref=result.ref;current.values=values;
  if(stage==='allocate'){const originalStacks=new Set(context.project.stacks.map(stack=>stack.shell+'/'+stack.face+'/'+stack.cell));project=validateProject({...project,stacks:project.stacks.filter(stack=>originalStacks.has(stack.shell+'/'+stack.face+'/'+stack.cell)||project.records.some(record=>record.anchor?.kind==='stack'&&record.shell===stack.shell&&record.face===stack.face&&record.cell===stack.cell))});}
  if(stage==='allocate'){selection=result.selection||selection;for(const binding of result.ref.bindings)slots.set(targetKey(binding.target),current);selectOwner(selection);}
  viewer.updateProject(project,selection);if(changedFace&&selection.face==='I')aimInside();showResult(key);positionTag();
}
function aimInside(){if(!viewer?.view)return;const p=viewer.view.centre({shell:selection.shell,face:selection.face,cell:selection.index,anchor:selection}),eye=viewer.view.camera.position.toArray(),d=p.map((n,i)=>n-eye[i]);viewer.view.theta=Math.atan2(d[0],d[2]);viewer.view.phi=Math.max(-1.5,Math.min(1.5,Math.atan2(d[1],Math.hypot(d[0],d[2]))));viewer.view.render();}
function showResult(key=cards[step].fields[0]?.key){
  const records=recordsAt(project.records,selection),first=records[0];
  const title=stage==='avatar'?records.find(record=>record.fields['Aura row ID']===key)?.fields.Measurement||records.map(record=>record.fields.Measurement).filter(Boolean).join(' · '):key==='Title'?first?.title:first?.fields[key]||first?.title;
  tag.textContent='Facet '+selection.index+(title?' · '+title:'');tag.title=title||'No sample text at this facet';
  status.textContent=!viewer?.view?'3D is unavailable. Choose a facet number to edit its text.':first?'Text attached to the highlighted facet.':'Select a facet and give it some text.';
  positionTag();
}
function positionTag(){
  if(labelFrame)return;labelFrame=requestAnimationFrame(()=>{labelFrame=0;if(!viewer?.view)return;const p=viewer.view.project({shell:selection.shell,face:selection.face,cell:selection.index,anchor:selection}),bounds=scene.getBoundingClientRect();tag.style.left=Math.max(8,Math.min(bounds.width-tag.offsetWidth-8,(p.x+1)*bounds.width/2+12))+'px';tag.style.top=Math.max(8,Math.min(bounds.height-38,(1-p.y)*bounds.height/2-30))+'px';});
}
function resetSample(){seed();viewer?.updateProject(project,selection);pick(selection);}
seed();
viewer=mountMatrix(scene,{mode:'single',example,project,selection,compact:true,onSelection:t=>pick(t)});
if(viewer.view){viewer.view.theta=Math.PI-.35;viewer.view.phi=-.6;viewer.view.zoom=1.1;viewer.view.marker.material.color.set('#ffb800');viewer.view.marker.scale.setScalar(1.4);viewer.view.render();}
selectOwner(selection);current=stateAt(selection);renderCard();showResult();
scene.addEventListener('pointermove',positionTag);scene.addEventListener('pointerup',positionTag);scene.addEventListener('wheel',positionTag,{passive:true});scene.addEventListener('keydown',positionTag);
scene.addEventListener('keydown',event=>{const direction={ArrowLeft:'west',ArrowRight:'east',ArrowUp:'north',ArrowDown:'south'}[event.key];if(event.shiftKey&&direction){event.preventDefault();event.stopImmediatePropagation();pick(target(selection.shell,selection.face,'facet',neighbours(selection.index)[direction]));}},{capture:true});
let announcedHeight=0;const announceSize=()=>{const height=Math.ceil(root.getBoundingClientRect().height+20);if(height!==announcedHeight){announcedHeight=height;parent.postMessage({type:'aura-starter-size',height},location.origin);}positionTag();};new ResizeObserver(announceSize).observe(root);announceSize();
parent.postMessage({type:'aura-starter-ready'},location.origin);
window.addEventListener('pagehide',()=>{cancelAnimationFrame(labelFrame);viewer?.destroy();},{once:true});
