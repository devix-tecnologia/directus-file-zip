import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { setupTestEnv, testEnv } from './test-env.js';
import { logger } from './test-logger.js';

const execAsync = promisify(exec);

// Detecta qual comando Docker Compose está disponível
let dockerComposeCommand: string | null = null;

async function getDockerComposeCommand(): Promise<string> {
  if (dockerComposeCommand) {
    return dockerComposeCommand;
  }

  try {
    // Tenta docker compose (v2)
    await execAsync('docker compose version');
    dockerComposeCommand = 'docker compose';
    logger.debug('Using Docker Compose v2 (docker compose)');
  } catch {
    try {
      // Fallback para docker-compose (v1)
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

async function cleanupDocker() {
  try {
    logger.debug('Cleaning up test containers...');
    const composeCmd = await getDockerComposeCommand();
    await execAsync(
      `DIRECTUS_VERSION=${process.env.DIRECTUS_VERSION} ${composeCmd} -f docker-compose.test.yml down --remove-orphans`,
    );
    logger.debug('Test containers removed');
  } catch (error) {
    logger.warn('Warning while cleaning test containers');
  }
}

export async function setupTestEnvironment() {
  try {
    // Limpa o ambiente Docker
    await cleanupDocker();

    // Configura o ambiente de teste
    const restoreEnv = setupTestEnv();

    // Start Docker containers
    logger.info('Starting test environment...');
    const composeCmd = await getDockerComposeCommand();
    const { stdout, stderr } = await execAsync(
      `DIRECTUS_VERSION=${process.env.DIRECTUS_VERSION} ${composeCmd} -f docker-compose.test.yml up -d`,
    );

    // Docker Compose uses stderr for progress messages
    const realError =
      stderr && !stderr.includes('Creating') && !stderr.includes('Starting');
    if (realError) {
      logger.error('Docker Compose error:', stderr);
    } else if (stdout || stderr) {
      logger.dockerProgress(stdout || stderr);
    }

    // Wait for Directus to be ready
    logger.info('Waiting for Directus to be ready...');
    await waitForBootstrap();

    // Login to get admin access token
    const loginResponse = await axios.post(`${testEnv.DIRECTUS_PUBLIC_URL}/auth/login`, {
      email: testEnv.DIRECTUS_ADMIN_EMAIL,
      password: testEnv.DIRECTUS_ADMIN_PASSWORD,
    });

    const accessToken = loginResponse.data.data.access_token;

    // Set access token for tests
    process.env.DIRECTUS_ACCESS_TOKEN = accessToken;

    return accessToken;
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}

export async function teardownTestEnvironment() {
  try {
    logger.info('Shutting down test environment...');
    const composeCmd = await getDockerComposeCommand();
    await execAsync(
      `DIRECTUS_VERSION=${process.env.DIRECTUS_VERSION} ${composeCmd} -f docker-compose.test.yml down --remove-orphans`,
    );
  } catch (error) {
    console.error('Erro ao finalizar ambiente de teste:', error);
    throw error;
  }
}

async function waitForBootstrap(retries = 90, delay = 2000) {
  logger.info(`Waiting for Directus to start (max ${(retries * delay) / 1000}s)...`);

  for (let i = 0; i < retries; i++) {
    try {
      logger.debug(`Connection attempt ${i + 1}/${retries}`);

      // Check if server is responding
      const healthCheck = await axios.get(`${testEnv.DIRECTUS_PUBLIC_URL}/server/health`, {
        timeout: 5000,
      });

      if (healthCheck.data.status !== 'ok') {
        logger.debug(`Health check returned: ${JSON.stringify(healthCheck.data)}`);
        throw new Error('Health check failed');
      }

      logger.debug('Health check OK, attempting authentication...');

      // Try to login to verify if the system is fully ready
      try {
        await axios.post(
          `${testEnv.DIRECTUS_PUBLIC_URL}/auth/login`,
          {
            email: testEnv.DIRECTUS_ADMIN_EMAIL,
            password: testEnv.DIRECTUS_ADMIN_PASSWORD,
          },
          { timeout: 5000 }
        );
        logger.info(`Directus is ready (took ${(i + 1) * delay / 1000}s)`);
        return;
      } catch (loginError: any) {
        logger.debug(`Login attempt failed: ${loginError.message}`);
        throw new Error('System not ready for authentication');
      }
    } catch (error: any) {
      if (i === retries - 1) {
        logger.error('Failed to connect to Directus after all retries');
        logger.error(`Last error: ${error.message}`);
        // Dump docker logs for debugging
        try {
          const composeCmd = await getDockerComposeCommand();
          const { stdout: logs } = await execAsync(
            `${composeCmd} -f docker-compose.test.yml logs --tail=100`
          );
          logger.error('Docker container logs:');
          console.error(logs);
        } catch (logError) {
          logger.error('Failed to get docker logs');
        }
        throw new Error(`Directus failed to start after ${(retries * delay) / 1000}s`);
      }
      // Only show progress every 10 attempts to reduce noise
      if (i % 10 === 0 && i > 0) {
        logger.debug(`Still waiting... (${i}/${retries} attempts)`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
