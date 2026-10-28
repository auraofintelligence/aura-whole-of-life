/* Compact native-writer cards. Only cards/fields cycle; the Aura and result stay mounted. */
import {contexts} from './fixtures.js';

const text=(key,label,extra={})=>({key,label,type:'text',...extra});
const choice=(key,label,options)=>({key,label,type:'select',options:options.map(v=>Array.isArray(v)?{value:v[0],label:v[1]}:{value:v,label:v})});
const resonance=[text('Title','Name it'),text('What resonates','What makes it meaningful?',{type:'textarea',rows:2})];
const favouriteKinds=['Book','Music','TV','Film','Game','Place','Experience','Value','Virtue','Emotion','Sensation'];
const colours=['Red','Orange','Yellow','Green','Blue','Indigo','Violet'];

export const STAGE_FIELDS=Object.freeze({
  favourites:{stage:'favourites',label:'What matters to you',writer:{method:'saveSectionEntry',index:5},cards:[
    {key:'favourites-value',label:'A value you care about',facet:1,sourceIndex:0,fixed:{Category:'Value'},fields:resonance,resultLabel:'Your value and its meaning'},
    {key:'favourites-experience',label:'An experience you enjoy',facet:2,sourceIndex:1,fixed:{Category:'Experience'},fields:resonance,resultLabel:'Your experience and its meaning'},
    {key:'favourites-item',label:'Something you love',facet:3,sourceIndex:2,fields:[...resonance,choice('Category','What kind of thing?',favouriteKinds)],resultLabel:'Your chosen thing and its meaning'}
  ]},
  family:{stage:'family',label:'People who matter',writer:{method:'saveLife',key:'family'},cards:[
    {key:'person',label:'Someone in your life',facet:1,fields:[text('Title','Their name'),text('Relationship','Your word for the relationship')],resultLabel:'This person and your connection'},
    {key:'person-note',label:'What you want to remember',facet:1,fields:[text('Notes','A memory or useful detail',{type:'textarea',rows:2})],resultLabel:'The same person, with your note'}
  ]},
  skills:{stage:'skills',label:'Something to practise',writer:{method:'saveSectionEntry',index:6,refKey:'skills'},cards:[
    {key:'practice',label:'A useful skill',facet:1,fields:[text('Title','Something to practise'),text('Practice','How would you try it?')],resultLabel:'Your skill and practice idea'},
    {key:'practice-evidence',label:'Notice what changes',facet:1,fields:[text('Evidence','What would show progress?',{type:'textarea',rows:2}),text('Source','Where did the idea come from?')],resultLabel:'The same skill, with evidence and source'}
  ]},
  goals:{stage:'goals',label:'A next possibility',writer:{method:'saveSectionEntry',index:7,refKey:'goals'},cards:[
    {key:'goal',label:'Something you would like to do',facet:1,fields:[text('Title','What would you like to do?'),text('Why it matters','Why does it matter to you?')],resultLabel:'Your goal and its meaning'},
    {key:'goal-action',label:'A small first step',facet:1,fields:[text('Next action','What could you try first?',{type:'textarea',rows:2})],resultLabel:'The same goal, with a next step'}
  ]},
  dates:{stage:'dates',label:'A date to remember',writer:{method:'saveSectionEntry',index:3,refKey:'dates'},cards:[
    {key:'date',label:'A date to return to',facet:1,fields:[text('Title','What is the date for?'),text('Date','Which day?',{type:'date'})],resultLabel:'Your sample date'}
  ]},
  timing:{stage:'timing',label:'A time to return',writer:{method:'saveSectionEntry',index:4,refKey:'timing'},cards:[
    {key:'review-time',label:'Return to something useful',facet:1,fields:[text('Title','Something to review'),text('Date','Which day?',{type:'date'}),text('Time','What time?',{type:'time'})],resultLabel:'Your sample review time'},
    {key:'review-action',label:'What you want to do then',facet:1,fields:[text('Instructions','What would you like to do?',{type:'textarea',rows:2})],resultLabel:'The same review, with your next action'}
  ]},
  travel:{stage:'travel',label:'A place to explore',writer:{method:'saveTrip'},cards:[
    {key:'place',label:'A place that interests you',facet:1,fields:[text('Destination','Where would you like to go?'),text('Purpose','What draws you there?',{type:'textarea',rows:2})],resultLabel:'Your place and the reason it matters'},
    {key:'place-status',label:'Where it sits in your plans',facet:1,fields:[choice('Status','Your connection with this place',['Want to go','Planned','Visited']),text('Date','A day, if you have one',{type:'date',optional:true})],resultLabel:'The same place, with your chosen status'}
  ]},
  avatar:{stage:'avatar',label:'Your avatar choices',writer:{method:'saveAvatar',section:'preferences'},cards:[
    {key:'avatar-choice',label:'A look that suits you',facet:1,fields:[choice('avatar-answer-4','Clothing fit',['Fitted','Regular','Loose','Varies by activity','Prefer not to say']),choice('avatar-answer-3','Details to include',['Tattoos','Piercings','Both','Neither','Decide later','Prefer not to say'])],resultLabel:'Your recorded avatar preferences'}
  ]},
  allocate:{stage:'allocate',label:'Place three sample records',writer:{method:'allocateTable'},cards:[
    {key:'destination',label:'Choose a colour and a side',facet:1,fields:[choice('shell','Colour',colours.map((n,i)=>[String(i),n])),choice('face','Side',[['I','Inside'],['O','Outside']])],resultLabel:'The selected colour and side'},
    {key:'record-order',label:'How the records sit together',facet:1,fields:[choice('mode','Record layout',[['stack','Three ordered layers'],['facets','Three neighbouring facets']])],resultLabel:'Three source-linked sample records'}
  ]}
});

