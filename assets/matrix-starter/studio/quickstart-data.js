import {saveLife} from './life-data.js?v=0.4.26';
import {saveTiming} from './timing-data.js?v=0.4.26';
import {allocateTable,pendingRows} from './dataset-allocation.js?v=0.4.26';

export const QUICK_SECTIONS=[
 {label:'Birthdays',intro:'Add a birthday, its context and any reminder preferences.'},
 {label:'Avatar creation',intro:'Choose how your avatar represents you.'},
 {label:'Family & belonging',intro:'Add someone who matters to you and describe your relationship.'},
 {label:'Milestones & goals',intro:'Record an event you want to remember or progress towards a goal.'},
 {label:'Timing and signals',intro:'Add an action, choose when to review it and set any repeat pattern.'},
 {label:'My favourites',intro:'Choose something you enjoy or value. Describe what resonates with you.'},
 {label:'Learning & skills',intro:'Name a skill and how you would like to practise it.'},
 {label:'Life goals',intro:'Describe a goal, why it matters and an action you could take.'},
 {label:'Travel plans',intro:'Save a place you have visited or would like to visit.'},
 {label:'Matrix',intro:'Your entries are already saved. Placement is optional: it gives them an address in your Aura. Choose a chakra perspective, inside or outside, and a starting facet. Preview before placing. A stack keeps several entries at one facet in order.'}
];
// Keep saved step indexes stable while presenting existing segments in batches.
export const QUICK_ORDER=[0,1,9,5,2,6,7,3,4,8];
export const QUICK_JOURNEY=[
 {id:'birthday',index:0,title:'Your profile',group:'Personal details',intro:'Choose the name your Aura uses. Add your birthday and a little about yourself.'},
 {id:'avatar-photos',index:1,title:'Avatar photographs',group:'Avatar references',destination:'FFF3392C-C4CD-452E-9121-EC51530743CD',label:'Avatar photographs',intro:'Add 1 to 10 photographs. Different angles and poses help map your face, proportions and movement.'},
 {id:'avatar',index:1,title:'Your body and avatar',group:'Body and appearance',intro:'Add your measurements and preferred fit to help your avatar represent you.'},
 {id:'aura-dimensions',index:1,title:'Your Aura dimensions',group:'Aura',destination:'EB351F52-5B46-44B7-8014-8F7193AA2DAA',label:'Aura dimensions and personal space',intro:'Set how far each layer extends around you. Drag the view or pinch to zoom.'},
 {id:'aura-setup',index:9,title:'Aura Glow-Up',group:'Aura',destination:'aura-glow-up',label:'Aura Glow-Up',intro:'Shape a living field around your avatar. Choose a form, then adjust its detail and flow.'},
 {id:'favourites',index:5,title:'What matters to you',group:'Values, favourites and lived experience',intro:'Share a value, an experience and something you love. Add what makes each meaningful.'},
 {id:'social-preferences',index:2,title:'Friendships',group:'Social preferences',destination:'76172966-3F90-4DB8-A914-4E63AE19A501',label:'Friendships',intro:'Describe the friendships you welcome and how you like to keep in touch.'},
 {id:'dating',index:2,title:'Dating',group:'Social preferences',destination:'1FA4EBEC-3D1A-482A-B3B2-35A1172BECB6',label:'Dating preferences',intro:'Say who you would like to meet, what you are open to and what feels comfortable. Optional, for adults 18+.'}
];
export const QUICK_ROUTES=[...QUICK_JOURNEY.map(s=>s.id),'ready','skills','goals','dates','timing','travel'];
export function quickStage(id){return QUICK_JOURNEY.find(s=>s.id===id);}
export const SETUP_TABLES=['quickstart-life-events','quickstart-body','avatar-profile-photos','avatar-boundaries','aura-personal-space-shells','quickstart-inspiration','quickstart-relationships'];
export function connectSetupEntries(project){
 let next=structuredClone(project);const starts=Array(7).fill(1);
 for(const table of next.tables.filter(t=>SETUP_TABLES.includes(t.id))){const count=pendingRows(next,table).length;if(!count)continue;const shell=table.recommendation==='inspiration'?1:table.recommendation==='relationships'?3:0;
  // Facets retain the table and row references. Local photo bytes stay in the
  // source dataset, rather than being copied into a web-link asset field.
  const sourceTables=next.tables,source=structuredClone(next),photoTable=source.tables.find(t=>t.id===table.id);
  if(table.id==='avatar-profile-photos'){const asset=photoTable.columns.indexOf('Asset');if(asset>=0){photoTable.columns.splice(asset,1);for(const row of photoTable.rows)row.values.splice(asset,1);}}
  next=allocateTable(source,table.id,{shell,face:'I',mode:'facets',start:starts[shell],titleColumn:Math.max(0,photoTable.columns.indexOf('Title'))});next.tables=sourceTables;starts[shell]=(starts[shell]+count-1)%288+1;
 }
 return next;
}
export const QUICK_BATCHES={0:'Personal details',1:'Body, avatar and Aura',5:'Values, favourites and lived experience',2:'People and connections',6:'Learning and intentions',7:'Learning and intentions',3:'Everyday life and timing',4:'Everyday life and timing',8:'Places and travel',9:'Organise your data'};
export const AVATAR_LINKS=[
 ['Height and reach','82556099-54EF-41B6-84DF-0A02B82C3CC5'],
 ['Shoulders and arm span','8EEAE4F6-2A46-4447-A9B7-EBE9C528D2C8'],
 ['Eyes and spacing','C6AFC90C-3BCB-4CFE-A0A8-2A59A175ED46'],
 ['Aura dimensions and personal space','EB351F52-5B46-44B7-8014-8F7193AA2DAA'],
 ['Aura Glow-Up','aura-glow-up']
];

// Use the full sections' writers so a quick entry behaves like a section entry.
export function saveSectionEntry(project,index,values,existing=null){
 if([2,5,7].includes(index))return saveLife(project,{2:'family',5:'favourites',7:'goals'}[index],values,existing);
 if([3,4,6].includes(index))return saveTiming(project,{3:'milestones',4:'schedules',6:'learning'}[index],values,existing);
 throw Error('This step has its own saving form.');
}
