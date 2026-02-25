import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registra la entidad aquí
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exportar para que AuthModule pueda usarlo luego
})
export class UsersModule {}
