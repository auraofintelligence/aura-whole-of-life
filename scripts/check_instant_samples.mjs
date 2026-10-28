import assert from 'node:assert/strict';
import fs from 'node:fs';
Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('Real storage accessed');}});
globalThis.fetch=()=>{throw Error('Unexpected network');};
const {syncInstantSample}=await import('../assets/matrix-starter/instant-data.js');
const {validateProject}=await import('../assets/matrix-studio/core.js?v=0.4.26');
const {target,recordTarget,recordsAt,targetKey}=await import('../assets/matrix-studio/spatial.js?v=0.4.26');
const samples=JSON.parse(fs.readFileSync(new URL('../assets/matrix-studio-samples.json',import.meta.url),'utf8'));
const rowCount=p=>p.tables.reduce((n,t)=>n+t.rows.length,0);
let repeated=0;
for(const context of Object.values(samples.contexts)){
 for(const stage of ['favourites','skills','goals','dates','timing','travel','family','avatar','allocate']){
  let project=structuredClone(context.project),ref;
  let values=structuredClone(stage==='allocate'?{tableId:context.entryPoints.practiceTableId}:context.stageDefaults[stage]);
  assert.ok(values,stage+' missing fixture');
  let result=syncInstantSample(project,{stage,values,ref,cell:1,face:'O',mode:'facets'});
  assert.equal(result.valid,true,stage+': '+result.error);project=result.project;ref=result.ref;
  const ids=result.records.map(r=>r.id),rows=ref.items.map(r=>r.tableId+'/'+r.id),count=project.records.length,totalRows=rowCount(project);
  assert.equal(result.selection.index,1);assert.equal(result.selection.face,'O');
  if(stage==='favourites')assert.deepEqual(result.records.map(r=>r.cell),[1,2,3]);
  for(let step=0;step<12;step++){
   if(stage==='favourites'){values[0].Title='Edited favourite '+step;values[0]['What resonates']='Meaning '+step;}
   else if(stage==='travel')values.Destination='Fictional place '+step;
   else if(stage==='avatar')values['avatar-answer-4']='Fit sample '+step;
   else if(stage!=='allocate')values.Title='Edited sample '+step;
   result=syncInstantSample(project,{stage,values,ref,cell:1,face:'O',mode:'facets'});
   assert.equal(result.valid,true,stage+': '+result.error);project=result.project;ref=result.ref;
   assert.deepEqual(result.records.map(r=>r.id),ids,stage+' record IDs changed');
   assert.deepEqual(ref.items.map(r=>r.tableId+'/'+r.id),rows,stage+' row IDs changed');
   assert.equal(project.records.length,count,stage+' duplicated records');assert.equal(rowCount(project),totalRows,stage+' duplicated rows');
   if(stage==='favourites'){assert.equal(result.records[0].title,values[0].Title);assert.equal(result.records[0].fields['What resonates'],values[0]['What resonates']);}
   for(const record of result.records){assert.equal(recordsAt(project.records,recordTarget(record)).some(r=>r.id===record.id),true);}
   validateProject(project);repeated++;
  }
 }
}

