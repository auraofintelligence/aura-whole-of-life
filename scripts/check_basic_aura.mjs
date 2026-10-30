import assert from 'node:assert/strict';
import {createSurfaceState} from '../assets/matrix-studio/surface-state.js';
import {blankProject,neighbours} from '../assets/matrix-studio/core.js?v=0.4.26';
import {target} from '../assets/matrix-studio/spatial.js?v=0.4.26';

const state=createSurfaceState();
assert.deepEqual(state.current,target(0,'O','facet',1));
assert.equal(Object.keys(state.selections).length,14);
// First visit never carries a previous torus or side's selected index.
state.select(target(0,'O','facet',6));
assert.deepEqual(state.switchSurface(0,'I'),target(0,'I','facet',1));
state.select(target(0,'I','facet',17));
assert.deepEqual(state.switchSurface(1,'I'),target(1,'I','facet',1));
assert.deepEqual(state.switchSurface(1,'O'),target(1,'O','facet',1));
assert.deepEqual(state.switchSurface(0,'O'),target(0,'O','facet',6));
assert.deepEqual(state.switchSurface(0,'I'),target(0,'I','facet',17));
// Distinct remembered addresses for every one of the fourteen independent surfaces.
for(let shell=0;shell<7;shell++)for(const [i,face] of ['I','O'].entries())state.select(target(shell,face,'facet',shell*24+i+1));
for(let shell=0;shell<7;shell++)for(const [i,face] of ['I','O'].entries())assert.deepEqual(state.switchSurface(shell,face),target(shell,face,'facet',shell*24+i+1));
const snapshot=state.selections;snapshot['0/I'].index=288;assert.equal(state.switchSurface(0,'I').index,1);
const current=state.current;current.index=288;assert.equal(state.current.index,1);
assert.throws(()=>state.switchSurface(7,'I'));
assert.throws(()=>state.select(target(0,'O','stack',1,1)));
assert.throws(()=>state.select({shell:0,face:'O',kind:'facet',index:0}));
assert.equal(neighbours(1).west,24);assert.equal(neighbours(1).north,265);assert.equal(neighbours(288).east,265);assert.equal(neighbours(288).south,24);
const project=blankProject();
for(const key of ['records','links','vectors','programs','stacks','tables'])assert.equal(project[key].length,0,key);
console.log('PASS: fourteen independent surfaces, first facet 1, return restores own selection, native map wrapping, empty project.');
