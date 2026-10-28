export const HOME='72917D84-7C55-42C9-A552-27AC4CB15FE7';
export const PROGRAMMER='BDBC5806-9DB0-4CB2-901E-31E2E973173B';
export const FINITE='1FE14FC9-F981-4E27-B038-BDF3FF404838';
export const TORUS='1773263D-945B-4087-ACEF-8C088C29FB47';
export const CAMERA_VARIANTS={'240B517C-0F63-4E04-BEE9-F3EB647B06DB':HOME,'3396DB1C-1A41-452E-8FE2-865582557CA0':PROGRAMMER};
export const CROWN='666AEEAB-5621-4EA6-B4FA-DC6FDB2B8DA4';
export const PAGE_ALIASES={'49B01240-CBE1-4CAE-A639-D79E064FE56B':'04D7A1CD-024B-4CC1-8116-37139DF95A29'};
export const PAGE_PARENTS={'1FA4EBEC-3D1A-482A-B3B2-35A1172BECB6':'AE87688C-93C9-4AB1-A72D-A447ED56C5E0','76172966-3F90-4DB8-A914-4E63AE19A501':'AE87688C-93C9-4AB1-A72D-A447ED56C5E0','A54DE2EE-A009-467A-BE13-BA8C3BDF1018':CROWN,'665135E8-D026-47B2-8F17-01F31A8910C1':CROWN,'04D7A1CD-024B-4CC1-8116-37139DF95A29':CROWN};
export const canonicalPage=id=>CAMERA_VARIANTS[id]||PAGE_ALIASES[id]||id;
const finiteInside='61CEB74B-9978-49D9-8514-E5D0F0E1E989',finiteOutside='BCB57A67-242E-4B77-9AC3-9B760D7181DD';
const torusInside='F8799D0F-5FC9-4A10-83A4-5D491C1DE094',torusOutside='A6C23855-5F57-4601-8F6A-02749BA0895E';
export const COLOUR_PAGES=[TORUS,'0D39C84A-0C31-40C0-BDEF-D8F334131ECB','CFE053D6-774F-47CF-B628-252A95B76C7F','1CC53FF5-C942-4FBA-94DD-3D13C371D970','00E35924-A98C-4CFA-BCED-8690ED4BF7C7','FB53C125-AA89-4951-986E-C2C32EA5E0DD','DE4BD293-699C-4440-BE3A-1BFB99C64EE4'];
export function livePage(id,params=new URLSearchParams()){
  const flat=[FINITE,finiteInside,finiteOutside].includes(id),shell=COLOUR_PAGES.indexOf(id);
  if(!flat&&shell<0&&![torusInside,torusOutside].includes(id))return null;
  const requested=params.get('shell'),side=params.get('face');
  return {shape:flat?'flat':'horn',shell:requested!==null&&/^[0-6]$/.test(requested)?+requested:Math.max(0,shell),face:['I','O'].includes(side)?side:[finiteInside,torusInside].includes(id)?'I':'O'};
}
export function parentPage(page,pages){
  if(PAGE_PARENTS[canonicalPage(page.id)])return PAGE_PARENTS[canonicalPage(page.id)];
  if(page.id===PROGRAMMER)return HOME;
  if(livePage(page.id))return PROGRAMMER;
  let parent=pages.get(page.parent),seen=new Set([page.id]);
  while(parent&&/ CK$/.test(parent.name)&&!seen.has(parent.id)){seen.add(parent.id);parent=pages.get(parent.parent);}
  return parent&&!seen.has(parent.id)?parent.id:HOME;
}
export function stageBounds(page){
  const images=page.controls.filter(c=>['Image','Gif'].includes(c.controlTypeID)&&+c.w>150&&+c.h>100&&+c.y<240);
  if(!images.length)return null;
  const x=Math.min(...images.map(c=>+c.x)),y=Math.min(...images.map(c=>+c.y));
  return [x,y,Math.max(...images.map(c=>+c.x + +c.w))-x,Math.max(...images.map(c=>+c.y + +c.h))-y];
}
