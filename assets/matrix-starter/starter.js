import {blankProject,validateProject,SHELLS} from '../matrix-studio/core.js?v=0.4.26';
import {target,targetLabel} from '../matrix-studio/spatial.js?v=0.4.26';
import {getProject,replaceProject,onProjectChange} from './sample-store.js';
import {saveSectionEntry,QUICK_SECTIONS,quickStage} from './studio/quickstart-data.js?v=0.4.26';
import {allocationPlan,allocateTable,pendingRows} from './studio/dataset-allocation.js?v=0.4.26';
import {LIFE_SECTIONS,birthdayFor,entriesFor} from './studio/life-data.js?v=0.4.26';
import {mountLife} from './studio/life-ui.js?v=0.4.26';
import {saveTrip,travelEntries} from './studio/travel-data.js?v=0.4.26';
import {AVATAR_QUESTIONS as AVATAR_FIELDS,AVATAR_SECTIONS,avatarValues,saveAvatar} from './studio/avatar-data.js?v=0.4.26';
import {catalogue,travelDestinations,contexts} from './fixtures.js';

const STAGES=['favourites','skills','goals','dates','timing','travel','family','avatar','allocate'];
const INDEX={favourites:5,skills:6,goals:7,dates:3,timing:4,family:2,avatar:1,allocate:9,travel:8};
const LABELS={favourites:'What matters to you',skills:'Learning & skills',goals:'Life goals',dates:'Dates & milestones',timing:'Timing & signals',travel:'Travel plans',family:'Family & belonging',avatar:'Body & avatar',allocate:'Place in your Aura'};
const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=(text,fn)=>{const b=make('button','quick-secondary',text);b.type='button';b.onclick=fn;return b;};
const field=(form,label,type,value='')=>{const n=make('input');n.type=type;n.value=value;n.setAttribute('aria-label',label);const l=make('label');l.append(make('span','',label),n);form.append(l);return n;};
function travelSeed(){return Promise.resolve(travelDestinations);}

/* SOURCE: quickstart.js validBirthday, saveQuickEntry, field/select/input,
 * stepArt, renderFavourites, renderGuided and renderAllocation are inserted by
 * build-starter.py. Their exact source/patch hashes are in upstream-manifest.json. */
export function saveQuickEntry(project,dataset,values,rowId){
  const next=structuredClone(project);let table=next.tables.find(t=>t.id==='quickstart-'+dataset.id);
  if(!table){table={id:'quickstart-'+dataset.id,name:dataset.name,category:dataset.category,recommendation:dataset.id,columns:[...dataset.columns],rows:[],chakraTags:dataset.chakraRelevance.map(r=>r.shell)};next.tables.push(table);}
  for(const key of Object.keys(values))if(!table.columns.includes(key))throw Error('This table no longer has the '+key+' column. Use Tables to edit it.');
  let row=rowId&&table.rows.find(r=>r.id===rowId);if(!row){row={id:rowId||crypto.randomUUID(),values:table.columns.map(()=> '')};table.rows.push(row);}
  for(const [key,value]of Object.entries(values))row.values[table.columns.indexOf(key)]=value;
  return validateProject(next);
}
export function validBirthday(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}


