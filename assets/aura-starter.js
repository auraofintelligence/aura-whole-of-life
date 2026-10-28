/* Each native starter activity owns a separate in-memory sample project. */
(function(){
  'use strict';
  const frames=new Set();
  function mount(root){if(root.dataset.starterMounted)return;root.dataset.starterMounted='true';const frame=document.createElement('iframe');frame.title=root.dataset.starterTitle||'Aura Matrix Studio sample activity';frame.src=root.dataset.starterSrc;frame.loading='lazy';frame.className='as-frame';root.append(frame);frames.add(frame);}
  window.addEventListener('message',event=>{if(event.origin!==location.origin)return;for(const frame of frames)if(frame.contentWindow===event.source){if(event.data?.type==='aura-starter-ready')frame.parentElement.querySelector('.as-fallback').hidden=true;if(event.data?.type==='aura-starter-size'){const height=Number(event.data.height);if(Number.isFinite(height))frame.style.height=Math.max(420,Math.min(1800,Math.ceil(height)))+'px';}break;}});
  function init(){const roots=document.querySelectorAll('[data-aura-starter]');if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);mount(entry.target);}},{rootMargin:'150px'});roots.forEach(root=>observer.observe(root));}else roots.forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
