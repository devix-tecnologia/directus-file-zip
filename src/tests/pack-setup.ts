import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { logger } from './test-logger.js';

const execAsync = promisify(exec);

// Detecta qual comando Docker Compose está disponível
let dockerComposeCommand: string | null = null;

async function getDockerComposeCommand(): Promise<string> {
  if (dockerComposeCommand) {
    return dockerComposeCommand;
  }

  try {
    await execAsync('docker compose version');
    dockerComposeCommand = 'docker compose';
    logger.debug('Using Docker Compose v2 (docker compose)');
  } catch {
    try {
      await execAsync('docker-compose --version');
      dockerComposeCommand = 'docker-compose';
      logger.debug('Using Docker Compose v1 (docker-compose)');
    } catch {
      throw new Error(
        'Docker Compose not found. Please install Docker Compose v1 or v2.',
      );
    }
  }

  return dockerComposeCommand;
}

async function cleanupPackTestDocker() {
  try {
    logger.debug('Cleaning up pack test containers...');
    const composeCmd = await getDockerComposeCommand();
    const envVars = {
      ...process.env,
      DIRECTUS_VERSION: process.env.DIRECTUS_VERSION || '11.5.1',
    };
    await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml down --remove-orphans --volumes`,
      { env: envVars },
    );
    logger.debug('Pack test containers removed');
  } catch (error) {
    logger.warn('Warning while cleaning pack test containers');
  }
}

export async function generatePackage(): Promise<string> {
  logger.info('Generating package with pnpm pack...');

  try {
    const { stdout } = await execAsync('pnpm pack');
    const packageFile = stdout.trim();
    logger.info(`Package generated: ${packageFile}`);
    return packageFile;
  } catch (error: any) {
    logger.error('Failed to generate package:', error);
    throw new Error(`Failed to run pnpm pack: ${error.message}`);
  }
}

export async function setupPackTestEnvironment() {
  try {
    // Define versão padrão se não estiver definida
    if (!process.env.DIRECTUS_VERSION) {
      process.env.DIRECTUS_VERSION = '11.5.1';
    }

    // Limpa o ambiente Docker anterior
    await cleanupPackTestDocker();

    // Gera o pacote .tgz
    const packageFile = await generatePackage();
    logger.info(`Package ready: ${packageFile}`);

    // Constrói e sobe o Docker
    logger.info('Building Docker image with extension...');
    const composeCmd = await getDockerComposeCommand();

    const envVars = {
      ...process.env,
      DIRECTUS_VERSION: process.env.DIRECTUS_VERSION || '11.5.1',
    };

    // Build da imagem
    const { stdout: buildOut, stderr: buildErr } = await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml build --no-cache`,
      { env: envVars },
    );

    if (buildOut) logger.dockerProgress(buildOut);
    if (buildErr) logger.dockerProgress(buildErr);

    // Sobe o container
    logger.info('Starting pack test environment...');
    const { stdout, stderr } = await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml up -d`,
      { env: envVars },
    );

    if (stdout) logger.dockerProgress(stdout);
    if (stderr) logger.dockerProgress(stderr);

    // Aguarda o Directus estar pronto
    logger.info('Waiting for Directus to be ready...');
    await waitForDirectusReady();

    // Captura os logs para verificar se a extensão foi carregada
    logger.info('Checking extension loading in logs...');
    const logs = await getContainerLogs();

    return { packageFile, logs };
  } catch (error) {
    logger.error('Failed to setup pack test environment:', error);
    throw error;
  }
}

export async function teardownPackTestEnvironment() {
  try {
    logger.info('Shutting down pack test environment...');
    const composeCmd = await getDockerComposeCommand();
    const envVars = {
      ...process.env,
      DIRECTUS_VERSION: process.env.DIRECTUS_VERSION || '11.5.1',
    };
    await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml down --remove-orphans --volumes`,
      { env: envVars },
    );
  } catch (error) {
    logger.error('Error tearing down pack test environment:', error);
    throw error;
  }
}

async function waitForDirectusReady(retries = 60, delay = 2000) {
  const publicUrl = 'http://localhost:18056';

  for (let i = 0; i < retries; i++) {
    try {
      logger.debug(`Connection attempt ${i + 1}/${retries}`);

      const healthCheck = await axios.get(`${publicUrl}/server/health`, {
        timeout: 5000,
      });

      if (healthCheck.data.status === 'ok') {
        logger.info('Directus is ready!');
        return;
      }
    } catch (error: any) {
      if (i === retries - 1) {
        logger.error('Failed to connect to Directus', error);
        throw new Error('Directus failed to start');
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export async function getContainerLogs(): Promise<string> {
  try {
    const composeCmd = await getDockerComposeCommand();
    const { stdout } = await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml logs directus-pack-test`,
    );
    return stdout;
  } catch (error: any) {
    logger.error('Failed to get container logs:', error);
    return '';
  }
}

export async function checkExtensionInContainer(): Promise<boolean> {
  try {
    const composeCmd = await getDockerComposeCommand();
    const { stdout } = await execAsync(
      `${composeCmd} -f docker-compose.pack-test.yml exec -T directus-pack-test ls -la /directus/extensions/`,
    );

    logger.debug(`Extensions directory content: ${stdout}`);
    return stdout.includes('directus-file-zip');
  } catch (error: any) {
    logger.error('Failed to check extension in container:', error);
    return false;
  }
}
