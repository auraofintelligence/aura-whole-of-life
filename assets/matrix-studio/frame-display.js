export const frameOrientation=page=>page.width>page.height?'landscape':'portrait';
export const frameRotated=element=>Boolean(element.closest?.('[data-frame-rotated="true"]'));
export function framePoint(element,event){
 const b=element.getBoundingClientRect(),x=(event.clientX-b.left)/b.width,y=(event.clientY-b.top)/b.height,rotated=frameRotated(element),u=rotated?y:x,v=rotated?1-x:y;
 return {u,v,x:u*(element.clientWidth|| (rotated?b.height:b.width)),y:v*(element.clientHeight||(rotated?b.width:b.height))};
}
