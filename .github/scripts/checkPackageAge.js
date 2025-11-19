#!/usr/bin/env node

/**
 * Script para verificar idade de packages antes de instalar
 * Uso: node .github/scripts/checkPackageAge.js [package-name]
 */

import https from 'node:https';

const MIN_AGE_DAYS = parseInt(process.env.PACKAGE_MIN_AGE_DAYS || '5', 10);

function getPackageInfo(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}`;
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function getPackageAge(publishDate) {
  const now = new Date();
  const published = new Date(publishDate);
  const ageInMs = now - published;
  const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
  return ageInDays;
}

async function checkPackage(packageName, version = 'latest') {
  try {
    console.log(`Checking ${packageName}@${version}...`);
    const packageInfo = await getPackageInfo(packageName);
    
    const versionToCheck = version === 'latest' 
      ? packageInfo['dist-tags'].latest 
      : version;
    
    const publishDate = packageInfo.time[versionToCheck];
    
    if (!publishDate) {
      console.log(`⚠️  Version ${versionToCheck} not found for ${packageName}`);
      return false;
    }
    
    const age = getPackageAge(publishDate);
    const isOldEnough = age >= MIN_AGE_DAYS;
    
    if (isOldEnough) {
      console.log(`✅ ${packageName}@${versionToCheck} is ${age} days old (>= ${MIN_AGE_DAYS} days)`);
    } else {
      console.log(`❌ ${packageName}@${versionToCheck} is only ${age} days old (< ${MIN_AGE_DAYS} days)`);
    }
    
    return isOldEnough;
  } catch (error) {
    console.error(`Error checking ${packageName}:`, error.message);
    return false;
  }
}

// CLI usage
const packageArg = process.argv[2];
if (packageArg) {
  const [name, version] = packageArg.split('@');
  checkPackage(name, version || 'latest').then((result) => {
    process.exit(result ? 0 : 1);
  });
} else {
  console.log('Usage: node checkPackageAge.js <package-name>[@version]');
  console.log(`Current minimum age: ${MIN_AGE_DAYS} days`);
  process.exit(1);
}
