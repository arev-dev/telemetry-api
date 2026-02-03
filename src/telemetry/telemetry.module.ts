import { Module } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail.service';
import { SessionCleanerService } from 'src/sessioncleaner.service';

@Module({
  providers: [PrismaService,MailService, TelemetryService, SessionCleanerService],
  controllers: [TelemetryController]
})
export class TelemetryModule {}
