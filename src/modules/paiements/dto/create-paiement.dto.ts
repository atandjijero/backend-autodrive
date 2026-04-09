import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MethodePaiement } from '@prisma/client';

// Validation Luhn personnalisée
export class LuhnValidator {
  validate(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }

  defaultMessage() {
    return 'Numéro de carte invalide (échec validation Luhn)';
  }
}

export class CreatePaiementDto {
  @ApiProperty({
    description: "ID de la réservation associée",
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  reservationId!: number;

  @ApiProperty({
    description: "Nom complet du client",
    example: "Jean Dupont",
  })
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty({
    description: "Adresse email du client",
    example: "jean@gmail.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "Montant du paiement",
    example: 15000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  montant!: number;

  @ApiProperty({
    enum: MethodePaiement,
    description: "Mode de paiement utilisé",
  })
  @IsEnum(MethodePaiement)
  methodePaiement!: MethodePaiement;

  @ApiProperty({
    description: "Numéro de téléphone pour les paiements mobiles (TMoney, Flooz)",
    example: "90000000",
    required: false,
  })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({
    description: "Numéro de carte bancaire (16 chiffres)",
    example: "4242424242424242",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{16}$/, {
    message: "Le numéro de carte doit contenir exactement 16 chiffres",
  })
  @Validate(LuhnValidator)
  numeroCarte?: string;

  @ApiProperty({
    description: "Date d'expiration (MM/AA)",
    example: "12/25",
    required: false,
  })
  @IsOptional()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: "Format d'expiration invalide. Exemple : 12/25",
  } )
  expiration?: string;

  @ApiProperty({
    description: "Code de sécurité CVV (3 chiffres)",
    example: "123",
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{3}$/, {
    message: "Le CVV doit contenir exactement 3 chiffres",
  })
  cvv?: string;
}
