import {
  Controller, Get, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { Request } from '@nestjs/common';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ OVERVIEW ============
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ============ USERS ============
  @Get('users')
  listUsers(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers(
      q,
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
  }

  @Patch('users/:id/role')
  setUserRole(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { role: UserRole },
  ) {
    return this.adminService.setUserRole(req.user.userId, id, body.role);
  }

  @Patch('users/:id/active')
  setUserActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.setUserActive(id, body.isActive);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

 @Patch('users/:id/verified')
  setUserVerified(
    @Param('id') id: string,
    @Body() body: { isVerified: boolean },
  ) {
    return this.adminService.setUserVerified(id, body.isVerified);
  }

  // ============ WINGS ============
  @Get('wings')
  listWings(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listWings(
      q,
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
  }

  @Delete('wings/:id')
  deleteWing(@Param('id') id: string) {
    return this.adminService.deleteWing(id);
  }

  // ============ COMMENTS ============
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.adminService.deleteComment(id);
  }

  // ============ COMMUNITIES ============
  @Get('communities')
  listCommunities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listCommunities(
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
  }

  @Delete('communities/:id')
  deleteCommunity(@Param('id') id: string) {
    return this.adminService.deleteCommunity(id);
  }

  // ============ REPORTS ============
  @Get('reports')
  listReports(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listReports(
      status,
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
  }

  @Patch('reports/:id')
  updateReportStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateReportStatus(id, body.status);
  }
}