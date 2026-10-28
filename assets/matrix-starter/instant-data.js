/* Native Studio data binding for the immediate input + Aura view.
 * No DOM, browser storage, network, timers or viewer/camera mutation.
 * Keep the returned ref with this activity/selected target between edits.
 */
import {blankProject,validateProject} from '../matrix-studio/core.js?v=0.4.26';
import {target,validateTarget,recordTarget,targetKey} from '../matrix-studio/spatial.js?v=0.4.26';
import {saveSectionEntry} from './studio/quickstart-data.js?v=0.4.26';
import {saveLife,entriesFor} from './studio/life-data.js?v=0.4.26';
import {saveTrip,travelEntries} from './studio/travel-data.js?v=0.4.26';
import {saveAvatar,AVATAR_SECTIONS,fieldsFor} from './studio/avatar-data.js?v=0.4.26';
import {allocateTable} from './studio/dataset-allocation.js?v=0.4.26';

const INDEX={favourites:5,skills:6,goals:7,dates:3,timing:4};
const EXPECTED={favourites:'inspiration',skills:'learning',goals:'goals',dates:'life-events',timing:'schedules',family:'relationships',travel:'journeys'};
const FAVOURITE_KEYS=['favourites-value','favourites-experience','favourites-item'];
const clone=value=>structuredClone(value);
const rowKey=r=>r.tableId+'/'+(r.id||r.rowId);
const text=value=>String(value??'');
const wrap=cell=>((cell-1)%288+288)%288+1;
function findRow(project,ref){const table=project.tables.find(t=>t.id===ref?.tableId),row=table?.rows.find(r=>r.id===(ref?.id||ref?.rowId));return table&&row?{table,row,ref:{tableId:table.id,id:row.id}}:null;}
function rowFromRecord(project,record){return record?findRow(project,{tableId:record.fields?.['Aura table ID'],id:record.fields?.['Aura row ID']}):null;}
function usableRow(stage,found){return found&&(stage==='avatar'?['body','boundaries'].includes(found.table.recommendation):found.table.recommendation===EXPECTED[stage])?found:null;}
function sameTarget(a,b){return a&&b&&targetKey(a)===targetKey(b);}

function destination(options,ref,index=0){
 const explicit=options.target||options.selection;
 if(explicit){const t=validateTarget(explicit);if(!['facet','stack'].includes(t.kind))throw Error('Choose a facet or stack layer for this activity.');return t.kind==='stack'?{...t,layer:t.layer+index}:{...t,index:wrap(t.index+index)};}
 const previous=ref?.bindings?.[index]?.target;
 if(previous&&options.shell===undefined&&options.face===undefined&&options.cell===undefined&&options.start===undefined&&options.mode===undefined)return clone(previous);
 const shell=Number(options.shell??previous?.shell??0),face=options.face??previous?.face??'O',cell=Number(options.cell??options.start??previous?.index??1),mode=options.mode??'facets';
 return target(shell,face,mode==='stack'?'stack':'facet',mode==='stack'?cell:wrap(cell+index),...(mode==='stack'?[Number(options.layer??previous?.layer??index+1)]:[]));
}

function canonicalRecord(project,found,address,oldRecord,makeId){
 // Ask the unchanged native allocator to construct the exact field/data shape.
 // A one-row temporary project prevents other pending rows being allocated.
 const temp=blankProject();temp.tables=[{...clone(found.table),rows:[clone(found.row)]}];
 if(address.kind==='stack'&&address.layer>1)temp.stacks=[{shell:address.shell,face:address.face,cell:address.index,count:address.layer-1}];
 const titleColumn=Math.max(0,found.table.columns.indexOf('Title'));
 const generated=allocateTable(temp,found.table.id,{shell:address.shell,face:address.face,start:address.index,mode:address.kind==='stack'?'stack':'facets',titleColumn},()=>oldRecord?.id||(makeId?makeId():crypto.randomUUID())).records[0];
 // Record identity keeps existing connections intact. Unrelated source fields
 // and an asset remain available; native row fields/data override matching keys.
 const result={...oldRecord,...generated,fields:{...(oldRecord?.fields||{}),...generated.fields}};
 if(oldRecord?.data&&typeof oldRecord.data==='object'&&!Array.isArray(oldRecord.data))result.data={...oldRecord.data,...generated.data};
 if(oldRecord?.asset&&!generated.asset)result.asset=clone(oldRecord.asset);
 if(address.kind==='facet')delete result.anchor;
 return result;
}

function writeOne(project,stage,values,existing){
 const before=new Set(project.tables.flatMap(t=>t.rows.map(r=>t.id+'/'+r.id)));
 let next;
 if(stage in INDEX)next=saveSectionEntry(project,INDEX[stage],values,existing?.ref||null);
 else if(stage==='family')next=saveLife(project,'family',values,existing?.ref||null);
 else if(stage==='travel')next=saveTrip(project,values,existing?.ref||null);
 else throw Error('Unknown instant activity.');
 let found=existing&&findRow(next,existing.ref);
 if(!found){for(const table of next.tables){const row=table.rows.find(r=>!before.has(table.id+'/'+r.id));if(row){found={table,row,ref:{tableId:table.id,id:row.id}};break;}}}
 if(!found)throw Error('The native writer did not produce a row.');
 return {project:next,found};
}

/**
 * syncInstantSample(project,{stage,values,ref?,target?,recordId?,activeIndex?,
 *   shell=0,face='O',cell=1,mode='facets',tableId?,reuseSeed=true,makeId?})
 * Returns {project,ref,selection,records,valid,error}. Invalid/incomplete edits
 * return the original last-valid project and ref, without changing either.
 * Values: native field object; favourites also accepts its three-item array,
 * which uses consecutive facets. Avatar parameter rows share one selected facet.
 * reuseSeed:false gives a new owner its own native row, without QuickStart reuse.
 * allocate values: {tableId,shell?,face?,start?,mode?,titleColumn?}.
 */
