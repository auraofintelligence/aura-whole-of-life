import {framePoint,frameRotated} from './frame-display.js?v=0.4.26';
import {SHELLS,ROWS,COLS,shellPoint,PRESETS,address} from './core.js?v=0.4.26';
import {target,targetPoint,edgePoints,rayEnd,rayTargets,recordTarget,targetLabel,cameraFrame,stackPoint,stackColour,stackSamples,STACK_DRAW_LIMIT,fitStackFrame} from './spatial.js?v=0.4.26';
const T=globalThis.THREE;
export class AuraView {
  constructor(canvas,onSelect){
    this.canvas=canvas;this.onSelect=onSelect;this.pose={...PRESETS.horn};this.shell=0;this.cell=null;this.face='O';this.records=[];this.links=[];this.showLabels=false;this.selection=null;this.kind='facet';this.vectors=[];this.rayMode='off';this.showVolume=false;this.sequence=null;this.cameraViews={I:{theta:0,phi:0,zoom:1},O:{theta:.55,phi:.4,zoom:1}};
    this.theta=.55;this.phi=.4;this.zoom=1;this.scene=new T.Scene();this.scene.background=new T.Color('#fafaf7');
    this.camera=new T.PerspectiveCamera(36,1,.1,300);
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.scene.add(new T.HemisphereLight(0xffffff,0x949aa9,1.1));const light=new T.DirectionalLight(0xffffff,.55);light.position.set(4,7,12);this.scene.add(light);this.keyLight=light;this.shellStyles={};this.skinTextures=new Map();
    this.meshes=[];this.wires=[];this.parameters=[];
    // Triangles only draw the surface. Their cell mapping is fixed and independent of shape.
    for(let row=0;row<ROWS;row++)for(let col=0;col<COLS;col++)for(let y=0;y<3;y++)for(let x=0;x<3;x++){
      const u=(col+x/3)/COLS,v=(row+y/3)/ROWS,du=1/(3*COLS),dv=1/(3*ROWS),cell=row*COLS+col+1;
      for(const [a,b] of [[u,v],[u+du,v],[u+du,v+dv],[u,v],[u+du,v+dv],[u,v+dv]])this.parameters.push([a,b,cell]);
    }
    this.lineParameters=[];
    for(let r=0;r<=ROWS;r++)for(let c=0;c<COLS*3;c++)this.lineParameters.push([c/(COLS*3),r/ROWS],[(c+1)/(COLS*3),r/ROWS]);
    for(let c=0;c<=COLS;c++)for(let r=0;r<ROWS*3;r++)this.lineParameters.push([c/COLS,r/(ROWS*3)],[c/COLS,(r+1)/(ROWS*3)]);
    for(let s=0;s<7;s++){
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(this.parameters.length*3),3));geometry.setAttribute('uv',new T.Float32BufferAttribute(this.parameters.flatMap(([u,v])=>[u,v]),2));geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(this.parameters.length*3),3));
      const mesh=new T.Mesh(geometry,new T.MeshPhongMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.82,shininess:22,depthWrite:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));mesh.userData.shell=s;this.scene.add(mesh);this.meshes.push(mesh);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(this.lineParameters.length*3),3));
      const wire=new T.LineSegments(g,new T.LineBasicMaterial({color:'#e4f5ff',transparent:true,opacity:.85,depthWrite:false}));this.scene.add(wire);this.wires.push(wire);
    }
    this.connect=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial({color:'#11232d',transparent:true,opacity:.9,depthTest:false}));this.connect.renderOrder=3;this.scene.add(this.connect);
    this.marker=new T.Mesh(new T.SphereGeometry(.1,12,8),new T.MeshBasicMaterial({color:0x101b24,depthTest:false}));this.marker.renderOrder=4;this.scene.add(this.marker);
    this.spatialGroup=new T.Group();this.scene.add(this.spatialGroup);this.picking=[];
    this.raycaster=new T.Raycaster();this.drag=null;this.touchPoints=new Map();this.events=new AbortController();
    const listen=(name,handler,options={})=>canvas.addEventListener(name,handler,{...options,signal:this.events.signal});
    listen('pointerdown',e=>{if(e.button!==0)return;this.touchPoints.set(e.pointerId,framePoint(canvas,e));if(this.touchPoints.size===2){const [a,b]=[...this.touchPoints.values()];this.pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);this.drag=null;canvas.setPointerCapture(e.pointerId);return;}this.drag={...framePoint(canvas,e),theta:this.theta,phi:this.phi,moved:false};canvas.setPointerCapture(e.pointerId);});
    listen('pointermove',e=>{if(this.touchPoints.has(e.pointerId))this.touchPoints.set(e.pointerId,framePoint(canvas,e));if(this.touchPoints.size===2){const [a,b]=[...this.touchPoints.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinchDistance&&!this.locked)this.zoom=Math.max(.5,Math.min(3,this.zoom*distance/this.pinchDistance));this.pinchDistance=distance;this.render();return;}if(!this.drag||this.locked)return;const point=framePoint(canvas,e),dx=point.x-this.drag.x,dy=point.y-this.drag.y;if(Math.hypot(dx,dy)>5)this.drag.moved=true;this.theta=this.drag.theta-dx*.006;this.phi=Math.max(-1.5,Math.min(1.5,this.drag.phi+dy*.006));this.render();});
    listen('pointerup',e=>{this.touchPoints.delete(e.pointerId);this.pinchDistance=0;if(this.drag&&!this.drag.moved&&!this.locked)this.pick(e);this.drag=null;});
    listen('pointercancel',e=>{this.touchPoints.delete(e.pointerId);this.drag=null;this.pinchDistance=0;});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.render();},{signal:this.events.signal});
    listen('wheel',e=>{if(this.locked)return;e.preventDefault();this.zoom=Math.max(.5,Math.min(3,this.zoom*Math.exp(-e.deltaY*.001)));this.render();},{passive:false});
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);this.update();
  }
  dispose(){
    cancelAnimationFrame(this.animationFrame);this.disposed=true;for(const t of this.skinTextures?.values()||[])t.dispose();this.skinTextures?.clear();this.observer?.disconnect();this.events?.abort();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});
    for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
    this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;
  }
  resize(){const bounds=this.canvas.getBoundingClientRect(),rotated=frameRotated(this.canvas),width=rotated?bounds.height:bounds.width,height=rotated?bounds.width:bounds.height;if(width&&height){this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.render();}}
  set(pose,shell=this.shell,cell=this.cell,face=this.face){this.pose={...pose,explodeStacks:this.explodeStacks||0};this.shell=shell;this.cell=cell;if(face!==this.face){this.cameraViews[this.face]={theta:this.theta,phi:this.phi,zoom:this.zoom};Object.assign(this,this.cameraViews[face]);}this.face=face;if(pose.camera&&face==='O'){[this.theta,this.phi]=pose.camera;this.zoom=1;}this.update();}
  centre(record){return targetPoint(recordTarget(record),this.pose,this.vectors);}
  update(){
    this.pose.stackCounts=Object.fromEntries((this.stacks||[]).map(s=>[`${s.shell}/${s.face}/${s.cell}`,s.count]));
    const p=this.pose,occupied=new Set(this.records.filter(r=>r.face===this.face&&recordTarget(r).kind==='facet').map(r=>`${r.shell}/${r.cell}`));
    for(let s=0;s<7;s++){
      const mesh=this.meshes[s],wire=this.wires[s];mesh.visible=wire.visible=((p.nest>.001&&this.face==='O')||s===this.shell);if(!mesh.visible)continue;
      mesh.material.opacity=this.face==='I'?1:p.nest>.001?(s===this.shell?.56:.13):.83;mesh.material.depthWrite=this.face==='I'||p.nest<.001;wire.material.opacity=p.nest>.001?.5:.88;
      const positions=mesh.geometry.attributes.position.array,colors=mesh.geometry.attributes.color.array;
      const groupCells=new Set(this.selectedFacets||[]),groupColour=new T.Color('#ffd267');
      mesh.userData.baseOpacity=mesh.material.opacity;wire.userData.baseOpacity=wire.material.opacity;
      const style=this.shellStyles?.[`${s}/${this.face}`],base=new T.Color(style?.skin==='image'&&style.image?'#ffffff':SHELLS[s][1]),active=new T.Color('#ffe59a'),filled=new T.Color('#214f5a');
      for(let i=0;i<this.parameters.length;i++){
        const [u,v,c]=this.parameters[i],xyz=shellPoint(u,v,p,s,this.shell);positions.set(xyz,i*3);
        const colour=s===this.shell&&c===this.cell&&this.selection?.kind==='facet'?active:s===this.shell&&this.kind==='facet'&&groupCells.has(c)?groupColour:occupied.has(`${s}/${c}`)?filled:base;colors.set([colour.r,colour.g,colour.b],i*3);
      }
      mesh.geometry.attributes.position.needsUpdate=mesh.geometry.attributes.color.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
      const lines=wire.geometry.attributes.position.array;this.lineParameters.forEach(([u,v],i)=>lines.set(shellPoint(u,v,p,s,this.shell),i*3));wire.geometry.attributes.position.needsUpdate=true;wire.geometry.computeBoundingSphere();
    }
    this.marker.visible=Boolean(this.selection);if(this.selection)this.marker.position.fromArray(targetPoint(this.selection,p,this.vectors));
    const points=[],byId=new Map(this.records.filter(r=>r.face===this.face).map(r=>[r.id,r]));
    for(const l of this.links){const a=byId.get(l.from),b=byId.get(l.to);if(a&&b&&(p.nest>.001||(a.shell===this.shell&&b.shell===this.shell)))points.push(...this.centre(a),...this.centre(b));}
    this.connect.geometry.dispose();this.connect.geometry=new T.BufferGeometry();this.connect.geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
    this.drawSpatial();this.render();
  }
  drawSpatial(){
    while(this.spatialGroup.children.length){const o=this.spatialGroup.children[0];this.spatialGroup.remove(o);o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();}this.picking=[];this.stackPicking=[];this.stackRadius=0;
    const addLines=(points,colour,opacity=1)=>{const g=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p)));const line=new T.LineSegments(g,new T.LineBasicMaterial({color:colour,transparent:true,opacity,depthTest:false}));line.renderOrder=5;this.spatialGroup.add(line);return line;};
    const addPoints=(targets,colour,size)=>{if(!targets.length)return;const g=new T.BufferGeometry().setFromPoints(targets.map(t=>new T.Vector3(...targetPoint(t,this.pose,this.vectors))));const o=new T.Points(g,new T.PointsMaterial({color:colour,size,sizeAttenuation:false,depthTest:false}));o.userData.targets=targets;o.renderOrder=6;this.spatialGroup.add(o);this.picking.push(o);};
    const s=this.shell,f=this.face,p=this.pose;
    for(const stack of (this.stacks||[]).filter(s=>s.shell===this.shell&&s.face===f)){
      const row=Math.floor((stack.cell-1)/24),col=(stack.cell-1)%24,chosen=this.selection?.kind==='stack'&&this.selection.index===stack.cell?this.selection.layer:null;
      for(const layer of stackSamples(stack.count,chosen)){
        const t=target(s,f,'stack',stack.cell,layer),points=[];
        for(let y=0;y<3;y++)for(let x=0;x<3;x++){const u=(col+x/3)/24,v=(row+y/3)/12,du=1/72,dv=1/36;for(const [a,b]of [[u,v],[u+du,v],[u+du,v+dv],[u,v],[u+du,v+dv],[u,v+dv]])points.push(...stackPoint(t,a,b,p));}
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.computeVertexNormals();const mesh=new T.Mesh(g,new T.MeshPhongMaterial({color:chosen===layer?'#fff1a2':stackColour(s,layer),side:T.DoubleSide,transparent:true,opacity:.82}));mesh.userData.target=t;this.spatialGroup.add(mesh);this.stackPicking.push(mesh);
        const centre=targetPoint(t,p,this.vectors);for(let i=0;i<points.length;i+=3)this.stackRadius=Math.max(this.stackRadius,Math.hypot(points[i],points[i+1],points[i+2]));
        if(p.explodeStacks>.05&&(stack.count<=12||layer===1||layer===stack.count||layer===chosen)){this.stackRadius=Math.max(this.stackRadius,Math.hypot(...centre)+1.6);const canvas=document.createElement('canvas');canvas.width=256;canvas.height=60;const cx=canvas.getContext('2d');cx.fillStyle='#fffdf3';cx.fillRect(0,0,256,60);cx.fillStyle='#243b42';cx.font='bold 22px Arial';cx.fillText(`Step ${layer} · ${stackColour(s,layer)}`,10,25,235);const rec=this.records.find(r=>recordTarget(r).kind==='stack'&&r.shell===s&&r.face===f&&r.cell===stack.cell&&r.anchor.layer===layer);cx.font='17px Arial';cx.fillText(rec?.title||'Click to attach instructions and data',10,48,235);const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));label.position.fromArray(centre);label.position.x+=.6;label.scale.set(1.8,.42,1);label.renderOrder=9;label.userData.target=t;this.spatialGroup.add(label);this.stackPicking.push(label);}
      }
      const label=document.createElement('canvas');label.width=320;label.height=52;const ctx=label.getContext('2d');ctx.fillStyle='#fffdf2';ctx.fillRect(0,0,320,52);ctx.fillStyle='#1c3035';ctx.font='bold 26px Arial';ctx.textAlign='center';ctx.fillText('+'+stack.count+(stack.count>STACK_DRAW_LIMIT?' (sampled)':''),160,35,310);const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(label),depthTest:false}));sprite.position.fromArray(shellPoint((col+.84)/24,(row+.12)/12,p,s));sprite.scale.set(stack.count>STACK_DRAW_LIMIT?1.65:.85,.22,1);sprite.renderOrder=8;this.spatialGroup.add(sprite);
    }
    if(this.kind==='vertex')addPoints(Array.from({length:288},(_,i)=>target(s,f,'vertex',i+1)),'#173d54',6);
    if(this.kind.startsWith('edge-')){
      const targets=Array.from({length:288},(_,i)=>target(s,f,this.kind,i+1));addPoints(targets,'#29546a',5);
      const lines=[];for(const t of targets){const ps=edgePoints(t,p);for(let i=1;i<ps.length;i++)lines.push(ps[i-1],ps[i]);}addLines(lines,'#267c94',.65);
    }
    if(this.selection?.kind.startsWith('edge-')){const ps=edgePoints(this.selection,p),lines=[];for(let i=1;i<ps.length;i++)lines.push(ps[i-1],ps[i]);addLines(lines,'#fff1a2');}
    const rays=[],targets=rayTargets(s,f,this.rayMode,this.selection);
    for(const t of targets){const end=rayEnd(t,p,this.vectors);if(end)rays.push([0,0,0],end);}
    if(rays.length)addLines(rays,'#ffd583',this.rayMode==='selected'?1:.45);
    if(this.kind.startsWith('ray-')&&this.rayMode!=='off')addPoints(targets.filter(t=>t.kind===this.kind),'#ffedaa',7);
    if(this.selection?.kind.startsWith('ray-')&&this.rayMode!=='off'){
      const end=rayEnd(this.selection,p,this.vectors);if(end)addLines([[0,0,0],end],'#fff1a2',1);
    }
    if(this.showVolume){
      const box=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(8.8,8.8,8.8)),new T.LineBasicMaterial({color:'#568688',transparent:true,opacity:.4,depthTest:false}));this.spatialGroup.add(box);
      addLines([[-4.4,0,0],[4.4,0,0],[0,-4.4,0],[0,4.4,0],[0,0,-4.4],[0,0,4.4]],'#568688',.3);
      for(let sh=0;sh<7;sh++)addPoints(this.vectors.filter(v=>v.shell===sh&&v.face===f).map(v=>target(v.shell,v.face,'volume',v.id)),SHELLS[sh][1],11);
      const links=[];for(const v of this.vectors.filter(v=>v.face===f&&v.anchor))links.push(v.position.map(x=>x*4.4),targetPoint(v.anchor,p,this.vectors));if(links.length)addLines(links,'#568688',.5);
    }
    const seq=this.sequence;if(seq?.steps.length){const path=[];for(const step of seq.steps){path.push(targetPoint(step.target,p,this.vectors));if(step.span>1)path.push(targetPoint({...step.target,layer:step.target.layer+step.span-1},p,this.vectors));}const lines=[];for(let i=1;i<path.length;i++)lines.push(path[i-1],path[i]);if(seq.loop&&path.length>1)lines.push(path.at(-1),path[0]);if(lines.length)addLines(lines,'#7b367e',.85);}
  }
  render(){
    if(!this.renderer)return;const p=this.pose,now=performance.now()/1000,elapsed=Math.min(.05,now-(this.lastRenderTime||now));this.lastRenderTime=now;let moving=false;this.keyLight.position.set(4,7,12);const activeImages=new Set(Object.values(this.shellStyles||{}).map(s=>s.image).filter(Boolean));for(const [url,texture]of this.skinTextures){if(!activeImages.has(url)){texture.dispose();this.skinTextures.delete(url);}}
    for(let s=0;s<7;s++){
      const mesh=this.meshes[s],wire=this.wires[s],style=this.shellStyles?.[`${s}/${this.face}`],material=mesh.material;
      const image=style?.skin==='image'?style.image:'';let texture=null;
      if(image){texture=this.skinTextures.get(image);if(!texture){texture=new T.TextureLoader().load(image,()=>{if(!this.disposed)this.render();});texture.wrapS=texture.wrapT=T.RepeatWrapping;this.skinTextures.set(image,texture);}}
      if(material.map!==texture){material.map=texture;material.needsUpdate=true;}
      material.opacity=(mesh.userData.baseOpacity??.83)*(style?.skin==='glass'?.35:1);
      material.emissive.set(SHELLS[s][1]);material.emissiveIntensity=style?.skin==='luminous'?.4:0;
      wire.material.opacity=wire.userData.baseOpacity??.38;
      const motion=style?.motion||'still';
      if(mesh.visible&&motion!=='still'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!this.locked){
        moving=true;const t=now*(style.speed||1);
        if(motion==='breathe')material.emissiveIntensity+=.18+.16*Math.sin(t*2);
        if(motion==='shimmer'){material.shininess=95;material.emissiveIntensity+=.12+.08*Math.sin(t*3+s);this.keyLight.position.set(Math.sin(t)*7,7,Math.cos(t)*7);if(texture)texture.offset.x=(t*.025)%1;}
        if(motion==='turn'&&s===this.shell&&!this.drag&&!this.pinchDistance)this.theta+=elapsed*.18*(style.speed||1);
      }else{material.shininess=22;if(texture)texture.offset.x=0;}
    }
    if(moving&&!document.hidden&&!this.animationFrame)this.animationFrame=requestAnimationFrame(()=>{this.animationFrame=0;this.render();});
    const aspect=this.camera.aspect||1,initial=cameraFrame(p,this.shell,this.face,this.theta,this.phi,aspect,this.zoom);
    const frame=this.face==='O'?fitStackFrame(initial,this.stackRadius,aspect,this.zoom):initial;
    this.camera.position.fromArray(frame.eye);this.camera.lookAt(...frame.look);this.camera.near=frame.near;this.camera.fov=frame.fov;this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);
  }
  pick(e){const point=framePoint(this.canvas,e);this.raycaster.setFromCamera(new T.Vector2(point.u*2-1,1-point.v*2),this.camera);this.raycaster.params.Points.threshold=.12;
    const stacked=this.raycaster.intersectObjects(this.stackPicking||[])[0];if(stacked){this.onSelect(stacked.object.userData.target,e);return;}
    if(this.kind==='volume'){const pointHit=this.raycaster.intersectObjects(this.picking)[0];if(pointHit)this.onSelect(pointHit.object.userData.targets[pointHit.index],e);return;}
    if(this.kind.startsWith('ray-')&&this.rayMode==='off')return;
    const hit=this.raycaster.intersectObjects(this.meshes.filter(m=>m.visible))[0];if(!hit||this.kind==='volume')return;
    const s=hit.object.userData.shell;
    if(this.kind==='facet'){this.onSelect(target(s,this.face,'facet',Math.floor(hit.faceIndex/18)+1),e);return;}
    let nearest=null,best=Infinity;for(let i=1;i<=288;i++){const t=target(s,this.face,this.kind,i),p=new T.Vector3(...targetPoint(t,this.pose,this.vectors)),d=p.distanceToSquared(hit.point);if(d<best){best=d;nearest=t;}}if(nearest)this.onSelect(nearest,e);
  }
  reset(){this.theta=this.face==='I'?0:this.pose.ring>.1?.55:0;this.phi=this.face==='I'?0:this.pose.ring>.1?.4:0;this.zoom=1;this.render();}
  project(record){return new T.Vector3(...this.centre(record)).project(this.camera);}
  paintExport(ctx,width,height,caption,labels=false){
    const savedSize=this.renderer.getSize(new T.Vector2()),pixelRatio=this.renderer.getPixelRatio(),aspect=this.camera.aspect;
    try{this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.render();ctx.drawImage(this.canvas,0,0,width,height);
      if(labels){ctx.font='16px Arial';ctx.textAlign='left';for(const r of this.records.filter(r=>r.face===this.face&&(this.pose.nest>.001||r.shell===this.shell))){const p=this.project(r);if(Math.abs(p.x)>1||Math.abs(p.y)>1)continue;const x=(p.x+1)*width/2,y=(1-p.y)*height/2;ctx.fillStyle='#fff';ctx.fillRect(x-4,y-19,Math.min(ctx.measureText(r.title).width+10,380),25);ctx.fillStyle='#132127';ctx.fillText(r.title,x,y,370);}}
      ctx.fillStyle='rgba(250,250,247,.96)';ctx.fillRect(0,0,width,68);ctx.fillRect(0,height-130,width,130);ctx.fillStyle='#18292d';ctx.font='bold 25px Arial';ctx.fillText('AURA  /  Matrix Studio',36,43);ctx.font='17px Arial';ctx.textAlign='right';ctx.fillText('12 × 24  ·  288 cells per shell',width-36,42);ctx.textAlign='left';ctx.font='24px Arial';
      const words=caption.split(/\s+/);let line='',y=height-88;for(const w of words){if(ctx.measureText(line+w).width>width-72){ctx.fillText(line,36,y);line='';y+=31;}line+=w+' ';}ctx.fillText(line,36,y);ctx.font='15px Arial';ctx.fillStyle='#526368';ctx.fillText(`Luke Nathan Hayes / Aura of Intelligence     |     ${targetLabel(this.selection)}`,36,height-19);
    }finally{this.renderer.setPixelRatio(pixelRatio);this.renderer.setSize(savedSize.x,savedSize.y,false);this.camera.aspect=aspect;this.render();}
  }
}
