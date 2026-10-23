// Remove only generated export output before build; never modify public assets.
const fs = require('node:fs');
const path = require('node:path');
fs.rmSync(path.resolve(__dirname, '../out'), { recursive: true, force: true });
