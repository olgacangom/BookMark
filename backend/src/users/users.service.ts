import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(newUser);

    const { password, ...result } = savedUser;
    return result;
  }

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOneBy({ email });
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: string) {
    // Cambiado a string por el UUID
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.usersRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }

  async getPublicProfile(id: string) {
    const user = await this.findOne(id);

    if (!user.isPublic) {
      throw new ForbiddenException('Este perfil es privado');
    }
    return {
      id: user.id,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
    };
  }

  async findOneProfile(
    id: string,
    requesterId?: string,
  ): Promise<Partial<User>> {
    const user = await this.findOne(id);

    if (!user.isPublic && user.id !== requesterId) {
      throw new ForbiddenException('Este perfil es privado');
    }

    // Para el perfil completo (pero sin password), devolvemos todo excepto el password
    // Usamos esta forma para que el linter no detecte 'password' como variable no usada
    const { password, ...result } = user;
    void password; // Esto le dice al linter que 'password' ha sido "usada" (ignorada conscientemente)

    return result;
  }
}
