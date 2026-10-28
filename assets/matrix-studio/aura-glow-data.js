export const GLOW_PATTERNS=[['filaments','Filaments'],['petals','Petal weave'],['mist','Luminous veil']];
export const defaultAuraGlow=()=>({format:'aura-glow/1',enabled:false,pattern:'filaments',seed:104729,detail:.6,glow:.65,flow:.4});
export function validateAuraGlow(raw=defaultAuraGlow()){
 if(!raw||raw.format!=='aura-glow/1'||typeof raw.enabled!=='boolean'||!GLOW_PATTERNS.some(([id])=>id===raw.pattern)||!Number.isInteger(raw.seed)||raw.seed<0||raw.seed>4294967295)throw Error('Invalid Aura Glow-Up form.');
 for(const key of ['detail','glow','flow'])if(!Number.isFinite(raw[key])||raw[key]<0||raw[key]>1)throw Error('Aura '+key+' must be between zero and one.');
 return Object.fromEntries(Object.keys(defaultAuraGlow()).map(key=>[key,raw[key]]));
}
export function glowPoint(config,space,shell,u,v,time=0){
 const ratio=Math.pow(space.radii[shell]/space.radii[6],.45),phase=(config.seed%997)/997*Math.PI*2,t=time*config.flow;
 const outer=(.25+.72*ratio)*(.8+.3*Math.tanh(space.radii[6]/space.height)),warp=config.pattern==='petals'?.17:config.pattern==='mist'?.045:.1;
 const r=outer*(1+warp*Math.sin(6*v+3*u+phase+t*.25));
 const rho=r*(.52+.48*Math.cos(v)),angle=u+.35*Math.sin(v*2+phase)+t*.07;
 const y=(.89+.16*ratio)*Math.sin(v)+warp*.3*Math.sin(5*u+v+phase+t*.4);
 return [rho*Math.cos(angle),y,rho*Math.sin(angle)];
}
export function glowAddressPoint(config,space,{shell,cell},time=0){
 if(!Number.isInteger(shell)||shell<0||shell>6||!Number.isInteger(cell)||cell<1||cell>288)throw Error('Choose a valid Aura address.');
 const row=Math.floor((cell-1)/24),column=(cell-1)%24;
 return glowPoint(config,space,shell,(column+.5)/24*Math.PI*2,(row+.5)/12*Math.PI*2,time);
}
