import { IsString, IsEnum, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { BookStatus } from '../enum/book-status.enum';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsEnum(BookStatus)
  @IsNotEmpty()
  status: BookStatus;

  @IsString()
  @IsOptional()
  genre: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsNumber()
  @IsOptional()
  pageCount: number;

  @IsString()
  @IsOptional()
  urlPortada: string;
}
