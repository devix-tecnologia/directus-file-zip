# Directus-file-zip

Packs a list of Directus files from their UUIDs into a Zip file.

## Instalation:

```
npm install @devix/directus-file-zip
```

Set `DIRECTUS_ACCESS_TOKEN` in your .env file with a access_token with the proper rights to access the files.

## Usage:

```
npm install @devix/directus-file-zip
```

This package can be used inside a Directus Backend or outside using the REST API.

### Using inside Directus (ie. Extension Endpoint):

```ts
import { directusZipFiles } from '@devix/directus-file-zip';

export default defineEndpoint((router, ctx) => {
  router.get('/', async (_req, res) => {
    // In this example we zip all the files in Directus storage
    const { FilesService } = ctx.services;
    const filesService = new FilesService({
      schema: _req.schema,
    });

    const files = await filesService.readByQuery({});
    const filesIds = files.map((file) => file.id);

    // Using the package. Consider wraping this call in a try/catch block.
    const compressedID = await directusZipFiles(filesIds, 'compressed.zip', 'compress', {
      ApiExtensionContext: ctx,
      storage: 'local',
    });

    res.json(compressedID);
  });
});
```

<br /><br />

### Using it outside Directus Backend:

```ts
import { directusZipFiles } from '@devix/directus-file-zip';

const config = {
  accessToken: String(process.env.DIRECTUS_ACCESS_TOKEN),
  baseURL: process.env.PUBLIC_URL ?? 'http://localhost:8055',
};

const uploadedFileUUID = await directusZipFiles(
  ['6e710d5b-1d2b-43f6-941a-32e74d9808b9', '8b710d5b-1d2b-43f6-941a-32e74d9808c5'],
  'compressed.zip',
  'File title',
  config,
);
```

## Test with Directus (only for API calls):

- Start Docker-compose `docker-compose up -d`
- Go to Directus Admin and create an access token
- Write the token to the .env.dev file -> DIRECTUS_ACCESS_TOKEN: "xxxxxx"
- `npm test`
