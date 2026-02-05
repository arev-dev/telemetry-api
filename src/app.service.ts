import { Injectable } from '@nestjs/common';
import { env } from 'process';

@Injectable()
export class AppService {
  getHello(): string {
    return process.env.POSTGRES_VER__DATABASE_URL?.toString() || 'UUUUUUPS';
  }
}
