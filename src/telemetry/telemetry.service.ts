import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail.service';

@Injectable()
export class TelemetryService {
    constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

    async getActiveSessions() {
      const sessions = await this.prisma.telemetryEvent.findMany({
        where: { eventType: 'session_start', isActive: true },
      });

      const now = new Date();

      return sessions.map(s => {
        const diffMs = now.getTime() - s.createdAt.getTime();
        const timeSessionActive = this.formatDuration(diffMs);

        return {
          ...s,
          timeSessionActive,
        };
      });
    }

    async getSessions() {
      const sessions = await this.prisma.telemetryEvent.findMany({
        where: {
          OR: [
            { eventType: 'session_end', isActive: false },
            { eventType: 'session_start', isActive: true }
          ]
        },
      });

      return sessions;
    }

    async create(data) {
      const event = await this.prisma.telemetryEvent.create({ data });

      this.mailService.sendEventAlert(event).catch(console.error);

      return event;
    }

    async killSessions(){
      return this.prisma.telemetryEvent.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    async endSession(id: string) {
      const s = await this.prisma.telemetryEvent.findUnique({ where: { id } });
      if (!s) {
        throw new NotFoundException('Session not found');
      }
      if(!s.isActive){
        throw new NotFoundException('Session is already ended');
      }
      const now = new Date();
      const diffMs = now.getTime() - s.createdAt.getTime();
      const totalTime = this.formatDuration(diffMs);
      const event = await this.prisma.telemetryEvent.update({
        where: { id },
        data: {
          isActive: false,
          eventType: 'session_end',
          endedAt: now,
          totalSessionTime: totalTime,
        },
      });
      this.mailService.sendEventAlert(event).catch(console.error);
      return event;
    }

    async ping(sessionId: string) {
      return this.prisma.telemetryEvent.update({
        where: { id: sessionId },
        data: {
          lastPingAt: new Date(),
          isActive: true
        }
      })
    }

  private formatDuration(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}


