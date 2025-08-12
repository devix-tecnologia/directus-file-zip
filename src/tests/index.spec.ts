import { directusZipFiles } from '../index.js';
import { uploadZip, getFileDetails } from './helper_test.js';
import { resolve } from 'path';
import { setupTestEnvironment, teardownTestEnvironment } from './setup.js';
import { jest } from '@jest/globals';
import { logger } from './test-logger.js';

jest.setTimeout(120000); // Increase timeout for Docker operations

const directusVersions = [
  '9.23.1', // Versão atual
  '9.22.4', // Versão anterior
  '9.24.0', // Versão mais recente da série 9
  '10.8.3', // Última versão da série 10
];

describe.each(directusVersions)(
  'directusZipFiles Integration Tests - Directus %s',
  (version) => {
    let accessToken: string;

    beforeEach(() => {
      logger.setCurrentTest(`Directus ${version}`);
    });

    beforeAll(async () => {
      process.env.DIRECTUS_VERSION = version;
      accessToken = await setupTestEnvironment();
    }, 120000); // Timeout específico para o beforeAll

    afterAll(async () => {
      await teardownTestEnvironment();
    });

    test('Compress single file and save to Directus', async () => {
      // Ensure we have the access token from the setup
      expect(process.env.DIRECTUS_ACCESS_TOKEN).toBeDefined();

      const FileForDownload = await uploadZip(resolve(process.cwd(), 'package.json'));
      const res = await directusZipFiles(
        [FileForDownload?.data.id],
        'compressed.zip',
        'File title',
        {
          accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
          baseURL: process.env.DIRECTUS_PUBLIC_URL,
        },
      );
      if (!res) throw new Error('Axios failed');
      const fileDetails = await getFileDetails(res);
      expect(res).not.toBeNull();
      expect(fileDetails.data.filename_download).toBe('compressed.zip');
      expect(fileDetails.data.type).toBe('application/zip');
      expect(fileDetails.data.title).toBe('File title');
    }, 60000);

    test('Compress multiple files and save to Directus', async () => {
      const file1 = await uploadZip(resolve(process.cwd(), 'package.json'));
      const file2 = await uploadZip(resolve(process.cwd(), 'readme.md'));

      const res = await directusZipFiles(
        [file1?.data.id, file2?.data.id],
        'multiple.zip',
        'Multiple Files',
        {
          accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
          baseURL: process.env.DIRECTUS_PUBLIC_URL,
        },
      );
      if (!res) throw new Error('Axios failed');
      const fileDetails = await getFileDetails(res);
      expect(res).not.toBeNull();
      expect(fileDetails.data.filename_download).toBe('multiple.zip');
      expect(fileDetails.data.type).toBe('application/zip');
      expect(fileDetails.data.title).toBe('Multiple Files');
    }, 60000);

    test('Handle invalid file IDs gracefully', async () => {
      await expect(
        directusZipFiles(['invalid-id'], 'error.zip', 'Error Test', {
          accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
          baseURL: process.env.DIRECTUS_PUBLIC_URL,
        }),
      ).rejects.toThrow();
    }, 60000);
  },
);
