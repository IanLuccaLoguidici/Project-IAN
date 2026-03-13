import { IsString, IsNotEmpty } from 'class-validator';

export class SuggestTitleDto {
  @IsString()
  @IsNotEmpty()
  description: string;
}
