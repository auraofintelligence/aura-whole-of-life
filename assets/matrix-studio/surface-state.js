import {target,validateTarget} from './spatial.js?v=0.4.26';

// Every torus side owns its own selection. No index is inherited from another side.
export function createSurfaceState(){
  const selections=Object.fromEntries(Array.from({length:7},(_,shell)=>['I','O'].map(face=>[`${shell}/${face}`,target(shell,face,'facet',1)])).flat());
  let current=target(0,'O','facet',1);
  const copy=t=>({...t});
  return {
    get current(){return copy(current);},
    get selections(){return Object.fromEntries(Object.entries(selections).map(([key,value])=>[key,copy(value)]));},
    switchSurface(shell,face){
      const owner=target(shell,face,'facet',1);
      current=copy(selections[`${owner.shell}/${owner.face}`]);
      return copy(current);
    },
    select(value){
      const next=validateTarget(value);
      if(next.kind!=='facet')throw Error('Choose a facet.');
      current=copy(next);
      selections[`${next.shell}/${next.face}`]=copy(next);
      return copy(current);
    }
  };
}
