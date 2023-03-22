import { IZipConfig } from './types/types';

async function directusZipFiles(
  filesUUID: string[],
  zipFilename: string,
  config: IZipConfig,
) {
  if (config.ApiExtensionContext) {
    // return new LocalZipFiles(filesUUID, config).execute(zipFilename);
  }
  if (config.accessToken) {
    return new RemoteZipFiles(filesUUID, config).execute(zipFilename);
  }

  throw new Error(
    'You have to specify in the config either accessToken or the ApiExtensionContext',
  );
}
