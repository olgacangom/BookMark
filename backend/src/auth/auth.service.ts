import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Partial<User> | null> {
    const user = await this.usersService.findOneByEmail(email);
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const result: Partial<User> = { ...user };
      delete result.password; 
      return result;
    }
    return null;
  }

  login(user: Partial<User>) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}