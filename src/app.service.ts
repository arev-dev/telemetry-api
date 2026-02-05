import { Injectable } from '@nestjs/common';
import { env } from 'process';

@Injectable()
export class AppService {
  getHello(): string {
    return process.env.DATABASE_URL?.toString() || 'UUUUUUPS';
  }
}
