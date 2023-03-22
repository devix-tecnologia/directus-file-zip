import { BackendZipFiles } from './BackendZipFiles';
import { RemoteZipFiles } from './RemoteZipFiles';
import { IZipConfig } from './types/types';

async function directusZipFiles(
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

export { directusZipFiles };
