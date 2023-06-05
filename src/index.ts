import BackendZipFiles from './BackendZipFiles.js';
import RemoteZipFiles from './RemoteZipFiles.js';
import type { IZipConfig } from './types/types';

export async function directusZipFiles(
  filesUUID: string[],
  zipFilename: string,
  zipFileTitle: string,
  config: IZipConfig,
) {
  if (config.ApiExtensionContext) {
    return new BackendZipFiles(filesUUID, config).zip(zipFilename, zipFileTitle);
  }
  if (config.accessToken) {
    return new RemoteZipFiles(filesUUID, config).zip(zipFilename, zipFileTitle);
  }

  throw new Error(
    'You have to specify in the config either accessToken or the ApiExtensionContext',
  );
}
