import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';

/**
 * S3-compatible object storage backed by the shared MinIO instance
 * (healthai-infra, `app` network). Objects are stored privately and exposed to
 * clients via short-lived presigned GET URLs.
 *
 * Two clients are used on purpose:
 *  - `internal` talks to MinIO over the docker network (`http://minio:9000`)
 *    for server-side uploads/deletes.
 *  - `public` signs GET URLs against the host-published endpoint so a browser
 *    can actually resolve them (the signature covers the host, so it must match
 *    the URL the client will hit).
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly internal: S3Client;
  private readonly public: S3Client;
  private readonly bucket: string;
  private readonly presignTtl: number;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('MINIO_REGION', 'us-east-1');
    const accessKeyId = this.config.getOrThrow<string>('MINIO_ACCESS_KEY');
    const secretAccessKey = this.config.getOrThrow<string>('MINIO_SECRET_KEY');
    const credentials = { accessKeyId, secretAccessKey };

    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    this.presignTtl = Number(
      this.config.get<string>('MINIO_PRESIGN_TTL', '900'),
    );

    this.internal = new S3Client({
      region,
      endpoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      credentials,
      forcePathStyle: true,
    });

    this.public = new S3Client({
      region,
      endpoint: this.config.get<string>(
        'MINIO_PUBLIC_ENDPOINT',
        this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      ),
      credentials,
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.internal.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.log(`Bucket "${this.bucket}" absent, creating it`);
      try {
        await this.internal.send(
          new CreateBucketCommand({ Bucket: this.bucket }),
        );
      } catch (err) {
        this.logger.error(`Could not create bucket "${this.bucket}"`, err);
      }
    }
  }

  /** Uploads a file and returns the stored object key. */
  async put(file: Express.Multer.File, prefix = 'posts'): Promise<string> {
    const key = `${prefix}/${randomUUID()}${extname(file.originalname)}`;
    try {
      await this.internal.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (err) {
      this.logger.error(`Upload failed for key "${key}"`, err);
      throw new InternalServerErrorException('Échec du téléversement du média');
    }
    return key;
  }

  /** Best-effort delete; a missing object is not an error. */
  async delete(key: string): Promise<void> {
    try {
      await this.internal.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(`Could not delete object "${key}"`, err);
    }
  }

  /** Presigned GET URL for a stored key, or null when there is no media. */
  async presign(key: string | null): Promise<string | null> {
    if (!key) return null;
    return getSignedUrl(
      this.public,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.presignTtl },
    );
  }
}
