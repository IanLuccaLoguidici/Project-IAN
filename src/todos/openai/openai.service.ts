import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Calls OpenAI to generate a concise todo title based on a description.
   * Returns the generated title as a plain string.
   */
  async suggestTitle(description: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that suggests concise todo titles.' },
          { role: 'user', content: `Suggest a short todo title (max 5 words) for the following description: ${description}` },
        ],
        temperature: 0.7,
        max_tokens: 20,
      });
      const title = completion.choices[0]?.message?.content?.trim();
      return title ?? 'Untitled';
    } catch (err) {
      throw new InternalServerErrorException('Failed to generate title via OpenAI');
    }
  }
}
