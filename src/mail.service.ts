import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MailService {
  private readonly brevoUrl = 'https://api.brevo.com/v3/smtp/email';

  async sendEventAlert(event: any) {
    const html = `
      <div style="font-family: Arial, sans-serif">
        <h2>Nuevo evento de telemetría</h2>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr><td><b>ID</b></td><td>${event.id}</td></tr>
          <tr><td><b>Tipo</b></td><td>${event.eventType}</td></tr>
          <tr><td><b>Activo</b></td><td>${event.isActive}</td></tr>
          <tr><td><b>Creado</b></td><td>${event.createdAt}</td></tr>
          <tr><td><b>Finalizado</b></td><td>${event.endedAt ?? '—'}</td></tr>
          <tr><td><b>Duración</b></td><td>${event.totalSessionTime ?? '—'}</td></tr>
        </table>
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