/* Fixed fictional visual fixtures. No network, storage, uploads, sensors or model calls. */
(function (host) {
  'use strict';
  const fixtures = {
    kitchen: {object:'Dish rack',title:'Making room on the bench',metric:'Clear bench · cm',times:['09:00','09:05','09:10'],values:[34,41,46],trial:[34,45,52],unit:'cm',left:'Beside sink',right:'Turned sideways',share:'Our bench layout idea',cards:['Layout photo','Bench readings','Personal note'],place:'Kitchen',colour:'#7654bb'},
    garden: {object:'Balcony planter',title:'Which corner gets the light?',metric:'Shaded pots · count',times:['10:00','12:00','14:00'],values:[2,1,3],trial:[2,2,1],unit:'pots',left:'Corner A',right:'Corner B',share:'Balcony observation notes',cards:['Planter photo','Shade count','Personal note'],place:'Balcony',colour:'#7654bb'},
    fermentation: {object:'Labelled jar',title:'Keeping this jar’s story together',metric:'Dated photos · count',times:['Monday','Wednesday','Friday'],values:[1,2,3],trial:[1,3,4],unit:'photos',left:'Small label',right:'Larger label',share:'Jar labels and photo log',cards:['Jar photo','Photo log','Personal note'],place:'Bench',colour:'#7654bb'},
    event: {object:'Folding chairs',title:'Making space for another neighbour',metric:'Chairs placed · count',times:['15:00','15:10','15:20'],values:[8,9,10],trial:[8,10,12],unit:'chairs',left:'Rows',right:'Small groups',share:'Community afternoon layout',cards:['Layout sketch','Chair count','Personal note'],place:'Community room',colour:'#7654bb'},
    memory: {object:'Photo box',title:'The afternoon at Nan’s place',metric:'Chosen captions · count',times:['First pass','Second pass','Third pass'],values:[1,2,3],trial:[1,3,4],unit:'captions',left:'Date first',right:'People and stories',share:'Three memories I chose',cards:['Chosen photo','Caption list','Personal note'],place:'Sitting room',colour:'#7654bb'},
    travel: {object:'Day bag',title:'What comes on the day trip?',metric:'Items listed · count',times:['08:00','08:10','08:20'],values:[7,6,5],trial:[7,5,4],unit:'items',left:'Full list',right:'Selected essentials',share:'An example day-trip list',cards:['Bag photo','Packing list','Personal note'],place:'Trip planning desk',colour:'#7654bb'},
    creative: {object:'Cardboard world',title:'A little world worth exploring',metric:'Scenes made · count',times:['Version 1','Version 2','Version 3'],values:[2,3,4],trial:[2,4,5],unit:'scenes',left:'Straight path',right:'Branching paths',share:'Our cardboard-world storyboard',cards:['Model photo','Scene list','Personal note'],place:'Creative desk',colour:'#7654bb'}
  };
  const contexts = [
    {key:'kitchen',label:'On the bench',record:'Making room on the bench',anchor:'Dish rack',vector:[0.82,0.21,0.35,0.16],note:'Move the rack; keep the photo and readings together.'},
    {key:'event',label:'At the afternoon',record:'Making space for another neighbour',anchor:'Folding chairs',vector:[0.34,0.84,0.56,0.25],note:'Add a place at the table; keep the layout with the plan.'},
    {key:'memory',label:'In a family story',record:'The afternoon at Nan’s place',anchor:'Photo box',vector:[0.22,0.42,0.91,0.73],note:'Keep a place for this memory; choose the caption.'}
  ];
  const mates = [
    {key:'kitchen',name:'Kitchen Mate',action:'Plan a meal',steps:['See the ingredients','Compare a meal plan','Keep the chosen list']},
    {key:'garden',name:'Garden Mate',action:'Observe a planter',steps:['Find the planter','Compare shade records','Choose the next observation']},
    {key:'fermentation',name:'Fermentation Mate',action:'Keep a batch log',steps:['Find the labelled jar','Open dated photos','Compare the labels']},
    {key:'event',name:'Event Mate',action:'Plan an afternoon',steps:['See the room','Compare the layouts','Keep the selected plan']}
  ];
  let serial = 0;
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function svg(label, body, cls) {
    return '<svg class="aev__svg '+(cls||'')+'" viewBox="0 0 600 350" role="img" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+body+'</svg>';
  }
  function objectArt(key,x,y,scale) {
    const common='fill="#ece5fa" stroke="#57416e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
    const drawings={
      kitchen:'<path d="M-95 35 L80 35 L105 66 L-72 66 Z" fill="#c2cbd7" stroke="#526277" stroke-width="4"/><path d="M-75 27 V-18 M-44 28 V-32 M-12 29 V-42 M20 29 V-32 M52 29 V-18" stroke="#7761a6" stroke-width="13" stroke-linecap="round"/><ellipse cx="-10" cy="-13" rx="31" ry="52" fill="#fff" stroke="#7d5db7" stroke-width="5"/><path d="M-69 65 V80 M88 65 V80" stroke="#526277" stroke-width="5"/>',
      garden:'<path d="M-67 5 H68 L52 81 H-51 Z" fill="#c39c6b" stroke="#79593b" stroke-width="4"/><path d="M-78 5 H79 V25 H-78 Z" fill="#d5b487" stroke="#79593b" stroke-width="4"/><path d="M-22 8 V-50 M20 8 V-77" stroke="#4d7554" stroke-width="6"/><path d="M-21-22 C-85-57-64-79-20-52 C25-88 39-47-21-22 M21-32 C-29-82-15-105 21-75 C75-107 89-65 21-32" fill="#83a67d" stroke="#4d7554" stroke-width="3"/>',
      fermentation:'<rect x="-59" y="-65" width="118" height="149" rx="24" fill="#e6d3ab" fill-opacity=".6" stroke="#66778e" stroke-width="4"/><path d="M-55-15 H55 V61 Q50 80 34 81 H-34 Q-53 77-55 61 Z" fill="#d6b37b"/><rect x="-64" y="-80" width="128" height="24" rx="6" fill="#8b78a9" stroke="#57416e" stroke-width="4"/><rect x="-47" y="-10" width="94" height="62" rx="4" fill="#fffdf7" stroke="#9d87bc" stroke-width="3"/><path d="M-29 9 H27 M-29 25 H12" stroke="#7654bb" stroke-width="5"/>',
      event:'<g '+common+'><path d="M-100-35 H-30 V12 H-100 Z M-93 15 H-25 V35 H-93 Z M-89 35 L-104 86 M-33 35 L-17 86 M-84-36 L-71-68"/><path d="M18-35 H88 V12 H18 Z M25 15 H93 V35 H25 Z M29 35 L14 86 M85 35 L101 86 M34-36 L47-68"/></g>',
      memory:'<rect x="-70" y="-71" width="99" height="111" transform="rotate(-13)" fill="#fff" stroke="#8a759f" stroke-width="4"/><path d="M-57-40 L-5-40 L-5 1 L-57 1 Z" fill="#d9bff0"/><rect x="-12" y="-78" width="90" height="105" transform="rotate(10)" fill="#fff" stroke="#8a759f" stroke-width="4"/><path d="M0-52 H58 V-8 H0 Z" fill="#b5d3e6"/><path d="M-96 5 H95 L80 86 H-77 Z" fill="#b991c7" stroke="#6a457f" stroke-width="4"/><path d="M-96 5 L-71-21 H76 L95 5" fill="#d7bee5" stroke="#6a457f" stroke-width="4"/>',
      travel:'<path d="M-50-48 Q-45-90 0-90 Q45-90 50-48" fill="none" stroke="#57416e" stroke-width="12"/><rect x="-75" y="-58" width="150" height="151" rx="36" fill="#8255ae" stroke="#503369" stroke-width="4"/><rect x="-52" y="13" width="104" height="61" rx="15" fill="#ab8fca" stroke="#503369" stroke-width="4"/><path d="M-56-30 H55 M-33 35 H33" stroke="#e9cd76" stroke-width="7"/><path d="M-74-3 L-95 3 V66 L-73 74 M74-3 L95 3 V66 L73 74" fill="#685099" stroke="#503369" stroke-width="4"/>',
      creative:'<path d="M-106 52 L4 4 L108 47 L-1 100 Z" fill="#c49e73" stroke="#795d45" stroke-width="4"/><path d="M-62 42 V-35 L-22-57 L16-35 V17 M-62-35 L-22-13 L16-35 M-22-13 V62" fill="#dfbd8a" stroke="#795d45" stroke-width="4"/><path d="M31 41 V-11 L63-30 L94-9 V64 M31-11 L63 6 L94-9 M63 6 V80" fill="#cdbce2" stroke="#795d45" stroke-width="4"/><path d="M-76 64 L-30 82 L17 60 L57 79" fill="none" stroke="#fff4d4" stroke-width="7"/>'
    };
    return '<g transform="translate('+x+' '+y+') scale('+scale+')">'+drawings[key]+'</g>';
  }
  function capture(key) {
    return svg('Fictional document thumbnail of '+fixtures[key].object,
      '<rect x="65" y="24" width="470" height="301" rx="16" fill="#fdfcf9" stroke="#c7bdcf" stroke-width="3"/><path d="M88 55 H245 M88 72 H180" stroke="#baa8cd" stroke-width="8"/><rect x="90" y="94" width="420" height="190" rx="8" fill="#e8e5ef"/><path d="M90 234 L510 206 V284 H90 Z" fill="#d5c5ad"/>'+objectArt(key,300,190,.73)+'<path d="M91 302 H230 M375 302 H508" stroke="#b4a0c7" stroke-width="6"/>');
  }
  function room(key, selected) {
    return svg('Simple spatial twin with the same '+fixtures[key].object+', a note anchor and a sample reading anchor',
      '<path d="M67 149 L312 54 L550 154 L302 307 Z" fill="#eee7f8" stroke="#87749b" stroke-width="3"/><path d="M67 149 V60 L312 4 V54 Z" fill="#f4f0fa" stroke="#aa9db9" stroke-width="3"/><path d="M312 4 L550 88 V154 L312 54 Z" fill="#e6dcf1" stroke="#aa9db9" stroke-width="3"/><path d="M129 177 L365 84 M189 213 L424 108 M245 249 L487 133 M132 124 L367 268 M192 99 L427 230 M251 77 L488 192" stroke="#d3c7df" stroke-width="2"/><ellipse cx="260" cy="193" rx="112" ry="42" fill="'+(selected===0?'#dac5f0':'#e2d8eb')+'"/>'+objectArt(key,260,165,.55)+'<path d="M418 165 L469 148 L505 170 L452 192 Z" fill="'+(selected===1?'#f4cf6a':'#f7e6b7')+'" stroke="#a48132" stroke-width="3"/><circle cx="365" cy="257" r="16" fill="'+(selected===2?'#1979be':'#9abedb')+'" stroke="#fff" stroke-width="4"/><path d="M365 240 V218 M355 225 L365 215 L375 225" fill="none" stroke="#327aab" stroke-width="4"/>');
  }
  function chart(key, comparison) {
    const f=fixtures[key],max=Math.max.apply(null,f.values.concat(f.trial))+2;
    const coords=v=>v.map((n,i)=>(95+i*205)+','+(268-n/max*205)).join(' ');
    return svg('Fixed '+f.metric+' history'+(comparison?'; solid measured records versus dashed trial fixture':''),
      '<path d="M75 40 V280 H535" fill="none" stroke="#84758f" stroke-width="3"/><path d="M75 100 H535 M75 160 H535 M75 220 H535" stroke="#e4dced" stroke-width="2"/>'+(comparison?'<polyline points="'+coords(f.trial)+'" fill="none" stroke="#b47b12" stroke-width="5" stroke-dasharray="12 10"/>':'')+'<polyline points="'+coords(f.values)+'" fill="none" stroke="#7654bb" stroke-width="6"/>'+f.values.map((n,i)=>'<circle cx="'+(95+i*205)+'" cy="'+(268-n/max*205)+'" r="8" fill="#7654bb" stroke="#fff" stroke-width="3"/>').join(''));
  }
  function shareArt(key,selected) {
    return svg('Preview of selected fictional records with the same '+fixtures[key].object,
      '<rect x="38" y="40" width="230" height="273" rx="15" fill="#f6f2fb" stroke="#b8a5cf" stroke-width="3"/>'+objectArt(key,151,162,.57)+'<path d="M77 275 H227" stroke="#b19cc9" stroke-width="7"/><path d="M294 172 H330 M319 160 L333 172 L319 184" fill="none" stroke="#7654bb" stroke-width="5"/>'+[0,1,2].map((n)=>'<g opacity="'+(selected.includes(n)?'1':'.28')+'"><rect x="356" y="'+(49+n*85)+'" width="205" height="67" rx="9" fill="#fff" stroke="#9c80bb" stroke-width="3"/><rect x="371" y="'+(64+n*85)+'" width="38" height="36" rx="5" fill="'+(selected.includes(n)?'#7654bb':'#d7cbe4')+'"/><path d="M425 '+(72+n*85)+' H540 M425 '+(88+n*85)+' H511" stroke="#b6a5ca" stroke-width="5"/></g>').join(''));
  }
  function readings(f,comparison) {
    return '<ul class="aev__readings">'+f.values.map((n,i)=>'<li><span>'+esc(f.times[i])+'</span><strong>'+n+' '+esc(f.unit)+'</strong>'+(comparison?'<span class="aev__trial">Trial '+f.trial[i]+' '+esc(f.unit)+'</span>':'')+'</li>').join('')+'</ul>';
  }
  function placePanel(key,stage,state,interactive) {
    const f=fixtures[key],anchor=state.anchor||0,selected=state.selected||[0,1];
    const names=['Capture','Twin','Records','Compare','Share preview'];
    let visual='',extra='';
    if(stage===0){visual=capture(key);extra='<div class="aev__tags"><span>Document thumbnail</span><span>'+esc(f.object)+'</span></div>';}
    if(stage===1){visual='<div class="aev__plan">'+room(key,anchor)+(interactive?'<div class="aev__anchors">'+[f.object,'Note','Sample reading'].map((label,n)=>'<button type="button" class="aev__anchor aev__anchor--'+n+'" data-aev-anchor="'+n+'" aria-pressed="'+(anchor===n)+'">'+esc(label)+'</button>').join('')+'</div>':'')+'</div>';extra='<div class="aev__record"><span class="aev__eyebrow">'+esc(f.place)+' · anchor '+(anchor+1)+'</span><strong>'+esc([f.object,'Personal note','Sample reading'][anchor])+'</strong><span>'+esc([f.title,'Chosen context stays with the record',f.metric][anchor])+'</span></div>';}
    if(stage===2){visual=chart(key,false);extra='<strong>'+esc(f.metric)+'</strong>'+readings(f,false)+'<div class="aev__tags"><span>Fictional recorded example</span><span>Record DEMO-'+key.toUpperCase()+'</span><span>'+esc(f.place)+' · 12–16 Oct 2026 · sample log</span></div>';}
    if(stage===3){visual=chart(key,true);extra='<div class="aev__legend"><span><i class="aev__solid"></i>Fictional recorded example</span><span><i class="aev__dash"></i>Illustrative trial</span></div>'+readings(f,true)+'<div class="aev__tags"><span>'+esc(f.left)+'</span><span>'+esc(f.right)+'</span></div>';}
    if(stage===4){visual=shareArt(key,selected);extra='<strong>'+esc(f.share)+'</strong><div class="aev__pick">'+f.cards.map((c,n)=>interactive?'<button type="button" data-aev-pick="'+n+'" aria-pressed="'+selected.includes(n)+'">'+(selected.includes(n)?'✓ ':'+ ')+esc(c)+'</button>':'<span>'+ (selected.includes(n)?'✓ ':'— ')+esc(c)+'</span>').join('')+'</div><div class="aev__scope">'+['Personal','Community','Public'].map((label,n)=>interactive?'<button type="button" data-aev-scope="'+n+'" aria-pressed="'+((state.scope||0)===n)+'">'+label+'</button>':'<span>'+((state.scope||0)===n?'● ':'')+label+'</span>').join('')+'</div><span class="aev__tag">Selected preview · '+selected.length+' records</span>';}
    return '<div class="aev__stage"><div class="aev__visual">'+visual+'</div><div class="aev__detail"><span class="aev__eyebrow">'+(stage+1)+' / 5 · '+names[stage]+'</span><h3>'+esc(stage===0?f.object:f.title)+'</h3>'+extra+'</div></div>';
  }
  function projection(contextIndex) {
    const c=contexts[contextIndex],p=v=>({x:75+v[0]*450,y:285-v[1]*210}),point=p(c.vector),base=p(contexts[0].vector);
    const cloud=[[.14,.18],[.26,.28],[.4,.35],[.46,.67],[.58,.44],[.71,.6],[.83,.75],[.15,.8],[.64,.17],[.9,.33]];
    return svg('Illustrative two-coordinate projection of a fixed four-number context fixture; selected context '+c.label,
      '<path d="M65 40 V292 H545" stroke="#a697b5" stroke-width="3" fill="none"/><path d="M65 115 H545 M65 204 H545 M215 40 V292 M380 40 V292" stroke="#e4dbed" stroke-width="2"/>'+cloud.map(v=>{const q=p(v);return '<circle cx="'+q.x+'" cy="'+q.y+'" r="7" fill="#cdc0de"/>';}).join('')+(contextIndex?'<path d="M'+base.x+' '+base.y+' L'+point.x+' '+point.y+'" stroke="#b47b12" stroke-width="4" stroke-dasharray="8 7"/><circle cx="'+base.x+'" cy="'+base.y+'" r="12" fill="none" stroke="#b47b12" stroke-width="3"/>':'')+'<circle cx="'+point.x+'" cy="'+point.y+'" r="20" fill="#7654bb" fill-opacity=".14"/><circle cx="'+point.x+'" cy="'+point.y+'" r="11" fill="#7654bb" stroke="#fff" stroke-width="4"/>');
  }
  function memoryRoute(ci,route) {
    const c=contexts[ci],record='<span class="aev__eyebrow" data-memory-id="demo-making-room">Same memory</span>';
    if(route===0)return '<div class="aev__conversation">'+record+'<div class="aev__bubble">“We can make room.”</div><div class="aev__bubble aev__bubble--reply">'+esc(c.label)+' → '+esc(c.anchor)+'</div><strong>'+esc(c.record)+'</strong></div>';
    if(route===1)return '<div class="aev__form">'+record+'<dl><dt>Phrase</dt><dd>We can make room.</dd><dt>Context</dt><dd>'+esc(c.label)+'</dd><dt>Linked record</dt><dd>'+esc(c.record)+'</dd></dl></div>';
    return '<div class="aev__scroll">'+record+'<ol><li>We can make room.</li><li>'+esc(c.label)+'</li><li>'+esc(c.record)+'</li></ol></div>';
  }
  function meaningPanel(ci,route,interactive) {
    const c=contexts[ci];
    return '<div class="aev__meaning-grid"><div><div class="aev__phrase">“We can make room.”</div>'+'<div class="aev__projection">'+projection(ci)+(interactive?contexts.map((item,n)=>'<button type="button" class="aev__point" data-aev-vector-context="'+n+'" aria-pressed="'+(ci===n)+'" style="left:'+((75+item.vector[0]*450)/6)+'%;top:'+((285-item.vector[1]*210)/3.5)+'%">'+['Bench','Afternoon','Story'][n]+'</button>').join(''):'')+'</div><div class="aev__legend"><span><i class="aev__dot"></i>Selected context</span><span>Illustrative projection</span></div><details class="aev__values"><summary>Sample values</summary><code class="aev__vector">['+c.vector.map(n=>n.toFixed(2)).join(', ')+']</code></details></div><div><div class="aev__record">'+objectArtInline(c.key)+'<strong>'+esc(c.record)+'</strong><span>'+esc(c.anchor)+'</span></div>'+memoryRoute(ci,route)+'</div></div>';
  }
  function objectArtInline(key) {return svg(fixtures[key].object,objectArt(key,300,175,1.1),'aev__object');}
  function cookingArt(step) {
    const base='<rect x="55" y="40" width="490" height="270" rx="18" fill="#f2eaf9"/>';
    const ingredients='<circle cx="145" cy="155" r="38" fill="#d78771" stroke="#80515b" stroke-width="4"/><path d="M135 116 L150 91 L161 118" fill="#85a67c"/><rect x="217" y="100" width="85" height="135" rx="16" fill="#d8b681" stroke="#99734c" stroke-width="4"/><path d="M232 130 H287 M232 158 H287" stroke="#fff1d8" stroke-width="7"/>';
    const card='<rect x="345" y="79" width="135" height="190" rx="9" fill="#fff" stroke="#9a80b9" stroke-width="4"/><path d="M365 120 H457 M365 149 H436 M365 180 H450" stroke="#b7a4ce" stroke-width="7"/>';
    const bowl='<path d="M105 155 H295 Q278 251 200 252 Q123 250 105 155 Z" fill="#baa0d5" stroke="#684e84" stroke-width="4"/><ellipse cx="200" cy="155" rx="95" ry="28" fill="#e6c98e" stroke="#684e84" stroke-width="4"/><circle cx="176" cy="148" r="13" fill="#c47563"/><circle cx="224" cy="157" r="12" fill="#83a67d"/>';
    const checks='<path d="M365 120 L376 131 L394 109 M365 160 L376 171 L394 149 M365 200 L376 211 L394 189" fill="none" stroke="#7654bb" stroke-width="7"/>';
    if(step===0)return svg('Fictional ingredients beside their inventory document',base+ingredients+card);
    if(step===1)return svg('Illustrative meal option beside its recipe card',base+bowl+card+'<rect x="329" y="63" width="167" height="223" rx="13" fill="none" stroke="#7654bb" stroke-width="5"/>');
    return svg('Chosen ingredient list linked to the same example ingredients',base+ingredients+card+checks);
  }
  function matesPanel(index) {
    const m=mates[index];
    return '<div class="aev__mate-title"><strong>'+m.name+'</strong><span>'+m.action+'</span></div><div class="aev__mate-flow">'+m.steps.map((label,n)=>'<figure><div class="aev__mate-art">'+(m.key==='kitchen'?cookingArt(n):(n===0?objectArtInline(m.key):n===1?room(m.key,0):shareArt(m.key,[0,1])))+'</div><figcaption><span class="aev__step-no">'+(n+1)+'</span>'+esc(label)+'</figcaption></figure>').join('')+'</div>';
  }
  function note(){return '<div class="aev__fixture">Fictional sample · fixed values · local demonstration</div>';}
  function staticMarkup(mode,example) {
    const key=fixtures[example]?example:'kitchen';
    if(mode==='meaning')return '<div class="aev__static">'+contexts.map((c,i)=>'<section><h3>'+esc(c.label)+'</h3>'+meaningPanel(i,0)+'</section>').join('')+'<details><summary>Same memory · three routes</summary><div class="aev__route-fallback">'+[0,1,2].map(r=>memoryRoute(0,r)).join('')+'</div></details>'+note()+'</div>';
    if(mode==='mates')return '<div class="aev__static">'+mates.map((m,i)=>'<section>'+matesPanel(i)+'</section>').join('')+note()+'</div>';
    return '<div class="aev__static">'+[0,1,2,3,4].map((n)=>'<section>'+placePanel(key,n,{anchor:0,selected:[0,1],scope:0},false)+'</section>').join('')+note()+'</div>';
  }
  function mountHTML(mode,example) {
    const m=['place','meaning','mates'].includes(mode)?mode:'place',key=fixtures[example]?example:'kitchen';
    return '<div class="aev" data-aura-everyday="'+m+'" data-aura-example="'+key+'"><div data-aura-everyday-fallback>'+staticMarkup(m,key)+'</div><noscript><div class="aev__fixture">Static sample · all steps available above</div></noscript></div>';
  }
  function mount(root) {
    if(!root || root.dataset.auraEverydayReady)return;
    const mode=['place','meaning','mates'].includes(root.dataset.auraEveryday)?root.dataset.auraEveryday:'place';
    const key=fixtures[root.dataset.auraExample]?root.dataset.auraExample:'kitchen';
    const state={stage:0,anchor:0,selected:[0,1],scope:0,context:Math.max(0,contexts.findIndex(c=>c.key===key)),route:0,mate:Math.max(0,mates.findIndex(m=>m.key===key))};
    const uid='aev-'+(++serial);root.classList.add('aev');root.dataset.auraEverydayReady='true';
    root.innerHTML='<div class="aev__interactive"><div class="aev__controls" data-aev-controls></div><div id="'+uid+'-panel" data-aev-panel></div><div class="aev__secondary" data-aev-secondary></div>'+note()+'<div class="aev__status" role="status" aria-live="polite" aria-atomic="true"></div></div><div class="aev__print">'+staticMarkup(mode,key)+'</div>';
    function button(label,attr,n,current){return '<button type="button" '+attr+'="'+n+'" aria-pressed="'+(n===current)+'" aria-controls="'+uid+'-panel">'+esc(label)+'</button>';}
    function draw(focusKey) {
      const controls=root.querySelector('[data-aev-controls]'),panel=root.querySelector('[data-aev-panel]'),secondary=root.querySelector('[data-aev-secondary]');
      if(mode==='place'){
        controls.innerHTML=['Capture','Twin','Records','Compare','Share preview'].map((s,n)=>button((n+1)+' · '+s,'data-aev-stage',n,state.stage)).join('');
        panel.innerHTML=placePanel(key,state.stage,state,true);secondary.innerHTML='';
      } else if(mode==='meaning'){
        controls.innerHTML=contexts.map((c,n)=>button(c.label,'data-aev-context',n,state.context)).join('');
        panel.innerHTML=meaningPanel(state.context,state.route,true);
        secondary.innerHTML='<span class="aev__eyebrow">Same memory · choose a route</span><div class="aev__controls">'+['Conversation','Form','Memory scroll'].map((s,n)=>button(s,'data-aev-route',n,state.route)).join('')+'</div>';
      } else {
        controls.innerHTML=mates.map((m,n)=>button(m.name,'data-aev-mate',n,state.mate)).join('');panel.innerHTML=matesPanel(state.mate);secondary.innerHTML='';
      }
      if(focusKey){const target=root.querySelector(focusKey);if(target)target.focus({preventScroll:true});}
    }
    root.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b||!root.contains(b))return;
      let message='',focusKey='';
      for(const [attr,field] of [['data-aev-stage','stage'],['data-aev-anchor','anchor'],['data-aev-scope','scope'],['data-aev-context','context'],['data-aev-vector-context','context'],['data-aev-route','route'],['data-aev-mate','mate']]){
        if(b.hasAttribute(attr)){state[field]=Number(b.getAttribute(attr));focusKey='['+attr+'="'+state[field]+'"]';message=b.textContent.trim()+' selected.';break;}
      }
      if(b.hasAttribute('data-aev-pick')){const n=Number(b.dataset.aevPick);state.selected=state.selected.includes(n)?state.selected.filter(x=>x!==n):state.selected.concat(n).sort();focusKey='[data-aev-pick="'+n+'"]';message=state.selected.length+' sample records in preview.';}
      if(!focusKey)return;draw(focusKey);root.querySelector('.aev__status').textContent=message;
    });
    draw();
  }
  function mountAll(scope){if(!host.document)return;const area=scope||host.document;area.querySelectorAll('[data-aura-everyday]').forEach(mount);}
  const api=Object.freeze({mount,mountAll,mountHTML,staticMarkup,examples:Object.keys(fixtures),modes:['place','meaning','mates']});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(host.document){host.AuraEveryday=api;if(host.document.readyState==='loading')host.document.addEventListener('DOMContentLoaded',()=>mountAll(),{once:true});else mountAll();}
})(typeof globalThis!=='undefined'?globalThis:this);
