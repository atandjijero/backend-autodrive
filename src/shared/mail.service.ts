import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { AgenciesService } from '../modules/agencies/services/agencies.service';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly agenciesService?: AgenciesService) {
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
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              AutoDrive Auth
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:16px;">Bonjour,</p>
              <p style="font-size:15px;">Voici votre code de connexion sécurisé :</p>
              <p style="font-size:26px;font-weight:bold;color:#004080;text-align:center;margin:20px 0;">${otp}</p>
              <p style="font-size:14px;color:#555;text-align:center;">Ce code est valable pendant <b>5 minutes</b>.</p>
              <p style="font-size:13px;color:#777;text-align:center;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
              <p style="margin-top:30px;font-size:14px;">Merci,<br/><strong>L'équipe AutoDrive</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
  }

  /**
   * Envoi lien de réinitialisation mot de passe
   */
  async sendResetLink(to: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await this.transporter.sendMail({
      from: `"AutoDrive Auth" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe - AutoDrive',
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              AutoDrive Auth
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:16px;">Bonjour,</p>
              <p style="font-size:15px;">Vous avez demandé à réinitialiser votre mot de passe.</p>
              <p style="margin:25px 0;text-align:center;">
                <table align="center" cellpadding="0" cellspacing="0">
                  <tr>
                    <td bgcolor="#004080" style="border-radius:4px;">
                      <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-weight:bold;color:#fff;text-decoration:none;">
                        Réinitialiser mon mot de passe
                      </a>
                    </td>
                  </tr>
                </table>
              </p>
              <p style="font-size:14px;color:#555;text-align:center;">Ce lien est valable pendant <b>1 heure</b>.</p>
              <p style="font-size:13px;color:#777;text-align:center;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
              <p style="margin-top:30px;font-size:14px;">Merci,<br/><strong>L'équipe AutoDrive</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
  }

  /**
   * Envoi confirmation de paiement + localisation Google Maps
   */
  async sendPaymentConfirmation(to: string, name: string, amount: number) {
    // Récupérer l'agence active si disponible
    let agency: any = null;
    let googleMapsUrl: string | undefined = undefined;
    try {
      if (this.agenciesService) {
        const res = await this.agenciesService.findAll({ isActive: true, limit: 1 });
        agency = res && res.data && res.data.length ? res.data[0] : null;
        if (agency && agency.location && agency.location.latitude && agency.location.longitude) {
          googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${agency.location.latitude},${agency.location.longitude}`;
        }
      }
    } catch (e) {
      // ignorer les erreurs de récupération d'agence, on utilisera des valeurs par défaut
      agency = null;
    }

    const agencyName = agency?.name || 'AutoDrive - Agence principale';
    const agencyAddress = agency?.address ? `${agency.address}${agency.city ? ', ' + agency.city : ''}${agency.postalCode ? ' - ' + agency.postalCode : ''}` : 'Rue de l\'Aéroport, Lomé, Togo';
    const agencyPhone = agency?.phone || '+228 90 00 00 00';

    await this.transporter.sendMail({
      from: `"AutoDrive Paiement" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Confirmation de paiement - AutoDrive',
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              AutoDrive Paiement
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:16px;">Bonjour <strong>${name}</strong>,</p>
              <p style="font-size:15px;">Nous vous confirmons que votre paiement de <strong>${amount} €</strong> a été effectué avec succès.</p>
              
              <h3 style="color:#004080;margin-top:30px;">Votre véhicule vous attend</h3>
              <p>Vous pouvez maintenant vous rendre à notre agence pour récupérer votre voiture.</p>
              
              <h3 style="color:#004080;margin-top:30px;">Adresse de l'agence :</h3>
              <p>
                <strong>${agencyName}</strong><br/>
                ${agencyAddress}<br/>
                Téléphone : ${agencyPhone}
              </p>
              
              ${googleMapsUrl ? `
                <p style="margin:25px 0;text-align:center;">
                  <table align="center" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="#004080" style="border-radius:4px;">
                        <a href="${googleMapsUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-weight:bold;color:#fff;text-decoration:none;">
                          Voir sur Google Maps
                        </a>
                      </td>
                    </tr>
                  </table>
                </p>` : ''}
              
              <p style="font-size:14px;">Merci de vous présenter avec une pièce d'identité valide et votre numéro de réservation.</p>
              <p style="margin-top:30px;font-size:14px;">Cordialement,<br/><strong>L'équipe AutoDrive</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
  }

  /**
   * Envoi notification de validation/rejet de contrat avec informations agence + Google Maps
   */
  async sendContractValidation(
    to: string,
    name: string,
    approved: boolean,
    contractId: string,
    agency: any | null,
    mapsUrl?: string,
    commentaires?: string,
  ) {
    // Récupérer l'agence active si disponible
    let agencyData: any = agency;
    let googleMapsUrl: string | undefined = mapsUrl;
    try {
      if (this.agenciesService) {
        const res = await this.agenciesService.findAll({ isActive: true, limit: 1 });
        agencyData = res && res.data && res.data.length ? res.data[0] : agency;
        if (agencyData && agencyData.location && agencyData.location.latitude && agencyData.location.longitude) {
          googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${agencyData.location.latitude},${agencyData.location.longitude}`;
        }
      }
    } catch (e) {
      // ignorer les erreurs de récupération d'agence, on utilisera des valeurs par défaut
      agencyData = agency;
    }

    const title = approved ? 'Votre contrat a été approuvé' : 'Votre contrat a été rejeté';
    const agencyName = agencyData?.name || agencyData?.agenceNom || 'AutoDrive';
    const agencyAddress = agencyData?.address || agencyData?.agenceAdresse || 'Adresse non spécifiée';
    const agencyPhone = agencyData?.phone || agencyData?.agenceTelephone || 'Téléphone non spécifié';
    const agencyEmail = agencyData?.email || agencyData?.agenceEmail || process.env.MAIL_USER;

    const downloadUrl = `${process.env.FRONTEND_URL || ''}/contracts/${contractId}/download`;

    // préparer le logo : si l'agence fournit une URL publique, l'utiliser, sinon joindre le logo local inline
    let attachments: any[] = [];
    let logoHtml = '';
    try {
      if (agencyData && agencyData.logo && typeof agencyData.logo === 'string') {
        // si c'est une URL http(s), on l'affiche directement
        if (agencyData.logo.startsWith('http://') || agencyData.logo.startsWith('https://')) {
          logoHtml = `<div style="text-align:center;margin-bottom:12px;"><img src="${agencyData.logo}" alt="${agencyName} logo" style="max-height:60px;object-fit:contain;"/></div>`;
        } else {
          // sinon on considère un chemin relatif/nom de fichier dans uploads
          const possiblePath = path.isAbsolute(agencyData.logo) ? agencyData.logo : path.join(process.cwd(), 'uploads', agencyData.logo);
          if (fs.existsSync(possiblePath)) {
            attachments.push({ filename: path.basename(possiblePath), path: possiblePath, cid: 'agencylogo' });
            logoHtml = `<div style="text-align:center;margin-bottom:12px;"><img src="cid:agencylogo" alt="${agencyName} logo" style="max-height:60px;object-fit:contain;"/></div>`;
          }
        }
      }
    } catch (e) {
      // ignore logo errors
      attachments = [];
      logoHtml = '';
    }

    await this.transporter.sendMail({
      from: `"AutoDrive" <${process.env.MAIL_USER}>`,
      to,
      subject: `${title} - AutoDrive`,
      attachments: attachments.length ? attachments : undefined,
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              AutoDrive
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${logoHtml}
              <p style="font-size:16px;">Bonjour <strong>${name}</strong>,</p>
              <p style="font-size:15px;">${approved ? 'Votre contrat a été approuvé par un administrateur.' : 'Votre contrat a été rejeté par un administrateur.'}</p>
              ${commentaires ? `<p style="background:#f9f9f9;padding:12px;border-radius:4px;color:#444;">${commentaires}</p>` : ''}

              <h3 style="color:#004080;margin-top:20px;">Agence assignée</h3>
              <p>
                <strong>${agencyName}</strong><br/>
                ${agencyAddress}<br/>
                Téléphone: ${agencyPhone}<br/>
                Email: ${agencyEmail}
              </p>

              ${googleMapsUrl ? `
                <p style="margin:20px 0;text-align:center;">
                  <table align="center" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="#004080" style="border-radius:4px;">
                        <a href="${googleMapsUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-weight:bold;color:#fff;text-decoration:none;">Voir sur Google Maps</a>
                      </td>
                    </tr>
                  </table>
                </p>` : ''}

              ${approved ? `
                <p style="margin:25px 0;text-align:center;">
                  <table align="center" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="#004080" style="border-radius:4px;">
                        <a href="${downloadUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-weight:bold;color:#fff;text-decoration:none;">Télécharger mon reçu</a>
                      </td>
                    </tr>
                  </table>
                </p>` : ''}

              <p style="margin-top:30px;font-size:14px;">Cordialement,<br/><strong>L'équipe AutoDrive</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
  }

  /**
   * Envoi de réponse à un message de contact
   */
  async sendContactResponse(to: string, name: string, originalMessage: string, response: string) {
    await this.transporter.sendMail({
      from: `"AutoDrive Support" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Réponse à votre message - AutoDrive',
      html: `
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;font-family:Arial,sans-serif;color:#333;">
          <tr>
            <td style="background:#004080;color:#fff;padding:16px;text-align:center;font-size:20px;font-weight:bold;">
              AutoDrive Support
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="font-size:16px;">Bonjour ${name},</p>
              <p style="font-size:15px;">Nous avons bien reçu votre message :</p>
              <blockquote style="border-left:4px solid #004080;padding-left:16px;margin:16px 0;font-style:italic;color:#555;">
                ${originalMessage}
              </blockquote>
              <p style="font-size:15px;">Voici notre réponse :</p>
              <p style="font-size:15px;background:#f9f9f9;padding:16px;border-radius:4px;">
                ${response}
              </p>
              <p style="margin-top:30px;font-size:14px;">Cordialement,<br/><strong>L'équipe AutoDrive</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;text-align:center;padding:12px;font-size:12px;color:#888;">
              © ${new Date().getFullYear()} AutoDrive. Tous droits réservés.
            </td>
          </tr>
        </table>
      `,
    });
  }
}
