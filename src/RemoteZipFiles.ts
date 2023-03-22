import { IBaseZipClass, IDirectusFile, IZipConfig } from './types/types';
import { randomUUID } from 'crypto';
import { resolve } from 'path';
import { createWriteStream } from 'node:fs';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { readdir, readFile } from 'node:fs/promises';

class RemoteZipFiles implements IBaseZipClass {
  private _token: string;
  private _filesUUID: string[];
  private _baseURL: string;
  private _tempFolder: string;

  constructor(filesUUID: string[], config: IZipConfig) {
    if (!config.accessToken || !config.baseURL)
      throw new Error('You must provide access token in the config parameter');

    this._token = config.accessToken;
    this._baseURL = config.baseURL;
    this._filesUUID = filesUUID;
    this._tempFolder = resolve(__dirname, 'temp', randomUUID());
  }

  async zip(zipFilename: string, fileTitle: string = zipFilename): Promise<string> {
    await this.downloadFiles();
    await this.compressFile(zipFilename);
    return await this.uploadZip(zipFilename, fileTitle);
  }

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

  private async compressFile(zipFilename: string) {
    let zip = new AdmZip();
    (await this.readFilesFromFolder()).forEach((file) => zip.addLocalFile(file));
    zip.writeZip(zipFilename);
  }

  async uploadZip(filename: string, title: string): Promise<string> {
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
    console.log(response.data);
    return response.data.id;
  }

  private async readFilesFromFolder() {
    return await readdir(this._tempFolder);
  }

  private getFileFullPath(filename: string) {
    return resolve(this._tempFolder, filename);
  }
}

export { RemoteZipFiles };
