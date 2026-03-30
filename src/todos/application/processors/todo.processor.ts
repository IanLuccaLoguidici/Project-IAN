import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Processor('todo-queue')
export class TodoProcessor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Process('todo-created')
  async handleTodoCreated(job: Job) {
    this.logger.info(`[Bull Queue] Procesando background job (todo-created)`, {
      jobId: job.id,
      data: job.data,
    });
    
    // Aquí es donde harías el trabajo pesado: enviar un email, generar reporte, etc.
    // Simular un poco de trabajo async:
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    this.logger.info(`[Bull Queue] Trabajo finalizado exitosamente (job: ${job.id})`);
  }
}
