# Directus File Zip

[![npm version](https://badge.fury.io/js/%40devix-tecnologia%2Fdirectus-file-zip.svg)](https://badge.fury.io/js/%40devix-tecnologia%2Fdirectus-file-zip)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Pack a list of Directus files from their UUIDs into a ZIP file and save it to Directus Assets.

## 🚀 Features

- ✅ Works inside Directus Backend (Extensions) and outside via REST API
- ✅ Support for multiple storage drivers (local, S3, etc.)
- ✅ TypeScript support
- ✅ Configurable compression
- ✅ Error handling and validation

## 📦 Installation

```bash
npm install @devix-tecnologia/directus-file-zip
```

or

```bash
pnpm add @devix-tecnologia/directus-file-zip
```

## ⚙️ Configuration

Set your Directus access token in your `.env` file:

```env
DIRECTUS_ACCESS_TOKEN=your_access_token_here
PUBLIC_URL=http://localhost:8055  # Your Directus instance URL
```

> **Note:** The access token must have proper permissions to read files and create new assets.

## 📖 Usage

### 🔧 Inside Directus Backend (Extension Endpoint)

Use this approach when creating Directus extensions or hooks:

```typescript
import { directusZipFiles } from '@devix-tecnologia/directus-file-zip';

export default defineEndpoint((router, ctx) => {
  router.get('/', async (req, res) => {
    try {
      // Get all files from Directus storage
      const { FilesService } = ctx.services;
      const filesService = new FilesService({
        schema: req.schema,
      });

      const files = await filesService.readByQuery({});
      const fileIds = files.map((file) => file.id);

      // Create ZIP file
      const compressedId = await directusZipFiles(
        fileIds,
        'compressed.zip',
        'My Compressed Files',
        {
          ApiExtensionContext: ctx,
          storage: 'local', // or 's3', 'gcs', etc.
        },
      );

      res.json({
        success: true,
        fileId: compressedId,
        message: 'ZIP file created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
});
```

### 🌐 Outside Directus Backend (REST API)

Use this approach for external applications or scripts:

```typescript
import { directusZipFiles } from '@devix-tecnologia/directus-file-zip';

async function createZipFile() {
  try {
    const config = {
      accessToken: process.env.DIRECTUS_ACCESS_TOKEN!,
      baseURL: process.env.PUBLIC_URL || 'http://localhost:8055',
    };

    const fileIds = [
      '6e710d5b-1d2b-43f6-941a-32e74d9808b9',
      '8b710d5b-1d2b-43f6-941a-32e74d9808c5',
    ];

    const uploadedFileId = await directusZipFiles(
      fileIds,
      'my-archive.zip',
      'Archive Files',
      config,
    );

    console.log('ZIP file created with ID:', uploadedFileId);
    return uploadedFileId;
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw error;
  }
}

// Usage
createZipFile();
```

## 📋 API Reference

### `directusZipFiles(fileIds, filename, title, config)`

#### Parameters

| Parameter  | Type       | Required | Description                                    |
| ---------- | ---------- | -------- | ---------------------------------------------- |
| `fileIds`  | `string[]` | ✅       | Array of Directus file UUIDs to include in ZIP |
| `filename` | `string`   | ✅       | Name of the ZIP file (with .zip extension)     |
| `title`    | `string`   | ✅       | Title/description for the file in Directus     |
| `config`   | `Config`   | ✅       | Configuration object (see below)               |

#### Config Object

**For Backend Extensions:**

```typescript
{
  ApiExtensionContext: DirectusExtensionContext;
  storage?: string; // Storage driver name (default: 'local')
}
```

**For REST API:**

```typescript
{
  accessToken: string; // Directus access token
  baseURL: string; // Directus instance URL
}
```

#### Returns

- `Promise<string>`: UUID of the created ZIP file in Directus

## 🧪 Development & Testing

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- pnpm (recommended) or npm

### Setup Test Environment

1. **Start Directus instance:**

   ```bash
   docker compose up -d
   ```

2. **Configure Directus:**
   - Go to Directus Admin Panel (http://localhost:8055)
   - Create an admin user
   - Generate an access token with file permissions

3. **Set environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env and add your DIRECTUS_ACCESS_TOKEN
   ```

4. **Install dependencies:**

   ```bash
   pnpm install
   ```

5. **Run tests:**
   ```bash
   pnpm test      # Run all tests
   pnpm lint      # Check code formatting
   pnpm typecheck # Check TypeScript types
   ```

## 🛠️ Development Scripts

```bash
pnpm build     # Build the package
pnpm clean     # Clean build artifacts
pnpm format    # Format code with Prettier
pnpm lint      # Check code formatting
pnpm typecheck # TypeScript type checking
pnpm test      # Run tests with Vitest
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- **Roberto Seba** - [roberto@robertoseba.com](mailto:roberto@robertoseba.com) - [@robertoseba](https://github.com/robertoseba)
- **Sidarta Veloso** - [sidartaveloso@gmail.com](mailto:sidartaveloso@gmail.com) - [@sidartaveloso](https://github.com/sidartaveloso)

## 🏢 Organization

[Devix Tecnologia Ltda.](https://github.com/devix-tecnologia)

---

Made with ❤️ by [Devix Tecnologia](https://github.com/devix-tecnologia).
