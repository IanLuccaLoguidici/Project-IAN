import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class MagicLinkDto {
  @ApiProperty({ description: 'Dirección de correo electrónico' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
