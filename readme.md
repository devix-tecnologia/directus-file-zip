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

Code example:

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

## Test with Directus:

- Start Docker-compose `docker-compose up -d`
- Go to Directus Admin and create an access token
- Write the token to the .env.dev file -> DIRECTUS_ACCESS_TOKEN: "xxxxxx"
- `npm test`
