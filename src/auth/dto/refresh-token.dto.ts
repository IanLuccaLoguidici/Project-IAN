import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The long-lived refresh token sent to issue new tokens' })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
