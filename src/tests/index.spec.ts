import { directusZipFiles } from '../index.js';
import { uploadZip, getFileDetails } from './helper_test.js';
import { resolve } from 'path';
import { setupTestEnvironment, teardownTestEnvironment } from './setup.js';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { logger } from './test-logger.js';

import { directusVersions } from './directus-versions.js';

describe.each(directusVersions)(
  'directusZipFiles Integration Tests - Directus %s',
  (version) => {
    let accessToken: string;

    beforeEach(() => {
      logger.setCurrentTest(`Directus ${version}`);
    });

    let file1Id: string;
    let file2Id: string;
    beforeAll(async () => {
      process.env.DIRECTUS_VERSION = version;
      accessToken = await setupTestEnvironment();
      const file1 = await uploadZip(resolve(process.cwd(), 'package.json'));
      const file2 = await uploadZip(resolve(process.cwd(), 'README.md'));
      file1Id = file1?.data.id;
      file2Id = file2?.data.id;
    }, 120000); // Timeout específico para o beforeAll

    afterAll(async () => {
      await teardownTestEnvironment();
    });

    test('Compress single file and save to Directus', async () => {
      expect(process.env.DIRECTUS_ACCESS_TOKEN).toBeDefined();
      const res = await directusZipFiles([file1Id], 'compressed.zip', 'File title', {
        accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
        baseURL: process.env.DIRECTUS_PUBLIC_URL,
      });
      if (!res) throw new Error('Axios failed');
      const fileDetails = await getFileDetails(res);
      expect(res).not.toBeNull();
      expect(fileDetails.data.filename_download).toBe('compressed.zip');
      expect(fileDetails.data.type).toBe('application/zip');
      expect(fileDetails.data.title).toBe('File title');
    }, 60000);

    test('Compress multiple files and save to Directus', async () => {
      const res = await directusZipFiles(
        [file1Id, file2Id],
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
