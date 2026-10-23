const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),env={...process.env},file=path.join(root,'.env.local');
if(fs.existsSync(file))for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){
  const m=line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if(m&&env[m[1]]===undefined)env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');
}
(async()=>{
  for(const [variable,file,slug]of [['GLANCE','get-glance.php','dgu-at-glance'],['HOSTEL','get-hostel-life.php','hostel-life'],['INTERNATIONAL','get-international.php','office-of-international-affairs']]){
    try{
      const key=(env[`NEXT_PUBLIC_DGU_${variable}_API_KEY`]||env.NEXT_PUBLIC_DGU_MENU_API_KEY||'').trim();
      if(!key)throw new Error('Set the existing NEXT_PUBLIC_DGU_MENU_API_KEY in .env.local.');
      const original=`https://dgu.ac.in/api/${file}`,configured=(env[`NEXT_PUBLIC_DGU_${variable}_API_URL`]||'').trim();
      const base=(env.NEXT_PUBLIC_DGU_API_BASE_URL||'https://dgu.ac.in/api').replace(/\/+$/,'');
      const response=await fetch(configured&&configured!==original?configured:`${base}/${file}`,{
        method:'POST',headers:{'Content-Type':'application/json',Apikey:key,'User-Agent':'Mozilla/5.0'},body:JSON.stringify({URL:slug}),cache:'no-store',signal:AbortSignal.timeout(20000),
      });
      const text=await response.text();if(!response.ok)throw new Error(`HTTP ${response.status}; check deployment and server access.`);
      let payload;try{payload=JSON.parse(text.replace(/^\uFEFF/,''));}catch{
        if(/(?:<title[^>]*>[^<]*(?:404|page not found)|<h[1-6][^>]*>\s*404)/i.test(text))throw new Error(`Missing API: upload server-api/api/${file} to public_html/api/${file}.`);
        throw new Error('The endpoint did not return JSON.');
      }
      if(String(payload.error)!=='0'||!payload.data?.page?.html?.trim())throw new Error('No active CMS content returned; check the key and published page.');
      console.log(`PASS ${variable}: CMS page ${payload.data.page.id}, ${payload.data.page.html.length} HTML characters, ${(payload.data.photos||[]).length} photos, ${(payload.data.videos||[]).length} videos.`);
    }catch(error){console.error(`FAIL ${variable}: ${error.message}`);process.exitCode=1;}
  }
})().catch(()=>{console.error('Page API checks could not be completed.');process.exitCode=1;});
