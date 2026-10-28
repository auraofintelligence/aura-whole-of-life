import {blankProject,validateProject} from '../matrix-studio/core.js?v=0.4.26';

// One isolated iframe owns this module. This alias never reads browser storage.
let project=blankProject();
const changes=new EventTarget();
const key='aura-matrix-studio:v4:project';
export function getProject(){return project;}
export function replaceProject(next){project=validateProject(structuredClone(next));changes.dispatchEvent(new Event('change'));return project;}
export function onProjectChange(fn){changes.addEventListener('change',fn);return ()=>changes.removeEventListener('change',fn);}
export const sampleStorage=Object.freeze({
 getItem(name){return name===key?JSON.stringify(project):null;},
 setItem(name,value){if(name!==key)throw Error('This sample accepts only its in-memory project.');replaceProject(JSON.parse(value));},
 removeItem(name){if(name===key)replaceProject(blankProject());},
 clear(){replaceProject(blankProject());}
});
