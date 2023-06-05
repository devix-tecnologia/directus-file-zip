import axios from 'axios';
import { readFile } from 'fs/promises';
import { IDirectusFile } from '../types/types';

export async function uploadZip(file: string): Promise<IDirectusFile> {
  const url = `${process.env.PUBLIC_URL}/files`;
  const fileBuffer = await readFile(file);
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: 'application/zip' }), file);

  const response = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${String(process.env.DIRECTUS_ACCESS_TOKEN)}`,
    },
  });
  return response.data;
}

export async function getFileDetails(fileUUID: string): Promise<IDirectusFile> {
  const url = `${process.env.PUBLIC_URL}/files/${fileUUID}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${String(process.env.DIRECTUS_ACCESS_TOKEN)}` },
  });
  return response.data;
}
