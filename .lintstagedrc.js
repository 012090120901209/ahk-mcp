// NOTE:
// This repository is "type": "module". Tools like lint-staged will treat
// *.js configs as ESM and will error if they use `module.exports`.
//
// Keep this file as a small ESM shim so older tooling that explicitly looks for
// .lintstagedrc.js still works, while the actual config lives in .lintstagedrc.cjs.

import config from './.lintstagedrc.cjs';

export default config;
