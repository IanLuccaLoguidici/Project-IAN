import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-magic-link')
  async handleSendMagicLink(job: Job) {
    const { email, url } = job.data;
    
    // Simulate sending email log behavior
    this.logger.log(`\n\n=========================================\n`);
    this.logger.log(`Enviando Magic Link de inicio de sesión...`);
    this.logger.log(`Destinatario: ${email}`);
    this.logger.log(`URL de acceso: ${url}\n`);
    this.logger.log(`=========================================\n\n`);
  }
}