export function mountStarter(root,{stage:initialStage='favourites',example='memory',project:initialProject,showMatrix}={}){
 const context=contexts[example]||contexts.memory||Object.values(contexts)[0];
 const fixture=()=>validateProject(structuredClone(context?.project||blankProject()));
 replaceProject(initialProject||fixture());
 let project=getProject(),stage=initialStage==='allocation'?'allocate':initialStage,index=0,tableId='',draft=null,preview=null,native=null,disposed=false;
 if(!STAGES.includes(stage))stage='favourites';index=INDEX[stage];
 root.replaceChildren();root.classList.add('starter-host');
 const heading=make('header','sample-heading'),title=make('h1','',LABELS[stage]),badge=make('p','sample-badge','Native Studio activity · fictional sample');title.tabIndex=-1;heading.append(badge,title);
 const tools=make('div','sample-tools'),choice=make('select');choice.setAttribute('aria-label','Choose a sample activity');for(const id of STAGES){const o=make('option','',LABELS[id]);o.value=id;choice.append(o);}choice.value=stage;choice.onchange=()=>goStage(choice.value);
 const reset=button('Reset sample',()=>{replaceProject(fixture());tableId='';render();message.textContent='Sample reset.';}),allocation=button('Review table & place in Aura',()=>goStage('allocate'));
 tools.append(choice,reset,allocation);root.append(heading,tools);
 const message=make('p','sample-status');message.setAttribute('role','status');message.setAttribute('aria-live','polite');root.append(message);
 const body=make('div','quick-body sample-body');root.append(body);
 const summary=make('div','sample-summary'),view=button('View in Aura',()=>openMatrix());summary.append(view);root.append(summary);
 const full=make('a','sample-full','Open full Aura Matrix Studio ↗');full.href='https://auraofintelligence.github.io/aura-matrix-studio/';full.target='_blank';full.rel='noopener noreferrer';root.append(full);
 function updateSummary(){project=getProject();view.textContent=`View in Aura · ${project.records.length} records`;}
 const unsubscribe=onProjectChange(updateSummary);
 function read(){project=getProject();}
 function mutate(fn){project=replaceProject(fn(structuredClone(getProject())));return project;}
 function safely(fn){try{return fn();}catch(error){message.textContent=error.message;}}
 function registerDraft(form,save,filled){draft={form,save,filled};}
 function selectedTable(){return project.tables.find(t=>t.id===tableId);}
 function navigate(delta){message.textContent='Saved in this sample.';goStage(STAGES[Math.min(STAGES.length-1,Math.max(0,STAGES.indexOf(stage)+delta))]);}
 function goStage(next){if(!STAGES.includes(next))return;stage=next;index=INDEX[next];tableId='';render();title.focus();}
 function go(id){const map={'AE87688C-93C9-4AB1-A72D-A447ED56C5E0':'family','82791921-1F9A-4056-A0FE-B4385FD5377A':'favourites','E933DDB8-9FDE-445A-97A0-686C17B77380':'goals','4EE0FBBC-65BF-49B1-9D77-7022C1FD6E1D':'goals','A95C1B93-E697-4764-9F0D-D819C3B71AC1':'goals','DAFCEEE9-7303-415D-975B-AB7176A59010':'travel'};if(id==='command:back')return goStage('favourites');if(map[id])return goStage(map[id]);message.textContent='That section is available in the full Studio.';}
 function openMatrix(selection){
  read();selection=selection||Object.values(project.selections||{}).find(Boolean)||target(0,'I','facet',181);
  if(typeof showMatrix==='function')showMatrix(project,selection,{stage,example});
  else root.dispatchEvent(new CustomEvent('aura-sample-matrix',{bubbles:true,detail:{project,selection,stage,example}}));
 }
 function renderTravel(){
  const existing=travelEntries(project)[0]||context?.stageDefaults?.travel||null;
  tripForm(body,{entry:existing,onSave:values=>{mutate(p=>saveTrip(p,values,existing?.id?existing:null));message.textContent='Travel example saved in this sample.';}});
 }
 function render(){
  if(disposed)return;native?.dispose();native=null;read();draft=null;preview=null;body.replaceChildren();title.textContent=LABELS[stage];choice.value=stage;updateSummary();
  if(stage==='family'){native=mountLife({screen:body,go,section:LIFE_SECTIONS.find(s=>s.key==='family')});return;}
  if(stage==='favourites')renderFavourites();else if(stage==='travel')renderTravel();else if(stage==='allocate'){if(!tableId)tableId=project.tables.find(t=>pendingRows(project,t).length)?.id||project.tables[0]?.id||'';renderAllocation();}else renderGuided();
 }
   function field(label,input){const n=make('label','quick-field');n.append(make('span','',label),input);return n;}
  function select(label,items,value,onchange){const n=make('select');n.setAttribute('aria-label',label);for(const [v,t]of items){const o=make('option','',t);o.value=v;n.append(o);}n.value=value;n.onchange=onchange;return n;}
  function input(label,value,type='text'){const n=make('input');n.type=type;n.value=value;n.setAttribute('aria-label',label);return n;}
  function stepArt(step,label){
    const paths=['M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z','M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 22v-3a8 8 0 0 1 16 0v3','M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21v-3a6 6 0 0 1 12 0v3m1-8a6 6 0 0 1 7 5v3','m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z','M6 10a6 6 0 0 1 12 0v5l2 3H4l2-3v-5Zm4 11h4','M12 21S2 15 2 8a5 5 0 0 1 10-2A5 5 0 0 1 22 8c0 7-10 13-10 13Z','M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3V4Zm9 2v15','M5 22V3m0 1h14l-3 5 3 5H5','M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c-6 5-6 15 0 20 6-5 6-15 0-20ZM2 12h20','M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h6v6h-6v-6M9 6h6M6 9v6m12-6v6M9 18h6'];
    const hero=make('div','quick-step-hero'),art=make('div','quick-step-art');art.setAttribute('aria-hidden','true');
    art.innerHTML=`<svg viewBox="0 0 160 160"><circle class="step-orbit" cx="80" cy="80" r="70"/><circle class="step-orbit inner" cx="80" cy="80" r="55"/><circle class="step-spark" cx="127" cy="28" r="4"/><circle class="step-spark" cx="25" cy="112" r="2"/><g transform="translate(52 52) scale(2.33)" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[step]||paths[0]}"/></g></svg>`;
    hero.append(art,make('h3','',label));return hero;
  }
  function renderFavourites(){
    const form=make('form','quick-welcome'),groups=[];
    for(const [key,label,category]of [['favourites-value','A value that matters to you','Value'],['favourites-experience','An experience you enjoy','Experience'],['favourites-item','Something you love','Book']]){
      const ref=project.quickStart.entries?.[key]||(key==='favourites-item'?project.quickStart.entries?.favourites:null),table=project.tables.find(t=>t.id===ref?.tableId),row=table?.rows.find(r=>r.id===ref?.id),values=row?Object.fromEntries(table.columns.map((c,i)=>[c,row.values[i]])):{};
      const title=input(label,values.Title||''),meaning=input('What resonates: '+label,values['What resonates']||''),type=key==='favourites-item'?select('Favourite category',['Book','Music','TV','Film','Game','Place','Experience','Value','Virtue','Emotion','Sensation'].map(v=>[v,v]),values.Category||category,()=>{}):null;
      form.append(make('h3','',label),field(label,title));if(type)form.append(field('Category',type));form.append(field('What makes it meaningful?',meaning));groups.push({key,title,meaning,type,category,ref:row?ref:null});
    }
    const save=()=>mutate(project=>{let next=project;for(const group of groups){if(!group.title.value.trim()){if(group.ref)throw Error('Keep a title for a saved favourite. Remove entries in the full section.');if(group.meaning.value.trim())throw Error('Give this favourite a title so its meaning can be saved.');continue;}const before=new Set(next.tables.filter(t=>t.recommendation==='inspiration').flatMap(t=>t.rows.map(r=>r.id)));next=saveSectionEntry(next,5,{Title:group.title.value.trim(),Category:group.type?.value||group.category,'What resonates':group.meaning.value.trim()},group.ref);const ref=group.ref||next.tables.filter(t=>t.recommendation==='inspiration').flatMap(t=>t.rows.map(r=>({tableId:t.id,id:r.id}))).find(r=>!before.has(r.id));next.quickStart.entries={...next.quickStart.entries,[group.key]:ref};}return next;});
    const submit=make('button','quick-primary','Save & continue');submit.type='submit';form.append(submit);registerDraft(form,save,()=>groups.some(g=>g.title.value.trim()));form.onsubmit=e=>{e.preventDefault();safely(()=>{draft.save();navigate(1);});};body.append(form);
  }
  function renderGuided(){
    const step=catalogue.steps[index],rec=catalogue.datasets.find(d=>d.id===step.datasets[0]);
    const form=make('form','quick-welcome'),controls=[];let rowId,defaults={},heading='';
    const sectionTable=project.tables.find(t=>t.id===project.quickStart.entries?.[step.id]?.tableId),sectionRow=sectionTable?.rows.find(r=>r.id===project.quickStart.entries[step.id].id),existing=sectionRow?{tableId:sectionTable.id,id:sectionRow.id}:null;
    function entry(column,label,type='text',options,required=true){
      const saved=existing?sectionTable:project.tables.find(t=>t.id==='quickstart-'+rec.id),row=existing?sectionRow:rowId&&saved?.rows.find(r=>r.id===rowId),section=AVATAR_SECTIONS.find(s=>s.steps.some(step=>step.fields.some(f=>f.id===column))),value=index===1&&section?avatarValues(project,section)[column]||'':column==='Birthday'&&existing?birthdayFor(project,existing)?.Date||'':row?.values[saved.columns.indexOf(column)]||'';
      if(options&&value&&!options.includes(value))options=[...options,value];
      const n=options?select(label,[['','Choose'],...options.map(v=>[v,v])],value,()=>{}):input(label,value,type);n.required=required;controls.push([column,n,required]);const wrap=field(label,n);form.append(wrap);return n;
    }
    if(index===0){rowId='my-birthday';defaults={Title:'My birthday'};entry('Person or subject','Name you want to use');entry('Date','Date of birth (optional)','date',null,false);entry('Place','Place of birth (optional)','text',null,false);entry('Meaning','A little about your background (optional)','text',null,false);}
    if(stage==='avatar'){form.append(make('h3','','Body details'));const height=entry('body-height','Height (cm)','number',null,false);height.min=.01;height.step='any';const weight=entry('body-weight','Weight (kg)','number',null,false);weight.min=.01;weight.step='any';form.append(make('h3','','Appearance and fit'));for(const f of [AVATAR_FIELDS[2],AVATAR_FIELDS[4],AVATAR_FIELDS[5]])entry(f.id,f.label,'text',f.options,false);form.append(make('h3','','Clothing sizes'));const group=AVATAR_SECTIONS[0].steps.find(s=>s.title==='Body and clothing details');for(const f of group.fields.filter(f=>f.id!=='body-weight'))entry(f.id,f.label,'text',null,false);form.append(make('p','quick-note',group.help));}
    if(index===2){entry('Title','Person’s name');entry('Relationship','Relationship to you');entry('Birthday','Birthday (optional)','date',null,false);entry('Notes','What would you like to remember? (optional)','text',null,false);}
    if(index===3){entry('Title','Event or milestone');entry('Date','Date','date');entry('Meaning','Why is this significant? (optional)','text',null,false);}
    if(index===4){entry('Title','Action to review');entry('Date','Start date','date');entry('Time','Time (optional)','time',null,false);entry('Repeat','Repeat','text',['None','Daily','Weekly','Monthly','Yearly'],false);entry('Instructions','What needs to happen? (optional)','text',null,false);}
    if(index===5){entry('Title','Favourite item');entry('Category','Category','text',['Book','Music','TV','Film','Game','Place','Experience','Value','Virtue','Emotion','Sensation']);}
    if(index===5)entry('What resonates','What do you love about it? (optional)','text',null,false);
    if(index===6){entry('Title','Skill you use or want to learn');entry('Practice','How could you practise? (optional)','text',null,false);entry('Evidence','What can you already do? (optional)','text',null,false);entry('Source','Learning source (optional)','text',null,false);}
    if(index===7){entry('Title','Goal');entry('Why it matters','Why it matters (optional)','text',null,false);entry('Next action','First action, if you have one (optional)','text',null,false);}
    if(index!==0&&!quickStage(stage)){const titles=['','Make it yours','Your people','A date to remember','A little reminder','Something you love','Keep growing','Your next goal'];const hero=stepArt(index,titles[index]);if(heading)hero.append(make('p','quick-guided-description',heading));form.prepend(hero);}
    const submit=make('button','quick-primary','Save & continue');submit.type='submit';form.append(submit);
    const save=()=>{const values={...defaults};for(const [column,n,required]of controls){if(required&&!n.value.trim())throw Error('Complete '+n.getAttribute('aria-label')+'.');if(n.type==='date'&&n.value&&!validBirthday(n.value))throw Error('Enter a valid date.');if(n.value||existing||index<2)values[column]=n.value.trim();}mutate(p=>{if(index===0)return saveQuickEntry(p,rec,values,rowId);if(index===1){let next=p;for(const section of AVATAR_SECTIONS)next=saveAvatar(next,section,values);return next;}const before=new Set(p.tables.flatMap(t=>t.rows.map(r=>r.id)));const next=saveSectionEntry(p,index,values,existing);const saved=existing||next.tables.filter(t=>t.recommendation===rec.id).flatMap(t=>t.rows.map(r=>({tableId:t.id,id:r.id}))).find(r=>!before.has(r.id));next.quickStart.entries={...next.quickStart.entries,[step.id]:saved};return next;});};
    registerDraft(form,save,()=>controls.some(([,n])=>n.value.trim()));
    form.onsubmit=e=>{e.preventDefault();safely(()=>{draft.save();navigate(1);});};body.append(form);
    const extras=make('div','quick-actions quick-step-extras');if(index>=2)extras.append(button('Save and add another',()=>safely(()=>{draft.save();mutate(p=>{delete p.quickStart.entries[step.id];return p;});render();message.textContent='Saved. Add the next item.';})));
    body.append(extras);
  }
  function renderAllocation(){
    body.append(stepArt(9,'Place it in your Aura'));
    const list=select('Table to allocate',[['','Choose a table'],...project.tables.map(t=>[t.id,t.name])],tableId,()=>{tableId=list.value;render();});body.append(field('Table to allocate',list));
    const table=selectedTable();if(!table){body.append(make('p','','Create or import a table on an earlier card first.'));return;}
    const remaining=make('p','quick-reasons');const updateRemaining=()=>{const t=selectedTable();remaining.textContent=`${t.rows.length} rows; ${pendingRows(project,t).length} not yet allocated. Suggested associations: ${t.chakraTags.map(n=>SHELLS[n][0]).join(', ')||'Choose your own'}.`;};updateRemaining();body.append(remaining);
    const shell=select('Destination chakra',[['','Choose a chakra'],...SHELLS.map(([n],i)=>[String(i),n])],'',clear),face=select('Destination side',[['','Choose a side'],['I','Inside'],['O','Outside']],'',clear),mode=select('Allocation layout',[['facets','Consecutive facets'],['stack','Steps in one outward stack']],'facets',clear),start=input('Starting facet',1,'number');start.min=1;start.max=288;start.oninput=clear;
    const titleColumn=select('Row title column',table.columns.map((c,i)=>[String(i),c]),'0',clear),settings=make('div','quick-settings');settings.append(field('Chakra',shell),field('Side',face),field('Layout',mode),field('Starting facet',start),field('Title column',titleColumn));body.append(settings);
    const explanation=make('p','quick-note','Facets wrap after 288, keeping extra rows as separate records. Stack steps append after existing layers. Repeating allocation adds only new rows. It does not publish records or run an agent.');body.append(explanation);
    const previewText=make('p','quick-preview'),commit=button('Allocate new rows',()=>safely(()=>{
      read();const options=optionsNow(),plan=allocationPlan(project,tableId,options);if(!preview||preview!==JSON.stringify({options,plan}))throw Error('The table or destination changed. Preview the allocation again.');
      mutate(p=>allocateTable(p,tableId,options));updateRemaining();commit.disabled=true;preview=null;message.textContent=`Allocated ${plan.length} rows. Tables and records are saved together.`;
      const open=button('View in Aura',()=>openMatrix(plan[0]?.target||target(options.shell,options.face,'facet',options.start)));previewText.replaceChildren(open);
    }));commit.disabled=true;
    function clear(){preview=null;commit.disabled=true;previewText.textContent='';}
    function optionsNow(){if(shell.value===''||face.value==='')throw Error('Choose a chakra and a side.');return {shell:+shell.value,face:face.value,mode:mode.value,start:+start.value,titleColumn:+titleColumn.value};}
    const previewButton=button('Preview allocation',()=>safely(()=>{read();const options=optionsNow(),plan=allocationPlan(project,tableId,options);preview=JSON.stringify({options,plan});previewText.textContent=plan.length?`${plan.length} new rows: ${plan.slice(0,3).map(p=>targetLabel(p.target)).join('; ')}${plan.length>3?' … through '+targetLabel(plan.at(-1).target):''}`:'All rows are already allocated.';commit.disabled=!plan.length;}));
    const actions=make('div','quick-actions');actions.append(previewButton,commit);body.append(actions,previewText);
  }

 render();
 return {get project(){return getProject();},get stage(){return stage;},reset(){replaceProject(fixture());render();},destroy(){disposed=true;native?.dispose();unsubscribe();root.replaceChildren();root.classList.remove('starter-host');}};
}

