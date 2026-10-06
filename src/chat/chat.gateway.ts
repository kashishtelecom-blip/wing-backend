
import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:4200',
      'https://wing-frontend.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers.authorization || '').replace('Bearer ', '');

      if (!token) throw new Error('No token provided');

      const payload: any = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;
      if (!userId) throw new Error('Invalid token payload');

      client.data.userId = userId;
      client.join(`user-${userId}`);

      this.logger.log(`✅ User ${userId} connected (${client.id})`);
    } catch (err) {
      this.logger.warn(`❌ Socket auth failed: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      this.logger.log(
        `👋 User ${client.data.userId} disconnected (${client.id})`,
      );
    }
  }

  // ============ CONVERSATION ROOMS (DMs) ============
  @SubscribeMessage('join-conversation')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const room = `conversation-${data.conversationId}`;
    client.join(room);
    this.logger.log(`👥 ${client.id} joined ${room}`);
    return { joined: true, room };
  }

  @SubscribeMessage('leave-conversation')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const room = `conversation-${data.conversationId}`;
    client.leave(room);
    this.logger.log(`👋 ${client.id} left ${room}`);
  }

  emitToConversation(conversationId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Chat gateway server not ready');
      return;
    }
    const room = `conversation-${conversationId}`;
    this.server.to(room).emit(event, payload);
    this.logger.log(`📤 Emitted "${event}" to ${room}`);
  }

  // ============ COMMUNITY ROOMS ============
  @SubscribeMessage('join-community')
  handleJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    if (!data?.communityId) return;
    const room = `community-${data.communityId}`;
    client.join(room);
    this.logger.log(`👥 ${client.id} joined ${room}`);
    return { joined: true, room };
  }

  @SubscribeMessage('leave-community')
  handleLeaveCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    if (!data?.communityId) return;
    const room = `community-${data.communityId}`;
    client.leave(room);
    this.logger.log(`👋 ${client.id} left ${room}`);
  }

  emitToCommunity(communityId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Chat gateway server not ready');
      return;
    }
    const room = `community-${communityId}`;
    this.server.to(room).emit(event, payload);
    this.logger.log(`📤 Emitted "${event}" to ${room}`);
  }

   // ============ USER ROOMS (notifications) ============
  emitToUser(userId: string, event: string, payload: any) {
    if (!this.server) {
      this.logger.warn('Chat gateway server not ready');
      return;
    }
    this.server.to(`user-${userId}`).emit(event, payload);
    this.logger.log(`📤 Emitted "${event}" to user-${userId}`);
  }

  // ============ TYPING INDICATOR ============
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId?: string;
      communityId?: string;
      isTyping: boolean;
    },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    if (data.conversationId) {
      client.to(`conversation-${data.conversationId}`).emit('typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping,
      });
    } else if (data.communityId) {
      client.to(`community-${data.communityId}`).emit('typing', {
        communityId: data.communityId,
        userId,
        isTyping: data.isTyping,
      });
    }
  }
}