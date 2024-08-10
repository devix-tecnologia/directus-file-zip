// Docker-compose should be up for this test to run
// Run Directus instance. Create access_key for admin
// set key in the .env.dev file DIRECTUS_ACCESS_TOKEN="xxxxx"


import { directusZipFiles } from '..';
import * as dotenv from 'dotenv';
import { uploadZip, getFileDetails } from './helper_test';
import { resolve } from 'path';

dotenv.config({ path: `${process.cwd()}/.env.dev` });

// jest.setTimeout(20000);

if (!process.env.PUBLIC_URL) throw new Error('PUBLIC_URL not set in .env.dev');

describe('directusZipFiles', () => {
  test('Compress files and saves to Directus', async () => {
    // jest.setTimeout(20000);
    const FileForDownload = await uploadZip(resolve(process.cwd(), 'package.json'));
    const res = await directusZipFiles(
      [FileForDownload?.data.id],
      'compressed.zip',
      'File title',
      {
        accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
        baseURL: process.env.PUBLIC_URL ?? 'http://localhost:8055',
      },
    );
    if (!res) throw new Error('Axios failed');
    const fileDetails = await getFileDetails(res);
    expect(res).not.toBeNull();
    expect(fileDetails.data.filename_download).toBe('compressed.zip');
    expect(fileDetails.data.type).toBe('application/zip');
  });
});
