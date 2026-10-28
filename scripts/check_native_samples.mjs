import assert from 'node:assert/strict';
// Any accidental use of the real browser store or a remote fetch fails this test.
Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('Real storage accessed');}});
globalThis.fetch=()=>{throw Error('Fetch is not part of a sample activity');};
const {blankProject,validateProject}=await import('../assets/matrix-studio/core.js?v=0.4.26');
const {target,recordsAt,targetPoint}=await import('../assets/matrix-studio/spatial.js?v=0.4.26');
const {saveSectionEntry}=await import('../assets/matrix-starter/studio/quickstart-data.js?v=0.4.26');
const {allocationPlan,allocateTable}=await import('../assets/matrix-starter/studio/dataset-allocation.js?v=0.4.26');
const {saveLife}=await import('../assets/matrix-starter/studio/life-data.js?v=0.4.26');
const {AVATAR_SECTIONS,saveAvatar}=await import('../assets/matrix-starter/studio/avatar-data.js?v=0.4.26');
const {readTravelProject,writeTravelProject,saveTrip}=await import('../assets/matrix-starter/studio/travel-data.js?v=0.4.26');
const {getProject,replaceProject,sampleStorage}=await import('../assets/matrix-starter/sample-store.js');
const {contexts}=await import('../assets/matrix-starter/fixtures.js');
await import('../assets/matrix-starter/starter.js'); // Resolve the complete production ESM graph, without DOM or I/O side effects.
let checks=0;
for(const [key,context]of Object.entries(contexts)){
 validateProject(context.project);replaceProject(context.project);
 assert.equal(readTravelProject().records.length,context.project.records.length);
 let project=blankProject();
 for(const favourite of context.stageDefaults.favourites)project=saveSectionEntry(project,5,favourite);
 const table=project.tables.find(t=>t.recommendation==='inspiration');assert.equal(table.rows.length,3);
 const options={shell:1,face:'I',mode:'stack',start:181,titleColumn:table.columns.indexOf('Title')};
 const plan=allocationPlan(project,table.id,options);assert.equal(plan.length,3);
 project=allocateTable(project,table.id,options);
 assert.equal(project.records.length,3);assert.equal(project.stacks[0].count,3);
 const selected=target(1,'I','stack',181,2),record=recordsAt(project.records,selected)[0];
 assert.equal(record.title,context.stageDefaults.favourites[1].Title);
 assert.equal(record.fields['What resonates'],context.stageDefaults.favourites[1]['What resonates']);
 assert.ok(targetPoint(selected,{curl:1,ring:1,pinch:1,nest:0,arrange:0,stackCounts:{'1/I/181':3}}).every(Number.isFinite));
 assert.equal(allocateTable(project,table.id,options).records.length,3);
 project=structuredClone(context.project); // Timing defaults reference the fixture's native program.
 for(const [stage,index]of [['skills',6],['goals',7],['dates',3],['timing',4]])project=saveSectionEntry(project,index,context.stageDefaults[stage]);
 project=saveTrip(project,context.stageDefaults.travel);project=saveLife(project,'family',context.stageDefaults.family);
 for(const section of AVATAR_SECTIONS)project=saveAvatar(project,section,context.stageDefaults.avatar||{});
 replaceProject(project);writeTravelProject(p=>saveLife(p,'family',{Title:'A fictional mentor',Relationship:'Mentor',Notes:'Sample only'}));
 assert.ok(getProject().tables.some(t=>t.rows.some(r=>r.values.includes('A fictional mentor'))));
 assert.equal(sampleStorage.getItem('unrelated-real-project'),null);checks++;
}
assert.throws(()=>sampleStorage.setItem('unrelated-real-project','{}'));
console.log(JSON.stringify({pass:true,contexts:checks,nativeFavouriteWriter:true,realTableRows:true,realFacetStackAllocation:true,selectedRecordRecall:true,idempotentAllocation:true,nativeSkillsGoalsDatesTimingTravelFamilyWriters:true,realBrowserStorageNeverAccessed:true,fetchNeverAccessed:true},null,2));