const fixture=samples.contexts.memory;
let p=structuredClone(fixture.project);
const A=target(0,'O','facet',45),B=target(0,'O','facet',46);
let a=syncInstantSample(p,{stage:'favourites',values:{Title:'At facet A',Category:'Music','What resonates':'A meaning'},target:A});assert.equal(a.valid,true,a.error);p=a.project;
const aId=a.record.id,aRow=a.ref.items[0].id;
let b=syncInstantSample(p,{stage:'favourites',values:{Title:'At facet B',Category:'Book','What resonates':'B meaning'},target:B});assert.equal(b.valid,true,b.error);p=b.project;
assert.notEqual(aId,b.record.id);assert.notEqual(aRow,b.ref.items[0].id);
a=syncInstantSample(p,{stage:'favourites',values:{Title:'Back at A',Category:'Music','What resonates':'Updated A'},target:A,ref:a.ref});assert.equal(a.valid,true,a.error);p=a.project;
assert.equal(a.record.id,aId);assert.equal(a.ref.items[0].id,aRow);assert.equal(recordsAt(p.records,B).find(r=>r.id===b.record.id).title,'At facet B');
const unchanged=JSON.stringify(p),ref=structuredClone(a.ref);
const incomplete=syncInstantSample(p,{stage:'favourites',values:{Title:'','What resonates':'Still typing'},target:A,ref});assert.equal(incomplete.valid,false);assert.equal(incomplete.project,p);assert.equal(JSON.stringify(p),unchanged);assert.deepEqual(incomplete.ref,ref);
const moved=syncInstantSample(p,{stage:'favourites',values:{Title:'Moved A',Category:'Music'},target:target(1,'I','stack',47,4),ref:a.ref});assert.equal(moved.valid,true,moved.error);assert.equal(moved.record.id,aId);assert.equal(moved.ref.items[0].id,aRow);assert.equal(targetKey(recordTarget(moved.record)),'1/I/stack/47/4');
let stacked=moved;for(let i=0;i<10;i++){stacked=syncInstantSample(stacked.project,{stage:'favourites',values:{Title:'Stack edit '+i,Category:'Music'},target:target(1,'I','stack',47,4),ref:stacked.ref});assert.equal(stacked.valid,true,stacked.error);assert.equal(stacked.record.id,aId);assert.equal(stacked.ref.items[0].id,aRow);assert.equal(stacked.record.anchor.layer,4);assert.equal(stacked.project.records.length,moved.project.records.length);}

