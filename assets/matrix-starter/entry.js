import {mountStarter} from './starter.js';
import {mountMatrix} from '../matrix-studio/viewer.js';
const root=document.getElementById('starter'),params=new URLSearchParams(location.search);
const example=params.get('example')||'memory';let starter,viewer;
function showStarter(project,stage=params.get('stage')||'favourites'){
 viewer?.destroy();viewer=null;
 starter=mountStarter(root,{project,stage,example,showMatrix(project,selection,state){
  starter?.destroy();starter=null;root.replaceChildren();
  viewer=mountMatrix(root,{mode:selection.face==='I'?'inside':'layers',example,project,selection,onReturn:next=>showStarter(next||project,state.stage)});
 }});
 parent.postMessage({type:'aura-starter-ready'},location.origin);
}
showStarter();
let announcedHeight=0;
const announceSize=()=>{const height=Math.ceil(root.getBoundingClientRect().height+24);if(height!==announcedHeight){announcedHeight=height;parent.postMessage({type:'aura-starter-size',height},location.origin);}};
new ResizeObserver(announceSize).observe(root);
announceSize();
window.addEventListener('pagehide',()=>{starter?.destroy();viewer?.destroy();},{once:true});
