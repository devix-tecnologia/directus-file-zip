import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Vitest 5 no longer excludes build output by default; compiled specs live in dist/.
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
});
