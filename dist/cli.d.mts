import * as citty from 'citty';
import { ArgsDef } from 'citty';

declare const main: citty.CommandDef<ArgsDef>;
declare const runMain: () => Promise<void>;

export { main, runMain };
