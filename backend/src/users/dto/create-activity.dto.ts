import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsNumber()
  bookId?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pollOptions?: string[] | null;
}