const old=fixture.project.records.find(r=>r.shell===0&&r.face==='O'&&r.cell===181&&!r.anchor),related=fixture.project.links.filter(l=>l.from===old.id||l.to===old.id);
const adopted=syncInstantSample(fixture.project,{stage:'goals',values:{Title:'Updated visible record','Why it matters':'A current explanation'},target:target(0,'O','facet',181),recordId:old.id});assert.equal(adopted.valid,true,adopted.error);assert.equal(adopted.record.id,old.id);for(const link of related)assert.ok(adopted.project.links.some(l=>JSON.stringify(l)===JSON.stringify(link)));
const partial=syncInstantSample(adopted.project,{stage:'dates',values:{Title:'A date',Date:'2026-1'},ref:adopted.ref});assert.equal(partial.valid,false);assert.equal(partial.project,adopted.project);
const allFavs=syncInstantSample(fixture.project,{stage:'favourites',values:fixture.stageDefaults.favourites});assert.equal(allFavs.valid,true,allFavs.error);
const withSelectedId=syncInstantSample(allFavs.project,{stage:'favourites',values:fixture.stageDefaults.favourites,ref:allFavs.ref,activeIndex:2,recordId:allFavs.records[2].id});assert.equal(withSelectedId.valid,true,withSelectedId.error);assert.equal(new Set(withSelectedId.records.map(r=>r.id)).size,3);assert.equal(new Set(withSelectedId.ref.items.map(r=>r.id)).size,3);assert.equal(withSelectedId.selection.index,3);
const otherColour=syncInstantSample(allFavs.project,{stage:'favourites',values:{Title:'A new colour owner',Category:'Music','What resonates':'A separate meaning'},target:target(2,'O','facet',1),reuseSeed:false});assert.equal(otherColour.valid,true,otherColour.error);assert.notEqual(otherColour.ref.items[0].id,allFavs.ref.items[0].id);assert.equal(otherColour.project.tables.find(t=>t.id===allFavs.ref.items[0].tableId).rows.find(r=>r.id===allFavs.ref.items[0].id).values[0],fixture.stageDefaults.favourites[0].Title);
const avatarValues={'avatar-answer-4':'Loose','avatar-answer-5':'Often moving'};
let avatar=syncInstantSample(fixture.project,{stage:'avatar',values:avatarValues,cell:1,face:'O'});assert.equal(avatar.valid,true,avatar.error);assert.equal(avatar.records.length,2);assert.equal(new Set(avatar.records.map(r=>r.id)).size,2);assert.deepEqual(avatar.records.map(r=>r.cell),[1,1]);const avatarIds=avatar.records.map(r=>r.id);
for(let i=0;i<10;i++){avatar=syncInstantSample(avatar.project,{stage:'avatar',values:{...avatarValues,'avatar-answer-4':'Fit '+i},ref:avatar.ref,cell:1,face:'O'});assert.equal(avatar.valid,true,avatar.error);assert.deepEqual(avatar.records.map(r=>r.id),avatarIds);assert.equal(avatar.records[0].fields.Measurement,'Fit '+i);assert.equal(avatar.records[1].fields.Measurement,'Often moving');assert.deepEqual(avatar.records.map(r=>r.cell),[1,1]);}
let subset=syncInstantSample(avatar.project,{stage:'avatar',values:{'avatar-answer-5':'Second only'},ref:avatar.ref,cell:1,face:'O'});assert.equal(subset.valid,true,subset.error);assert.equal(subset.record.id,avatarIds[1]);
subset=syncInstantSample(subset.project,{stage:'avatar',values:{'avatar-answer-4':'First again'},ref:subset.ref,cell:1,face:'O'});assert.equal(subset.valid,true,subset.error);assert.equal(subset.record.id,avatarIds[0]);
const selectedSecond=syncInstantSample(avatar.project,{stage:'goals',values:{Title:'Selected second record','Next action':'A native update'},target:target(0,'O','facet',1),recordId:avatarIds[1],activeIndex:7,reuseSeed:false});assert.equal(selectedSecond.valid,true,selectedSecond.error);assert.equal(selectedSecond.record.id,avatarIds[1]);assert.equal(selectedSecond.project.records.find(r=>r.id===avatarIds[0]).fields.Measurement,'Fit 9');
let yellowAvatar=syncInstantSample(avatar.project,{stage:'avatar',values:{...avatarValues,'avatar-answer-4':'Yellow fit'},target:target(2,'O','facet',1),reuseSeed:false});assert.equal(yellowAvatar.valid,true,yellowAvatar.error);assert.ok(yellowAvatar.records.every(record=>!avatarIds.includes(record.id)));assert.deepEqual(recordsAt(yellowAvatar.project.records,target(0,'O','facet',1)).map(record=>record.id),avatarIds);assert.equal(yellowAvatar.project.records.find(record=>record.id===avatarIds[0]).fields.Measurement,'Fit 9');const yellowIds=yellowAvatar.records.map(record=>record.id);
yellowAvatar=syncInstantSample(yellowAvatar.project,{stage:'avatar',values:{...avatarValues,'avatar-answer-4':'Yellow revised'},target:target(2,'O','facet',1),ref:yellowAvatar.ref,reuseSeed:false});assert.equal(yellowAvatar.valid,true,yellowAvatar.error);assert.deepEqual(yellowAvatar.records.map(record=>record.id),yellowIds);assert.deepEqual(recordsAt(yellowAvatar.project.records,target(0,'O','facet',1)).map(record=>record.id),avatarIds);
const redAgain=syncInstantSample(yellowAvatar.project,{stage:'avatar',values:{...avatarValues,'avatar-answer-4':'Red revised'},target:target(0,'O','facet',1),ref:avatar.ref,reuseSeed:false});assert.equal(redAgain.valid,true,redAgain.error);assert.deepEqual(redAgain.records.map(record=>record.id),avatarIds);assert.equal(redAgain.project.records.find(record=>record.id===yellowIds[0]).fields.Measurement,'Yellow revised');
console.log(JSON.stringify({pass:true,stages:9,contexts:7,repeatedNativeEdits:repeated,stableRowRecordAndLayerIds:true,favouritesFacets:[1,2,3],bidirectionalFacetOwnership:true,explicitMovePreservesIdentity:true,incompleteInputPreservesLastValidState:true,existingRecordLinksPreserved:true,noStorageOrFetch:true},null,2));
