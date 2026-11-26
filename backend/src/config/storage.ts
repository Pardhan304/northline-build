import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from './env.js';

export interface UploadFileOptions {
  contentType: string;
}

export interface StorageAdapter {
  readonly providerName: string;
  upload(buffer: Buffer, key: string, options: UploadFileOptions): Promise<{ publicUrl: string }>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  exists(key: string): Promise<boolean>;
}

export class LocalStorageAdapter implements StorageAdapter {
  public readonly providerName = 'local';
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(rootDir: string, publicBaseUrl: string) {
    this.rootDir = path.resolve(rootDir);
    this.publicBaseUrl = publicBaseUrl.replace(/\/+$/, '');
  }

  private resolveSafePath(key: string): string {
    const cleanedKey = key.replace(/^[/\\]+/, '');
    const target = path.resolve(this.rootDir, cleanedKey);
    if (!target.startsWith(this.rootDir + path.sep) && target !== this.rootDir) {
      throw new Error('Invalid storage key path');
    }
    return target;
  }

  public async upload(
    buffer: Buffer,
    key: string,
    _options: UploadFileOptions,
  ): Promise<{ publicUrl: string }> {
    const filePath = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return { publicUrl: this.getPublicUrl(key) };
  }

  public async delete(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  public getPublicUrl(key: string): string {
    const normalizedKey = key.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    return `${this.publicBaseUrl}/${normalizedKey}`;
  }

  public async exists(key: string): Promise<boolean> {
    const filePath = this.resolveSafePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageAdapter: StorageAdapter = new LocalStorageAdapter(
  env.LOCAL_UPLOAD_DIR,
  env.PUBLIC_ASSET_BASE_URL,
);
