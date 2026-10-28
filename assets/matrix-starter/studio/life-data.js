import {validateProject,parseCSV} from '../../matrix-studio/core.js?v=0.4.26';
import {dateValid} from './travel-data.js?v=0.4.26';
export const SOCIAL_HOME='0CEE0A43-6ED5-4A00-A522-6C18F90ECD2B';
const group=(name,icon,prompts)=>({name,icon,prompts:prompts.split('|')});
export const KINSHIP_TERMS=['Parent','Child','Sibling','Partner','Grandparent','Grandchild','Great-grandparent','Great-grandchild','Ancestor','Descendant','Cousin','Aunt','Uncle','Niece','Nephew','Step-parent','Step-child','Step-sibling','Parent-in-law','Sibling-in-law','Adoptive parent','Foster parent','Guardian','Chosen family','Kin','Friend','Mentor','Neighbour'];
export const FAMILY_STARTERS=[['Add a parent','Parent'],['Add a sibling','Sibling'],['Add a child','Child'],['Add a partner','Partner'],['Add chosen family','Chosen family'],['Add a grandparent','Grandparent'],['Add a grandchild','Grandchild'],['Add a cousin','Cousin'],['Add an aunt','Aunt'],['Add an uncle','Uncle'],['Add a niece','Niece'],['Add a nephew','Nephew'],['Add a great-grandparent','Great-grandparent'],['Add a great-grandchild','Great-grandchild'],['Add an earlier ancestor','Ancestor'],['Add a later descendant','Descendant'],['Add step-family','Step-sibling'],['Add family by marriage','Sibling-in-law'],['Add adoptive family','Adoptive parent'],['Add foster family','Foster parent'],['Add a guardian','Guardian'],['Use your own kinship term',''],['Add a trusted friend','Friend'],['Add a community connection','Kin']];
export const LIFE_SECTIONS=[
 {key:'family',id:'AE87688C-93C9-4AB1-A72D-A447ED56C5E0',title:'Family & belonging',image:'AB022E2843DD5DDE810CE5A68E5CE80A.png',intro:'The people, connections and occasions that matter.',recommendation:'relationships',tags:[0,3],groups:[
  group('Build Your Family Tree','people',FAMILY_STARTERS.map(([title])=>title).join('|')),
  group('Ceremonies for New Family','celebrate','Welcome a new baby|Celebrate a partnership|Welcome someone into the family|Plan a family reunion'),
  group('Keep in touch','talk','Make time for a regular call|Plan a shared meal|Remember a family tradition'),
  group('People who support me','heart','Add a trusted friend|Add a mentor|Add a neighbour')
 ]},
 {key:'favourites',id:'82791921-1F9A-4056-A0FE-B4385FD5377A',title:'My favourites',image:'2D0AAEEA1F543459C9F086DE92D76DCB.png',intro:'Collect what you love and what makes it meaningful.',recommendation:'inspiration',tags:[1,4,5],groups:[
  group('Values I Prefer','compass','Honesty|Kindness|Freedom|Fairness|Curiosity|Belonging'),group('Virtues I Prefer','spark','Patience|Courage|Generosity|Humility|Perseverance|Compassion'),
  group('Emotions I Prefer','heart','Joy|Calm|Wonder|Gratitude|Hope|Connection'),group('Sensations I Prefer','sun','Ocean breeze|Warm sunshine|Soft textures|Favourite scents|Gentle sounds|Movement'),
  group('Experiences I Enjoy','celebrate','Sharing a meal|Making something|Walking outdoors|Live music|Quiet reflection|Helping someone'),group('Books, Music, TV, Film, Games I Enjoy','book','A book worth revisiting|A song for my day|A favourite film|A series I love|A game to share|A favourite creator'),group('Places I Love','place','A peaceful place|A childhood place|A gathering place|A place in nature|A favourite cafe|A place to return to')
 ]},
 {key:'wishes',id:'4EE0FBBC-65BF-49B1-9D77-7022C1FD6E1D',title:'My wish lists',image:'1105A4F5B166469A25DB500CDC00E28C.png',intro:'Give each wish a reason, a possibility and a first step.',recommendation:'goals',tags:[1,2,6],groups:[
  group('Project Specific Wish Lists','build','A tool for my project|Someone to collaborate with|A space to create'),group('Themed Wish Lists','spark','A creative collection|A seasonal wish|A meaningful gift'),group('Relationship Wish Lists','heart','More time together|A shared tradition|An experience to share'),group('Travel Wish Lists','place','A destination to explore|A journey with someone|A different way to travel'),group('Lifestyle Wish Lists','sun','A calmer morning|More outdoor time|A more balanced week'),group('Learning Wish Lists','book','A subject to explore|A course to try|A teacher to learn from'),group('Home Wish Lists','home','A cosy reading corner|A growing space|A repair or improvement')
 ]},
 {key:'bucket',id:'A95C1B93-E697-4764-9F0D-D819C3B71AC1',title:'My bucket list',image:'0E97B46351CBE7901E2CB3A1198907F7.jpg',intro:'Turn someday experiences into memories.',recommendation:'goals',tags:[1,2,6],groups:[
  group('Places to Visit','place','See a natural wonder|Visit an island|Explore a new country'),group('People to Meet','people','Meet a creative inspiration|Reconnect with an old friend|Meet a community elder'),group('Activities to Try','sun','Try a water activity|Make something by hand|Take an outdoor adventure'),group('Events to Attend','celebrate','Experience a festival|Attend a live performance|Join a community celebration'),group('Skills to Master','book','Learn an instrument|Speak another language|Master a practical craft'),group('Things to Create','build','Write a story|Make a film|Build something useful'),group('Out of the Box Thinking','spark','Combine two interests|Try a new way of living|Imagine an unexpected adventure')
 ]},
 {key:'goals',id:'E933DDB8-9FDE-445A-97A0-686C17B77380',title:'Life goals',image:'86B0ADA6055984BBBE033B37BAFCB445.png',intro:'Connect purpose with milestones and everyday action.',recommendation:'goals',tags:[2,3,6],groups:[
  group('Research Goals','compass','Explore a question|Test an idea|Share what I discover'),group('Performance Goals','spark','Prepare a performance|Improve a personal best|Practise consistently'),group('Leadership Goals','people','Mentor someone|Build a team|Lead a shared project'),group('Public Service Goals','heart','Support a community cause|Volunteer a skill|Improve a shared space'),group('Milestone Quantities','steps','Complete a number of sessions|Reach a savings milestone|Create a collection'),group('Experiences I Wish to Try','sun','Try something outside my routine|Make a meaningful memory|Share a new experience'),group('Places I Wish to Visit','place','Plan my next destination|Explore closer to home|Make a long-term travel plan')
 ]}
];
const moreIdeas={
 'Ceremonies for New Family':'Mark an adoption|Celebrate a family anniversary',
 'Keep in touch':'Share family news|Arrange a visit|Start a regular family activity',
 'People who support me':'Add someone I care for|Add a community connection|Add a long-distance friend',
 'Project Specific Wish Lists':'Materials to get started|Funding for a project|Time to finish a project',
 'Themed Wish Lists':'A wellbeing collection|A nature-inspired wish|A shared family wish list',
 'Relationship Wish Lists':'Learn something together|Reconnect with someone|Create a keepsake together',
 'Travel Wish Lists':'A slow journey|A meaningful return visit|An accessible travel experience',
 'Lifestyle Wish Lists':'Make time for friends|Simplify a daily task|Create a restful evening',
 'Learning Wish Lists':'A language to learn|A practical skill to try|A book or resource to study',
 'Home Wish Lists':'A shared cooking space|A more accessible room|A place for creative work',
 'Places to Visit':'Explore a national park|Discover a historic place|Return to a meaningful place',
 'People to Meet':'Find a future collaborator|Meet distant family|Learn from a skilled maker',
 'Activities to Try':'Cook something unfamiliar|Try an accessible outdoor experience|Spend a night under the stars',
 'Events to Attend':'See a sporting event|Join a learning gathering|Celebrate a local tradition',
 'Skills to Master':'Learn to grow food|Develop a creative skill|Master a digital tool',
 'Things to Create':'Record family memories|Make a community project|Create a garden',
 'Out of the Box Thinking':'Explore a surprising collaboration|Design an unusual experiment|Reimagine a familiar place',
 'Research Goals':'Document a local story|Compare different approaches|Create a useful knowledge collection',
 'Performance Goals':'Finish a creative work|Develop confidence in a skill|Share work with an audience',
 'Leadership Goals':'Organise a gathering|Help others learn|Support a group decision',
 'Public Service Goals':'Make information easier to access|Care for a local place|Build something others can use',
 'Milestone Quantities':'Reach a practice-hours target|Finish a reading target|Reach a community contribution target',
 'Experiences I Wish to Try':'Learn through making|Spend time in a new environment|Take part in a shared challenge',
 'Places I Wish to Visit':'Visit someone important|Explore a place for learning|Find a place to rest and reflect'
};
for(const s of LIFE_SECTIONS)for(const g of s.groups)if(moreIdeas[g.name])g.prompts.push(...moreIdeas[g.name].split('|'));
// Keep the original category names and saved row identities when combining lists.
const wishes=LIFE_SECTIONS.find(s=>s.key==='wishes'),bucket=LIFE_SECTIONS.find(s=>s.key==='bucket');
wishes.title='Wishes & bucket list';wishes.intro='Things you hope for, places to go and experiences to try.';wishes.groups.push(...bucket.groups);
LIFE_SECTIONS[LIFE_SECTIONS.indexOf(bucket)]={key:'achievements',id:bucket.id,title:'Achievements & memories',image:'A95C1B93E69747649F0DD819C3B71AC1.svg',intro:'What you have done, where you have been and what you have learnt.',recommendation:'life-events',tags:[2,3,5],groups:[
 group('Achievements & accomplishments','spark','Something I am proud of|A project I completed|A qualification I earned|A challenge I overcame|A contribution I made|A personal milestone'),
 group('Places I have lived','home','My childhood home|A town I lived in|A country I called home|A temporary home|A shared household|A place I returned to'),
 group('Places I have visited','place','A country I visited|An island I explored|A memorable local place|A journey I took|A place I visited with family|A place I would revisit'),
 group('Skills & lessons learnt','book','A skill I developed|A lesson from experience|Something I learnt from someone|A practice I mastered|A new perspective|Knowledge I shared'),
 group('Experiences & memories','heart','A meaningful celebration|A shared adventure|A moment of kindness|An event I attended|A family memory|A turning point'),
 group('Work & contributions','people','A role I held|A team I helped|A community contribution|Something I created|Someone I supported|A project we delivered')
]};
export const LIFE_PAGES=Object.fromEntries(LIFE_SECTIONS.map(s=>[s.id,s]));
export const lifeRows=p=>p.tables.flatMap(t=>t.rows.map(r=>({...Object.fromEntries(t.columns.map((c,i)=>[c,r.values[i]])),tableId:t.id,id:r.id,recommendation:t.recommendation})));
export function entriesFor(p,key){const s=LIFE_SECTIONS.find(s=>s.key===(key==='bucket'?'wishes':key));return lifeRows(p).filter(r=>s.key==='family'?r.recommendation==='relationships'||r.recommendation==='ceremonies'&&r.Collection==='family':r.recommendation===s.recommendation&&(s.key==='favourites'||(s.key==='wishes'?['wishes','bucket'].includes(r.Collection):(r.Collection||'goals')===s.key)));}
export function categoryFor(row,s){
 if(s.groups.some(g=>g.name===row.Category))return row.Category;
 if(s.key==='family')return row.recommendation==='ceremonies'?s.groups[1].name:s.groups[0].name;
 if(s.key==='favourites'){const x=(row.Category||'').toLowerCase();const index=/virtue/.test(x)?1:/emotion/.test(x)?2:/sensation/.test(x)?3:/experience/.test(x)?4:/book|music|tv|film|game/.test(x)?5:/place/.test(x)?6:/value/.test(x)?0:-1;return index<0?'Other':s.groups[index].name;}
 return 'Other';
}
export const rowRef=r=>JSON.stringify([r.tableId,r.id]);
// A graph of user-described ties, not a fixed family hierarchy. Old single ties
// remain readable and are only migrated when the person saves their changes.
export function familyLinks(row){
 if(row['Family links']){const links=JSON.parse(row['Family links']);if(!Array.isArray(links))throw Error('Family connections must be a list.');return links.map(l=>{if(!l||typeof l.person!=='string'||!l.person||['term','meaning','reciprocal'].some(k=>l[k]!==undefined&&typeof l[k]!=='string'))throw Error('Invalid family connection.');return {person:l.person,term:l.term||'',meaning:l.meaning||'',reciprocal:l.reciprocal||''};});}
 return row['Connected person']?[{person:row['Connected person'],term:row.Connection||'',meaning:'',reciprocal:''}]:[];
}
export function familyNeighbours(people,person){const ref=rowRef(person),found=new Map();for(const owner of people)for(const link of familyLinks(owner)){if(rowRef(owner)!==ref&&link.person!==ref)continue;const other=people.find(r=>rowRef(r)===(rowRef(owner)===ref?link.person:rowRef(owner)));if(!other)continue;const key=rowRef(other),label=rowRef(owner)===ref?`${person.Title} ${link.term||'connected to'} ${other.Title}`:link.reciprocal?`${person.Title} ${link.reciprocal} ${other.Title}`:`${owner.Title} ${link.term||'connected to'} ${person.Title}`;if(!found.has(key))found.set(key,{person:other,labels:[]});found.get(key).labels.push(label);}return [...found.values()];}
export function birthdayFor(p,r){return lifeRows(p).find(b=>b.recommendation==='life-events'&&(b['Source entry']===rowRef(r)||b.id===r.id+'-birthday'));}
export function progressOf(r){const target=Number(r.Target),value=Number(r.Value);return r.Status==='Done'?100:r.Target&&target>0&&r.Value!==''&&Number.isFinite(value)?Math.min(100,Math.max(0,value/target*100)):null;}
function upsert(p,rec,fields,existing,tableId,tags){
 let t=p.tables.find(t=>t.id===(existing?.tableId||tableId));
 if(!t){if(existing)throw Error('This table is no longer available.');const columns={relationships:['Title','Relationship','Shared context','Important date','Notes'],inspiration:['Title','Category','What resonates','Asset','Possible use'],goals:['Title','Why it matters','Next action','Target date','Status'],'life-events':['Title','Person or subject','Date','Place','Meaning','Asset'],ceremonies:['Title','Date or season','People','Meaning','Place','Instructions']}[rec]||['Title'];t={id:tableId,name:rec==='relationships'?'People and family':rec==='inspiration'?'Favourites':rec==='life-events'?'Life events and memories':rec==='ceremonies'?'Family occasions':'Goals, wishes and experiences',category:rec==='relationships'?'people':rec==='life-events'||rec==='ceremonies'?'time':'intent',recommendation:rec,columns,rows:[],chakraTags:tags};p.tables.push(t);}
 let row=existing&&t.rows.find(r=>r.id===existing.id);if(existing&&!row)throw Error('This entry is no longer available.');
 for(const k of Object.keys(fields)){if(['__proto__','constructor','prototype','id','tableId','recommendation'].includes(k))throw Error('Invalid field.');if(!t.columns.includes(k)){t.columns.push(k);t.rows.forEach(r=>r.values.push(''));}}
 if(!row){row={id:crypto.randomUUID(),values:t.columns.map(()=> '')};t.rows.push(row);}
 for(const [k,v]of Object.entries(fields))row.values[t.columns.indexOf(k)]=String(v??'');
 return {id:row.id,tableId:t.id};
}
export function saveLife(project,key,values,existing=null){
 if(key==='bucket')key='wishes';
 const s=LIFE_SECTIONS.find(s=>s.key===key);if(!s)throw Error('Unknown collection.');
 if(!String(values.Title||'').trim())throw Error(key==='family'?'Enter a name or occasion.':'Give this entry a title.');
 for(const k of ['Birthday','Date','End date','Target date','Review date'])if(values[k]&&!dateValid(values[k]))throw Error('Enter a valid '+k.toLowerCase()+'.');
 if(values.Date&&values['End date']&&values['End date']<values.Date)throw Error('The end date must follow the start date.');
 if(values.Time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.Time))throw Error('Enter a valid time.');
 for(const k of ['Budget','Value','Target','Reminder minutes'])if(values[k]!==undefined&&values[k]!==''&&(!Number.isFinite(Number(values[k]))||+values[k]<0))throw Error('Use a non-negative number for '+k.toLowerCase()+'.');
 if(values.Target!==undefined&&values.Target!==''&&+values.Target===0)throw Error('The progress target must be greater than zero.');
 if(values.Asset&&!/^https?:\/\//i.test(values.Asset))throw Error('Use a complete https:// or http:// link.');
 if(existing&&!entriesFor(project,key).some(r=>r.id===existing.id&&r.tableId===existing.tableId))throw Error('This entry is no longer in this collection.');
 const p=structuredClone(project),fields={...values,Title:values.Title.trim(),Collection:key},birthday=fields.Birthday;delete fields.Birthday;
 if(key==='achievements'){fields.Status='Done';fields['Event kind']='Memory';}
 if(key==='family'&&fields['Family links']!==undefined){
  const links=familyLinks(fields),people=entriesFor(p,'family').filter(r=>r.recommendation==='relationships');
  for(const link of links){if(!people.some(r=>rowRef(r)===link.person))throw Error('Choose an available person for each connection.');if(existing&&link.person===rowRef(existing))throw Error('Choose another person to connect to.');}
  fields['Family links']=JSON.stringify(links);fields['Connected person']=links[0]?.person||'';fields.Connection=links[0]?.term||'';
 }
 if(fields['Connected person']){const linked=entriesFor(p,'family').find(r=>r.recommendation==='relationships'&&rowRef(r)===fields['Connected person']);if(!linked)throw Error('Choose an available family member.');if(existing&&rowRef(existing)===fields['Connected person'])throw Error('Choose another person to connect to.');}
 const occasion=key==='family'&&fields.Category===s.groups[1].name;
 if(existing&&key==='family'&&(p.tables.find(t=>t.id===existing.tableId).recommendation==='ceremonies')!==occasion)throw Error('Keep people and occasions as separate entries. Add a new entry in the other category.');
 const rec=existing?p.tables.find(t=>t.id===existing.tableId).recommendation:occasion?'ceremonies':s.recommendation;
 const saved=upsert(p,rec,fields,existing,'quickstart-'+rec,s.tags);
 if(key==='family'&&birthday!==undefined&&!occasion){
  const old=birthdayFor(p,saved);if(birthday||old)upsert(p,'life-events',{Title:'Birthday: '+fields.Title,'Person or subject':fields.Title,Date:birthday||'',Repeat:'Yearly','Event kind':'Birthday','Source entry':rowRef(saved),'Reminder minutes':fields['Reminder minutes']??old?.['Reminder minutes']??'',Enabled:birthday?'Yes':'No'},old||null,'quickstart-life-events',[0,3,6]);
 }
 return validateProject(p);
}
export function importLifePreview(text,key,category){
 const csv=parseCSV(text);if(!csv.headers.includes('Title'))throw Error('Include a Title column. Download the template for the available columns.');
 if(!csv.rows.length)throw Error('This CSV has no entries.');
 const rows=csv.rows.map(values=>({...Object.fromEntries(csv.headers.map((h,i)=>[h,values[i]||''])),Category:values[csv.headers.indexOf('Category')]||category}));
 return rows;
}
export function importLife(project,key,rows){let p=project;for(const row of rows)p=saveLife(p,key,row);return p;}