export function syncInstantSample(input,options={}){
 const originalRef=options.ref;
 try{
  let project=validateProject(clone(input));
  const stage=options.stage==='allocation'?'allocate':options.stage;
  const ref=Array.isArray(originalRef)?{items:clone(originalRef),bindings:[]}:clone(originalRef||{});
  ref.stage=stage;ref.items=ref.items||((ref.tableId&&ref.id)?[{tableId:ref.tableId,id:ref.id}]:[]);ref.bindings=ref.bindings||[];
  const values=options.values||{};let foundRows=[];
  if(stage==='allocate'){
   const id=values.tableId||options.tableId||ref.items[0]?.tableId;
   const table=project.tables.find(t=>t.id===id);if(!table)throw Error('Choose a table.');
   foundRows=table.rows.map(row=>({table,row,ref:{tableId:table.id,id:row.id}}));
   if(!foundRows.length)throw Error('This table has no rows yet.');
  }else if(stage==='avatar'){
   const keys=Object.keys(values);if(!keys.length)throw Error('Choose an avatar field.');
   for(const section of AVATAR_SECTIONS)project=saveAvatar(project,section,values);
   const allowed=new Set(AVATAR_SECTIONS.flatMap(fieldsFor).map(f=>f.id));
   for(const table of project.tables.filter(t=>['body','boundaries'].includes(t.recommendation)))for(const row of table.rows)if(keys.includes(row.id)&&allowed.has(row.id))foundRows.push({table,row,ref:{tableId:table.id,id:row.id}});
   if(!foundRows.length)throw Error('Enter a sample preference or measurement.');
  }else{
   const inputs=stage==='favourites'&&Array.isArray(values)?values:[values],activeInput=Math.max(0,Math.min(inputs.length-1,Number(options.activeIndex)||0));
   for(let i=0;i<inputs.length;i++){
    const data={...inputs[i]};if(!text(data.Title??data.Destination).trim())throw Error(stage==='travel'?'Enter a destination.':'Enter a title.');
    if(['dates','timing'].includes(stage)&&!text(data.Date).trim())throw Error('Complete the date.');
    if(stage==='travel'&&!data.Status)data.Status='Want to go';
    const address=destination(options,ref,i),binding=ref.bindings[i];
    const explicitId=(i===activeInput?options.recordId||ref.recordId:null)||binding?.recordId;
    const at=project.records.find(r=>r.id===explicitId)||project.records.find(r=>sameTarget(recordTarget(r),address));
    let existing=usableRow(stage,findRow(project,ref.items[i])||rowFromRecord(project,at));
    // Initial native starter rows are reused at the first three entry facets.
    // A different selected facet gets its own row rather than stealing one.
    if(options.reuseSeed!==false&&!existing&&!at&&(!options.target&&!options.selection||address.index===i+1)){
     const key=stage==='favourites'?FAVOURITE_KEYS[i]:stage;
     existing=usableRow(stage,findRow(project,project.quickStart.entries?.[key]));
    }
    const written=writeOne(project,stage,data,existing);project=written.project;foundRows.push(written.found);
   }
  }
  const records=[],bindings=[],activeRow=Math.max(0,Math.min(foundRows.length-1,Number(options.activeIndex)||0));
  for(let i=0;i<foundRows.length;i++){
   const found=foundRows[i],oldBinding=ref.bindings.find(b=>b.tableId===found.table.id&&b.id===found.row.id)||(['avatar','allocate'].includes(stage)?undefined:ref.bindings[i]);
   const placement=stage==='allocate'?{...options,...values}:options;
   const addressIndex=stage==='avatar'?0:i,previousBindings=[];previousBindings[addressIndex]=oldBinding;
   const address=destination(placement,{bindings:previousBindings},addressIndex);
   const explicitId=(i===activeRow?options.recordId||ref.recordId:null)||oldBinding?.recordId;
   let old=project.records.find(r=>r.id===explicitId);
   if(!old)old=project.records.find(r=>r.fields?.['Aura table ID']===found.table.id&&r.fields?.['Aura row ID']===found.row.id&&(stage!=='avatar'||sameTarget(recordTarget(r),address)));
   if(!old&&stage!=='avatar')old=project.records.find(r=>sameTarget(recordTarget(r),address));
   const generated=canonicalRecord(project,found,address,old,options.makeId);
   const position=project.records.findIndex(r=>r.id===generated.id);if(position<0)project.records.push(generated);else project.records[position]=generated;
   if(address.kind==='stack'){const stack=project.stacks.find(s=>s.shell===address.shell&&s.face===address.face&&s.cell===address.index);if(stack)stack.count=Math.max(stack.count,address.layer);else project.stacks.push({shell:address.shell,face:address.face,cell:address.index,count:address.layer});}
   records.push(generated);bindings.push({tableId:found.table.id,id:found.row.id,recordId:generated.id,target:clone(address)});
  }
  project=validateProject(project);ref.items=foundRows.map(f=>f.ref);ref.bindings=bindings;delete ref.recordId;
  const active=Math.max(0,Math.min(records.length-1,Number(options.activeIndex)||0));
  return {project,ref,selection:bindings[active]?.target||null,records,record:records[active]||null,valid:true,error:''};
 }catch(error){return {project:input,ref:originalRef,selection:originalRef?.bindings?.[Number(options.activeIndex)||0]?.target||null,records:[],record:null,valid:false,error:error.message};}
}
