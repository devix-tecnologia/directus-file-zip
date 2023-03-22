import { RemoteZipFiles } from './RemoteZipFiles';
import { IZipConfig } from './types/types';

async function directusZipFiles(
  filesUUID: string[],
  zipFilename: string,
  zipFileTitle: string,
  config: IZipConfig,
) {
  if (config.ApiExtensionContext) {
    // return new LocalZipFiles(filesUUID, config).execute(zipFilename);
  }
  if (config.accessToken) {
    return new RemoteZipFiles(filesUUID, config).zip(zipFilename, zipFileTitle);
  }

  throw new Error(
    'You have to specify in the config either accessToken or the ApiExtensionContext',
  );
}

async function test() {
  const files = [
    '73027644-0a74-4674-982c-41b6bfbcdf06',
    'bb72413e-5ca9-408f-ac1d-08b354509032',
    '73027644-0a74-4674-982c-41b6bfbcdf06',
  ];
  const fileid = await directusZipFiles(files, 'contrato.zip', 'Contratos-usuário X', {
    accessToken: 'xcapZarUYfzlUqHJysV5SsZBPwumttt9',
    baseURL: process.env.PUBLIC_URL ?? 'http://localhost:8055',
  });
  console.log(fileid);
}

test();
