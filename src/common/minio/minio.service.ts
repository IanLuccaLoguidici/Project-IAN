import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'todos-bucket';
    
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || '127.0.0.1',
      port: Number(this.configService.get<number>('MINIO_PORT')) || 9000,
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadminpassword',
    });

    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists.`);
      }
    } catch (error) {
      this.logger.error('Error connecting to MinIO or creating bucket', error);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    // originalname might have spaces or special characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `${timestamp}-${uniqueSuffix}-${safeName}`;

    try {
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );
      
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || '127.0.0.1';
      const port = this.configService.get<number>('MINIO_PORT') || 9000;
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      // Construir la URL pública (asumiendo que el bucket tiene políticas públicas, o devolvemos el endpoint base)
      const fileUrl = `${protocol}://${endpoint}:${port}/${this.bucketName}/${objectName}`;
      return fileUrl;
    } catch (error) {
      this.logger.error('Error uploading file to MinIO', error);
      throw new Error('Could not upload file to storage');
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
    } catch (error) {
      this.logger.error(`Error deleting file ${objectName} from MinIO`, error);
    }
  }

  async getPresignedUrl(objectName: string): Promise<string> {
    try {
      // Expira en 5 minutos (300 segundos)
      return await this.minioClient.presignedGetObject(this.bucketName, objectName, 300);
    } catch (error) {
      this.logger.error(`Error generating presigned URL for ${objectName}`, error);
      throw new Error('Could not generate presigned URL');
    }
  }
}
