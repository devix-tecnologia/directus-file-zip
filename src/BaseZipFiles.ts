import { resolve } from 'path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import { readdir } from 'fs/promises';

export class BaseZipFiles {
  protected _tempFolder: string;

  constructor() {
    this._tempFolder = resolve(tmpdir(), 'directus-zip-files', randomUUID());
  }

  async zip(zipFilename: string, fileTitle: string = zipFilename): Promise<string> {
    throw new Error('Implemented only on child classes');
  }

  protected async compressFile(zipFilename: string) {
    let zip = new AdmZip();
    (await this.readFilesFromFolder()).forEach((file) => {
      zip.addLocalFile(file);
    });
    const targetFileName = this.getFileFullPath(zipFilename);
    zip.writeZip(targetFileName);
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
    try {
      rmSync(this._tempFolder, {
        recursive: true,
        force: true,
        maxRetries: 2,
        retryDelay: 1000,
      });
    } catch (err) {
      const newError = new Error('Falha ao executar emptyTempFolder');
      (newError as any).cause = err;
      throw newError;
    }
  }
}
