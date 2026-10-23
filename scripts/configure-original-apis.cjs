// Run from your existing Next.js root. Updates only public DGU API settings.
const fs = require('node:fs');
const packageFile = 'package.json', envFile = '.env.local';
if (!fs.existsSync(packageFile) || !JSON.parse(fs.readFileSync(packageFile, 'utf8')).dependencies?.next) {
  throw new Error('Run this script from the existing Next.js project root.');
}
const base = 'https://dgu.ac.in/api';
const key = 'e33af7151e5cce3e14fff44c544e3c9fb9e0bece8a8d3ede63df4598012153e1';
const settings = {
  NEXT_PUBLIC_DGU_API_BASE_URL: base,
  NEXT_PUBLIC_DGU_MENU_API_URL: `${base}/get-menus.php`,
  NEXT_PUBLIC_DGU_MENU_API_METHOD: 'POST', NEXT_PUBLIC_DGU_MENU_API_AUTH: 'header',
  NEXT_PUBLIC_DGU_MENU_API_KEY: key,
  NEXT_PUBLIC_DGU_CLUB_API_URL: `${base}/get-club.php`, NEXT_PUBLIC_DGU_CLUB_API_KEY: key,
  NEXT_PUBLIC_DGU_REVIEWS_API_URL: `${base}/get-reviews.php`, NEXT_PUBLIC_DGU_REVIEWS_API_KEY: key,
  NEXT_PUBLIC_DGU_FACULTY_API_KEY: key,
  NEXT_PUBLIC_DGU_RECRUITERS_API_URL: `${base}/get-recruiters.php`, NEXT_PUBLIC_DGU_RECRUITERS_API_KEY: key,
  NEXT_PUBLIC_DGU_ADMISSIONS_API_URL: `${base}/get-admissions.php`, NEXT_PUBLIC_DGU_ADMISSIONS_API_KEY: key,
  NEXT_PUBLIC_DGU_DIFFERENTIATORS_API_URL: `${base}/get-differentiators.php`, NEXT_PUBLIC_DGU_DIFFERENTIATORS_API_KEY: key,
  NEXT_PUBLIC_HOMEPAGE_DATA_API: `${base}/next-homepage-data.php`,
};
const previous = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
if (previous) fs.copyFileSync(envFile, `${envFile}.before-original-apis-${Date.now()}.bak`);
const lines = previous.split(/\r?\n/).filter(line => {
  const assignment = line.match(/^\s*([A-Z0-9_]+)\s*=/);
  return !assignment || !Object.hasOwn(settings, assignment[1]);
});
const retained = lines.join('\n').replace(/\n*$/, '');
const configured = Object.entries(settings).map(([name, value]) => `${name}=${JSON.stringify(value)}`).join('\n');
fs.writeFileSync(envFile, (retained ? retained + '\n' : '') + configured + '\n');
console.log('Original DGU API endpoints and the supplied Apikey are configured. Restart dev, or rebuild for production.');
