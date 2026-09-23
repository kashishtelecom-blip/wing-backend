import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  searchUsers(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.searchService.searchUsers(q || '', limit ? Number(limit) : 20);
  }

  @Get('wings')
  searchWings(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.searchService.searchWings(q || '', limit ? Number(limit) : 20);
  }

  @Get()
  searchAll(@Query('q') q: string) {
    return this.searchService.searchAll(q || '');
  }
}