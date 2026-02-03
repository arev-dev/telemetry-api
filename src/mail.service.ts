// mail.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });

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

    await this.transporter.sendMail({
      from: `${process.env.MAIL_NAME} <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      subject: `Nuevo evento: ${event.eventType}`,
      html,
    });
  }
}