import { ApiExtensionContext } from '@directus/shared/types';
import { resolve } from 'path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import AdmZip from 'adm-zip';
import { readdir } from 'fs/promises';

class BaseZipFiles {
  protected _tempFolder: string;

  constructor() {
    this._tempFolder = resolve(__dirname, 'temp', randomUUID());
  }

  async zip(zipFilename: string, fileTitle: string = zipFilename): Promise<string> {
    throw new Error('Implemented only on child classes');
  }

  protected async compressFile(zipFilename: string) {
    let zip = new AdmZip();
    (await this.readFilesFromFolder()).forEach((file) => {
      zip.addLocalFile(file);
    });
    zip.writeZip(this.getFileFullPath(zipFilename));
  }

  protected async readFilesFromFolder() {
    const filenames = await readdir(this._tempFolder);
    return filenames.map((file) => this.getFileFullPath(file));
  }

  protected createTempFolder() {
    if (!existsSync(this._tempFolder)) {
      mkdirSync(this._tempFolder, { recursive: true });
    }
  }

  protected getFileFullPath(filename: string) {
    return resolve(this._tempFolder, filename);
  }

  protected emptyTempFolder() {
    rmSync(this._tempFolder, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 1000,
    });
  }
}

export { BaseZipFiles };
