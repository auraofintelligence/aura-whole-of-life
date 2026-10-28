import {canonicalPage} from './original-routes.js?v=0.4.26';
export const emptyFavourites=()=>({activeId:'favourites',menus:[{id:'favourites',name:'Favourites',slots:Array(25).fill(null)}]});
export function validateFavourites(raw=emptyFavourites()){
  if(!raw||!Array.isArray(raw.menus)||!raw.menus.length)throw Error('Favourites need at least one menu.');const ids=new Set();
  const menus=raw.menus.map(menu=>{
    if(typeof menu.id!=='string'||!menu.id||menu.id.length>200||ids.has(menu.id))throw Error('Invalid favourite menu ID.');ids.add(menu.id);
    if(typeof menu.name!=='string'||!menu.name.trim()||menu.name.length>80)throw Error('Give the favourite menu a name.');
    if(!Array.isArray(menu.slots)||menu.slots.length!==25)throw Error('A favourite menu uses the 25 original slots.');
    return {id:menu.id,name:menu.name.trim(),slots:menu.slots.map(slot=>{
      if(slot===null)return null;if(!slot||typeof slot.pageId!=='string'||!/^[a-f0-9-]{36}$/i.test(slot.pageId))throw Error('Invalid favourite destination.');
      if(typeof slot.icon!=='string'||slot.icon&&!/^[a-f0-9]{32}\.(png|svg|gif|jpe?g|webp)$/i.test(slot.icon))throw Error('Choose an icon from the app.');
      return {pageId:canonicalPage(slot.pageId),icon:slot.icon};
    })};
  });
  if(!ids.has(raw.activeId))throw Error('The active favourite menu is missing.');return {activeId:raw.activeId,menus};
}
export function updateFavourite(raw,menuId,index,slot,moveTo=index){
  const next=validateFavourites(raw);if(!Number.isInteger(index)||index<0||index>24||!Number.isInteger(moveTo)||moveTo<0||moveTo>24)throw Error('Choose a valid favourite slot.');
  const menu=next.menus.find(m=>m.id===menuId);if(!menu)throw Error('The favourite menu is missing.');
  if(moveTo!==index)menu.slots[index]=menu.slots[moveTo];menu.slots[moveTo]=slot;return validateFavourites(next);
}
