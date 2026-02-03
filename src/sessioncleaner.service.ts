import { Injectable } from "@nestjs/common"
import { PrismaService } from 'src/prisma.service';
import { Cron } from "@nestjs/schedule"
import { MailService } from 'src/mail.service';

@Injectable()
export class SessionCleanerService {
    constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    ) {}

    @Cron("*/30 * * * * *") // cada 30s
    async closeDeadSessions() {
        const limit = new Date(Date.now() - 60_000)
        console.log("The session cleaner is running...")
        
        // Obtener los ids antes de actualizar
        const sessionsToUpdate = await this.prisma.telemetryEvent.findMany({
            where: {
                isActive: true,
                lastPingAt: { lt: limit }
            },
            select: { id: true }
        })
        
        const result = await this.prisma.telemetryEvent.updateMany({
            where: {
                isActive: true,
                lastPingAt: { lt: limit }
            },
            data: { isActive: false, eventType: 'session_end_cronor', endedAt: new Date() }
        })
        
        if (result.count > 0) {
            const ids = sessionsToUpdate.map(s => s.id)
            console.log(`Updated ${result.count} sessions:`, ids)
            // this.mailService.sendEventAlert(result).catch(console.error);
        }
        else{
            console.log("No sessions to update.")
        }
    }
  
}