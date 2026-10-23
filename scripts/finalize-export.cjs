// Add scoped academic/news rules; preserve other copied deployment rules.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),target=path.join(root,'out/.htaccess');
const existing=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
const retained=existing.replace(/# BEGIN DGU (?:ACADEMIC|NEWS) CLEAN URLS[\s\S]*?# END DGU (?:ACADEMIC|NEWS) CLEAN URLS\s*/g,'');
const rules=['academic-urls.htaccess','news-urls.htaccess'].map(name=>fs.readFileSync(path.join(root,'deployment',name),'utf8')).join('\n');
fs.writeFileSync(target,rules+'\n'+retained);
if(!fs.existsSync(path.join(root,'out/news/index.html')))throw new Error('News export missing: upload must include out/news/.');
console.log('Static export includes clean academic/news routes. Upload the complete out folder, including .htaccess.');
