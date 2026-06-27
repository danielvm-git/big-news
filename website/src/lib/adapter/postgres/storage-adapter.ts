// ---------------------------------------------------------------------------
// S3-compatible storage adapter — implements FileStorageAdapter
// ADR-0006: S3-compatible storage default; local FS dev-only fallback
// ---------------------------------------------------------------------------

import { randomUUID } from 'node:crypto';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { FileStorageAdapter } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOADS_DIR = join(process.cwd(), 'uploads');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateFile(file: { name: string; buffer: ArrayBuffer; mime_type: string }): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mime_type)) {
    throw new Error(
      `Invalid file type: ${file.mime_type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  if (file.buffer.byteLength > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    throw new Error(`File too large: max ${maxMb} MB`);
  }
}

function generateKey(fileName: string): string {
  const ext = extname(fileName);
  return `${randomUUID()}${ext}`;
}

// ---------------------------------------------------------------------------
// Local FS driver (dev-only)
// ---------------------------------------------------------------------------

async function localDriver(): Promise<FileStorageAdapter> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  return {
    async uploadFile(file, _options?) {
      validateFile(file);

      const key = generateKey(file.name);
      const filePath = join(UPLOADS_DIR, key);
      await writeFile(filePath, Buffer.from(file.buffer));

      return {
        url: `/uploads/${key}`,
        key,
      };
    },

    async getFileUrl(key: string) {
      return `/uploads/${key}`;
    },

    async deleteFile(key: string) {
      const filePath = join(UPLOADS_DIR, key);
      await unlink(filePath).catch(() => {
        // File may already be deleted — ignore
      });
    },
  };
}

// ---------------------------------------------------------------------------
// S3 driver (default)
// ---------------------------------------------------------------------------

async function s3Driver(): Promise<FileStorageAdapter> {
  const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  const region = process.env.S3_REGION ?? 'us-east-1';
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT; // Optional: for S3-compatible providers
  const publicUrlBase = process.env.S3_PUBLIC_URL; // Optional: custom CDN/public URL base

  if (!bucket) {
    throw new Error('Missing required env: S3_BUCKET');
  }

  const client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
  });

  return {
    async uploadFile(file, options?) {
      validateFile(file);

      const key = options?.path
        ? `${options.path}/${generateKey(file.name)}`
        : generateKey(file.name);

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: Buffer.from(file.buffer),
          ContentType: file.mime_type,
        })
      );

      const url = publicUrlBase
        ? `${publicUrlBase.replace(/\/$/, '')}/${key}`
        : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

      return { url, key };
    },

    async getFileUrl(key: string) {
      if (publicUrlBase) {
        return `${publicUrlBase.replace(/\/$/, '')}/${key}`;
      }
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    },

    async deleteFile(key: string) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a FileStorageAdapter backed by either S3 (default) or local FS.
 *
 * Driver selection:
 * - `STORAGE_DRIVER=local` → local FS under ./uploads (dev-only)
 * - unset / any other value → S3 (requires S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)
 */
export async function createStorageAdapter(): Promise<FileStorageAdapter> {
  const driver = process.env.STORAGE_DRIVER ?? 's3';

  if (driver === 'local') {
    return localDriver();
  }

  return s3Driver();
}

// Export for testing
export { localDriver };
