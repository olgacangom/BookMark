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
    private readonly userRepository: Repository<User>,
  ) {}

  // S1-01: Crear usuario con Hash de Bcrypt
  async create(createUserDto: CreateUserDto) {
    const { password, email, ...userData } = createUserDto;

    // Verificar duplicados
    const userExists = await this.userRepository.findOneBy({ email });
    if (userExists) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    return await this.userRepository.save(newUser);
  }

  // Método extra útil para el login de JWT más adelante
  async findOneByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  findAll() {
    return this.userRepository.find();
  }

  async findOne(id: string) {
    // Cambiado a string por el UUID
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return this.userRepository.remove(user);
  }

  async getPublicProfile(id: string) {
    const user = await this.findOne(id);

    if (!user.isPublic) {
      throw new ForbiddenException('Este perfil es privado');
    }
    // Seleccionamos solo los campos públicos
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
