import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { User, UserRole } from './entities/user.entity';
import { Roles } from './roles/roles.decorator';
import { RolesGuard } from './roles/roles.guard';
import { randomUUID } from 'crypto';

interface RequestWithUser {
  user: {
    id: string;
    email: string;
  };
}

interface GrowthData {
  month: string;
  count: number | string;
}

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // RUTAS ESTÁTICAS

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Get('follow/requests')
  async getRequests(@Request() req: RequestWithUser) {
    return this.usersService.getPendingRequests(req.user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') q: string) {
    return this.usersService.searchUsers(q);
  }

  @Patch('profile')
  @Roles(UserRole.USER, UserRole.LIBRERO, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    const userId = req.user.id;

    const url = `http://localhost:3000/uploads/avatars/${file.filename}`;

    return this.usersService.updateAvatar(userId, url);
  }

  @Delete('avatar')
  async deleteAvatar(@Req() req: { user: User }): Promise<User> {
    return this.usersService.deleteAvatar(req.user.id);
  }

  @Patch('deactivate-me')
  @Roles(UserRole.USER, UserRole.LIBRERO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deactivateMyAccount(@Req() req: { user: User }): Promise<User> {
    return this.usersService.deactivateAccount(req.user.id);
  }

  // RUTAS DE ACCIÓN SOCIAL

  @UseGuards(JwtAuthGuard)
  @Post('follow/:id')
  @Roles(UserRole.USER)
  async follow(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.followUser(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unfollow/:id')
  @Roles(UserRole.USER)
  async unfollow(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.unfollowUser(req.user.id, id);
  }

  @Post('follow/accept/:id')
  @Roles(UserRole.USER)
  async acceptRequest(@Param('id') id: string) {
    return this.usersService.acceptFollowRequest(id);
  }

  @Delete('follow/decline/:id')
  @Roles(UserRole.USER)
  async declineRequest(@Param('id') id: string) {
    return this.usersService.declineFollowRequest(id);
  }

  // RUTAS CON PARÁMETROS DINÁMICOS

  @Get('profile/:id')
  @Roles(UserRole.USER, UserRole.LIBRERO, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getProfile(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<any> {
    return this.usersService.findOneProfile(id, req.user.id);
  }

  @Get()
  @Roles(UserRole.USER)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.USER)
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.USER)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.USER)
  remove(@Param('id') id: string): Promise<User> {
    return this.usersService.remove(id);
  }

  @Post()
  create(@Body() registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  @Get('stats/growth')
  @Roles(UserRole.USER, UserRole.LIBRERO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getGrowth(@Req() req: RequestWithUser): Promise<GrowthData[]> {
    return this.usersService.getBooksGrowth(req.user.id);
  }
}
