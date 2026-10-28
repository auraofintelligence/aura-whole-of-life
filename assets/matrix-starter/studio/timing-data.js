import {validateProject} from '../../matrix-studio/core.js?v=0.4.26';
import {dateValid} from './travel-data.js?v=0.4.26';
export const TIMING_PAGES={
 'DC827E51-FDDD-49EC-BB9D-7FFAE33159BC':'birthdays','951AAB58-F4AE-41E2-A790-4F204A0EC475':'milestones',
 '956F8AD0-B3EF-41E8-8817-89365312F363':'counters','F48AFCA1-102C-4305-981F-CF183DECB786':'schedules',
 '69916C5A-CC15-4412-A126-2D3A57C5FFBF':'reminders','1BF3DD9E-39CC-4828-A4B4-FA9B6D89E705':'ceremonies',
 '02B0EE12-8186-4347-BFC7-06657FAC52D8':'learning','C114B9ED-EFE7-407D-AE82-DB51CD8A5024':'work',
 '0C80839D-6648-4F69-A381-F485356386F0':'weather','2F2B1282-1970-44AA-B71E-7C65EB342418':'community'
};
export const TIMING_GROUPS={birthdays:['life-events'],milestones:['life-events','goals','counters'],counters:['counters'],schedules:['schedules'],reminders:['schedules','life-events','goals','learning','work','ceremonies','community','environment','counters'],ceremonies:['ceremonies'],learning:['learning'],work:['work'],weather:['environment'],community:['community','commitments']};
export const timingRows=p=>p.tables.flatMap(t=>t.rows.map(r=>({...Object.fromEntries(t.columns.map((c,i)=>[c,r.values[i]])),tableId:t.id,id:r.id,recommendation:t.recommendation,tableName:t.name})));
export const isBirthday=r=>r['Event kind']?r['Event kind']==='Birthday':r.id==='my-birthday'||r.id.endsWith('-birthday')||/\bbirthday\b/i.test(r.Title||'');
export const timingDate=r=>r.Date||r['Target date']||r['Due date']||(dateValid(r['Date or season']||'')?r['Date or season']:'')||'';
export const repeatOf=r=>r.Repeat||(isBirthday(r)?'Yearly':'None');
export function timingEntries(p,group){return timingRows(p).filter(r=>TIMING_GROUPS[group]?.includes(r.recommendation)).filter(r=>group==='birthdays'?isBirthday(r):group==='milestones'?!isBirthday(r):group==='reminders'?r.recommendation==='schedules'||isBirthday(r)||r['Reminder minutes']!==undefined&&r['Reminder minutes']!=='':true);}
const number=(v,label,min=-Infinity)=>{if(v===''||!Number.isFinite(Number(v))||Number(v)<min)throw Error('Enter a valid '+label+'.');return Number(v);};
export function saveTiming(project,group,fields,existing=null){
 const p=structuredClone(project);if(!TIMING_GROUPS[group])throw Error('Unknown timing section.');
 if(!String(fields.Title||'').trim())throw Error('Give this entry a name.');
 for(const key of ['Date','End date'])if(key in fields&&!dateValid(fields[key]))throw Error('Choose a valid '+key.toLowerCase()+'.');
 if(fields.Time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(fields.Time))throw Error('Choose a valid time.');
 if(fields.Repeat&&!['None','Daily','Weekly','Monthly','Yearly'].includes(fields.Repeat))throw Error('Choose a repeat pattern.');
 if(fields.Interval!==undefined&&(!Number.isInteger(number(fields.Interval,'repeat interval',1))))throw Error('Repeat intervals must be whole numbers.');
 if(fields['Reminder minutes']!==undefined)number(fields['Reminder minutes'],'reminder lead time',0);
 for(const k of ['Value','Target'])if(fields[k]!==undefined&&fields[k]!=='')number(fields[k],k.toLowerCase());
 if(fields.Date&&fields['End date']&&fields['End date']<fields.Date)throw Error('The end date must follow the start date.');
 if(fields['Required data'])JSON.parse(fields['Required data']);
 if(fields['Signal condition'])validateCondition(JSON.parse(fields['Signal condition']));
 if(fields['Program ID']&&!p.programs.some(x=>x.id===fields['Program ID']))throw Error('The linked program is no longer available.');
 let t=p.tables.find(t=>t.id===(existing?.tableId||'timing-'+group));
 if(!t){if(existing)throw Error('This table is no longer available.');t={id:'timing-'+group,name:group[0].toUpperCase()+group.slice(1),category:'time',recommendation:TIMING_GROUPS[group][0],columns:[],rows:[],chakraTags:group==='birthdays'?[0,3,6]:[2,5]};p.tables.push(t);}
 const clean={...fields};const dateColumn=t.recommendation==='goals'?'Target date':t.recommendation==='work'?'Due date':null;if(dateColumn&&'Date' in clean){clean[dateColumn]=clean.Date;if(!t.columns.includes('Date'))delete clean.Date;}if(group==='birthdays')clean['Event kind']='Birthday';
 for(const k of Object.keys(clean)){if(['__proto__','prototype','constructor','id','tableId'].includes(k))throw Error('Invalid field.');if(!t.columns.includes(k)){t.columns.push(k);for(const row of t.rows)row.values.push('');}}
 let row=existing&&t.rows.find(r=>r.id===existing.id);if(existing&&!row)throw Error('This entry is no longer available.');
 if(!row){row={id:crypto.randomUUID(),values:t.columns.map(()=> '')};t.rows.push(row);}
 for(const [k,v]of Object.entries(clean))row.values[t.columns.indexOf(k)]=String(v??'');
 return validateProject(p);
}
export function validateCondition(c){if(!c||typeof c.tableId!=='string'||typeof c.rowId!=='string'||typeof c.column!=='string'||!['>=','>','=','<=','<'].includes(c.operator)||typeof c.value!=='number'||!Number.isFinite(c.value))throw Error('Choose a numeric record, comparison and threshold.');return c;}
export function conditionResult(p,r){
 if(!r['Signal condition'])return {pass:true,message:'No condition required.'};
 try{const c=validateCondition(JSON.parse(r['Signal condition'])),t=p.tables.find(t=>t.id===c.tableId),row=t?.rows.find(x=>x.id===c.rowId),v=row?.values[t.columns.indexOf(c.column)];
  if(v===undefined||v.trim()===''||!Number.isFinite(Number(v)))return {pass:false,message:'The condition needs a current numeric value.'};
  const n=Number(v),pass=({'>=':n>=c.value,'>':n>c.value,'=':n===c.value,'<=':n<=c.value,'<':n<c.value})[c.operator];return {pass,message:`${c.column}: ${n} ${c.operator} ${c.value} (${pass?'met':'not met'})`};
 }catch(e){return {pass:false,message:'Invalid saved condition: '+e.message};}
}
export const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// Calendar dates stay in device local time. Monthly/yearly repeats clamp to the last
// day of a shorter month, always returning to the original day when available.
export function nextOccurrences(r,from=new Date(),count=3){
 const start=timingDate(r);if(!start||!dateValid(start)||r.Enabled==='No'||['Done','Paused'].includes(r.Status))return [];
 const repeat=repeatOf(r),interval=Number(r.Interval||1);if(!['None','Daily','Weekly','Monthly','Yearly'].includes(repeat)||!Number.isInteger(interval)||interval<1)return [];
 const [y,m,d]=start.split('-').map(Number),[hour,minute]=(r.Time||'09:00').split(':').map(Number),lead=Number(r['Reminder minutes']||0);
 if(!Number.isFinite(hour)||!Number.isFinite(minute)||!Number.isFinite(lead)||lead<0)return [];
 const boundary=new Date(from.getTime()+lead*60000),dayDistance=Math.floor((Date.UTC(boundary.getFullYear(),boundary.getMonth(),boundary.getDate())-Date.UTC(y,m-1,d))/86400000);
 let index=Math.max(0,Math.floor(repeat==='Daily'?dayDistance/interval:repeat==='Weekly'?dayDistance/(7*interval):repeat==='Monthly'?((boundary.getFullYear()-y)*12+boundary.getMonth()-m+1)/interval:repeat==='Yearly'?(boundary.getFullYear()-y)/interval:0)-1);
 const result=[];for(let attempt=0;attempt<count+8;attempt++,index++){
  if(repeat==='None'&&index>0)break;
  let when;
  if(repeat==='Monthly'||repeat==='Yearly'){const month=repeat==='Monthly'?m-1+index*interval:m-1,year=repeat==='Yearly'?y+index*interval:y;const first=new Date(year,month,1,hour,minute);when=new Date(first.getFullYear(),first.getMonth(),Math.min(d,new Date(first.getFullYear(),first.getMonth()+1,0).getDate()),hour,minute);}
  else when=new Date(y,m-1,d+(repeat==='Daily'?index*interval:repeat==='Weekly'?index*interval*7:0),hour,minute);
  if(!Number.isFinite(when.getTime())||r['End date']&&localDay(when)>r['End date'])break;
  const remind=new Date(when.getTime()-lead*60000);if(remind<from)continue;result.push({date:localDay(when),at:when.toISOString(),remindAt:remind.toISOString()});if(result.length>=count)break;
 }return result;
}
export function timingRule(p,r){const condition=r['Signal condition']?validateCondition(JSON.parse(r['Signal condition'])):null,program=p.programs.find(x=>x.id===r['Program ID']);return {format:'aura-timing-rule/1',source:{tableId:r.tableId,rowId:r.id},title:r.Title,enabled:r.Enabled!=='No'&&!['Done','Paused'].includes(r.Status),when:{date:timingDate(r),time:r.Time||'09:00',timeBasis:'Device local time',repeat:repeatOf(r),interval:Number(r.Interval||1),until:r['End date']||null,reminderMinutes:Number(r['Reminder minutes']||0)},condition,action:{instructions:r.Instructions||'',program:program?structuredClone(program):null,data:r['Required data']?JSON.parse(r['Required data']):{}},delivery:'Manual review in Aura; no background delivery or automatic program execution'};}
