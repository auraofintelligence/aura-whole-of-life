import {validateProject} from '../../matrix-studio/core.js?v=0.4.26';
// Original Eyes and Distance page: preserve its nine positions and order.
export const EYE_POSES=[
 ['camera','Look into the camera','Keep your head level and look into the camera.'],
 ['wide','Eyes wide open','Keep looking ahead and open your eyes wide.'],
 ['left','Look left','Keep your head still and look to your left. The reference’s left is on your screen’s right.'],
 ['right','Look right','Keep your head still and look to your right. The reference’s right is on your screen’s left.'],
 ['up','Look up','Keep your head still and move your eyes upwards.'],
 ['down','Look down','Keep your head still and move your eyes downwards.'],
 ['ahead','Look ahead again','Return your eyes to the camera, with your face relaxed.'],
 ['closed-gently','Eyes closed gently','Close your eyes gently and keep your face relaxed.'],
 ['closed-tightly','Eyes closed tightly','Close your eyes tightly for the final photograph.']
].map(([key,title,help],index)=>({id:`eyes-pose-${key}`,title,help,index,kind:'photo'}));
export function eyePhotos(project){const t=project.tables.find(t=>t.id==='avatar-eye-photos');return Object.fromEntries((t?.rows||[]).map(r=>[r.id,Object.fromEntries(t.columns.map((c,i)=>[c,r.values[i]]))]));}
export function saveEyePhoto(project,id,data){
 const pose=EYE_POSES.find(p=>p.id===id);if(!pose)throw Error('Unknown eye position.');
 if(data.Asset===undefined)return project;
 if(data.Asset!==''&&(typeof data.Asset!=='string'||data.Asset.length>90000||!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(data.Asset)))throw Error('Choose a supported photo under the saved size limit.');
 if(typeof data.Filename!=='string'||data.Filename.length>500)throw Error('Photo filename is too long.');
 const p=structuredClone(project);let t=p.tables.find(t=>t.id==='avatar-eye-photos');
 if(!data.Asset&&!t?.rows.some(r=>r.id===id))return project;
 const columns=['Title','Position','Asset','Filename','Reference'];
 if(!t){t={id:'avatar-eye-photos',name:'Eye positions and reference photographs',category:'self',recommendation:'body',chakraTags:[5],columns:[...columns],rows:[]};p.tables.push(t);}
 for(const c of columns)if(!t.columns.includes(c)){t.columns.push(c);t.rows.forEach(r=>r.values.push(''));}
 let r=t.rows.find(r=>r.id===id);if(!r){r={id,values:t.columns.map(()=> '')};t.rows.push(r);}
 const values={Title:pose.title,Position:String(pose.index+1),Asset:data.Asset,Filename:data.Filename,Reference:'30 cm ruler across forehead'};
 for(const [k,v]of Object.entries(values))r.values[t.columns.indexOf(k)]=v;
 return validateProject(p);
}
