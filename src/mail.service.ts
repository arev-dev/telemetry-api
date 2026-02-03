// mail.service.ts
import * as nodemailer from 'nodemailer';

export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendEventAlert(event: any) {
    const html = `
        <div style="font-family: Arial, sans-serif">
        <h2>Nuevo evento de telemetría</h2>
        <table border="1" cellpadding="8" cellspacing="0">
            <tr>
            <td><b>ID</b></td>
            <td>${event.id}</td>
            </tr>
            <tr>
            <td><b>Tipo</b></td>
            <td>${event.eventType}</td>
            </tr>
            <tr>
            <td><b>Activo</b></td>
            <td>${event.isActive}</td>
            </tr>
            <tr>
            <td><b>Creado</b></td>
            <td>${event.createdAt}</td>
            </tr>
            <tr>
            <td><b>Finalizado</b></td>
            <td>${event.endedAt ?? '—'}</td>
            </tr>
            <tr>
            <td><b>Duración</b></td>
            <td>${event.totalSessionTime ?? '—'}</td>
            </tr>
        </table>
        </div>
    `;
    await this.transporter.sendMail({
      from: '"Telemetry Games" <telemetry@app.com>',
      to: 'arevdevgames@gmail.com',
      subject: `Nuevo evento: ${event.eventType}`,
      html,
      text: JSON.stringify(event, null, 2),
    });
  }
}