import { Injectable } from "@nestjs/common"
import { PrismaService } from './prisma.service';
import { Cron } from "@nestjs/schedule"
import { MailService } from './mail.service';

@Injectable()
export class SessionCleanerService {
    private idleSince: number | null = null
    private isSleeping = false
    constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    ) {}

    @Cron("*/1 * * * * *")
        async closeDeadSessions() {
        if (this.isSleeping) return

        // vars
        const now = new Date();
        const limit = new Date(Date.now() - 4_000) // 4 seconds
        const result = { count: 0 }

        var sessions_lapsed = await this.prisma.telemetryEvent.findMany({
            where: {
            isActive: true,
            lastPingAt: { lt: limit }
            }
        })
        console.log("The session cleaner is running...")

        if (sessions_lapsed.length > 0) {
            const updates = await Promise.all(
                sessions_lapsed.map(session => {
                    const diffMs = session.lastPingAt.getTime() - session.createdAt.getTime();
                    const totalTime = this.formatDuration(diffMs);

                    return this.prisma.telemetryEvent.update({
                        where: { id: session.id },
                        data: {
                            isActive: false,
                            eventType: 'session_end_cronor',
                            endedAt: new Date(),
                            totalSessionTime: totalTime,
                        },
                    })
                })
            )

            console.log(`Updated ${updates.length} sessions`)
            this.idleSince = null
        } else {
            

            if (result.count > 0) {
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