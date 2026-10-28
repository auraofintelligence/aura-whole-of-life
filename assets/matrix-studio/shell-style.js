export const SKINS=['colour','glass','luminous','image'];
export const MOTIONS=['still','breathe','shimmer','turn'];
export const defaultShellStyle=()=>({skin:'colour',motion:'still',speed:1,image:''});
export function validateShellStyles(raw={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid shell styles.');
  const result={};let bytes=0;
  for(const [key,value] of Object.entries(raw)){
    if(!/^[0-6]\/[IO]$/.test(key)||!value||!SKINS.includes(value.skin)||!MOTIONS.includes(value.motion)||!Number.isFinite(value.speed)||value.speed<.25||value.speed>2)throw Error('Invalid shell appearance.');
    const image=value.image||'';
    if(typeof image!=='string'||image.length>750000||image&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))throw Error('Use a small PNG, JPEG or WebP skin.');
    bytes+=image.length;if(bytes>2500000)throw Error('Skin images exceed browser storage. Use smaller images.');
    result[key]={skin:value.skin,motion:value.motion,speed:value.speed,image};
  }
  return result;
}
