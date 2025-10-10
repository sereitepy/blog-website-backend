import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description?: string;

  @IsString()
  body: string;

  @IsBoolean()
  published?: boolean = false;
}
