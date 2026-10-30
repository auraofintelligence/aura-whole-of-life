import {AuraView} from './renderer.js?v=0.4.26';
import {blankProject,SHELLS,PRESETS,neighbours} from './core.js?v=0.4.26';
import {target} from './spatial.js?v=0.4.26';
import {createSurfaceState} from './surface-state.js';

const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
let serial=0;

// Controls around the unmodified native renderer; no other application state is loaded.
export function mountBasicMatrix(root){
  if(root.basicMatrix)return root.basicMatrix;
  const before=root.innerHTML,originalClass=root.className,abort=new AbortController();
  const project=blankProject(),state=createSurfaceState(),uid='basic-aura-'+(++serial);
  let view=null,overview=false;
  root.replaceChildren();root.classList.add('ba-root');root.dataset.basicAura='';
  const frame=make('div',undefined,'ba-frame');root.append(frame);
  const listen=(node,name,handler)=>node.addEventListener(name,handler,{signal:abort.signal});
  const button=(text,action,parent)=>{const b=make('button',text);b.type='button';listen(b,'click',action);parent?.append(b);return b;};
  const shellbar=make('div',undefined,'ba-shells');shellbar.setAttribute('role','group');shellbar.setAttribute('aria-label','Torus colour');frame.append(shellbar);
  const shellButtons=SHELLS.map(([name,colour],shell)=>{const b=button('',()=>switchSurface(shell,state.current.face),shellbar),swatch=make('span',undefined,'ba-swatch');swatch.style.backgroundColor=colour;swatch.setAttribute('aria-hidden','true');b.append(swatch,document.createTextNode(name));return b;});
  const toolbar=make('div',undefined,'ba-toolbar'),faces=make('div',undefined,'ba-faces');faces.setAttribute('role','group');faces.setAttribute('aria-label','Inside or outside');toolbar.append(faces);frame.append(toolbar);
  const faceButtons=['I','O'].map(face=>({face,button:button(face==='I'?'Inside':'Outside',()=>switchSurface(state.current.shell,face),faces)}));
  const overviewButton=button('All seven',()=>setOverview(!overview),toolbar);
  const stage=make('div',undefined,'ba-stage'),canvas=make('canvas');canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-describedby',uid+'-hint');stage.append(canvas);frame.append(stage);
  const status=make('p',undefined,'ba-address');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');frame.append(status);
  const hint=make('p','Drag to turn · Scroll or pinch to zoom · Select a facet','ba-hint');hint.id=uid+'-hint';frame.append(hint);
  const camera=make('div',undefined,'ba-camera');camera.setAttribute('role','group');camera.setAttribute('aria-label','Camera controls');frame.append(camera);
  const rotate=(x,y)=>{if(!view)return;view.theta+=x;view.phi=clamp(view.phi+y,-1.5,1.5);view.render();};
  const zoom=factor=>{if(view){view.zoom=clamp(view.zoom*factor,.5,3);view.render();}};
  const cameraButtons=[button('←',()=>rotate(.25,0),camera),button('→',()=>rotate(-.25,0),camera),button('↑',()=>rotate(0,.2),camera),button('↓',()=>rotate(0,-.2),camera),button('+',()=>zoom(1.2),camera),button('−',()=>zoom(1/1.2),camera),button('Reset view',()=>view?.reset(),camera)];
  ['Turn left','Turn right','Look up','Look down','Zoom in','Zoom out','Reset view'].forEach((label,index)=>cameraButtons[index].setAttribute('aria-label',label));
  listen(canvas,'keydown',event=>{const directions={ArrowLeft:[.25,0],ArrowRight:[-.25,0],ArrowUp:[0,.2],ArrowDown:[0,-.2]};if(directions[event.key]){event.preventDefault();rotate(...directions[event.key]);}else if(['+','=','-','Home'].includes(event.key)){event.preventDefault();if(event.key==='Home')view?.reset();else zoom(event.key==='-'?1/1.2:1.2);}});
  const mapDetails=make('details',undefined,'ba-map-details');mapDetails.append(make('summary','Facet map'));frame.append(mapDetails);
  const form=make('form',undefined,'ba-number'),label=make('label','Facet number'),input=make('input');input.type='number';input.min='1';input.max='288';input.step='1';input.required=true;input.id=uid+'-number';label.htmlFor=input.id;label.append(input);form.append(label);const submit=make('button','Select facet');submit.type='submit';form.append(submit);mapDetails.append(form);
  listen(input,'input',()=>input.setCustomValidity(''));
  listen(form,'submit',event=>{event.preventDefault();const number=Number(input.value);if(!Number.isInteger(number)||number<1||number>288){input.setCustomValidity('Choose a whole number from 1 to 288.');input.reportValidity();return;}select(target(state.current.shell,state.current.face,'facet',number));});
  const mapScroll=make('div',undefined,'ba-map-scroll'),map=make('div',undefined,'ba-map');map.setAttribute('role','group');map.setAttribute('aria-label','Facet map: 12 rows and 24 columns. Arrow keys select adjacent facets.');mapScroll.append(map);mapDetails.append(mapScroll);
  for(let index=1;index<=288;index++){
    const b=button(String(index),()=>select(target(state.current.shell,state.current.face,'facet',index)),map);b.dataset.facet=String(index);
    listen(b,'keydown',event=>{const direction={ArrowUp:'north',ArrowRight:'east',ArrowDown:'south',ArrowLeft:'west'}[event.key];let next;if(direction)next=neighbours(index)[direction];else if(event.key==='Home')next=1;else if(event.key==='End')next=288;else return;event.preventDefault();select(target(state.current.shell,state.current.face,'facet',next));map.children[next-1].focus();});
  }

  function select(value){state.select(value);refresh();return state.current;}
  function switchSurface(shell,face){state.switchSurface(shell,face);refresh();return state.current;}
  function setOverview(value){overview=Boolean(value);refresh();return overview;}
  function refresh(){
    const selected=state.current,{shell,face,index}=selected;
    project.selections=state.selections;
    shellButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===shell)));
    faceButtons.forEach(({face:value,button:b})=>b.setAttribute('aria-pressed',String(value===face)));
    // The native inside camera shows only the selected torus. Its outside overview remains optional.
    overviewButton.disabled=face==='I';overviewButton.setAttribute('aria-pressed',String(overview&&face==='O'));
    status.textContent=SHELLS[shell][0]+' · '+(face==='I'?'Inside':'Outside')+' · Facet '+index;
    input.value=String(index);input.setCustomValidity('');
    canvas.setAttribute('aria-label',status.textContent+'. Arrow keys turn the view. Plus and minus zoom.');
    for(const b of map.children){const active=Number(b.dataset.facet)===index;b.tabIndex=active?0:-1;b.setAttribute('aria-pressed',String(active));b.setAttribute('aria-label',SHELLS[shell][0]+' '+(face==='I'?'Inside':'Outside')+' facet '+b.dataset.facet);}
    if(view){view.selection=selected;view.selectedFacets=[];view.kind='facet';view.records=project.records;view.links=project.links;view.vectors=project.vectors;view.stacks=project.stacks;view.shellStyles=project.shellStyles;view.showVolume=false;view.rayMode='off';view.set({...PRESETS[overview&&face==='O'?'nested':'horn']},shell,index,face);}
  }
  try{view=new AuraView(canvas,value=>select(value));refresh();view.resize();}
  catch{
    canvas.hidden=true;stage.hidden=true;hint.textContent='Choose a colour, Inside or Outside, and a numbered facet.';camera.hidden=true;mapDetails.open=true;refresh();
  }
  const api={get view(){return view;},get selection(){return state.current;},get selections(){return state.selections;},select,switchSurface,setOverview,destroy(){abort.abort();view?.dispose();delete root.basicMatrix;delete root.dataset.basicAura;root.className=originalClass;root.innerHTML=before;}};
  root.basicMatrix=api;return api;
}
