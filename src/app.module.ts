import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelemetryModule } from './telemetry/telemetry.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [TelemetryModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
