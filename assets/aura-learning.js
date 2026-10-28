/* Aura educational geometry. Canonical closed Matrix horn surface, not a live AI service.
 * Source: aura-matrix-studio/core.js point/shellPoint; spatial.js stack geometry.
 * No dependencies, network calls, persistence or autonomous animation.
 */
(function (global) {
  'use strict';
  const TAU = Math.PI * 2, ROWS = 12, COLS = 24, RADIUS = ROWS / TAU;
  const SHELLS = Object.freeze([
    ['Red', '#e23a2e'], ['Orange', '#f2801f'], ['Yellow', '#edc119'],
    ['Green', '#35a24f'], ['Blue', '#2f6fed'], ['Indigo', '#5546c8'], ['Violet', '#9a4fd6']
  ]);
  const EXAMPLES = Object.freeze({
    kitchen: {name:'KitchenMate', start:'A shared meal', item:'Recipe note', source:'A chosen recipe and its source', task:'Compare the plan', next:'Agree who brings each ingredient', revision:'A guest asks for a different ingredient. Keep the original note and review the revised plan.'},
    garden: {name:'GardenMate', start:'A familiar garden', item:'Plant observation', source:'A dated sample photo and manual note', task:'Compare two watering plans', next:'Check the plant again before choosing', revision:'A new sample observation describes a shaded spot. The proposed plan is revised; no live sensor is connected.'},
    fermentation: {name:'FermentationMate', start:'A sample batch record', item:'Preparation note', source:'A fictional batch date and chosen reference', task:'Review what was recorded', next:'Identify the question for a suitable source', revision:'The sample date is corrected. The earlier entry remains visible. This activity illustrates records, not food-safety instructions.'},
    event: {name:'EventMate', start:'A community music event', item:'Venue question', source:'A fictional venue note and access question', task:'Compare possible arrangements', next:'Ask the named host what is available', revision:'A participant asks for a quieter place. Revise the sample arrangement and preserve the unanswered question.'},
    memory: {name:'Chosen memories', start:'A meaningful song', item:'Music memory', source:'A fictional photograph and personal explanation', task:'Connect a story with an activity', next:'Choose whether to share the selected excerpt', revision:'The person changes the meaning of the song in this sample. Their current explanation sits beside the earlier account.'},
    travel: {name:'Travel planning', start:'A possible island outing', item:'Journey question', source:'A fictional route note; timetable not checked', task:'Compare the options', next:'Check the actual route and arrangements', revision:'The sample group changes its available time. The plan changes; this is not current transport information.'},
    creative: {name:'A creative project', start:'A short film idea', item:'Scene record', source:'A chosen fictional storyboard and source note', task:'Review a different ending', next:'Ask a peer what the scene communicates', revision:'The creator changes the intended feeling. Retain both versions and ask another person how they interpret the new one.'}
  });
  const add=(a,b)=>a.map((x,i)=>x+b[i]), sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const mul=(a,s)=>a.map(x=>x*s), dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const n=Math.hypot(...a)||1;return mul(a,1/n);};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const hex=a=>'#'+a.map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('');

  function point(u,v) {
    const q=RADIUS*(1-Math.cos(TAU*v)),psi=TAU*(u-.5);
    return [q*Math.sin(psi),-RADIUS*Math.sin(TAU*v),q*Math.cos(psi)];
  }
  function shellPoint(u,v,shell,nested=true) {return mul(point(u,v),nested?(shell+1)/7:1);}
  function uv(cell) {const row=Math.floor((cell-1)/COLS),col=(cell-1)%COLS;return {row,col,u:(col+.5)/COLS,v:(row+.5)/ROWS};}
  function facetCentre(cell,shell=0,nested=false) {const p=uv(cell);return shellPoint(p.u,p.v,shell,nested);}
  function surfaceNormal(cell) {
    const p=uv(cell),d=.00001;
    return unit(cross(sub(point(p.u+d,p.v),point(p.u-d,p.v)),sub(point(p.u,p.v+d),point(p.u,p.v-d))));
  }
  function stackPoint(cell,layer,u,v,explode=true) {
    // Matrix stackDepth(layer,count=3), with its documented explode multiplier.
    const depth=Math.min(1.2,3*.04)*layer/3*(explode?4:1);
    return add(point(u,v),mul(surfaceNormal(cell),depth));
  }
  function stackColour(shell,layer) {return '#'+((parseInt(SHELLS[shell][1].slice(1),16)+layer)%16777216).toString(16).padStart(6,'0');}
  function facetMesh(cell,position=point) {
    const {row,col}=uv(cell),out=[];
    for(let y=0;y<3;y++)for(let x=0;x<3;x++){
      const u=(col+x/3)/COLS,v=(row+y/3)/ROWS,du=1/72,dv=1/36;
      const p=[[u,v],[u+du,v],[u+du,v+dv],[u,v],[u+du,v+dv],[u,v+dv]].map(([a,b])=>position(a,b));
      out.push({points:p.slice(0,3),cell},{points:p.slice(3,6),cell});
    }
    return out;
  }
  const MESH=Array.from({length:288},(_,i)=>facetMesh(i+1)).flat();
  const WIRES=[];
  for(let row=0;row<=ROWS;row++)WIRES.push(Array.from({length:73},(_,col)=>point(col/72,row/ROWS)));
  for(let col=0;col<=COLS;col++)WIRES.push(Array.from({length:37},(_,row)=>point(col/COLS,row/36)));
  function cameraFor(state,width,height) {
    const inside=state.view==='inside';
    const theta=state.theta??(inside?.31:-.61),phi=state.phi??(inside?.77:.49);
    const towards=[Math.cos(phi)*Math.sin(theta),Math.sin(phi),Math.cos(phi)*Math.cos(theta)];
    const eye=inside?[0,0,RADIUS]:mul(towards,11);
    const forward=inside?towards:mul(towards,-1);
    const right=unit(cross(forward,[0,1,0])),up=unit(cross(right,forward));
    return {inside,eye,forward,right,up,near:RADIUS*.025,fov:105,scale:Math.min(width/8.6,height/6.3)*(state.zoom||1),focal:height/(2*Math.tan(105*Math.PI/360)),cx:width/2,cy:height*.52,width,height};
  }
  function camPoint(p,c) {const rel=sub(p,c.eye);return [dot(rel,c.right),dot(rel,c.up),dot(rel,c.forward)];}
  function projectCam(p,c) {return c.inside?[c.cx+p[0]*c.focal/p[2],c.cy-p[1]*c.focal/p[2],1/p[2]]:[c.cx+p[0]*c.scale,c.cy-p[1]*c.scale,-p[2]];}
  function clipNear(points,c) {
    if(!c.inside)return points;
    const out=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],ia=a[2]>=c.near,ib=b[2]>=c.near;
      if(ia)out.push(a);
      if(ia!==ib){const t=(c.near-a[2])/(b[2]-a[2]);out.push(add(a,mul(sub(b,a),t)));}
    }
    return out;
  }
  function projectedPolygon(points,c) {return clipNear(points.map(p=>camPoint(p,c)),c).map(p=>projectCam(p,c));}
  function projectedSegment(a,b,c) {
    a=camPoint(a,c);b=camPoint(b,c);
    if(c.inside){if(a[2]<c.near&&b[2]<c.near)return null;if(a[2]<c.near)a=add(a,mul(sub(b,a),(c.near-a[2])/(b[2]-a[2])));if(b[2]<c.near)b=add(b,mul(sub(a,b),(c.near-b[2])/(a[2]-b[2])));}
    return [projectCam(a,c),projectCam(b,c)];
  }
  function stateFor(mode='layers') {return {mode,view:mode==='inside'?'inside':mode==='stack'?'shell':'nested',shell:mode==='layers'?3:0,cell:181,face:mode==='inside'?'I':'O',theta:mode==='inside'?.31:-.61,phi:mode==='inside'?.77:.49,zoom:1,stack:mode==='stack',layer:1,revised:false,example:'creative'};}
  function scene(state,width,height) {
    const camera=cameraFor(state,width,height),polygons=[],lines=[];
    if(state.view==='nested'){
      for(let shell=6;shell>=0;shell--){const scale=(shell+1)/7;for(const curve of WIRES)lines.push({points:curve.map(p=>mul(p,scale)),colour:SHELLS[shell][1],width:shell===state.shell?1.3:.75,alpha:shell===state.shell?.92:.44});}
      for(const t of facetMesh(state.cell,(u,v)=>shellPoint(u,v,state.shell,true)))polygons.push({...t,colour:'#ffe59a',alpha:.65});
    } else {
      for(const t of MESH)polygons.push({...t,colour:t.cell===state.cell?'#ffe59a':SHELLS[state.shell][1],alpha:1});
      for(const curve of WIRES)lines.push({points:curve,colour:'#293342',width:.85,alpha:.72});
      if(state.stack&&state.view!=='inside')for(let layer=1;layer<=3;layer++){
        for(const t of facetMesh(state.cell,(u,v)=>stackPoint(state.cell,layer,u,v,true)))polygons.push({...t,layer,colour:layer===state.layer?'#ffe59a':stackColour(state.shell,layer),alpha:1});
        const p=uv(state.cell),corners=[[p.col/24,p.row/12],[(p.col+1)/24,p.row/12],[(p.col+1)/24,(p.row+1)/12],[p.col/24,(p.row+1)/12],[p.col/24,p.row/12]].map(([u,v])=>stackPoint(state.cell,layer,u,v,true));
        lines.push({points:corners,colour:'#5d347c',width:1.6,alpha:1,layer});
      }
    }
    const projected=[];
    for(const p of polygons){const points=projectedPolygon(p.points,camera);if(points.length>=3)projected.push({...p,points,depth:points.reduce((s,p)=>s+p[2],0)/points.length});}
    return {camera,polygons:projected.sort((a,b)=>a.depth-b.depth),lines};
  }
  function colourFor(poly,state) {
    const c=rgb(poly.colour);
    // A quiet UI material, not an inferred physical field or measurement.
    return c.map(v=>Math.round(v*.76+255*.24));
  }
  function paint(canvas,state) {
    const ratio=Math.min(global.devicePixelRatio||1,1.5),box=canvas.getBoundingClientRect();
    const w=Math.max(240,Math.round(box.width*ratio)),h=Math.max(230,Math.round(box.height*ratio));
    canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)return null;
    const model=scene(state,w,h),depth=new Float32Array(w*h),cells=new Uint16Array(w*h),layers=new Uint8Array(w*h);depth.fill(-Infinity);
    ctx.fillStyle='#f9faff';ctx.fillRect(0,0,w,h);
    if(state.view!=='nested'){
      const image=ctx.getImageData(0,0,w,h),pixels=image.data;
      for(const poly of model.polygons)for(let j=1;j<poly.points.length-1;j++){
        const a=poly.points[0],b=poly.points[j],c=poly.points[j+1];
        const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
        const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));const colour=colourFor(poly,state);
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
          const wa=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,wb=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,wc=1-wa-wb;
          if(wa<-.00001||wb<-.00001||wc<-.00001)continue;const z=wa*a[2]+wb*b[2]+wc*c[2],i=y*w+x;if(z<=depth[i])continue;depth[i]=z;cells[i]=poly.cell;layers[i]=poly.layer||0;const k=i*4;pixels[k]=colour[0];pixels[k+1]=colour[1];pixels[k+2]=colour[2];pixels[k+3]=255;
        }
      }
      ctx.putImageData(image,0,0);
    }else for(const p of model.polygons){ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.globalAlpha=p.alpha;ctx.fillStyle=p.colour;ctx.fill();ctx.globalAlpha=1;}
    for(const line of model.lines){ctx.strokeStyle=line.colour;ctx.globalAlpha=line.alpha;ctx.lineWidth=line.width*ratio;ctx.beginPath();let drawing=false;
      for(let i=0;i<line.points.length-1;i++){
        const segment=projectedSegment(line.points[i],line.points[i+1],model.camera);if(!segment){drawing=false;continue;}const [a,b]=segment,n=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])));
        for(let k=0;k<=n;k++){const t=k/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t,ix=Math.floor(x),iy=Math.floor(y),valid=ix>=0&&ix<w&&iy>=0&&iy<h,visible=valid&&(state.view==='nested'||z>=depth[iy*w+ix]-(model.camera.inside?.006:.025));
          if(visible){drawing?ctx.lineTo(x,y):ctx.moveTo(x,y);drawing=true;}else drawing=false;
        }
      }ctx.stroke();ctx.globalAlpha=1;
    }
    if(state.stack&&state.view!=='inside'&&state.view!=='nested'){
      const p=uv(state.cell);for(let layer=1;layer<=3;layer++){const q=projectedPolygon([stackPoint(state.cell,layer,p.u,p.v,true)],model.camera)[0];if(!q)continue;const x=q[0]+(24+layer*12)*ratio,y=q[1]-(14+layer*11)*ratio;ctx.strokeStyle='#65418a';ctx.lineWidth=ratio;ctx.beginPath();ctx.moveTo(q[0],q[1]);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#ffffff';ctx.fillRect(x-3*ratio,y-19*ratio,27*ratio,27*ratio);ctx.fillStyle='#38214f';ctx.font=`600 ${18*ratio}px sans-serif`;ctx.fillText(String(layer),x+3*ratio,y+2*ratio);}
    }
    return {w,h,ratio,cells,layers,model};
  }

  let serial=0;
  const mounted=new WeakMap();
  class Learning {
    constructor(root){
      this.root=root;this.original=root.innerHTML;this.state=stateFor(['layers','inside','stack'].includes(root.dataset.auraLearning)?root.dataset.auraLearning:'layers');this.state.example=EXAMPLES[root.dataset.auraExample]?root.dataset.auraExample:'creative';this.prefix='aura-learning-'+(++serial);this.frame=0;this.abort=new AbortController();root.classList.add('aura-learning');this.build();
      if(typeof global.ResizeObserver==='function'){this.observer=new global.ResizeObserver(()=>this.draw());this.observer.observe(root);}else global.addEventListener('resize',()=>this.draw(),{signal:this.abort.signal});this.refresh(true);
    }
    build(){
      const id=this.prefix,mode=this.state.mode,title=this.root.dataset.auraTitle||({layers:'Explore all seven Aura layers',inside:'Look from inside a curved layer',stack:'Follow three ordered steps'})[mode];
      this.root.innerHTML=`<section class="al-frame" aria-labelledby="${id}-title"><div class="al-heading"><h3 id="${id}-title">${escape(title)}</h3><p class="al-sample">Sample illustration</p></div><div class="al-shells" role="group" aria-label="Choose an Aura layer">${SHELLS.map(([name,colour],i)=>`<button type="button" data-al-shell="${i}" aria-pressed="false"><span class="al-swatch" style="background:${colour}" aria-hidden="true"></span>${name}</button>`).join('')}</div><div class="al-views" role="group" aria-label="Choose one geometry view"><button type="button" data-al-view="nested">All seven</button><button type="button" data-al-view="shell">Selected shell</button><button type="button" data-al-view="inside">Inside</button></div><div class="al-stage"><canvas aria-label="Canonical Aura geometry"></canvas></div><p class="al-view-note"></p><details class="al-adjust"><summary>Adjust view or facet</summary><div class="al-turn" role="group" aria-label="Turn the view"><button type="button" data-al-turn="left">Turn left</button><button type="button" data-al-turn="right">Turn right</button><button type="button" data-al-turn="up">Look up</button><button type="button" data-al-turn="down">Look down</button><button type="button" data-al-action="reset">Reset view</button></div><div class="al-facet-controls"><label for="${id}-facet">Facet, 1 to 288 <input id="${id}-facet" type="number" min="1" max="288" step="1" value="181" inputmode="numeric"></label><button type="button" data-al-action="previous">Previous facet</button><button type="button" data-al-action="next">Next facet</button></div></details><button type="button" class="al-stack-toggle" data-al-action="stack" aria-pressed="false">Show three ordered steps</button><div class="al-status" role="status" aria-live="polite"></div><div class="al-stack" hidden><p>Three layers at this facet · expanded spacing</p><div class="al-step-buttons" role="group" aria-label="Inspect an ordered stack layer"><button type="button" data-al-step="1">1 · Source</button><button type="button" data-al-step="2">2 · Compare</button><button type="button" data-al-step="3">3 · Next step</button></div></div><div class="al-record"><h4>Linked sample records</h4><p class="al-example-name"></p><ol class="al-records"></ol><button type="button" data-al-action="revise">Revise the sample</button><p class="al-revision" hidden></p></div><p class="al-key">Inside · private or secret / Outside · public</p></section>`;
      this.canvas=this.root.querySelector('canvas');
      this.root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!this.root.contains(b))return;
        if(b.dataset.alShell!==undefined){this.state.shell=+b.dataset.alShell;this.refresh();return;}
        if(b.dataset.alView){this.setView(b.dataset.alView);return;}
        if(b.dataset.alStep){this.state.layer=+b.dataset.alStep;this.refresh();return;}
        if(b.dataset.alTurn){const d=b.dataset.alTurn;this.state.theta+=(d==='left'?-.22:d==='right'?.22:0);this.state.phi=clamp(this.state.phi+(d==='up'?.16:d==='down'?-.16:0),-1.2,1.2);this.draw();return;}
        const a=b.dataset.alAction;if(a==='reset'){this.state.theta=this.state.view==='inside'?.31:-.61;this.state.phi=this.state.view==='inside'?.77:.49;this.draw();}
        if(a==='previous'||a==='next'){this.state.cell=(this.state.cell-1+(a==='next'?1:287))%288+1;this.refresh();}
        if(a==='stack'){this.state.stack=!this.state.stack;if(this.state.stack)this.setView('shell');else this.refresh();}
        if(a==='revise'){this.state.revised=!this.state.revised;this.refresh();}
      },{signal:this.abort.signal});
      this.root.querySelector('input').addEventListener('change',e=>{const value=Number(e.target.value);if(Number.isInteger(value)&&value>=1&&value<=288){e.target.setCustomValidity('');this.state.cell=value;this.refresh();}else{e.target.setCustomValidity('Choose a whole facet number from 1 to 288.');e.target.reportValidity();}},{signal:this.abort.signal});
      this.canvas.addEventListener('click',e=>this.pick(e),{signal:this.abort.signal});
    }
    setView(view){this.state.view=view;this.state.face=view==='inside'?'I':'O';this.state.theta=view==='inside'?.31:-.61;this.state.phi=view==='inside'?.77:.49;this.refresh();}
    refresh(initial=false){
      const s=this.state,p=uv(s.cell),example=EXAMPLES[s.example],address=`${SHELLS[s.shell][0]} ${s.face}${s.cell}`;
      for(const b of this.root.querySelectorAll('[data-al-shell]'))b.setAttribute('aria-pressed',String(+b.dataset.alShell===s.shell));
      for(const b of this.root.querySelectorAll('[data-al-view]'))b.setAttribute('aria-pressed',String(b.dataset.alView===s.view));
      for(const b of this.root.querySelectorAll('[data-al-step]'))b.setAttribute('aria-pressed',String(+b.dataset.alStep===s.layer));
      this.root.querySelector('input').value=s.cell;this.root.querySelector('[data-al-action="stack"]').setAttribute('aria-pressed',String(s.stack));this.root.querySelector('.al-stack').hidden=!s.stack;
      this.root.querySelector('.al-status').textContent=`${address} · row ${p.row+1}, column ${p.col+1}${s.stack?' · ordered layer '+s.layer+' of 3':''}`;
      this.root.querySelector('.al-view-note').textContent=s.view==='nested'?'Seven closed shells · red inside, violet outside · one common pinch':s.view==='inside'?'Inside the actual curved 12 × 24 grid · turn or pick a facet':'Selected shell · 288 facets · one closed pinch';
      this.root.querySelector('.al-example-name').textContent=`${example.name} · ${s.revised?'revised sample':'sample'} · ${address}`;
      const changed={kitchen:'Compare the revised ingredient choice',garden:'Review the shaded-spot note',fermentation:'Review the corrected sample date',event:'Compare a quieter arrangement',memory:'Keep both meanings, with dates',travel:'Compare the changed time window',creative:'Review the new intended feeling'};
      const records=[{title:example.item,text:example.source},{title:'Comparison',text:s.revised?changed[s.example]:example.task},{title:'Chosen next step',text:example.next}];
      this.root.querySelector('.al-records').innerHTML=records.map((r,i)=>`<li${s.stack&&s.layer===i+1?' class="al-record-active"':''}><strong>${escape(r.title)}</strong><span>${escape(r.text)}</span></li>`).join('');
      this.root.querySelector('[data-al-action="revise"]').textContent=s.revised?'Restore the earlier sample':'Revise the sample';this.root.querySelector('.al-revision').hidden=!s.revised;this.root.querySelector('.al-revision').textContent='Sample changed; earlier version retained. Address unchanged.';
      this.canvas.setAttribute('aria-label',`${s.view==='nested'?'Seven nested horn tori':s.view==='inside'?'View inside the '+SHELLS[s.shell][0]+' horn torus':'Selected '+SHELLS[s.shell][0]+' horn torus'}. Picked facet ${s.cell}, row ${p.row+1}, column ${p.col+1}.${s.stack?' Three ordered stack layers are available.':''}`);
      this.draw();
    }
    draw(){if(this.frame)return;this.frame=global.requestAnimationFrame(()=>{this.frame=0;this.rendered=paint(this.canvas,this.state);});}
    pick(e){
      const r=this.rendered;if(!r)return;const box=this.canvas.getBoundingClientRect(),x=clamp(Math.floor((e.clientX-box.left)*r.w/box.width),0,r.w-1),y=clamp(Math.floor((e.clientY-box.top)*r.h/box.height),0,r.h-1),i=y*r.w+x;
      if(r.cells[i]){this.state.cell=r.cells[i];if(r.layers[i])this.state.layer=r.layers[i];this.refresh();return;}
      if(this.state.view==='nested'){
        let nearest=null,best=Infinity;for(let cell=1;cell<=288;cell++){const p=projectedPolygon([facetCentre(cell,this.state.shell,true)],r.model.camera)[0];if(!p)continue;const d=Math.hypot(p[0]-x,p[1]-y);if(d<best){best=d;nearest=cell;}}if(best<45*r.ratio&&nearest){this.state.cell=nearest;this.refresh();}
      }
    }
    destroy(){this.abort.abort();this.observer?.disconnect();if(this.frame)global.cancelAnimationFrame(this.frame);this.root.innerHTML=this.original;this.root.classList.remove('aura-learning');mounted.delete(this.root);}
  }
  function mount(root){if(mounted.has(root))return mounted.get(root);const probe=global.document.createElement('canvas');try{if(!probe.getContext('2d'))return null;}catch{return null;}const value=new Learning(root);mounted.set(root,value);return value;}
  const waiting=new WeakSet();let lazyObserver=null;
  function mountAll(root,options={}){root=root||global.document;if(!root)return [];const nodes=[...(root.matches?.('[data-aura-learning]')?[root]:[]),...root.querySelectorAll('[data-aura-learning]')];for(const node of nodes){if(mounted.has(node))continue;if(waiting.has(node)){if(!options.eager)continue;lazyObserver?.unobserve(node);waiting.delete(node);}if(options.eager||typeof global.IntersectionObserver!=='function'){mount(node);continue;}if(!lazyObserver)lazyObserver=new global.IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){lazyObserver.unobserve(entry.target);waiting.delete(entry.target);mount(entry.target);}},{rootMargin:'180px 0px'});waiting.add(node);lazyObserver.observe(node);}return nodes;}
  function fallbackSVG(mode='layers'){
    const state=stateFor(mode),width=800,height=500,model=scene(state,width,height),elements=[`<rect width="800" height="500" fill="#f9faff"/>`];
    const depth=new Float32Array(width*height);depth.fill(-Infinity);
    for(const p of model.polygons){
      const fill=hex(colourFor(p,state));elements.push(`<polygon points="${p.points.map(q=>q.slice(0,2).map(n=>n.toFixed(3)).join(',')).join(' ')}" fill="${fill}" stroke="${fill}" stroke-width=".8" opacity="${p.alpha}"/>`);
      for(let j=1;j<p.points.length-1;j++){
        const a=p.points[0],b=p.points[j],c=p.points[j+1],den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
        const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
          const wa=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,wb=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,wc=1-wa-wb;
          if(wa<-.00001||wb<-.00001||wc<-.00001)continue;const index=y*width+x;depth[index]=Math.max(depth[index],wa*a[2]+wb*b[2]+wc*c[2]);
        }
      }
    }
    for(const line of model.lines){let d='',drawing=false;
      if(state.view==='nested'){
        for(let i=0;i<line.points.length-1;i++){
          const segment=projectedSegment(line.points[i],line.points[i+1],model.camera);if(!segment)continue;
          const [a,b]=segment;if(!drawing)d+=`M${a[0].toFixed(2)} ${a[1].toFixed(2)}`;d+=`L${b[0].toFixed(2)} ${b[1].toFixed(2)}`;drawing=true;
        }
        if(d)elements.push(`<path d="${d}" fill="none" stroke="${line.colour}" stroke-width="${line.width}" opacity="${line.alpha}"/>`);
        continue;
      }
      for(let i=0;i<line.points.length-1;i++){
        const segment=projectedSegment(line.points[i],line.points[i+1],model.camera);if(!segment){drawing=false;continue;}const [a,b]=segment,n=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.5));
        for(let k=0;k<=n;k++){
          const t=k/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t,ix=Math.floor(x),iy=Math.floor(y),valid=ix>=0&&ix<width&&iy>=0&&iy<height;
          const visible=valid&&(state.view==='nested'||z>=depth[iy*width+ix]-(model.camera.inside?.006:.025));
          if(visible){d+=`${drawing?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`;drawing=true;}else drawing=false;
        }
      }
      if(d)elements.push(`<path d="${d}" fill="none" stroke="${line.colour}" stroke-width="${line.width}" opacity="${line.alpha}"/>`);
    }
    if(mode==='stack'){
      const p=uv(state.cell);for(let layer=1;layer<=3;layer++){
        const q=projectedPolygon([stackPoint(state.cell,layer,p.u,p.v,true)],model.camera)[0],x=q[0]+24+layer*12,y=q[1]-14-layer*11;
        elements.push(`<path d="M${q[0]} ${q[1]}L${x} ${y}" stroke="#65418a"/><rect x="${x-3}" y="${y-19}" width="27" height="27" fill="white"/><text x="${x+3}" y="${y+2}" fill="#38214f" font-family="sans-serif" font-size="18" font-weight="600">${layer}</text>`);
      }
    }
    const title=mode==='inside'?'Inside the curved horn-torus grid':mode==='stack'?'A picked facet with three ordered layers':'Seven nested horn-torus shells';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-labelledby="title desc"><title id="title">${title}</title><desc id="desc">Canonical Matrix coordinates. Twelve rows by twenty-four columns. Red, Orange, Yellow, Green, Blue, Indigo and Violet remain selectable in the interactive version. Facet 181 is highlighted. This static sample sends and stores nothing.</desc><defs><clipPath id="clip"><rect width="800" height="500"/></clipPath></defs><g clip-path="url(#clip)">${elements.join('')}</g></svg>`;
  }
  global.AuraLearning=Object.freeze({mount,mountAll,fallbackSVG,examples:EXAMPLES,geometry:Object.freeze({ROWS,COLS,RADIUS,SHELLS,point,shellPoint,uv,facetCentre,surfaceNormal,stackPoint,stackColour,cameraFor,scene,stateFor})});
  if(global.document){if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',()=>mountAll(),{once:true});else mountAll();}
})(globalThis);
