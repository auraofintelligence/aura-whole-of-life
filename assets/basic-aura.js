/* Geometry only: load the unchanged Matrix Studio renderer without a sample project. */
(function(){
  'use strict';
  const script=document.currentScript,base=new URL('.',script.src);
  let runtime;
  function load(){
    if(!runtime)runtime=new Promise((resolve,reject)=>{
      function ready(){import(new URL('matrix-studio/basic-viewer.js?v=geometry-1',base)).then(resolve,reject);}
      if(globalThis.THREE){ready();return;}
      const dependency=document.createElement('script');dependency.src=new URL('matrix-studio/vendor/three.min.js',base);dependency.onload=ready;dependency.onerror=reject;document.head.append(dependency);
    });
    return runtime;
  }
  function mount(root){if(root.dataset.basicMounted)return;root.dataset.basicMounted='true';load().then(module=>module.mountBasicMatrix(root)).catch(()=>{root.dataset.basicMounted='failed';});}
  function init(){const roots=document.querySelectorAll('[data-basic-aura]');if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);mount(entry.target);}},{rootMargin:'180px'});roots.forEach(root=>observer.observe(root));}else roots.forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
