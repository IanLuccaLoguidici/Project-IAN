import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpenAIService } from './openai.service';
import { SuggestTitleDto } from './dto/suggest-title.dto';

@ApiTags('Todos')
@Controller('todos')
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('suggest-title')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a short todo title using OpenAI' })
  @ApiCreatedResponse({ 
      description: 'Suggested title', 
      schema: { 
          example: { title: 'Buy groceries' } 
      } 
  })
  async suggestTitle(@Body() dto: SuggestTitleDto): Promise<{ title: string }> {
    const title = await this.openAIService.suggestTitle(dto.description);
    return { title };
  }
}
