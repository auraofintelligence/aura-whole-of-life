/* Lazy-load the actual local Matrix Studio renderer and its pinned Three.js dependency. */
(function(){
  'use strict';
  const current=document.currentScript,base=new URL('./matrix-studio/',current.src);let runtime;
  function loadRuntime(){return runtime||(runtime=(async()=>{if(!globalThis.THREE)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('vendor/three.min.js',base);script.onload=resolve;script.onerror=reject;document.head.append(script);});return import(new URL('viewer.js',base));})());}
  const waiting=new WeakSet();
  async function mount(root){if(waiting.has(root)||root.matrixSample)return;waiting.add(root);try{const {mountMatrix}=await loadRuntime();mountMatrix(root,{mode:root.dataset.auraLearning,example:root.dataset.auraExample});}catch(error){waiting.delete(root);if(!root.querySelector('.al-load-error')){const p=document.createElement('p');p.className='al-load-error';p.textContent='The static example remains available. Reload to try the Matrix Studio viewer again.';root.append(p);}}}
  function mountAll(){const roots=document.querySelectorAll('[data-aura-learning]');if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);mount(entry.target);}},{rootMargin:'150px'});roots.forEach(root=>observer.observe(root));}else roots.forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountAll,{once:true});else mountAll();
})();
