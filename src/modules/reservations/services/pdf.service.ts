import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');
import { Reservation } from '@prisma/client';

type ReservationWithRelations = Reservation & {
  client?: { prenom?: string; nom?: string; email?: string };
  vehicle?: { marque?: string; modele?: string };
};

@Injectable()
export class PdfService {

  private formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  async generateReservationReceipt(reservation: ReservationWithRelations): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text('Reçu de Réservation', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Numéro : ${reservation.numeroReservation}`);

      const client = reservation.client;
      doc.text(`Client : ${client?.prenom ?? ''} ${client?.nom ?? ''}`);
      doc.text(`Email : ${client?.email ?? 'Non disponible'}`);

      const veh = reservation.vehicle;
      doc.text(
        `Véhicule : ${
          veh
            ? `${veh.marque} ${veh.modele}`
            : 'Véhicule supprimé ou introuvable'
        }`
      );

      doc.text(`Début : ${this.formatDate(reservation.dateDebut)}`);
      doc.text(`Fin : ${this.formatDate(reservation.dateFin)}`);

      doc.text(`Statut : ${reservation.statut}`);

      doc.end();
    });
  }
}