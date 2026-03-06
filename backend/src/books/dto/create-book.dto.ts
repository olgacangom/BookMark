import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum BookStatus {
  READING = 'Reading',
  READ = 'Read',
  WANT_TO_READ = 'Want to Read',
}

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
  @IsNotEmpty()
  genre: string;

}
