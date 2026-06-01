import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

export function generateLicenseFilename(file: Express.Multer.File) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return `${uniqueSuffix}${extname(file.originalname)}`;
}

export function multerFilenameCallback() {
  return (req: any, file: Express.Multer.File, cb: (err: Error | null, filename: string) => void) => {
    cb(null, generateLicenseFilename(file));
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  @UseInterceptors(
    FileInterceptor('document', {
      storage: diskStorage({
        destination: './uploads/licencias',
        filename: multerFilenameCallback(),
      }),
    }),
  )
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Omit<User, 'password'>> {
    if (file) {
      registerDto.document = file.path;
    }

    return this.usersService.create(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user: Omit<User, 'password'> | null =
      await this.authService.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.authService.login(user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPass: string }) {
    return this.authService.resetPassword(body.token, body.newPass);
  }
}
