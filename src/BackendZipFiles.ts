import type { ApiExtensionContext } from '@directus/shared/types';
import { createReadStream, createWriteStream } from 'node:fs';
import type { IZipConfig } from './types/types';
import { BaseZipFiles } from './BaseZipFiles.js';

export default class BackendZipFiles extends BaseZipFiles {
  private _ApiExtensionContext: ApiExtensionContext;
  private _filesUUID: string[];
  private _defaultStorage: string | undefined;

  constructor(filesUUID: string[], config: IZipConfig) {
    super();
    if (!config.ApiExtensionContext)
      throw new Error('You must provide ApiExtensionContext in the config parameter');

    this._ApiExtensionContext = config.ApiExtensionContext;
    this._filesUUID = filesUUID;
    this._defaultStorage = config.storage ?? 'local';
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
}
