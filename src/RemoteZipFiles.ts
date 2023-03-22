import { IDirectusFile, IZipConfig } from './types/types';
import { resolve } from 'path';
import { createWriteStream } from 'node:fs';
import axios from 'axios';
import { readFile } from 'node:fs/promises';
import { BaseZipFiles } from './BaseZipFiles';

/**
 * Downloads Directus files, zips them, and uploads to Directus
 * @returns string | Uploaded file UUID
 */
class RemoteZipFiles extends BaseZipFiles {
  private _token: string;
  private _filesUUID: string[];
  private _baseURL: string;

  constructor(filesUUID: string[], config: IZipConfig) {
    super();
    if (!config.accessToken || !config.baseURL)
      throw new Error('You must provide access token in the config parameter');

    this._token = config.accessToken;
    this._baseURL = config.baseURL;
    this._filesUUID = filesUUID;
    this.createTempFolder();
  }

  async zip(zipFilename: string, fileTitle: string = zipFilename): Promise<string> {
    let uploadedFileUUID: string | null = null;
    try {
      await this.downloadFiles();
      await this.compressFile(zipFilename);
      const uploadResponse = await this.uploadZip(zipFilename, fileTitle);
      this.emptyTempFolder();
      uploadedFileUUID = uploadResponse.data.id;
    } catch (err) {
      throw err;
    } finally {
      this.emptyTempFolder();
    }
    return uploadedFileUUID;
  }

  // PRIVATE METHODS

  private async downloadFiles() {
    await Promise.all(
      this._filesUUID.map(async (file) => {
        return await this.downloadFile(file);
      }),
    );
  }

  private async downloadFile(fileUUID: string): Promise<void> {
    const fileDetails = await this.getFileDetails(fileUUID);
    const url = `${this._baseURL}/assets/${fileUUID}?download`;
    const destFile = resolve(
      this._tempFolder,
      fileDetails.data.filename_download ?? fileDetails.data.filename_disk,
    );
    const writer = createWriteStream(destFile);

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${this._token}` },
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private async getFileDetails(fileUUID: string): Promise<IDirectusFile> {
    const url = `${this._baseURL}/files/${fileUUID}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${this._token}` },
    });
    return response.data;
  }

  private async uploadZip(filename: string, title: string): Promise<IDirectusFile> {
    const url = `${this._baseURL}/files`;
    const filePath = this.getFileFullPath(filename);
    const fileBuffer = await readFile(filePath);
    const formData = new FormData();
    formData.append('title', title);
    formData.append(
      'file',
      new Blob([fileBuffer], { type: 'application/zip' }),
      filename,
    );

    const response = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${this._token}`,
      },
    });
    return response.data;
  }
}

export { RemoteZipFiles };
