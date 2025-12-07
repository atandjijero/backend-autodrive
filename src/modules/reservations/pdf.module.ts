import { Module } from '@nestjs/common';
import { PdfService } from 'src/modules/reservations/services/pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService], 
})
export class PdfModule {}
