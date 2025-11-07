import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RequestAuthorDto {
  @IsEmail()
  permissionEmail: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
