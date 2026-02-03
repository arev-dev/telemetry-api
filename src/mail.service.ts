import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly brevoUrl = 'https://api.brevo.com/v3/smtp/email';

  async sendEventAlert(event: any) {
    const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:20px">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1)">
            
            <div style="background:#1f2933; color:#ffffff; padding:16px 20px">
            <h2 style="margin:0; font-size:18px">🚀 Nuevo evento de telemetría</h2>
            </div>

            <div style="padding:20px">
            <p style="margin-top:0; color:#555">
                Se ha registrado un nuevo evento en el sistema:
            </p>

            <div style="display:grid; grid-template-columns: 140px 1fr; row-gap:10px; column-gap:10px; font-size:14px">
                <div style="font-weight:bold; color:#333">ID</div>
                <div>${event.id}</div><br><br>

                <div style="font-weight:bold; color:#333">Tipo</div>
                <div>${event.eventType}</div><br><br>

                <div style="font-weight:bold; color:#333">Activo</div>
                <div>${event.isActive ? 'Sí' : 'No'}</div><br><br>

                <div style="font-weight:bold; color:#333">Plataforma</div>
                <div>${event.platform}</div><br><br>

                <div style="font-weight:bold; color:#333">Versión</div>
                <div>${event.gameVersion}</div><br><br>

                <div style="font-weight:bold; color:#333">Creado</div>
                <div>${event.createdAt}</div><br><br>

                <div style="font-weight:bold; color:#333">Finalizado</div>
                <div>${event.endedAt ?? '—'}</div><br><br>

                <div style="font-weight:bold; color:#333">Duración</div>
                <div>${event.totalSessionTime ?? '—'}</div><br><br>
            </div>
            </div>

            <div style="background:#f9fafb; padding:12px 20px; font-size:12px; color:#777; text-align:center">
            Telemetry Games · Sistema automático de monitoreo
            </div>
        </div>
        </div>
        `;

    await axios.post(
      this.brevoUrl,
      {
        sender: {
          name: process.env.MAIL_NAME,
          email: process.env.MAIL_USER, // verificado en Brevo
        },
        to: [
          { email: process.env.MAIL_TO },
        ],
        subject: `Nuevo evento: ${event.eventType}`,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
  }
}