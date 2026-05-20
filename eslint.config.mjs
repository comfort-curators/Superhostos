import path from 'node:path';
import { fileURLToPath } from 'node:url';
import next from 'eslint-config-next';
import { defineConfig } from 'eslint/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    extends: [...next],
  },
]);
