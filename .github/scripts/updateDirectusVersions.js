// Script para atualizar src/tests/directus-versions.ts com as versões não-deprecadas do Directus
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const versionsPath = path.resolve(__dirname, '../../src/tests/directus-versions.js');

// Importa versões bloqueadas do arquivo de versões
import { blockedDirectusVersions } from '../../src/tests/directus-versions.js';

// Versões fixas que você quer sempre testar
const fixedVersions = ['9.23.1', '9.22.4', '9.24.0', '10.8.3', '11.10.2'];

// Número de dias de "cooldown" antes de adotar uma nova versão
// Configurável via variável de ambiente DIRECTUS_VERSION_MIN_AGE_DAYS (padrão: 7 dias)
const MIN_VERSION_AGE_DAYS = parseInt(
  process.env.DIRECTUS_VERSION_MIN_AGE_DAYS || '7',
  10,
);

function getAllDirectusVersions() {
  return new Promise((resolve, reject) => {
    https
      .get('https://registry.npmjs.org/directus', (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const now = new Date();
            const minAgeMs = MIN_VERSION_AGE_DAYS * 24 * 60 * 60 * 1000;

            const versions = Object.entries(json.versions)
              .filter(([v, meta]) => {
                // Filtra versões deprecadas e bloqueadas
                if (meta.deprecated || blockedDirectusVersions.includes(v)) {
                  return false;
                }

                // Filtra apenas versões com formato semântico
                if (!/^\d+\.\d+\.\d+$/.test(v)) {
                  return false;
                }

                // Versões fixas sempre são incluídas (bypass do filtro de idade)
                if (fixedVersions.includes(v)) {
                  return true;
                }

                // Verifica idade da versão
                const publishDate = new Date(json.time[v]);
                const ageMs = now - publishDate;
                return ageMs >= minAgeMs;
              })
              .map(([v]) => v);

            resolve(versions);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function updateVersions() {
  let allVersions = [];
  try {
    console.log(
      `Fetching Directus versions with minimum age of ${MIN_VERSION_AGE_DAYS} days...`,
    );
    allVersions = await getAllDirectusVersions();
  } catch (e) {
    console.warn(
      'Não foi possível buscar as versões do Directus, mantendo apenas as fixas.',
    );
    console.error(e);
  }
  // Mantém as últimas 5 versões não-deprecadas (que já passaram pelo filtro de idade)
  const latestVersions = allVersions.slice(-5);
  // Junta as fixas, as últimas e o "latest"
  const uniqueVersions = Array.from(
    new Set([...fixedVersions, ...latestVersions, 'latest']),
  );

  // Lê o conteúdo atual do arquivo
  let fileContent = fs.readFileSync(versionsPath, 'utf8');
  // Substitui apenas o array directusVersions
  const newArray = `export const directusVersions = [\n  '${uniqueVersions.join("',\n  '")}',\n];`;
  fileContent = fileContent.replace(
    /export const directusVersions = \[[^\]]*\];/m,
    newArray,
  );
  fs.writeFileSync(versionsPath, fileContent);
  console.log('Directus versions updated in directus-versions.js:', uniqueVersions);
  console.log('Blocked Directus versions:', blockedDirectusVersions);
  console.log(`Version age filter: ${MIN_VERSION_AGE_DAYS} days`);
}

updateVersions();
