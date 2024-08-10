import { JestConfigWithTsJest } from 'ts-jest/dist/types';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm', // Usar o preset específico para ESM
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.ts'],
  resetMocks: true,
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.esm.json',
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;
