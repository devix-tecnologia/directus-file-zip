import { ApiExtensionContext } from '@directus/shared/types';
import { resolve } from 'path';
import { randomUUID } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { IZipConfig, IBaseZipClass } from './types/types';
import AdmZip from 'adm-zip';
import { readdir } from 'fs/promises';

class BackendZipFiles implements IBaseZipClass {
  private _ApiExtensionContext: ApiExtensionContext;
  private _filesUUID: string[];
  private _tempFolder: string;
  private _defaultStorage: string | undefined;

  constructor(filesUUID: string[], config: IZipConfig) {
    if (!config.ApiExtensionContext)
      throw new Error('You must provide ApiExtensionContext in the config parameter');

    this._ApiExtensionContext = config.ApiExtensionContext;
    this._filesUUID = filesUUID;
    this._defaultStorage = config.storage ?? 'local';
    this._tempFolder = resolve(__dirname, 'temp', randomUUID());
    this.createTempFolder();
  }

  async zip(zipFilename: string, fileTitle: string = zipFilename): Promise<string> {
    let uploadedFileUUID: string | null = null;
    try {
      await this.getFiles();
      await this.compressFile(zipFilename);
      const uploadResponse = await this.uploadFile(zipFilename, fileTitle);
      uploadedFileUUID = uploadResponse;
    } catch (err) {
      throw err;
    } finally {
      this.emptyTempFolder();
    }
    return uploadedFileUUID;
  }

  private async createAssetsService() {
    return new this._ApiExtensionContext.services.AssetsService({
      schema: await this._ApiExtensionContext.getSchema(),
    });
  }

  private async createFilesService() {
    return new this._ApiExtensionContext.services.FilesService({
      schema: await this._ApiExtensionContext.getSchema(),
    });
  }

  private async uploadFile(filename: string, title: string): Promise<string> {
    const filesService = await this.createFilesService();
    const fileStream = createReadStream(this.getFileFullPath(filename));
    return await filesService.uploadOne(fileStream, {
      filename_download: filename,
      title: title,
      type: 'application/zip',
      storage: this._defaultStorage,
    });
  }

  private async getFiles() {
    await Promise.all(
      this._filesUUID.map(async (file) => {
        return await this.getFile(file);
      }),
    );
  }

  private async getFile(fileUUID: string): Promise<void> {
    const assetsService = await this.createAssetsService();
    const { stream, file, stat } = await assetsService.getAsset(fileUUID, {});
    let writeStream = createWriteStream(this.getFileFullPath(file.filename_download));
    stream.pipe(writeStream);
    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  // TO PARENT CLASS

  private async compressFile(zipFilename: string) {
    let zip = new AdmZip();
    (await this.readFilesFromFolder()).forEach((file) => {
      zip.addLocalFile(file);
    });
    zip.writeZip(this.getFileFullPath(zipFilename));
  }

  private async readFilesFromFolder() {
    const filenames = await readdir(this._tempFolder);
    return filenames.map((file) => this.getFileFullPath(file));
  }

  private createTempFolder() {
    if (!existsSync(this._tempFolder)) {
      mkdirSync(this._tempFolder, { recursive: true });
    }
  }

  private getFileFullPath(filename: string) {
    return resolve(this._tempFolder, filename);
  }

  private emptyTempFolder() {
    rmSync(this._tempFolder, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 1000,
    });
  }
}

export { BackendZipFiles };
