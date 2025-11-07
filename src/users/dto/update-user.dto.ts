import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
