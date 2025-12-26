// NOTE:
// This repository is "type": "module". Prettier will treat .prettierrc.js as ESM.
// Keep this file as an ESM shim, delegating to the CJS config in .prettierrc.cjs.

import config from './.prettierrc.cjs';

export default config;
