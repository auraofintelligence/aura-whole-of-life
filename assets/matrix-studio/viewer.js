import {AuraView} from './renderer.js?v=0.4.26';
import {SHELLS,PRESETS,validateProject,neighbours} from './core.js?v=0.4.26';
import {target,validateTarget,targetLabel,targetKey,recordTarget,recordsAt,remember,remembered,selectFacetGroup} from './spatial.js?v=0.4.26';
import {SAMPLES} from './samples.js';

const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action,parent)=>{const b=make('button',text);b.type='button';b.addEventListener('click',action);parent?.append(b);return b;};
const bounded=(n,a,b)=>Math.max(a,Math.min(b,n));
let serial=0;

// Lesson controls surround the unchanged Matrix Studio AuraView, not a second renderer.
export function mountMatrix(root,{mode='layers',example='memory',project:givenProject,selection:givenSelection,onReturn,onSelection,compact=false}={}){
  if(root.matrixSample)return root.matrixSample;
  const fixture=SAMPLES.contexts[example]||SAMPLES.contexts.memory;
  let project=validateProject(structuredClone(givenProject||fixture.project));
  const original=structuredClone(project),initialFallback=root.innerHTML,originalClass=root.className;
  let selection=givenSelection?validateTarget(givenSelection):target(mode==='layers'?3:0,mode==='inside'?'I':'O',mode==='stack'?'stack':'facet',181,...(mode==='stack'?[1]:[]));
  let shape=mode==='layers'?'nested':'horn',multiple=false,exploded=mode==='stack',view=null;
  project.selections=remember(project.selections,selection);
  multiple=(project.facetSelections[selection.shell+'/'+selection.face]||[]).length>1;
  const abort=new AbortController(),uid='matrix-sample-'+(++serial),controls={shells:[],faces:[],shapes:[]};
  root.replaceChildren();root.classList.add('aura-learning');root.dataset.matrixRuntime='studio';
  if(compact)root.classList.add('al-compact');
  const frame=make('div',undefined,'al-frame');root.append(frame);
  frame.append(make('h3','Explore the Aura Matrix'),make('p','Matrix Studio · fictional sample','al-sample'));
  if(onReturn)button('Back to starter activity',()=>onReturn(project,selection),frame);
  const shellbar=make('div',undefined,'al-shells');shellbar.setAttribute('role','group');shellbar.setAttribute('aria-label','Aura colours');frame.append(shellbar);
  SHELLS.forEach(([name,colour],shell)=>{const b=button('',()=>switchOwner(shell,selection.face),shellbar),swatch=make('span',undefined,'al-swatch');swatch.style.background=colour;swatch.setAttribute('aria-hidden','true');b.append(swatch,document.createTextNode(name));b.dataset.shell=String(shell);controls.shells.push(b);});
  const shapeBar=make('div',undefined,'al-views');shapeBar.setAttribute('role','group');shapeBar.setAttribute('aria-label','Aura shape');frame.append(shapeBar);
  for(const [value,label]of [['nested','All seven'],['horn','Selected shell'],['flat','Flat matrix']]){const b=button(label,()=>setShape(value),shapeBar);b.dataset.shape=value;controls.shapes.push(b);}
  const faceBar=make('div',undefined,'al-views');faceBar.setAttribute('role','group');faceBar.setAttribute('aria-label','Inside or outside');frame.append(faceBar);
  for(const [value,label]of [['I','Inside'],['O','Outside']]){const b=button(label,()=>switchOwner(selection.shell,value),faceBar);b.dataset.face=value;controls.faces.push(b);}
  const stage=make('div',undefined,'al-stage'),canvas=make('canvas');canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-describedby',uid+'-hint');stage.append(canvas);frame.append(stage);
  const hint=make('p','Drag to turn · Pinch or scroll to zoom · Tap a facet','al-view-note');hint.id=uid+'-hint';frame.append(hint);
  const status=make('p',undefined,'al-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');frame.append(status);
  const cameraBar=make('div',undefined,'al-turn');frame.append(cameraBar);
  const cameraButtons=[];
  const rotate=(dx,dy)=>{if(!view)return;view.theta+=dx;view.phi=bounded(view.phi+dy,-1.5,1.5);view.render();};
  cameraButtons.push(button('Turn left',()=>rotate(.25,0),cameraBar),button('Turn right',()=>rotate(-.25,0),cameraBar),button('Look up',()=>rotate(0,.2),cameraBar),button('Look down',()=>rotate(0,-.2),cameraBar));
  const zoom=scale=>{if(view){view.zoom=bounded(view.zoom*scale,.5,3);view.render();}};
  cameraButtons.push(button('Zoom in',()=>zoom(1.2),cameraBar),button('Zoom out',()=>zoom(1/1.2),cameraBar),button('Reset view',()=>view?.reset(),cameraBar));
  canvas.addEventListener('keydown',event=>{const turns={ArrowLeft:[.25,0],ArrowRight:[-.25,0],ArrowUp:[0,.2],ArrowDown:[0,-.2]};if(turns[event.key]){event.preventDefault();rotate(...turns[event.key]);}else if(['+','=','-','Home'].includes(event.key)){event.preventDefault();event.key==='Home'?view?.reset():zoom(event.key==='-'?1/1.2:1.2);}},{signal:abort.signal});
  const stackPanel=make('div',undefined,'al-stack');frame.append(stackPanel);
  const settings=make('details',undefined,'al-adjust');settings.append(make('summary','Facet map and more views'));frame.append(settings);
  const fields=make('div',undefined,'al-facet-controls'),facetLabel=make('label','Facet number'),facet=make('input');facet.type='number';facet.min='1';facet.max='288';facet.step='1';facetLabel.append(facet);fields.append(facetLabel);settings.append(fields);
  button('Select facet',()=>{const n=Number(facet.value);if(Number.isInteger(n)&&n>=1&&n<=288)select(target(selection.shell,selection.face,'facet',n));else{facet.setCustomValidity('Choose a whole number from 1 to 288.');facet.reportValidity();}},fields);facet.addEventListener('input',()=>facet.setCustomValidity(''),{signal:abort.signal});
  const multiLabel=make('label',undefined,'al-check'),multi=make('input');multi.type='checkbox';multiLabel.append(multi,document.createTextNode('Select several facets'));settings.append(multiLabel);multi.addEventListener('change',()=>{multiple=multi.checked;if(!multiple&&selection.kind==='facet')select(selection);},{signal:abort.signal});
  const moreLabel=make('label','View'),moreShape=make('select');moreShape.setAttribute('aria-label','Matrix Studio view');for(const [value,preset]of Object.entries(PRESETS)){const option=make('option',preset.name);option.value=value;moreShape.append(option);}moreLabel.append(moreShape);settings.append(moreLabel);moreShape.addEventListener('change',()=>setShape(moreShape.value),{signal:abort.signal});
  const gridScroll=make('div',undefined,'al-map-scroll'),grid=make('div',undefined,'al-map');grid.setAttribute('role','group');grid.setAttribute('aria-label','12 rows and 24 columns of facets');gridScroll.append(grid);settings.append(gridScroll,make('p','The numbered map and the 3D surface select the same facets. Arrow keys move across the map.','al-sample'));
  // The numbered-map neighbour navigation and grouped selection use the Studio helpers.
  for(let cell=1;cell<=288;cell++){const b=button(String(cell),event=>select(target(selection.shell,selection.face,'facet',cell),event),grid);b.dataset.cell=String(cell);b.addEventListener('keydown',event=>{const direction={ArrowUp:'north',ArrowRight:'east',ArrowDown:'south',ArrowLeft:'west'}[event.key];if(direction){event.preventDefault();const next=neighbours(cell)[direction];select(target(selection.shell,selection.face,'facet',next));grid.children[next-1].focus();}},{signal:abort.signal});}
  const recordsPanel=make('div',undefined,'al-record'),jumpLabel=make('label','Sample records'),jump=make('select');jump.setAttribute('aria-label','Sample record');jumpLabel.append(jump);recordsPanel.append(jumpLabel);const recordContent=make('div',undefined,'al-record-content');recordsPanel.append(recordContent);frame.append(recordsPanel);jump.addEventListener('change',()=>{const record=project.records.find(r=>r.id===jump.value);if(record)select(recordTarget(record));},{signal:abort.signal});
  const footer=make('div',undefined,'al-sample-actions');button('Reset sample',()=>{project=validateProject(structuredClone(original));selection=givenSelection?validateTarget(givenSelection):target(mode==='layers'?3:0,mode==='inside'?'I':'O',mode==='stack'?'stack':'facet',181,...(mode==='stack'?[1]:[]));project.selections=remember(project.selections,selection);multiple=(project.facetSelections[selection.shell+'/'+selection.face]||[]).length>1;refresh();view?.reset();},footer);
  button('Download sample project',()=>{const blob=new Blob([JSON.stringify(validateProject(project),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=make('a');link.href=url;link.download='aura-matrix-'+example+'-sample.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},footer);
  const studio=make('a','Open Matrix Studio ↗');studio.href='https://auraofintelligence.github.io/aura-matrix-studio/matrix.html';studio.target='_blank';studio.rel='noopener noreferrer';footer.append(studio);frame.append(footer,make('p','Sample changes stay in this example. Inside and outside are separate views; choosing outside does not publish anything.','al-sample'),make('p','Based on Aura Matrix Studio by Luke Nathan Hayes / Strange But True / Aura of Intelligence.','al-attribution'));
  const print=make('div',undefined,'al-static-print');print.innerHTML=initialFallback||`<img src="${new URL('../aura-'+(mode==='inside'?'inside':mode==='stack'?'stack':'layers')+'-fallback.svg',import.meta.url)}" alt="Aura geometry sample">`;root.append(print);

  function select(t,event={}){
    t=validateTarget(t);
    if(t.kind==='facet'){const result=selectFacetGroup(project.facetSelections,t,(Boolean(event.type)&&multiple)||event.shiftKey||event.ctrlKey||event.metaKey);project.facetSelections=result.groups;t=result.focused||t;}
    selection=t;project.selections=remember(project.selections,t);refresh();onSelection?.(t,recordsAt(project.records,t));
  }
  function switchOwner(shell,face){selection=remembered(project.selections,shell,face)||target(shell,face,'facet',181);project.selections=remember(project.selections,selection);if((project.facetSelections[shell+'/'+face]||[]).length>1)multiple=true;refresh();}
  function setShape(value){shape=value;refresh();view?.reset();}
  function refresh(){
    const {shell,face,index}=selection,group=project.facetSelections[shell+'/'+face]||[];
    controls.shells.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===shell)));controls.faces.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.face===face)));controls.shapes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shape===shape)));moreShape.value=shape;facet.value=selection.kind==='volume'?'181':String(index);multi.checked=multiple;
    status.textContent=targetLabel(selection)+(group.length>1?' · '+group.length+' facets selected':'');canvas.setAttribute('aria-label',targetLabel(selection)+'. Interactive Matrix Studio view. Drag or use arrow keys to turn; plus and minus zoom.');
    const occupied=new Set(project.records.filter(r=>r.shell===shell&&r.face===face).map(r=>r.cell));
    for(const b of grid.children){const n=Number(b.dataset.cell),selected=selection.kind==='facet'&&(group.includes(n)||index===n);b.setAttribute('aria-pressed',String(selected));b.classList.toggle('al-occupied',occupied.has(n));b.tabIndex=index===n?0:-1;b.setAttribute('aria-label',SHELLS[shell][0]+' '+face+' facet '+n+(occupied.has(n)?', contains sample records':''));}
    stackPanel.replaceChildren();const stack=project.stacks.find(s=>s.shell===shell&&s.face===face&&s.cell===index);stackPanel.hidden=!stack;
    if(stack){stackPanel.append(make('h4','Ordered stack · '+stack.count+' layers'));const row=make('div',undefined,'al-step-buttons');button('Base facet',()=>select(target(shell,face,'facet',index)),row);for(let layer=1;layer<=Math.min(stack.count,12);layer++){const t=target(shell,face,'stack',index,layer),r=recordsAt(project.records,t)[0],b=button(layer+' · '+(r?.title||'Layer '+layer),()=>select(t),row);b.setAttribute('aria-pressed',String(selection.kind==='stack'&&selection.layer===layer));}stackPanel.append(row);const spread=button(exploded?'Bring layers together':'Spread stack layers',()=>{exploded=!exploded;refresh();},stackPanel);spread.setAttribute('aria-pressed',String(exploded));}
    jump.replaceChildren();const blank=make('option','Choose a prepared record');blank.value='';jump.append(blank);
    for(const r of project.records.filter(r=>r.shell===shell&&r.face===face)){const option=make('option',targetLabel(recordTarget(r))+' · '+r.title);option.value=r.id;jump.append(option);}
    const here=recordsAt(project.records,selection);jump.value=here[0]?.id||'';recordContent.replaceChildren();
    if(!here.length)recordContent.append(make('p','No sample record at this address. Choose a prepared record or another facet.'));
    for(const r of here){recordContent.append(make('h4',r.title));if(r.note)recordContent.append(make('p',r.note));const fields=make('dl',undefined,'al-fields'),extra=make('dl',undefined,'al-fields');for(const [name,value]of Object.entries(r.fields||{})){(['Audience','Source','Date'].includes(name)?fields:extra).append(make('dt',name),make('dd',value));}if(fields.children.length)recordContent.append(fields);if(extra.children.length){const detail=make('details');detail.append(make('summary','Record details'),extra);recordContent.append(detail);}if(r.instructions){const detail=make('details');detail.append(make('summary','Sample instructions'),make('p',r.instructions));recordContent.append(detail);}if(r.data!==undefined){const detail=make('details');detail.append(make('summary','Attached sample data'),make('pre',JSON.stringify(r.data,null,2)));recordContent.append(detail);}const related=project.links.filter(l=>l.from===r.id||l.to===r.id);if(related.length){const links=make('div',undefined,'al-links');links.append(make('strong','Connected records'));for(const link of related){const other=project.records.find(x=>x.id===(link.from===r.id?link.to:link.from));if(other)button(link.label+' · '+other.title,()=>select(recordTarget(other)),links);}recordContent.append(links);}}
    if(view){view.selection=selection;view.selectedFacets=compact?[]:group;view.kind=selection.kind==='stack'?'facet':selection.kind;view.showVolume=selection.kind==='volume';view.records=compact?recordsAt(project.records,selection):project.records;view.links=compact?[]:project.links;view.vectors=project.vectors;view.stacks=compact?project.stacks.filter(stack=>selection.kind==='stack'&&stack.shell===shell&&stack.face===face&&stack.cell===index):project.stacks;view.shellStyles=project.shellStyles;view.explodeStacks=compact&&selection.kind==='stack'?1:exploded?1:0;view.set({...PRESETS[shape]},shell,selection.kind==='volume'?null:index,face);}
  }
  try{view=new AuraView(canvas,select);view.shellStyles=project.shellStyles;refresh();view.resize();}
  catch(error){canvas.hidden=true;hint.textContent='The 3D view needs WebGL. Use the numbered facet map and sample records below.';cameraButtons.forEach(b=>b.disabled=true);settings.open=true;refresh();const fallback=make('div',undefined,'al-fallback');fallback.innerHTML=initialFallback||print.innerHTML;stage.append(fallback);}
  const api={view,get project(){return project;},select,updateProject(next,nextSelection=selection){project=validateProject(structuredClone(next));selection=validateTarget(nextSelection);project.selections=remember(project.selections,selection);refresh();},destroy(){abort.abort();view?.dispose();delete root.matrixSample;delete root.dataset.matrixRuntime;root.className=originalClass;root.innerHTML=initialFallback;}};root.matrixSample=api;return api;
}
