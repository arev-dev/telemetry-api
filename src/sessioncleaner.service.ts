import { Injectable } from "@nestjs/common"
import { PrismaService } from 'src/prisma.service';
import { Cron } from "@nestjs/schedule"
import { MailService } from 'src/mail.service';

@Injectable()
export class SessionCleanerService {
    private idleSince: number | null = null
    private isSleeping = false
    constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    ) {}

    @Cron("*/30 * * * * *")
        async closeDeadSessions() {
        if (this.isSleeping) return

        const limit = new Date(Date.now() - 60_000)
        console.log("The session cleaner is running...")

        const result = await this.prisma.telemetryEvent.updateMany({
            where: {
            isActive: true,
            lastPingAt: { lt: limit }
            },
            data: { 
            isActive: false, 
            eventType: 'session_end_cronor', 
            endedAt: new Date() 
            }
        })

        if (result.count > 0) {
            console.log(`Updated ${result.count} sessions`)
            this.idleSince = null
        } else {
            if (!this.idleSince) {
            this.idleSince = Date.now()
            }

            const idleTime = Date.now() - this.idleSince

            if (idleTime > 10 * 60 * 1000) {
            console.log("Cron going to sleep (no activity)")
            this.isSleeping = true
            }
        }
    }

    wakeUp() {
    if (this.isSleeping) {
        console.log("Cron woke up")
        this.isSleeping = false
        this.idleSince = null
    }
    }
  
}