const { generateVersion } = require('./scripts/generate-version');

/** `ng build` يزوّد رقم الإصدار؛ `ng serve` يسيب رقم آخر build. */
const command = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
generateVersion({ isBuild: command === 'build' || command === 'b' });

module.exports = (config) => config;
