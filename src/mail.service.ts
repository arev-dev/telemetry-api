import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class MailService {
  private readonly brevoUrl = 'https://api.brevo.com/v3/smtp/email';
  private readonly logger = new Logger(MailService.name);

  /**
   * Envía un email de forma asíncrona sin bloquear la respuesta
   * @param event - Evento de telemetría
   * @returns Promesa que se resuelve inmediatamente
   */
  async sendEventAlert(event: any): Promise<{ status: string }> {
    // Fire and forget - no esperamos la respuesta
    this.sendEmailAsync(event).catch((error) => {
      this.logger.error(
        `Error sending email for event ${event.id}: ${error.message}`,
        error.stack,
      );
    });

    // Retorna inmediatamente sin esperar el email
    return { status: 'email_queued' };
  }

  /**
   * Método privado que envía el email con reintentos
   */
  private async sendEmailAsync(event: any): Promise<void> {
    const maxRetries = 2;
    const startTime = Date.now();

    this.logger.log(`🚀 Queuing email for event: ${event.eventType} (${event.id})`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          this.brevoUrl,
          {
            sender: {
              name: process.env.MAIL_NAME,
              email: process.env.MAIL_USER,
            },
            to: [{ email: process.env.MAIL_TO }],
            subject: `Nuevo evento: ${event.eventType}`,
            htmlContent: this.generateEmailHtml(event),
          },
          {
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 8000, // 8 segundos
            validateStatus: (status) => status < 500, // No reintenta errores 4xx
          },
        );

        if (response.status >= 200 && response.status < 300) {
          const duration = Date.now() - startTime;
          this.logger.log(
            `✅ Email sent successfully in ${duration}ms (attempt ${attempt + 1}/${maxRetries + 1})`,
          );
          return;
        }

        throw new Error(`Brevo returned status ${response.status}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const isLastAttempt = attempt === maxRetries;

        if (axios.isAxiosError(error)) {
          this.logAxiosError(error, attempt + 1, duration);
        } else {
          this.logger.warn(
            `⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed after ${duration}ms: ${error.message}`,
          );
        }

        // Si es el último intento, lanza el error
        if (isLastAttempt) {
          this.logger.error(
            `❌ Email failed after ${maxRetries + 1} attempts and ${duration}ms`,
          );
          throw error;
        }

        // Espera exponencial antes de reintentar: 500ms, 1000ms
        const delayMs = 500 * Math.pow(2, attempt);
        this.logger.debug(`⏳ Retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
      }
    }
  }

  /**
   * Genera el HTML del email
   */
  private generateEmailHtml(event: any): string {
    return `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:20px">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1)">
          
          <div style="background:#1f2933; color:#ffffff; padding:16px 20px">
            <h2 style="margin:0; font-size:18px">🚀 Nuevo evento de telemetría</h2>
          </div>

          <div style="padding:20px">
            <p style="margin-top:0; color:#555">
              Se ha registrado un nuevo evento en el sistema:
            </p>

            <table style="width:100%; border-collapse:collapse; font-size:14px">
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333; width:140px">ID</td>
                <td style="padding:8px 0; color:#555">${event.id}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Tipo</td>
                <td style="padding:8px 0; color:#555">${event.eventType}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Activo</td>
                <td style="padding:8px 0; color:#555">${event.isActive ? '✅ Sí' : '❌ No'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Plataforma</td>
                <td style="padding:8px 0; color:#555">${event.platform || '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Versión</td>
                <td style="padding:8px 0; color:#555">${event.gameVersion || '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Creado</td>
                <td style="padding:8px 0; color:#555">${new Date(event.createdAt).toLocaleString('es-ES')}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Finalizado</td>
                <td style="padding:8px 0; color:#555">${event.endedAt ? new Date(event.endedAt).toLocaleString('es-ES') : '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-weight:bold; color:#333">Duración</td>
                <td style="padding:8px 0; color:#555">${event.totalSessionTime || '—'}</td>
              </tr>
            </table>
          </div>

          <div style="background:#f9fafb; padding:12px 20px; font-size:12px; color:#777; text-align:center">
            Telemetry Games · Sistema automático de monitoreo
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Loguea errores de Axios con detalles
   */
  private logAxiosError(error: AxiosError, attempt: number, duration: number): void {
    if (error.code === 'ECONNABORTED') {
      this.logger.warn(
        `⏱️ Timeout en intento ${attempt} después de ${duration}ms`,
      );
    } else if (error.response) {
      this.logger.warn(
        `⚠️ Brevo error ${error.response.status} en intento ${attempt}: ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      this.logger.warn(
        `⚠️ No response from Brevo en intento ${attempt} (network error)`,
      );
    } else {
      this.logger.warn(
        `⚠️ Error setting up request en intento ${attempt}: ${error.message}`,
      );
    }
  }

  /**
   * Utilidad para delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}