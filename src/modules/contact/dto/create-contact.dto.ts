import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsString()
  @IsNotEmpty()
  sujet!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}