import {validateProject} from '../../matrix-studio/core.js?v=0.4.26';
import {EYE_POSES,eyePhotos} from './eye-photos.js?v=0.4.26';
export const AVATAR_HOME='DD2667DF-4A8C-461B-9196-655447A018F3';
export const AVATAR_CREATION='3A178076-5EF1-41A0-8229-62636BE4F256';
const choice=(id,label,options)=>({id,label,options:[...options,'Prefer not to say'],unit:'',kind:'choice'});
export const AVATAR_QUESTIONS=[
 choice('avatar-answer-0','Which hand do you prefer to use?',['Right handed','Left handed','Both','Varies by activity']),
 choice('avatar-answer-1','Which foot do you prefer to use?',['Right footed','Left footed','Both','No preference']),
 choice('avatar-answer-2','Do you use glasses or contact lenses?',['Glasses','Contact lenses','Both','Neither']),
 choice('avatar-answer-3','Facial details to include in your avatar',['Tattoos','Piercings','Both','Neither','Decide later']),
 choice('avatar-answer-4','Which clothing fit feels comfortable?',['Fitted','Regular','Loose','Varies by activity']),
 choice('avatar-answer-5','How would you describe your activity routine?',['Mostly seated','A mix of sitting and moving','Often moving','Varies day to day']),
 choice('avatar-answer-6','How often do you change your hair style or colour?',['Rarely','Sometimes','Often','Not applicable']),
 choice('avatar-answer-7','Do you usually wear a hat or head covering?',['Usually','Sometimes','Rarely','Varies by setting'])
];
const measure=(id,label,unit='cm')=>({id,label,unit,kind:'number'});
const note=(id,label)=>({id,label,unit:'',kind:'text'});
export const AVATAR_SECTIONS=[
 {id:'6C41DDB8-433E-4F49-8593-82BFBAC3B941',key:'preferences',title:'Avatar preferences',summary:'Movement, appearance and everyday comfort',icon:'person',intro:'Describe how you want your avatar to represent you. Every answer is optional.',dataset:'body',steps:[{title:'Hand and foot preference',fields:AVATAR_QUESTIONS.slice(0,2)},{title:'Face and eyesight',fields:AVATAR_QUESTIONS.slice(2,4)},{title:'Comfort and activity',fields:AVATAR_QUESTIONS.slice(4,6)},{title:'Hair and headwear',fields:AVATAR_QUESTIONS.slice(6,8)}]},
 {id:'EB351F52-5B46-44B7-8014-8F7193AA2DAA',key:'space',title:'Personal space',summary:'Seven visual layers, height and distance',icon:'space',intro:'Record what feels comfortable to you. These are preferences, not automatic proximity alerts.',dataset:'boundaries',steps:[{title:'One-to-one space',fields:[measure('space-close','Red layer distance'),measure('space-conversation','Orange layer distance')],help:'Distance from you to the other person. Leave a distance blank if it depends on the situation.'},{title:'Group and public space',fields:[measure('space-group','Yellow layer distance'),measure('space-public','Green layer distance')]},{title:'Additional Aura layers',fields:[measure('space-blue','Blue layer distance'),measure('space-indigo','Indigo layer distance'),measure('space-violet','Violet layer distance')]},{title:'Context and boundaries',fields:[note('space-context','Where or with whom does this apply?'),note('space-contact','Touch and greeting preferences'),note('space-adjustments','What helps you feel comfortable?')]}]},
 {id:'C6AFC90C-3BCB-4CFE-A0A8-2A59A175ED46',key:'eyes',title:'Eyes and spacing',summary:'Nine look positions and eye measurements',icon:'eyes',intro:'Use measurements you already know, or leave them blank. No photos are required.',dataset:'body',steps:[{title:'Eye measurements',fields:[measure('eyes-spacing','Distance between pupil centres','mm'),measure('eyes-left','Left eye width, corner to corner','mm'),measure('eyes-right','Right eye width, corner to corner','mm')],help:'For avatar proportions only. These values do not provide a glasses prescription.'}]},
 {id:'82556099-54EF-41B6-84DF-0A02B82C3CC5',key:'reach',title:'Height and reach',summary:'Body height and comfortable overhead reach',icon:'reach',intro:'Record a comfortable position. Skip any measurement that does not suit you.',dataset:'body',steps:[{title:'Height measurements',fields:[measure('body-height','Standing height'),measure('body-reach','Floor to fingertip, arm raised'),measure('body-seated','Seat to top of head')],help:'Use a tape measure or a value you already know. Overhead reach is the total height from the floor.'}]},
 {id:'8EEAE4F6-2A46-4447-A9B7-EBE9C528D2C8',key:'shoulders',title:'Shoulders and arm span',summary:'Width, shoulder height and outward reach',icon:'shoulders',intro:'Record your natural proportions without stretching beyond a comfortable position.',dataset:'body',steps:[{title:'Shoulder measurements',fields:[measure('body-shoulder-height','Floor to top of shoulder'),measure('body-arm-span','Fingertip to fingertip, arms out'),measure('body-shoulder-width','Shoulder width')],help:'Leave anything you cannot measure comfortably blank. These inputs prepare your avatar scale.'}]}
];
export const AVATAR_PAGES=Object.fromEntries(AVATAR_SECTIONS.map(s=>[s.id,s]));
AVATAR_SECTIONS[0].steps.push({title:'Body and clothing details',fields:[measure('body-weight','Weight','kg'),note('clothing-top','Top or shirt size'),note('clothing-bottom','Trouser or skirt size'),note('clothing-shoes','Shoe size'),note('clothing-size-context','Sizing system, brand or fit notes')],help:'Clothing sizes vary by sizing system and brand. Include the context you use rather than converting it automatically.'});
export const fieldsFor=s=>s.steps.flatMap(p=>p.fields);
const tableId=s=>s.dataset==='body'?'quickstart-body':'avatar-boundaries';
export function avatarValues(project,section){const t=project.tables.find(t=>t.id===tableId(section));return Object.fromEntries(fieldsFor(section).map(f=>{const r=t?.rows.find(r=>r.id===f.id);return [f.id,r?.values[t.columns.indexOf('Measurement')]||''];}));}
export function avatarProgress(project,section){const v=avatarValues(project,section),fields=fieldsFor(section),photos=section.key==='eyes'?eyePhotos(project):{},poses=section.key==='eyes'?EYE_POSES:[];return {filled:fields.filter(f=>v[f.id]!== '').length+poses.filter(p=>photos[p.id]?.Asset).length,total:fields.length+poses.length};}
export function saveAvatar(project,section,values){
 const p=structuredClone(project),fields=fieldsFor(section);let t=p.tables.find(t=>t.id===tableId(section));
 for(const f of fields)if(f.id in values){const v=String(values[f.id]??'').trim();if(f.kind==='number'&&v!==''&&(!Number.isFinite(Number(v))||Number(v)<=0))throw Error(f.label+': enter a number greater than zero, or leave it blank.');if(v.length>2000)throw Error(f.label+': please use a shorter note.');}
 if(!t&&!fields.some(f=>String(values[f.id]??'').trim()))return validateProject(p);
 if(!t){t={id:tableId(section),name:section.dataset==='body'?'Body and avatar calibration':'Personal space preferences',category:'self',recommendation:section.dataset,columns:['Title','Measurement','Unit','Method','Date','Asset'],rows:[],chakraTags:section.dataset==='body'?[0,5]:[0,3,4]};p.tables.push(t);}
 for(const key of ['Title','Measurement','Unit','Method','Date','Asset'])if(!t.columns.includes(key)){t.columns.push(key);t.rows.forEach(r=>r.values.push(''));}
 for(const f of fields){if(!(f.id in values))continue;const value=String(values[f.id]??'').trim();let row=t.rows.find(r=>r.id===f.id);if(!row&&!value)continue;if(!row){row={id:f.id,values:t.columns.map(()=> '')};t.rows.push(row);}const data={Title:f.label,Measurement:value,Unit:value?f.unit:'',Method:row.values[t.columns.indexOf('Method')]||(f.kind==='number'?'User supplied':'Personal preference')};for(const [k,v]of Object.entries(data))row.values[t.columns.indexOf(k)]=v;}
 return validateProject(p);
}
export function avatarRatios(project){const values=Object.assign({},...AVATAR_SECTIONS.filter(s=>s.dataset==='body').map(s=>avatarValues(project,s)));const h=Number(values['body-height']);return {reach:h>0&&Number(values['body-reach'])>0?Number(values['body-reach'])/h:null,span:h>0&&Number(values['body-arm-span'])>0?Number(values['body-arm-span'])/h:null};}