function resolveContext(context){return typeof context==='string'?(contexts[context]||contexts.memory):context?.stageDefaults?context:contexts.memory;}
function stageKey(stage){return stage==='allocation'?'allocate':Object.hasOwn(STAGE_FIELDS,stage)?stage:'favourites';}

export function getFixtureDefaults(stage,context){
  const key=stageKey(stage),c=resolveContext(context);
  if(key==='allocate')return {shell:String(c.entryPoints?.shell??0),face:c.entryPoints?.face||'I',mode:'stack',start:1,titleColumn:0,tableId:c.entryPoints?.practiceTableId};
  return structuredClone(c.stageDefaults[key]||(key==='favourites'?[]:{}));
}

export function getStepCards(stage,context){
  const key=stageKey(stage),config=STAGE_FIELDS[key],defaults=getFixtureDefaults(key,context);
  return config.cards.map((card,index)=>{
    const values={...(key==='favourites'?defaults[card.sourceIndex]:defaults),...(card.fixed||{})};
    return {...card,stage:key,index,count:config.cards.length,writer:{...config.writer,refKey:key==='favourites'?card.key:config.writer.refKey||key},values,
      fields:card.fields.map(f=>({...f,options:f.options?.map(o=>({...o})),value:values[f.key]??''})),
      output:{facet:card.facet,kind:'facet',label:card.resultLabel,sameRecord:key!=='favourites',stayMounted:true}};
  });
}

/* Merge edits into the full native row; cycling a card never drops hidden source fields. */
export function mergeCardValues(card,currentValues,edits){
  const allowed=new Set(card.fields.map(f=>f.key));
  const patch=Object.fromEntries(Object.entries(edits).filter(([key])=>allowed.has(key)));
  const values={...card.values,...currentValues,...patch,...(card.fixed||{})};
  if(card.stage==='allocate')return {...values,shell:Number(values.shell),start:1,titleColumn:0};
  return values;
}

export const INSTANT_LAYOUT=Object.freeze({
  persistentTool:true,initialFacet:1,defaultCard:0,cycle:'text cards only',
  desktop:'fields beside Aura; selected record directly below the Aura',
  mobile:'compact Aura above the current card; selected record beside the fields where space permits',
  mobilePreviewHeight:150,maxVisibleFields:3,
  directFacetSelection:'favourites facets 1/2/3 choose Value/Experience/Thing; other stages keep one record at facet 1',
  nativeUpdate:'Keep native table/row identity and synchronise its existing facet record after every valid edit. allocateTable alone does not refresh already allocated rows.',
  allocationUpdate:'Preview/recompute from this activity’s unallocated baseline; never append three more rows on each input change.',
  validation:'Keep the last valid result visible and show a short field-level error until a valid native save is possible.'
});

export const INSTANT_QA=Object.freeze([
  {stage:'favourites',action:'At Value, change Title to Kindness and What resonates to I enjoy helping someone feel welcome. Next/Previous through Experience and Thing; select facets 1/2/3 directly.',expect:'Exactly three linked native favourite rows remain. Value is facet1, Experience2, Thing3; edits persist and the Aura/result never unmount. Only Thing has Category.'},
  {stage:'family',action:'Change the fictional name to River Example, then cycle to the note card and change Notes.',expect:'One native person row and facet1 record update in place; its stable identity and the existing fictional relationship link remain intact.'},
  {stage:'skills',action:'Change Title to Compare two captions. Cycle to evidence and enter A peer can identify the changed wording.',expect:'The same native learning row and facet1 show the new skill/evidence, preserving Practice and Source.'},
  {stage:'goals',action:'Enter Make a little model and then Try one cardboard room on the next-step card.',expect:'One native goal row/facet1 keeps Title, Why it matters and Next action together; no new goal is appended when cards change.'},
  {stage:'dates',action:'Change the fictional review date to 2026-11-09.',expect:'The same milestone row/facet1 shows the changed sample date; the fictional/proposed context remains.'},
  {stage:'timing',action:'Change Time to 11:30, cycle to Instructions and enter Compare the two sample notes.',expect:'The same schedule row/facet1 shows the time/action. Existing disabled/manual delivery and linked program are preserved; no notification is claimed.'},
  {stage:'travel',action:'Change Destination to Imagined Bay (fictional), then choose Want to go on the second card.',expect:'One native trip row/facet1 shows the place, purpose and status. No booking, route verification or geocoding is implied.'},
  {stage:'avatar',action:'Change Clothing fit from Loose to Regular and Details to include to Decide later.',expect:'Actual avatar-answer-4 and avatar-answer-3 native rows update; the single facet1 preference record shows both choices, without a body-measurement or reconstruction claim.'},
  {stage:'allocate',action:'Choose Blue/Inside, then Three ordered layers; change to neighbouring facets and back.',expect:'Three practice rows appear at/starting from facet1 using actual allocation. Recompute from the activity baseline: changing layout does not accumulate duplicate records. Source-row IDs remain attached.'}
]);
