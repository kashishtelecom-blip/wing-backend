import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { Community, CommunityDocument } from '../communities/schemas/community.schema';
import {
  CopyrightReport,
  CopyrightReportDocument,
  ReportStatus,
} from '../wings/schemas/copyright-report.schema';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Community.name) private communityModel: Model<CommunityDocument>,
    @InjectModel(CopyrightReport.name) private reportModel: Model<CopyrightReportDocument>,
  ) {}

  // ============ OVERVIEW ============
  async getStats() {
    const [
      totalUsers, activeUsers, bannedUsers, adminUsers,
      totalWings, publishedWings, deletedWings,
      totalComments, totalCommunities,
      totalReports, pendingReports,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ isActive: false }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.wingModel.countDocuments(),
      this.wingModel.countDocuments({ isPublished: true, deletedAt: null }),
      this.wingModel.countDocuments({ deletedAt: { $ne: null } }),
      this.commentModel.countDocuments({ deletedAt: null }),
      this.communityModel.countDocuments(),
      this.reportModel.countDocuments(),
     this.reportModel
        .countDocuments({ status: ReportStatus.PENDING })
        .catch(() => 0),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, banned: bannedUsers, admins: adminUsers },
      wings: { total: totalWings, published: publishedWings, deleted: deletedWings },
      comments: { total: totalComments },
      communities: { total: totalCommunities },
      reports: { total: totalReports, pending: pendingReports },
    };
  }

  // ============ USERS ============
  async listUsers(query: string | undefined, page = 1, limit = 30) {
    const filter: any = {};
    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async setUserRole(adminId: string, userId: string, role: UserRole) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot change your own role');
    }
    const user = await this.userModel
      .findByIdAndUpdate(userId, { role }, { returnDocument: 'after' })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setUserActive(userId: string, isActive: boolean) {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { isActive, deactivatedAt: isActive ? null : new Date() },
        { returnDocument: 'after' },
      )
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async deleteUser(userId: string) {
    const result = await this.userModel.findByIdAndDelete(userId);
    if (!result) throw new NotFoundException('User not found');
    return { deleted: true };
  }

  // ============ WINGS ============
  async listWings(query: string | undefined, page = 1, limit = 30) {
    const filter: any = {};
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.wingModel
        .find(filter)
        .populate('author', 'username name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.wingModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async deleteWing(wingId: string) {
    const wing = await this.wingModel.findById(wingId);
    if (!wing) throw new NotFoundException('Wing not found');
    wing.deletedAt = new Date();
    await wing.save();
    return { deleted: true };
  }

  // ============ COMMENTS ============
  async deleteComment(commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    comment.deletedAt = new Date();
    await comment.save();
    return { deleted: true };
  }

  // ============ COMMUNITIES ============
  async listCommunities(page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.communityModel
        .find()
        .populate('creator', 'username name avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.communityModel.countDocuments(),
    ]);
    return { data, total, page, limit };
  }

  async deleteCommunity(communityId: string) {
    const result = await this.communityModel.findByIdAndDelete(communityId);
    if (!result) throw new NotFoundException('Community not found');
    return { deleted: true };
  }

  // ============ REPORTS ============
  async listReports(status: string | undefined, page = 1, limit = 30) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .populate('wing', 'title content author')
        .populate('reporter', 'username name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.reportModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async updateReportStatus(reportId: string, status: string) {
    const report = await this.reportModel
      .findByIdAndUpdate(
        reportId,
        { status, reviewedAt: new Date() },
        { returnDocument: 'after' },
      )
      .exec();
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}