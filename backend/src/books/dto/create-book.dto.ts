import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { BookStatus } from '../enum/book-status.enum';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsEnum(BookStatus)
  status: BookStatus;
}
