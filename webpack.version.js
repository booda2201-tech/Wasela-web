const { generateVersion } = require('./scripts/generate-version');

/** `ng build` يعمل رقم إصدار جديد من وقت الـ build؛ `ng serve` يسيب رقم آخر build. */
const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
generateVersion({ isBuild: command === 'build' || command === 'b' });

module.exports = (config) => config;
