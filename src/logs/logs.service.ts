import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LogsService {
  private readonly logFilePath = path.join(process.cwd(), 'logs/app.log');

  async getLogs(page: number = 1, limit: number = 50, level?: string) {
    if (!fs.existsSync(this.logFilePath)) {
      return { data: [], total: 0 };
    }

    const fileContent = fs.readFileSync(this.logFilePath, 'utf-8');
    let logs = fileContent
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line))
      .reverse(); // Los más recientes primero

    if (level) {
      logs = logs.filter((log) => log.level === level.toLowerCase());
    }

    const total = logs.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedLogs = logs.slice(start, end);

    return {
      data: paginatedLogs,
      total,
      page,
      limit,
    };
  }
}
