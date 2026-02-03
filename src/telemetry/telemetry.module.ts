import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail.service';

@Module({
  providers: [PrismaService,MailService, TelemetryService],
  controllers: [TelemetryController]
})
export class TelemetryModule {}
