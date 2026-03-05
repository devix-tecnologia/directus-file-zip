import { describe, test, expect, afterEach } from 'vitest';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { BaseZipFiles } from '../BaseZipFiles.js';

/**
 * Classe concreta para testar BaseZipFiles (que é abstrata na prática).
 */
class TestableZipFiles extends BaseZipFiles {
  get tempFolder() {
    return this._tempFolder;
  }

  createFolder() {
    this.createTempFolder();
  }

  cleanup() {
    this.emptyTempFolder();
  }
}

describe('BaseZipFiles', () => {
  let instance: TestableZipFiles;

  afterEach(() => {
    try {
      instance?.cleanup();
    } catch {
      // ignora se já foi limpo
    }
  });

  test('deve usar diretório temporário do sistema operacional (os.tmpdir), não __dirname', () => {
    instance = new TestableZipFiles();
    const tempFolder = instance.tempFolder;

    // O tempFolder deve começar com o tmpdir do SO
    expect(tempFolder).toContain(tmpdir());

    // O tempFolder NÃO deve estar dentro de node_modules ou do diretório do pacote
    expect(tempFolder).not.toContain('node_modules');
    expect(tempFolder).not.toContain('dist/esm');
    expect(tempFolder).not.toContain('dist/cjs');
  });

  test('deve criar o diretório temporário dentro de os.tmpdir com sucesso', () => {
    instance = new TestableZipFiles();
    instance.createFolder();

    expect(existsSync(instance.tempFolder)).toBe(true);
    expect(instance.tempFolder.startsWith(tmpdir())).toBe(true);
  });

  test('deve criar e limpar o diretório temporário corretamente', () => {
    instance = new TestableZipFiles();
    instance.createFolder();

    // Cria um arquivo dentro do temp para simular uso
    const testFile = `${instance.tempFolder}/test.txt`;
    writeFileSync(testFile, 'test content');
    expect(existsSync(testFile)).toBe(true);

    // Limpa
    instance.cleanup();
    expect(existsSync(instance.tempFolder)).toBe(false);
  });

  test('cada instância deve ter um diretório temporário único', () => {
    instance = new TestableZipFiles();
    const instance2 = new TestableZipFiles();

    expect(instance.tempFolder).not.toBe(instance2.tempFolder);

    // Ambos devem estar no tmpdir do SO
    expect(instance.tempFolder).toContain(tmpdir());
    expect(instance2.tempFolder).toContain(tmpdir());
  });

  test('deve usar o prefixo "directus-zip-files" no caminho temporário', () => {
    instance = new TestableZipFiles();
    expect(instance.tempFolder).toContain('directus-zip-files');
  });
});
