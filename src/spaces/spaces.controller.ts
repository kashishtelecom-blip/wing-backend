import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() body: { title: string }) {
    return this.spacesService.createSpace(req.user.userId, body.title);
  }

  @Get()
  findAll() {
    return this.spacesService.getAllLiveSpaces();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spacesService.getSpaceById(id);
  }
}