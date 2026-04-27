import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserStats } from 'src/users/entities/user-stats.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserStats)
    private readonly userStatsRepository: Repository<UserStats>,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      if (user.role === UserRole.LIBRERO_PENDIENTE) {
        throw new BadRequestException(
          'Tu cuenta de librería está pendiente de aprobación por el administrador.',
        );
      }

      if (!user.isActive) {
        throw new BadRequestException('Esta cuenta ha sido desactivada.');
      }

      const userInstance = user as Partial<User>;
      delete userInstance.password;

      return userInstance as Omit<User, 'password'>;
    }
    return null;
  }

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, password, ...rest } = dto;

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
      isActive: dto.role === UserRole.USER,
    });

    const savedUser = await this.userRepository.save(newUser);

    const initialStats = this.userStatsRepository.create({
      user: savedUser,
      xp: 0,
      level: 1,
      totalBooksFinished: 0,
      currentStreak: 0,
    });
    await this.userStatsRepository.save(initialStats);

    const userInstance = savedUser as Partial<User>;
    delete userInstance.password;

    return userInstance as Omit<User, 'password'>;
  }

  login(user: Omit<User, 'password'>) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new NotFoundException('El correo no está registrado');

    const token = uuidv4();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await this.userRepository.save(user);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    await transporter.sendMail({
      from: '"BookMark Team" <noreply@bookmark.com>',
      to: user.email,
      subject: 'Restablecer tu contraseña - BookMark',
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Hola, ${user.fullName}</h2>
          <p>Has solicitado restablecer tu contraseña en BookMark.</p>
          <p>Haz clic en el botón de abajo para elegir una nueva:</p>
          <a href="${resetUrl}" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
          <p>Si no has sido tú, ignora este correo.</p>
        </div>
      `,
    });

    return { message: 'Correo enviado correctamente' };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('El enlace es inválido o ha caducado');
    }

    user.password = await bcrypt.hash(newPass, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada con éxito' };
  }
}
