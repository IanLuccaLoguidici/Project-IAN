import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { MinioService } from './minio.service';

@ApiTags('Files')
@Controller('files')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Get('presigned-url/:key')
  @ApiOperation({ summary: 'Obtener URL pre-firmada temporal para descargar un archivo' })
  @ApiParam({ name: 'key', description: 'Nombre/llave del archivo en MinIO/S3' })
  @ApiOkResponse({ description: 'URL pre-firmada válida por 5 minutos' })
  async getPresignedUrl(@Param('key') key: string) {
    try {
      const url = await this.minioService.getPresignedUrl(key);
      return { url };
    } catch (error) {
      throw new HttpException('Error al generar la URL pre-firmada', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
