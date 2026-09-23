import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Wing, WingDocument } from '../wings/schemas/wing.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Wing.name) private wingModel: Model<WingDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    wingId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // Check wing exists and comments are enabled
    const targetWing = await this.wingModel.findById(wingId);
    if (!targetWing) throw new NotFoundException('Wing not found');
    if (targetWing.commentsEnabled === false) {
      throw new ForbiddenException('Comments are turned off for this wing');
    }

    const newComment = new this.commentModel({
      text: createCommentDto.text,
      wing: new Types.ObjectId(wingId),
      author: new Types.ObjectId(userId),
    });
    const saved = await newComment.save();

    await this.wingModel.findByIdAndUpdate(wingId, {
      $inc: { commentsCount: 1 },
    });

    await this.notificationsService.create(
      targetWing.author.toString(),
      userId,
      NotificationType.COMMENT,
      wingId,
    );

    return saved;
  }

  async findAllForWing(wingId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ wing: new Types.ObjectId(wingId), deletedAt: null })
      .populate('author', 'name username email avatarUrl isVerified')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentModel
      .findOne({ _id: id, deletedAt: null })
      .populate('author', 'name username email avatarUrl isVerified')
      .exec();
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(
    id: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }
    comment.text = updateCommentDto.text || comment.text;
    return comment.save();
  }

  async remove(
    id: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    const comment = await this.commentModel.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (userRole !== 'admin' && comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    comment.deletedAt = new Date();
    await comment.save();

    await this.wingModel.findByIdAndUpdate(comment.wing, {
      $inc: { commentsCount: -1 },
    });
  }
}