export function tripForm(container,{entry=null,onSave=()=>{},initialStatus='Want to go',brief=false}={}){
 const form=make('form','travel-form'),message=make('p','travel-message');message.setAttribute('role','status');const tabs=make('nav','travel-form-tabs');let pane='place';const groups={};
 const values=entry||{},place=make('div');groups.place=place;
 const destination=field(place,initialStatus==='Visited'?'Where have you travelled?':'Where do you want to travel?','text',values.Destination||values.Title||'');destination.required=true;destination.maxLength=200;
 const list=make('datalist');list.id='travel-choices-'+crypto.randomUUID();destination.setAttribute('list',list.id);place.append(list);travelSeed().then(data=>{if(!list.isConnected)return;for(const r of data.destinations){const o=make('option');o.value=r.name;list.append(o);}}).catch(e=>message.textContent=e.message);
 const status=make('select');status.setAttribute('aria-label','Travel status');for(const value of ['Visited','Want to go','Planned']){const o=make('option','',value);o.value=value;status.append(o);}status.value=values.Status||initialStatus;const sl=make('label');sl.append(make('span','','Travel status'),status);place.append(sl);
 const timing=make('div');groups.timing=timing;const start=field(timing,'Departure or visit date','date',values.Date||''),end=field(timing,'Return date (optional)','date',values['Return date']||'');
 const hemisphere=make('select');hemisphere.setAttribute('aria-label','Seasonal region');for(const [id,text]of [['','Choose seasonal region'],['north','Northern hemisphere'],['south','Southern hemisphere'],['local','Local wet / dry or mixed seasons']]){const o=make('option','',text);o.value=id;hemisphere.append(o);}hemisphere.value=values.Hemisphere||'';const hl=make('label');hl.append(make('span','','Seasonal region'),hemisphere);timing.append(hl);
 const notes=make('div');groups.notes=notes;const season=field(notes,'Preferred season or local conditions','text',values['Preferred season']||''),astrology=field(notes,'Astrology notes or preferred timing','text',values['Astrology notes']||''),purpose=field(notes,'What would you like to do there?','text',values.Purpose||'');
 if(!brief){for(const [id,label]of [['place','Place'],['timing','Dates'],['notes','Intentions']]){const b=button(label,()=>{pane=id;render();});b.dataset.pane=id;tabs.append(b);}form.append(tabs);}
 form.append(place,timing,notes);function render(){Object.entries(groups).forEach(([id,g])=>g.hidden=id!==pane);for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.pane===pane));}render();
 const save=make('button','travel-primary','Save place');save.type='submit';form.append(save,message);container.append(form);
 form.onsubmit=e=>{e.preventDefault();try{if(!form.reportValidity())return;const fields={Destination:destination.value,Status:status.value,Date:start.value,'Return date':end.value,Hemisphere:hemisphere.value,'Preferred season':season.value,'Astrology notes':astrology.value,Purpose:purpose.value};onSave(fields);message.textContent='Saved in this sample travel list and Aura tables.';}catch(e){message.textContent=e.message;}};
 return form;
}
