import { defineCommand, runMain as runMain$1 } from 'citty';
import { n as name, d as description, v as version } from './shared/facturx.CFMSzDVW.mjs';

const main = defineCommand({
  meta: {
    name,
    description,
    version
  },
  subCommands: {
    extract: () => import('./chunks/extract.mjs').then((r) => r.default),
    generate: () => import('./chunks/generate.mjs').then((r) => r.default),
    check: () => import('./chunks/check.mjs').then((r) => r.default)
  }
});
const runMain = () => runMain$1(main);

export { main, runMain };
