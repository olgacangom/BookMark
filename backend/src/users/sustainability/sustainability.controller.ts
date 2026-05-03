import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  SustainabilityService,
  CreateListingDto,
  UpdateListingDto,
} from './sustainability.service';
import { ListingType } from '../entities/book-listing.entity';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
  };
}

@Controller('sustainability')
@UseGuards(JwtAuthGuard)
export class SustainabilityController {
  constructor(private readonly sustainabilityService: SustainabilityService) {}

  @Get('listings')
  getAll(@Query('type') type?: ListingType) {
    return this.sustainabilityService.findAllListings(type);
  }

  @Get('listings/social')
  async getSocial(@Req() req: RequestWithUser) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('No se pudo identificar al usuario');
    }

    return this.sustainabilityService.getSocialListings(userId);
  }

  @Get('donation-points')
  getDonations() {
    return this.sustainabilityService.findAllDonationPoints();
  }

  @Get('listings/book/:bookId')
  async getByBook(@Param('bookId', ParseIntPipe) bookId: number) {
    return this.sustainabilityService.findByBookId(bookId);
  }

  @Post('listings')
  create(@Req() req: RequestWithUser, @Body() data: CreateListingDto) {
    return this.sustainabilityService.createListing(req.user.id, data);
  }

  @Get('listings/me')
  getMyListings(@Req() req: RequestWithUser) {
    return this.sustainabilityService.findMyListings(req.user.id);
  }

  @Post('listings/:id/donate')
  markDonated(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.sustainabilityService.markAsDonated(req.user.id, id);
  }

  @Patch('listings/:id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() data: UpdateListingDto,
  ) {
    return this.sustainabilityService.updateListing(req.user.id, id, data);
  }

  @Delete('listings/:id')
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.sustainabilityService.deleteListing(req.user.id, id);
  }

  @Post('requests')
  createRequest(
    @Req() req: RequestWithUser,
    @Body('listingId') listingId: string,
  ) {
    return this.sustainabilityService.createRequest(req.user.id, listingId);
  }

  @Get('requests/me')
  async getMyRequests(@Req() req: RequestWithUser) {
    return this.sustainabilityService.getUserRequests(req.user.id);
  }

  @Patch('requests/:id/status')
  async updateStatus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('status') status: 'accepted' | 'rejected',
  ) {
    return this.sustainabilityService.updateRequestStatus(
      req.user.id,
      id,
      status,
    );
  }

  @Patch('requests/:id/return')
  markReturned(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.sustainabilityService.markAsReturned(req.user.id, id);
  }

  @Delete('requests/cancel/:listingId')
  async cancel(
    @Req() req: RequestWithUser,
    @Param('listingId') listingId: string,
  ) {
    return this.sustainabilityService.cancelRequest(req.user.id, listingId);
  }
}
