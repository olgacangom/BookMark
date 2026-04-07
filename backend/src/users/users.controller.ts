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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // RUTAS ESTÁTICAS

  @UseGuards(JwtAuthGuard)
  @Get('follow/requests')
  async getRequests(@Request() req: RequestWithUser) {
    return this.usersService.getPendingRequests(req.user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') q: string) {
    return this.usersService.searchUsers(q);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  // RUTAS DE ACCIÓN SOCIAL

  @Post('follow/:id')
  @UseGuards(JwtAuthGuard)
  async follow(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.followUser(req.user.id, id);
  }

  @Post('unfollow/:id')
  @UseGuards(JwtAuthGuard)
  async unfollow(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.unfollowUser(req.user.id, id);
  }

  @Post('follow/accept/:id')
  @UseGuards(JwtAuthGuard)
  async acceptRequest(@Param('id') id: string) {
    return this.usersService.acceptFollowRequest(id);
  }

  @Delete('follow/decline/:id')
  @UseGuards(JwtAuthGuard)
  async declineRequest(@Param('id') id: string) {
    return this.usersService.declineFollowRequest(id);
  }

  // RUTAS CON PARÁMETROS DINÁMICOS

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.usersService.findOneProfile(id, req.user.id);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('stats/growth')
  @UseGuards(JwtAuthGuard)
  async getGrowth(@Req() req: RequestWithUser): Promise<GrowthData[]> {
    return this.usersService.getBooksGrowth(req.user.id);
  }
}
