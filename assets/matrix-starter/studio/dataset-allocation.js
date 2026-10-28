import {validateProject,address} from '../../matrix-studio/core.js?v=0.4.26';
import {remember,target} from '../../matrix-studio/spatial.js?v=0.4.26';
export function pendingRows(project,table){
  const assigned=new Set(project.records.filter(r=>r.fields['Aura table ID']===table.id).map(r=>r.fields['Aura row ID']));
  return table.rows.filter(r=>!assigned.has(r.id));
}
export function allocationPlan(project,tableId,options){
  const table=project.tables.find(t=>t.id===tableId);if(!table)throw Error('Choose a table.');
  const {shell,face,start,mode}=options;address(shell,start,face);
  if(!['facets','stack'].includes(mode))throw Error('Choose facets or a stack.');
  if(table.columns.some(c=>['Aura table ID','Aura row ID','Aura chakra tags'].includes(c)))throw Error('Rename the reserved Aura allocation columns before allocating.');
  const rows=pendingRows(project,table),base=project.stacks.find(s=>s.shell===shell&&s.face===face&&s.cell===start)?.count||0;
  if(mode==='stack'&&base+rows.length>16777215)throw Error('This stack would exceed the colour-address range.');
  return rows.map((row,i)=>({row,target:mode==='stack'?target(shell,face,'stack',start,base+i+1):target(shell,face,'facet',(start-1+i)%288+1)}));
}
export function allocateTable(project,tableId,options,idFactory=()=>crypto.randomUUID()){
  const next=validateProject(structuredClone(project)),table=next.tables.find(t=>t.id===tableId),plan=allocationPlan(next,tableId,options);
  const titleColumn=options.titleColumn??0;if(!Number.isInteger(titleColumn)||titleColumn<0||titleColumn>=table.columns.length)throw Error('Choose a title column.');
  const value=(row,name)=>{const i=table.columns.findIndex(c=>c.toLowerCase()===name);return i<0?'':row.values[i];};
  for(const {row,target:t} of plan){
    const title=row.values[titleColumn].trim();if(!title)throw Error('Every new row needs a value in its title column.');
    const fields=Object.fromEntries(table.columns.map((c,i)=>[c,row.values[i]]));Object.assign(fields,{'Aura table ID':table.id,'Aura row ID':row.id,'Aura chakra tags':table.chakraTags.join(',')});
    const asset=value(row,'asset').trim();
    next.records.push({id:idFactory(),title,note:value(row,'details')||value(row,'description')||value(row,'meaning'),shell:t.shell,face:t.face,cell:t.index,fields,data:Object.fromEntries(table.columns.map((c,i)=>[c,row.values[i]])),instructions:value(row,'instructions'),...(asset?{asset:{url:asset}}:{}),...(t.kind==='stack'?{anchor:t}:{})});
  }
  if(plan.length){const last=plan.at(-1).target,first=plan[0].target;
    if(last.kind==='stack'){const existing=next.stacks.find(s=>s.shell===last.shell&&s.face===last.face&&s.cell===last.index);if(existing)existing.count=last.layer;else next.stacks.push({shell:last.shell,face:last.face,cell:last.index,count:last.layer});}
    next.selections=remember(next.selections,first);
  }
  return validateProject(next);
}
