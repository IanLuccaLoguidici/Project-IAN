import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }

    // 1. Max file size validation (5MB)
    const maxSize = 5 * 1024 * 1024;
    // We check if the file size is exactly strictly larger than 5MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds the 5MB limit. Provided file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
      );
    }

    // 2. File type validation (image/jpeg, image/png, application/pdf)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only JPG, PNG, and PDF files are allowed. Provided type: ${file.mimetype}`,
      );
    }

    return file;
  }
}
