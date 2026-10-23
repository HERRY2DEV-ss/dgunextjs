// Run only from the existing Next.js root. Never operate on the server's /api/ folder.
const fs = require('node:fs'), path = require('node:path');
if (!fs.existsSync('package.json') || !JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies?.next) {
  throw new Error('Run this script from the existing Next.js project root.');
}
for (const [filename, mode] of [['get-program-info.php', 'program'], ['get-programs.php', 'programs']]) {
  const file = path.join('server-api', 'api', filename);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  // Only remove our two short wrapper files. Preserve differently authored files.
  const own = /^\s*<\?php\s+require\s+__DIR__\s*\.\s*['"]\/dgu-academic-common\.php['"];\s*dgu_dispatch\(['"]([^'"]+)['"]\);\s*$/.exec(source);
  if (!own || own[1] !== mode) {
    console.log(`Preserved ${file}: it is not our custom wrapper.`);
    continue;
  }
  fs.unlinkSync(file);
  console.log(`Removed ${file}`);
}
console.log('Custom programme wrappers are removed from the project. Developer API files are unaffected.');
