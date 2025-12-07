import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, 
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Service SMTP prêt pour envoyer des mails');
    } catch (error) {
      this.logger.error('❌ Problème de connexion au service SMTP : ' + error.message);
    }
  }

  /**
   * Envoi OTP (première connexion)
   */
  async sendOtp(to: string, otp: string) {
    await this.transporter.sendMail({
      from: `"AutoDrive Auth" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Votre code OTP - AutoDrive',
      text: `Votre code de vérification est : ${otp}. Il expire dans 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color:#004080;">Code OTP AutoDrive</h2>
          <p>Bonjour,</p>
          <p>Voici votre code de connexion sécurisé :</p>
          <p style="font-size:22px; font-weight:bold; color:#004080; text-align:center;">${otp}</p>
          <p>Ce code est valable pendant <b>5 minutes</b>.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <p style="margin-top:20px;">Merci,<br/>L'équipe AutoDrive</p>
        </div>
      `,
    });
  }

  /**
   * Envoi lien de réinitialisation mot de passe
   */
  async sendResetLink(to: string, token: string) {
    // Important : correspond au frontend /reset-password/:token
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await this.transporter.sendMail({
      from: `"AutoDrive Auth" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe - AutoDrive',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color:#004080;">Réinitialisation de mot de passe AutoDrive</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous :</p>
          <p style="text-align:center; margin:20px 0;">
            <a href="${resetUrl}" style="background:#004080; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ce lien est valable pendant <b>1 heure</b>.</p>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <p style="margin-top:20px;">Merci,<br/>L'équipe AutoDrive</p>
        </div>
      `,
    });
  }
  /**
 * Envoi confirmation de paiement + localisation Google Maps
 */
async sendPaymentConfirmation(to: string, name: string, amount: number) {
  const googleMapsUrl = "https://maps.app.goo.gl/FyWEczQtLVD5CrvSA";

  await this.transporter.sendMail({
    from: `"AutoDrive Paiement" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Confirmation de paiement - AutoDrive',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color:#004080;">Paiement confirmé !</h2>

        <p>Bonjour <strong>${name}</strong>,</p>

        <p>
          Nous vous confirmons que votre paiement de 
          <strong>${amount} €</strong> a été effectué avec succès.
        </p>

        <h3 style="color:#004080;"> Votre véhicule vous attend</h3>
        <p>
          Vous pouvez maintenant vous rendre à notre agence pour récupérer votre voiture.
        </p>

        <h3 style="color:#004080;">📍 Adresse de l'agence :</h3>
        <p>
          <strong>AutoDrive - Agence principale</strong><br/>
          Rue de l'Aéroport, Lomé, Togo<br/>
          Téléphone : +228 90 00 00 00
        </p>

        <p style="margin: 20px 0;">
          
          <a href="${googleMapsUrl}" 
             target="_blank" 
             style="background:#004080; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">
            Voir sur Google Maps
          </a>
        </p>

        <p>
          Merci de vous présenter avec une pièce d'identité valide et votre numéro de réservation.
        </p>

        <br/>
        <p>Cordialement,<br/>L'équipe AutoDrive</p>
      </div>
    `,
  });
}

}
