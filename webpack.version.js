const { generateVersion } = require('./scripts/generate-version');

/** `ng build` يزوّد رقم النسخة؛ `ng serve` يعرض الرقم الحالي بس. */
const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
generateVersion({ bump: command === 'build' || command === 'b' });

module.exports = (config) => config;
