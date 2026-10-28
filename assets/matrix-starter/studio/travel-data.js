import {sampleStorage as localStorage} from '../sample-store.js';
import {blankProject,validateProject} from '../../matrix-studio/core.js?v=0.4.26';
export const TRAVEL='DAFCEEE9-7303-415D-975B-AB7176A59010',TIMELINES='2E5320C1-E2FE-4EE5-B62E-3CB9013D4010',CELESTIAL='04D7A1CD-024B-4CC1-8116-37139DF95A29';
export const PROJECT_KEY='aura-matrix-studio:v4:project';
export function readTravelProject(){const raw=[4,3,2,1].map(v=>localStorage.getItem(`aura-matrix-studio:v${v}:project`)).find(Boolean);return raw?validateProject(JSON.parse(raw)):blankProject();}
export function writeTravelProject(fn){const p=validateProject(fn(readTravelProject()));localStorage.setItem(PROJECT_KEY,JSON.stringify(p));return p;}
export const normaliseDestination=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ').toLowerCase();
export function travelEntries(project){return project.tables.filter(t=>t.recommendation==='journeys').flatMap(t=>t.rows.map(r=>({tableId:t.id,id:r.id,...Object.fromEntries(t.columns.map((c,i)=>[c,r.values[i]]))})));}
export function travelGoal(project){const t=project.tables.find(t=>t.id==='aura-travel-goal'),r=t?.rows[0],values=r?Object.fromEntries(t.columns.map((c,i)=>[c,r.values[i]])):{};return {target:Number(values['Target destinations'])||256,years:Number(values.Years)||10,start:values['Start date']||''};}
export function travelProgress(project){const entries=travelEntries(project),visited=new Set(entries.filter(r=>r.Status==='Visited').map(r=>normaliseDestination(r.Destination||r.Title)).filter(Boolean));return {visited:visited.size,...travelGoal(project)};}
export const dateValid=s=>!s||/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const COLUMNS=['Title','Destination','Status','Date','Return date','Hemisphere','Preferred season','Astrology notes','Purpose'];
export function saveTrip(project,values,existing=null){
 const p=structuredClone(project),destination=(values.Destination||'').trim();if(!destination)throw Error('Choose or enter a destination.');
 if(!['Visited','Want to go','Planned'].includes(values.Status))throw Error('Choose Visited, Want to go or Planned.');
 if(!dateValid(values.Date||'')||!dateValid(values['Return date']||''))throw Error('Enter a valid date.');
 if(values.Date&&values['Return date']&&values['Return date']<values.Date)throw Error('The return date must follow the departure date.');
 let t=p.tables.find(t=>t.id===(existing?.tableId||'aura-travel'));
 if(!t){if(existing)throw Error('This travel table is no longer available.');t={id:'aura-travel',name:'My travel plans',category:'place',recommendation:'journeys',columns:[...COLUMNS],rows:[],chakraTags:[0,1,2,6]};p.tables.push(t);}
 for(const c of COLUMNS)if(!t.columns.includes(c)){t.columns.push(c);t.rows.forEach(r=>r.values.push(''));}
 let row=existing&&t.rows.find(r=>r.id===existing.id);if(existing&&!row)throw Error('This trip is no longer available.');
 if(!row){row={id:crypto.randomUUID(),values:t.columns.map(()=> '')};t.rows.push(row);}
 const fields={...values,Destination:destination,Title:values.Title||destination};for(const c of COLUMNS)if(c in fields)row.values[t.columns.indexOf(c)]=String(fields[c]??'');
 return validateProject(p);
}
export function saveTravelGoal(project,goal){
 if(!Number.isInteger(+goal.target)||+goal.target<1||!Number.isFinite(+goal.years)||+goal.years<=0||!dateValid(goal.start||''))throw Error('Use a positive destination target, a positive time span and a valid start date.');
 const p=structuredClone(project);let t=p.tables.find(t=>t.id==='aura-travel-goal');if(!t){t={id:'aura-travel-goal',name:'My world travel goal',category:'intent',recommendation:'goals',columns:['Title','Target destinations','Years','Start date'],rows:[],chakraTags:[1,2,6]};p.tables.push(t);}t.rows=[{id:'world-travel',values:['Visit countries and territories',String(goal.target),String(goal.years),goal.start||'']}];return validateProject(p);
}
export const travelTimeline=project=>travelEntries(project).filter(r=>r.Date&&dateValid(r.Date)).sort((a,b)=>a.Date.localeCompare(b.Date));
